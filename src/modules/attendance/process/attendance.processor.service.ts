import { Injectable, Logger } from "@nestjs/common";
import { AttendanceEntryType, UserStatus } from "src/config/constants";
import { calculateTotalHours, getDayRange } from "src/helpers/common";
import { PrismaService } from "src/prisma.service";
import * as BluebirdPromise from 'bluebird';
import { AttendanceService } from "../attendance.service";

@Injectable()
export class AttendanceProcessorService {

  private readonly logger = new Logger(AttendanceProcessorService.name);
  constructor(private prisma: PrismaService, private readonly attendanceService: AttendanceService) { }

  async bulkProcessAttendance(beforeDate: Date) {
    let query = `SELECT "userId", DATE("checkIn") as "checkInDate"
                FROM "BiometricsChecks"
                WHERE "checkIn" < '${beforeDate.toISOString()}'
                AND "isProcessed" = FALSE
                GROUP BY "userId", "checkInDate"
                ORDER BY "checkInDate" DESC
                ;`

    const allUsersToProcess: Array<{ checkInDate: Date, userId: number }> = await this.prisma.$queryRawUnsafe(query);
    if (allUsersToProcess.length === 0) {
      this.logger.error("There are no new biometrics records to process");
      return;
    }
    const MAX_CONCURRENT_OPERATIONS = 10;
    console.log(`Processing ${allUsersToProcess.length} items`);
      await BluebirdPromise.map(allUsersToProcess, async (emp) => {
      try {
        const { dayStart, dayEnd } = getDayRange(emp.checkInDate);
        await this.userAttendanceOfGivenDate(emp.userId, dayStart, dayEnd);
      } catch (err) {
        this.logger.error("Some error while adding attendance", err.message)
      }
  }, { concurrency: MAX_CONCURRENT_OPERATIONS });
  }
  
  async userAttendanceOfGivenDate(userId: number, dayStart: Date, dayEnd: Date) {
    let existingRecord = await this.prisma.attendance.findFirst({
      where: {
        userId: userId,
        AND: [
          {
            checkIn: {
              gte: dayStart
            }
          },
          {
            checkIn: {
              lte: dayEnd
            }
          }
        ]
      }
    })

    const __checkIn = this.prisma.biometricsChecks.findFirst({
      where: {
        userId: userId,
        AND:[
          {checkIn: { gte: dayStart }},
          {checkIn: { lte: dayEnd }}
        ]
      },
      orderBy: { checkIn: 'asc' }
    })

    const __checkOut = this.prisma.biometricsChecks.findFirst({
      where: {
        userId: userId,
        AND:[
          {checkIn: { gte: dayStart }},
          {checkIn: { lte: dayEnd }}
        ]
      },
      orderBy: { checkIn: 'desc' }
    })

    const [checkInData, checkOutData] = await Promise.all([__checkIn, __checkOut]);
    if(!checkInData){
      throw {
        message: `No Check in data found UserId:${userId}  Date Start: ${dayStart.toISOString()} - Day End: ${dayEnd.toISOString()}`
      }
    }

    if(!checkOutData){
      throw {
        message: `No Check out data found UserId:${userId}  Date Start: ${dayStart.toISOString()} - Day End: ${dayEnd.toISOString()}`
      }
    }

    if(existingRecord){
    if(existingRecord.checkIn.getTime() === checkInData.checkIn.getTime() && existingRecord.checkOut.getTime() === checkOutData.checkIn.getTime()){
        throw {
          message: `Attendance for the given user: ${userId} in ${dayStart.toString()} already exists`,
        }
      }else{
        await this.prisma.attendance.delete({
          where:{
            id: existingRecord.id
          }
        })
      }
    }

    let userData = await this.prisma.user.findFirst({
      where:{
        id: userId
      }
    })
    let organization = await this.prisma.organization.findFirst({
      where:{
        id: userData.organizationId
      },
      include:{
        WorkingHours: true
      }
    })

    if(!organization.WorkingHours){
      throw {
        message: "No Working Hours Defined for the Company. Please assign working hour and try again",
        statusCode: 400
      }
    }

    let hoursWorked = Math.abs(calculateTotalHours(checkInData.checkIn, checkOutData.checkIn))
    let status = this.attendanceService.checkAttendanceStatus(checkInData.checkIn, hoursWorked, organization.WorkingHours);
    let proRatedDeduction = this.attendanceService.calculateIncompleteDeduction(status, checkInData.checkIn, hoursWorked, organization.WorkingHours);
    
    await this.prisma.attendance.create({
      data: {
        type: AttendanceEntryType.auto,
        addedDate: new Date(),
        checkIn: checkInData.checkIn,
        checkOut: checkOutData.checkIn,
        totalHours: hoursWorked,
        staus: status,
        proRatedDeduction: proRatedDeduction,
        userId: userId
      }
    }).then((data) =>{
      this.logger.log(`New Attendance added, UserID:${data.userId} ID:${data.id}`);
    }).catch((err) =>{
      this.logger.log(`Some error while adding attendance of userId:${userId} Date:${checkInData.checkIn.toString()} `, err.message);
    })

    await this.prisma.biometricsChecks.updateMany({
      where: {
        userId: userId,
        AND: [
          { checkIn: { gte: dayStart } },
          { checkIn: { lte: dayEnd } }
        ]
      },
      data: {
        isProcessed: true
      }
    })

  }
}