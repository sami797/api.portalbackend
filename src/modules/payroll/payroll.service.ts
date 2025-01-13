import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { PayrollFiltersDto } from './dto/payroll-filters.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { convertDate, getDifferenceInDays } from 'src/helpers/common';
import { PaidPayrollsDto } from './dto/paid-payroll.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AttendanceService } from '../attendance/attendance.service';
import { ExcelService } from '../file-convertor/excel.service';
import { AttendanceFilters } from '../attendance/dto/attendance-filters.dto';
import { GeneratePayrollReport, PayrollReportType } from './dto/generate-report.dto';
import * as BluebirdPromise from 'bluebird';
import { existsSync, mkdirSync } from 'fs';
import { PayrollReportSheetDto } from '../file-convertor/dto/payroll-report-sheet.dto';
import { PayrollProcessorService } from './process/payroll.processor.service';

@Injectable()
export class PayrollService {

  private readonly logger = new Logger(PayrollService.name);
  constructor(private prisma: PrismaService, @InjectQueue('payroll') private payrollQueue: Queue,
  private readonly attendanceService: AttendanceService,
  private readonly payrollProcessorService: PayrollProcessorService,
  private readonly excelService: ExcelService
  ) {
  }

  findAll(filters: Prisma.PayrollWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.payroll.findMany({
      where: filters,
      include: {
       User: {
        select: UserDefaultAttributes
       },
       ModifiedBy:{
        select: UserDefaultAttributes
       },
       PayrollCycle:{
        select:{
          id: true,
          fromDate: true,
          toDate: true
        }
       },
       Deductions: true
      },
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.payroll.findUnique({
      where: {
        id: id
      },
      include: {
        User: {
         select: UserDefaultAttributes
        },
        ModifiedBy:{
         select: UserDefaultAttributes
        },
        PayrollCycle:{
         select:{
           id: true,
           fromDate: true,
           toDate: true
         }
        }
       },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateDto: UpdatePayrollDto, user: AuthenticatedUser) {

    let payrollData = await this.prisma.payroll.findUniqueOrThrow({
      where:{
        id: id
      }
    })

    let today = new Date();
    let daysDifference = Math.abs(getDifferenceInDays(today, payrollData.addedDate));
    if(daysDifference > 31){
      throw {
        message: "You cannot update a payroll older than 31 days",
        statusCode: 400
      }
    }

    let netReceivable = payrollData.totalReceivable - payrollData.manualCorrection;
    let revisedReceivable = netReceivable + updateDto.manualCorrection

    return this.prisma.payroll.update({
      data: {
        ...updateDto,
        totalReceivable: revisedReceivable,
        modifiedById: user.userId
      },
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyFilters(filters: PayrollFiltersDto) {
    let condition: Prisma.PayrollWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if (filters.userId) {
        condition = { ...condition, userId: filters.userId }
      }

      if (filters.payrollCycleId) {
        condition = { ...condition, payrollCycleId: filters.payrollCycleId }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              monthYear: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              monthYear: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, monthYear: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, monthYear: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

    }
    return condition;
  }

  countRecords(filters: Prisma.PayrollWhereInput) {
    return this.prisma.payroll.count({
      where: filters
    })
  }

  async remove(recordId: number){
    let payrollData = await this.prisma.payroll.findUniqueOrThrow({
      where:{
        id: recordId
      },
      include:{
        Deductions: {
          where:{
            installmentId:{
              not: null
            }
          }
        }
      }
    })

    let today = new Date();
    let daysDifference = Math.abs(getDifferenceInDays(today, payrollData.addedDate));
    if(daysDifference > 31){
      throw {
        message: "You cannot delete a payroll older than 31 days",
        statusCode: 400
      }
    }

    if(payrollData.paid){
      throw {
        message: "This record has been marked as paid already, you cannot delete this record anymore",
        statuCode: 400
      }
    }

    await this.prisma.payroll.update({
      where:{
        id: recordId
      },
      data:{
        isDeleted: true,
        Deductions:{
          set:{
            installmentId: null
          }
        }
      },
      include:{
        Deductions: {
          where:{
            installmentId:{
              not: null
            }
          }
        }
      }
    })

    await this.prisma.payrollDeduction.updateMany({
      where:{
        payrollId: payrollData.id
      },
      data:{
        installmentId: null
      }
    })

    let allInstallmentIds = payrollData.Deductions.map((ele) => ele.installmentId);
    if(allInstallmentIds.length > 0){
      await this.prisma.cashAdvanceInstallment.updateMany({
        where:{
          id:{
            in: allInstallmentIds
          }
        },
        data:{
          isPaid: false,
          paidDate: null
        }
      })
    }

    return payrollData;
  }

  async recalculate(recordId: number){
    let payrollData = await this.prisma.payroll.findUniqueOrThrow({
      where:{
        id: recordId
      },
      include:{
        Deductions: {
          where:{
            installmentId:{
              not: null
            }
          }
        },
        PayrollCycle: true,
        Salary: true
      }
    })

    let today = new Date();
    let daysDifference = Math.abs(getDifferenceInDays(today, payrollData.addedDate));
    if(daysDifference > 31){
      throw {
        message: "You cannot recalculate a payroll older than 31 days",
        statusCode: 400
      }
    }

    if(payrollData.paid){
      throw {
        message: "This record has been marked as paid already, you cannot recalculate this record anymore",
        statuCode: 400
      }
    }

    await this.prisma.payroll.update({
      where:{
        id: recordId
      },
      data:{
        processing: true
      }
    })

    await this.prisma.payrollDeduction.deleteMany({
      where:{
        payrollId: payrollData.id
      }
    })

    let allInstallmentIds = payrollData.Deductions.map((ele) => ele.installmentId);
    if(allInstallmentIds.length > 0){
      await this.prisma.cashAdvanceInstallment.updateMany({
        where:{
          id:{
            in: allInstallmentIds
          }
        },
        data:{
          isPaid: false,
          paidDate: null
        }
      })
    }

    let userData = await this.prisma.user.findFirst({
      where:{
        id: payrollData.userId
      },
      select:{
        Organization:{
          select:{
            WorkingHours: true
          }
        }
      }
    })

    if(!userData?.Organization?.WorkingHours){
      throw {
        message: "No Working Hours Assigned to the Company, Can't process",
        statusCode: 400
      }
    }

    await this.payrollProcessorService.preparePayrollReportOfUser(payrollData.PayrollCycle, payrollData.userId, payrollData.Salary?.amount, payrollData.salaryId, userData?.Organization?.WorkingHours, payrollData.id);
    return payrollData;
  }

  markAsPaid(paidPayrollsDto: PaidPayrollsDto, user: AuthenticatedUser){
    let ids = [];
    if(Array.isArray(paidPayrollsDto.ids)){
      ids = paidPayrollsDto.ids
    }else{
      ids = [paidPayrollsDto.ids];
    }

    return this.prisma.payroll.updateMany({
      where:{
        id:{
          in: ids
        },
        paid: false
      },
      data:{
        paid: true,
        modifiedById: user.userId,
        paidDate: new Date()
      }
    })
  }

  async generateReport(reportDto: GeneratePayrollReport){
    let condition : Prisma.PayrollWhereInput = {};
    if(reportDto.reportType === PayrollReportType.department){
      condition = {
        ...condition,
        User:{
          departmentId: reportDto.departmentId
        }
      }
    }else if(reportDto.reportType === PayrollReportType.organization){
      condition = {
        ...condition,
        User:{
          organizationId: reportDto.organizationId
        }
      }
    }else if(reportDto.reportType === PayrollReportType.users){
      condition = {
        ...condition,
        id: {
          in: reportDto.userIds
        }
      }
    }

    let payrollCycleData = await this.prisma.payrollCycle.findFirst({
      where: {
        id: reportDto.payrollCycleId
      }
    })

    let payrollData = await this.prisma.payroll.findMany({
      where:{
        payrollCycleId: reportDto.payrollCycleId,
        ...condition
      },
      include:{
        User:{
          select:{
            id: true, 
            organizationId: true, 
            firstName: true, 
            lastName: true,
            designation: true,
            dateOfJoining: true,
            Department:{
              select:{
                title: true
              }
          }
          }
        }
      },
      orderBy:[
        {
          User:{
            firstName: 'asc'
          }
        }
      ]
    })

  let organizationData = await this.prisma.organization.findMany({
    where:{
      isDeleted: false
    },
    include:{
      WorkingHours: true
    }
  })

  let filters : AttendanceFilters = {
    fromDate: payrollCycleData.fromDate,
    toDate: payrollCycleData.toDate,
    userId: null
  }

  let publicHolidayFilters = this.attendanceService.applyFiltersPublicHolidays(filters);
  let publicHolidays = await this.attendanceService.findPublicHolidays(publicHolidayFilters);
  let reportSheets : PayrollReportSheetDto[] = [];

  const MAX_CONCURRENT_OPERATIONS = 10;
  let reportIndex = 0;
  await BluebirdPromise.map(payrollData, async (payroll : typeof payrollData[0]) => {
    try{
      filters.userId = payroll.User.id;
      let appliedFilters = this.attendanceService.applyFilters(filters);
      let org = organizationData.find((ele) => ele.id === payroll.User.organizationId);
      if(!org?.WorkingHours){
        console.log("I am error")
        throw {
          message: "No Working Hours Assigned to the Company" + org?.name,
          statusCode: 400
        }
      }
      let curIndex = reportIndex++;
      let userAttendance = await this.attendanceService.findAll(appliedFilters,{page: 1, perPage: 32}, {sortByField: 'checkIn', sortOrder: 'asc'} );
      let attendanceData = this.attendanceService.prepareAttendanceFromD1ToD2(userAttendance, publicHolidays, filters, org?.WorkingHours);
      let userData = {...payroll.User};
      delete payroll.User;
      reportSheets[curIndex] = {
        sheetName: userData.firstName + " " + userData.lastName,
        data: {
          employee: userData,
          payroll: payroll,
          attendance: attendanceData
        }
      }
    }catch(err){
      this.logger.error("Some error while preparing payroll report", err?.message);
      return true;
    }
  }, { concurrency: MAX_CONCURRENT_OPERATIONS });
  
  let attendanceFileName = "Payroll-Report-from-" + convertDate(payrollCycleData.fromDate, 'dd-mm-yy') + "-to-" +  convertDate(payrollCycleData.toDate, 'dd-mm-yy') + ".xlsx";
  let attendanceFilepath =  process.cwd() + "/public/payroll/";
  if (!existsSync(attendanceFilepath)) {
    mkdirSync(attendanceFilepath, { recursive: true });
  }

  let filePath = attendanceFilepath + attendanceFileName;
  await this.excelService.PayrollExcelReport(reportSheets, filePath);

  return {
    fileName: attendanceFileName,
    filePath: attendanceFilepath+attendanceFileName
  };
  
  }
}

