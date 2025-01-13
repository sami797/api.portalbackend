import { Injectable, Logger } from '@nestjs/common';
import { Attendance, LeaveRequest, Prisma, PublicHoliday, User, WorkingHours } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { AttendanceFilters } from './dto/attendance-filters.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { UserAttendanceFilters } from './dto/user-attendance-filters.dto';
import { AttendanceEntryType, AttendanceStatus, LeaveRequestStatus, OrganizationPolicy, TEST_EMAIL, UserStatus } from 'src/config/constants';
import { AttendanceSortingDto } from './dto/attendance-sorting.dto';
import { UserAttendanceType } from './entities/attendance.entity';
import { calculateTotalHours, convertDate, generateRandomName, getDifferenceInDays, isDateInRange, isSameDay, isWeekend } from 'src/helpers/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { OpeningHours } from '../working-hours/dto/create-working-hour.dto';
import { AttendanceReportType, GenerateAttendanceReport } from './dto/generate-report.dto';
import * as BluebirdPromise from 'bluebird';
import { ExcelService } from '../file-convertor/excel.service';
import { existsSync, mkdirSync } from 'fs';
import { AttendanceReportSheetDto } from '../file-convertor/dto/attendance-report-sheet.dto';

@Injectable()
export class AttendanceService {

  private readonly logger = new Logger(AttendanceService.name);
  constructor(private prisma: PrismaService,
    @InjectQueue('attendance') private attendanceQueue: Queue,
    private readonly excelService: ExcelService
  ) {
  }

  checkAttendanceStatus(date: Date, hours: number, workingHour: WorkingHours): AttendanceStatus {
    var dayOfWeek = date.getDay();
    let allHours = workingHour.hours as unknown as OpeningHours[]
    let dayWorkingHour = allHours.find((ele) => ele.day === dayOfWeek);
    if(dayWorkingHour.closed){
      return AttendanceStatus.off;
    }

    if(hours === 0){
      return AttendanceStatus.absent;
    }

    if(hours >= dayWorkingHour.totalHours - OrganizationPolicy.attendanceGraceTime){
      return AttendanceStatus.complete;
    }

    if(hours >= dayWorkingHour.totalHours - OrganizationPolicy.lateGraceTime){
      return AttendanceStatus.late;
    }

    return AttendanceStatus.incomplete;

    // if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5) { //Monday
    //   if (hours >= 10 && hours < 10.5) {
    //     return AttendanceStatus.late;
    //   } else if (hours >= 0 && hours < 10) {
    //     return AttendanceStatus.incomplete;
    //   } else if (hours === 0) {
    //     return AttendanceStatus.absent;
    //   } else {
    //     return AttendanceStatus.complete;
    //   }
    // } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    //   return AttendanceStatus.off;
    // }
  }

  //old
  // checkAttendanceStatus(date: Date, hours: number): AttendanceStatus {
  //   var dayOfWeek = date.getDay();
  //   if (dayOfWeek === 1) { //Monday
  //     if (hours >= 9.5 && hours < 10) {
  //       return AttendanceStatus.late;
  //     } else if (hours >= 0 && hours < 9.5) {
  //       return AttendanceStatus.incomplete;
  //     } else if (hours === 0) {
  //       return AttendanceStatus.absent;
  //     } else {
  //       return AttendanceStatus.complete;
  //     }
  //   } else if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5) {
  //     if (hours >= 9.5 && hours < 9.75) {
  //       return AttendanceStatus.late;
  //     } else if (hours >= 0 && hours < 9.5) {
  //       return AttendanceStatus.incomplete;
  //     } else if (hours === 0) {
  //       return AttendanceStatus.absent;
  //     } else {
  //       return AttendanceStatus.complete;
  //     }
  //   } else if (dayOfWeek === 6) {
  //     if (hours >= 3.5 && hours < 3.75) {
  //       return AttendanceStatus.late;
  //     } else if (hours >= 0 && hours < 3.5) {
  //       return AttendanceStatus.incomplete;
  //     } else if (hours === 0) {
  //       return AttendanceStatus.absent;
  //     } else {
  //       return AttendanceStatus.complete;
  //     }
  //   } else if (dayOfWeek === 0) {
  //     return AttendanceStatus.off;
  //   }
  // }

  // calculateIncompleteDeduction(status: AttendanceStatus, date: Date, hours: number) {
  //   var dayOfWeek = date.getDay();
  //   if (status === AttendanceStatus.incomplete && hours >= 0) {
  //     if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5) {
  //       return 1 - (hours / 10);
  //     } else if (dayOfWeek === 6) {
  //       return 1 - (hours / 4);
  //     }
  //   }
  //   return 0;
  // }

  //old
  calculateIncompleteDeduction(status: AttendanceStatus, date: Date, hours: number, workingHour: WorkingHours) {
    var dayOfWeek = date.getDay();
    let allHours = workingHour.hours as unknown as OpeningHours[]
    let dayWorkingHour = allHours.find((ele) => ele.day === dayOfWeek);

    if (status === AttendanceStatus.incomplete) {
      if(dayWorkingHour.closed){
        return 0
      }

      return Number((1 - (hours / dayWorkingHour.totalHours)).toFixed(6));
      
      // if (dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5) {
      //   return 1 - (hours / 10.5);
      // }
    }
    return 0;
  }

  async create(createDto: CreateAttendanceDto, user: AuthenticatedUser) {
    let checkInDayStart = new Date(createDto.checkIn);
    checkInDayStart.setHours(0, 0, 0, 0);
    let checkOutDayEnd = new Date(createDto.checkOut);
    checkOutDayEnd.setHours(23, 59, 59, 999);
    let existingRecord = await this.prisma.attendance.findFirst({
      where: {
        userId: createDto.userId,
        AND: [
          {
            checkIn: {
              gte: checkInDayStart
            }
          },
          {
            checkIn: {
              lte: checkOutDayEnd
            }
          }
        ]
      }
    })

    if (existingRecord) {
      throw {
        message: "Attendance for the given user in this date already exists",
        statusCode: 400
      }
    }

    let areSameDate = isSameDay(createDto.checkIn, createDto.checkOut);
    if (!areSameDate) {
      throw {
        message: "Check In and and Check Out Date must be same",
        statusCode: 400
      }
    }

    let daysDifference = Math.abs(getDifferenceInDays(new Date(), createDto.checkIn));
    if (daysDifference > 60) {
      throw {
        message: "You cannot add attendance data older than 31 days",
        statusCode: 404
      }
    }

    if (createDto.checkIn > new Date()) {
      throw {
        message: "You cannot add attendance data for future dates",
        statusCode: 404
      }
    }

    let userData = await this.prisma.user.findFirst({
      where:{
        id: createDto.userId
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

    let hoursWorked = Math.abs(calculateTotalHours(createDto.checkIn, createDto.checkOut));
    let status = this.checkAttendanceStatus(createDto.checkIn, hoursWorked, organization.WorkingHours);
    let proRatedDeduction = this.calculateIncompleteDeduction(status, createDto.checkIn, hoursWorked, organization.WorkingHours);
    return this.prisma.attendance.create({
      data: {
        ...createDto,
        totalHours: hoursWorked,
        staus: status,
        proRatedDeduction: proRatedDeduction,
        type: AttendanceEntryType.manual,
        addedById: (user.userEmail === TEST_EMAIL) ?  undefined : user.userId,
        addedDate: new Date()
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.AttendanceWhereInput, pagination: Pagination, sorting: AttendanceSortingDto) {
    let __sorter: Prisma.Enumerable<Prisma.AttendanceOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.attendance.findMany({
      where: filters,
      skip: skip,
      take: take,
      include: {
        AddedBy: {
          select: UserDefaultAttributes
        },
        ModifiedBy:{
          select: UserDefaultAttributes
        },
        User: {
          select: UserDefaultAttributes
        }
      },
      orderBy: __sorter
    });
    return records;
  }

  findPublicHolidays(filters: Prisma.PublicHolidayWhereInput) {
    let records = this.prisma.publicHoliday.findMany({
      where: filters,
      orderBy: {
        date: 'asc'
      }
    });
    return records;
  }

  findApprovedLeaveRequest(filters: Prisma.LeaveRequestWhereInput) {
    let records = this.prisma.leaveRequest.findMany({
      where: filters,
      orderBy: {
        leaveFrom: 'asc'
      }
    });
    return records;
  }



  findOne(id: number) {
    return this.prisma.attendance.findUnique({
      where: {
        id: id
      },
      include: {
        AddedBy: {
          select: UserDefaultAttributes
        },
        User: {
          select: UserDefaultAttributes
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateDto: UpdateAttendanceDto, user: AuthenticatedUser) {

    let hoursWorked = undefined;
    let status = undefined;
    let proRatedDeduction = undefined;

    let recordData = await this.prisma.attendance.findUniqueOrThrow({where:{
      id: id
    }})

    if(!recordData){
      throw {
        message: "Record doesnot exist",
        statusCode: 404
      }
    }

    if ((updateDto.checkIn && !updateDto.checkOut) || (updateDto.checkOut && !updateDto.checkIn)) {
      throw {
        message: "Please provide both check in and check out time or provide none",
        statusCode: 400
      }
    }

    let userData = await this.prisma.user.findFirst({
      where:{
        id: recordData.userId
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

    if (updateDto.checkIn && updateDto.checkOut) {
      hoursWorked = Math.abs(calculateTotalHours(updateDto.checkIn, updateDto.checkOut));
      status = this.checkAttendanceStatus(updateDto.checkIn, hoursWorked, organization.WorkingHours);
      proRatedDeduction = this.calculateIncompleteDeduction(status, updateDto.checkIn, hoursWorked, organization.WorkingHours);

      let checkInDayStart = new Date(updateDto.checkIn);
      checkInDayStart.setHours(0, 0, 0, 0);
      let checkOutDayEnd = new Date(updateDto.checkOut);
      checkOutDayEnd.setHours(23, 59, 59, 999);

      let existingRecord = await this.prisma.attendance.findFirst({
        where: {
          userId: recordData.userId,
          id: { not: id },
          AND: [
            { checkIn: { gte: checkInDayStart } },
            { checkIn: { lte: checkOutDayEnd } }
          ]
        }
      })
    
      if (existingRecord) {
        throw {
          message: "Attendance for the given user in this date already exists",
          statusCode: 400
        }
      }

      let areSameDate = isSameDay(updateDto.checkIn, updateDto.checkOut);
      if (!areSameDate) {
        throw {
          message: "Check In and and Check Out Date must be same",
          statusCode: 400
        }
      }

      let daysDifference = Math.abs(getDifferenceInDays(new Date(), updateDto.checkIn));
      if (daysDifference > 60) {
        throw {
          message: "You cannot update attendance data older than 31 days",
          statusCode: 404
        }
      }

      if (updateDto.checkIn > new Date()) {
        throw {
          message: "You cannot update attendance data for future dates",
          statusCode: 404
        }
      }
    }

    return this.prisma.attendance.update({
      data: {
        ...updateDto,
        totalHours: hoursWorked,
        staus: status,
        proRatedDeduction: proRatedDeduction,
        modifiedById: (user.userEmail === TEST_EMAIL) ?  undefined : user.userId,
        modifiedDate: (user.userEmail === TEST_EMAIL) ?  undefined : new Date()
      },
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }
  applyFiltersPublicHolidays(filters: AttendanceFilters | UserAttendanceFilters) {
    let condition: Prisma.PublicHolidayWhereInput = {};
    if (Object.entries(filters).length > 0) {
      if ("month" in filters && "year" in filters && filters.month && filters.year) {
        condition = {
          ...condition, AND: [
            {
              date: {
                gte: new Date(filters.year, filters.month, 1),
              }
            },
            {
              date: {
                lt: new Date(filters.year, filters.month + 1, 1),
              }
            }
          ]
        }
      }

      if ("fromDate" in filters && filters.fromDate && filters.toDate) {
        let fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        let toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 99);

        condition = {
          ...condition, AND: [
            {
              date: {
                gte: fromDate
              }
            },
            {
              date: {
                lte: toDate
              }
            }
          ]
        }
      } else {
        if ("fromDate" in filters && filters.fromDate) {
          let fromDate = new Date(filters.fromDate);
          fromDate.setHours(0, 0, 0, 0);
          condition = { ...condition, date: { gte: fromDate } }
        }

        if ("toDate" in filters && filters.toDate) {
          let toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 99);
          condition = { ...condition, date: { lte: toDate } }
        }
      }

    }
    return condition;
  }

  leaveRequestFilters(filters: AttendanceFilters | UserAttendanceFilters) {
    let condition: Prisma.LeaveRequestWhereInput = {
      status: LeaveRequestStatus.approved
    };
    if (Object.entries(filters).length > 0) {
      if ("month" in filters && "year" in filters && filters.month && filters.year) {
        if (filters.userId) {
          condition = {
            ...condition,
            requestById: filters.userId
          }
        }

        condition = {
          ...condition, AND: [
            {
              leaveFrom: {
                gte: new Date(filters.year, filters.month, 1),
              }
            },
            {
              leaveFrom: {
                lt: new Date(filters.year, filters.month + 1, 1),
              }
            }
          ]
        }
      }

      if ("fromDate" in filters && filters.fromDate && filters.toDate) {

        let fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        let toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 99);

        condition = {
          ...condition, AND: [
            {
              leaveFrom: {
                gte: fromDate
              }
            },
            {
              leaveFrom: {
                lte: toDate
              }
            }
          ]
        }
      } else {
        if ("fromDate" in filters && filters.fromDate) {
          let fromDate = new Date(filters.fromDate);
          fromDate.setHours(0, 0, 0, 0);
          condition = { ...condition, leaveFrom: { gte: fromDate } }
        }

        if ("toDate" in filters && filters.toDate) {
          let toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 99);
          condition = { ...condition, leaveFrom: { lte: toDate } }
        }
      }

    }
    return condition;
  }

  applyFilters(filters: AttendanceFilters | UserAttendanceFilters) {
    let condition: Prisma.AttendanceWhereInput = {
    };

    if (Object.entries(filters).length > 0) {
      if (filters.type) {
        condition = { ...condition, type: filters.type }
      }

      if (filters.userId) {
        condition = { ...condition, userId: filters.userId }
      }

      if ("fromDate" in filters && filters.fromDate && filters.toDate) {
        let fromDate = new Date(filters.fromDate);
        fromDate.setHours(0, 0, 0, 0);

        let toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 99);

        condition = {
          ...condition, AND: [
            {
              checkIn: {
                gte: fromDate
              }
            },
            {
              checkIn: {
                lte: toDate
              }
            }
          ]
        }
      } else {
        if ("fromDate" in filters && filters.fromDate) {
          let fromDate = new Date(filters.fromDate);
          fromDate.setHours(0, 0, 0, 0);
          condition = { ...condition, checkIn: { gte: fromDate } }
        }

        if ("toDate" in filters && filters.toDate) {
          let toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 99);
          condition = { ...condition, checkIn: { lte: toDate } }
        }
      }


      if ("month" in filters && (filters.month || filters.month === 0) && "year" in filters && filters.year) {
        condition = {
          ...condition, AND: [
            {
              checkIn: {
                gte: new Date(filters.year, filters.month, 1),
              }
            },
            {
              checkIn: {
                lt: new Date(filters.year, filters.month + 1, 1),
              }
            }
          ]
        }
      }

    }
    return condition;
  }

  countRecords(filters: Prisma.AttendanceWhereInput) {
    return this.prisma.attendance.count({
      where: filters
    })
  }

  prepareAttendance(attendance: Array<Attendance & { AddedBy: Partial<User>, ModifiedBy?: Partial<User>, LeaveRequest?: LeaveRequest }>, publicHolidays: PublicHoliday[], filters: UserAttendanceFilters, workingHour: WorkingHours) {
    let userAttendance: UserAttendanceType[] = [];
    const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    let allHours = workingHour.hours as unknown as OpeningHours[]
    for (let day = 1; day <= daysInMonth; day++) {
      let status: AttendanceStatus = AttendanceStatus.absent;
      const currentDate = new Date(filters.year, filters.month, day);

      const attendanceData = attendance.find(record =>
        isSameDay(currentDate, record.checkIn)
      );
      if (attendanceData) {
        status = attendanceData.staus;
      }
      let dayWorkingHour = allHours.find((ele) => ele.day === currentDate.getDay());
      const isWeekendDay = dayWorkingHour.closed;
      if (isWeekendDay) status = AttendanceStatus.off;

      const isPublicHoliday = publicHolidays.find(holiday =>
        isSameDay(currentDate, holiday.date)
      );
      if (isPublicHoliday) status = AttendanceStatus.off;

      userAttendance.push({
        recordId: attendanceData ? attendanceData.id : null,
        userId: filters.userId,
        entryType: attendanceData ? attendanceData.type : undefined,
        day: currentDate,
        status: status,
        checkIn: attendanceData? attendanceData.checkIn : undefined,
        checkOut: attendanceData ? attendanceData.checkOut : undefined,
        note: attendanceData ? attendanceData.note : "",
        hoursWorked: attendanceData ? attendanceData.totalHours : 0,
        proRatedDeduction: attendanceData ? attendanceData.proRatedDeduction : 0,
        AddedBy: attendanceData && attendanceData.AddedBy ? attendanceData.AddedBy : null,
        ModifiedBy: attendanceData && attendanceData.ModifiedBy ? attendanceData.ModifiedBy : null,
        modifiedDate: attendanceData?.modifiedDate ? attendanceData.modifiedDate : undefined,
        totalHours: attendanceData?.totalHours
      });
    }
    return userAttendance;
  }

  prepareAttendanceFromD1ToD2(attendance: Array<Attendance & { AddedBy: Partial<User>, ModifiedBy?: Partial<User>, LeaveRequest?: LeaveRequest }>, publicHolidays: PublicHoliday[], filters: AttendanceFilters, workingHour: WorkingHours) {
    let userAttendance: UserAttendanceType[] = [];
    // const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    // for (let day = 1; day <= daysInMonth; day++) {
    let allHours = workingHour.hours as unknown as OpeningHours[]
    let startDate = new Date(filters.fromDate);
    startDate.setHours(0, 0, 0, 0);

    let endDate = new Date(filters.toDate);
    endDate.setHours(23, 59, 59, 99);

    for (let cDate = startDate; cDate <= endDate; cDate.setDate(cDate.getDate() + 1)) {
      let status: AttendanceStatus = AttendanceStatus.absent;
      const currentDate = new Date(cDate);

      const attendanceData = attendance.find(record =>
        isSameDay(currentDate, record.checkIn)
      );
      if (attendanceData) {
        status = attendanceData.staus;
      }
      let dayWorkingHour = allHours.find((ele) => ele.day === currentDate.getDay());
      const isWeekendDay = dayWorkingHour.closed;
      if (isWeekendDay) status = AttendanceStatus.off;

      const isPublicHoliday = publicHolidays.find(holiday =>
        isSameDay(currentDate, holiday.date)
      );
      if (isPublicHoliday) status = AttendanceStatus.off;

      userAttendance.push({
        recordId: attendanceData ? attendanceData.id : null,
        userId: filters.userId,
        entryType: attendanceData ? attendanceData.type : undefined,
        day: currentDate,
        checkIn: attendanceData? attendanceData.checkIn : undefined,
        checkOut: attendanceData ? attendanceData.checkOut : undefined,
        status: status,
        note: attendanceData ? attendanceData.note : "",
        hoursWorked: attendanceData ? attendanceData.totalHours : 0,
        proRatedDeduction: attendanceData ? attendanceData.proRatedDeduction : 0,
        AddedBy: attendanceData && attendanceData.AddedBy ? attendanceData.AddedBy : null,
        ModifiedBy: attendanceData && attendanceData.ModifiedBy ? attendanceData.ModifiedBy : null,
        modifiedDate: attendanceData?.modifiedDate ? attendanceData.modifiedDate : undefined,
        totalHours: attendanceData?.totalHours
      });
    }
    return userAttendance;
  }

  async validateUser(userId: number) {
    let user = await this.prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    if (user) {
      return user
    } else {
      throw {
        message: "No User Found",
        statusCode: 404
      }
    }
  }

  triggerBulkAttendanceCalculation() {
    this.attendanceQueue.add('prepareBulkAttendanceReport', {
      message: "Start Preparing All Attendance Report"
    }, { removeOnComplete: true })
  }

  async findOrganization(organizationId: number) {
    // Check if organizationId is valid
    if (!organizationId) {
      // If not valid, throw an error
      throw {
        message: "Organization ID is missing or invalid", 
        statusCode: 400
      };
    }
  
    // Query the organization if ID is valid
    return this.prisma.organization.findFirst({
      where: {
        id: organizationId
      },
      include: {
        WorkingHours: true // Including working hours data
      }
    });
  }

  async generateReport(reportDto: GenerateAttendanceReport){
    let condition : Prisma.UserWhereInput = {};
    if(reportDto.reportType === AttendanceReportType.department){
      condition = {
        ...condition,
        departmentId: reportDto.departmentId
      }
    }else if(reportDto.reportType === AttendanceReportType.organization){
      condition = {
        ...condition,
        organizationId: reportDto.organizationId
      }
    }else if(reportDto.reportType === AttendanceReportType.users){
      condition = {
        ...condition,
        id: {
          in: reportDto.userIds
        }
      }
    }

    let allUsers = await this.prisma.user.findMany({
      where: {
          isDeleted: false,
          ...condition,
          AND: {
              OR: [
                  {
                      status: UserStatus.active
                  },
                  {
                      status: UserStatus.suspended,
                      lastWorkingDate: {
                          gte: reportDto.fromDate
                      }
                  }
              ]
          }
      },
      orderBy:{
        firstName: 'asc'
      },
      select: {
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
    fromDate: reportDto.fromDate,
    toDate: reportDto.toDate,
    userId: null
  }

  let publicHolidayFilters = this.applyFiltersPublicHolidays(filters);
  let publicHolidays = await this.findPublicHolidays(publicHolidayFilters);
  let reportSheets : AttendanceReportSheetDto[] = [];
  // let reportSheets : {sheetName: string, data:  UserAttendanceType[] }[] = [];

  const MAX_CONCURRENT_OPERATIONS = 10;
  let reportIndex = 0;
  await BluebirdPromise.map(allUsers, async (user : Partial<User>) => {
    try{
      filters.userId = user.id;
      let appliedFilters = this.applyFilters(filters);
      let org = organizationData.find((ele) => ele.id === user.organizationId);
      if(!org.WorkingHours){
        throw {
          message: "No Working Hours Assigned to the Company" + org.name,
          statusCode: 400
        }
      }
      let curIndex = reportIndex++;
      let userAttendance = await this.findAll(appliedFilters,{page: 1, perPage: 32}, {sortByField: 'checkIn', sortOrder: 'asc'} );
      let attendanceData = this.prepareAttendanceFromD1ToD2(userAttendance, publicHolidays, filters, org.WorkingHours);
      reportSheets[curIndex] = {
        sheetName: user.firstName + " " + user.lastName,
        data: {
          employee: user,
          attendance: attendanceData
        }
      }
    }catch(err){
      this.logger.error("Some error while preparing attendance report", err?.message)
    }
  }, { concurrency: MAX_CONCURRENT_OPERATIONS });
  
  let attendanceFileName = "Attendance-Report-from-" + convertDate(reportDto.fromDate, 'dd-mm-yy') + "-to-" +  convertDate(reportDto.toDate, 'dd-mm-yy') + ".xlsx";
  let attendanceFilepath =  process.cwd() + "/public/attendance/";
  if (!existsSync(attendanceFilepath)) {
    mkdirSync(attendanceFilepath, { recursive: true });
  }

  let filePath = attendanceFilepath + attendanceFileName;
  await this.excelService.attendanceExcelReport(reportSheets, filePath);

  return {
    fileName: attendanceFileName,
    filePath: attendanceFilepath+attendanceFileName
  };
  
  }

  remove(id: number){
    return this.prisma.attendance.delete({
      where:{
        id: id
      }
    })
  }
}


