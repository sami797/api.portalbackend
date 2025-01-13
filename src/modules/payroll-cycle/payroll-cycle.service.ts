import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileManagement, FileVisibility, PayrollCycle, Permit, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { UpdatePayrollCycleDto } from './dto/update-payroll-cycle.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { convertDate, getDifferenceInDays } from 'src/helpers/common';

@Injectable()
export class PayrollCycleService {

  private readonly logger = new Logger(PayrollCycleService.name);
  constructor(private prisma: PrismaService, @InjectQueue('payroll') private payrollQueue: Queue) {
  }

  async validateDates(createDto: CreatePayrollCycleDto){
    let today = new Date();
    let fromDate = createDto.fromDate;
    let toDate = createDto.toDate;
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    if(today > createDto.fromDate){
      let difference = Math.abs(getDifferenceInDays(fromDate, today));
      if(difference > 60){
        throw {
          message: "You cannot add payroll cycle older than 60 days",
          statusCode: 400
        }
      }
    }

    let conflictingRecords = await this.prisma.payrollCycle.findFirst({
      where:{
        OR: [
          {
            AND: [
              { fromDate: { lte: toDate } },
              { toDate: { gte: fromDate } },
            ],
          },
          {
            AND: [
              { fromDate: { gte: fromDate } },
              { toDate: { lte: toDate } },
            ],
          },
        ],
      }
    })

    if(conflictingRecords){
      throw {
        message: `There is a overlapping record found. Payroll cycle ID: ${conflictingRecords.id} Start Date: ${convertDate(conflictingRecords.fromDate ,"dd M yy")} - End Date: ${convertDate(conflictingRecords.toDate ,"dd M yy")}`,
        statusCode: 400
      }
    }

  }

  create(createDto: CreatePayrollCycleDto) {
    let fromDate = createDto.fromDate;
    let toDate = createDto.toDate;
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);
    return this.prisma.payrollCycle.create({
      data: {
        fromDate: fromDate,
        toDate: toDate,
        processed: false,
        processing: false
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.PayrollCycleWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.payrollCycle.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        fromDate: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.payrollCycle.findUnique({
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdatePayrollCycleDto) {

    let fromDate = updateDto.fromDate;
    let toDate = updateDto.toDate;
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(0, 0, 0, 0);

    return this.prisma.payrollCycle.update({
      data: updateDto,
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number) {
    return this.prisma.payrollCycle.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  countRecords(filters: Prisma.PayrollCycleWhereInput) {
    return this.prisma.payrollCycle.count({
      where: filters
    })
  }

  // async preparePayrollReport() {
  //   this.logger.log("Called every day at 02:00AM to check if paydate has come");
  //   let today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   let payrollCycle = await this.prisma.payrollCycle.findFirst({
  //     where: {
  //       processed: false,
  //       processing: false,
  //       toDate: {
  //         lte: today
  //       }
  //     },
  //     orderBy:{
  //       fromDate: 'asc'
  //     }
  //   })

  //   if (payrollCycle) {

  //     let lastPayrollCycle = await this.prisma.payrollCycle.findFirst({
  //       where: {
  //         processed: false,
  //       },
  //       orderBy:{
  //         toDate: 'desc'
  //       }
  //     })

  //     let nextCycleStartDate = new Date(lastPayrollCycle.toDate);
  //     nextCycleStartDate.setHours(0, 0, 0, 0);
  //     nextCycleStartDate.setDate(nextCycleStartDate.getDate() + 1);

  //     let nextCycleEndDate = new Date(lastPayrollCycle.toDate);
  //     nextCycleEndDate.setHours(23, 59, 59, 999);
  //     nextCycleEndDate.setDate(nextCycleEndDate.getDate() + 30);

  //     let doesExist = await this.prisma.payrollCycle.findFirst({
  //       where: {
  //         fromDate: nextCycleStartDate,
  //         toDate: nextCycleEndDate,
  //       }
  //     })

  //     if (!doesExist) {
  //       await this.prisma.payrollCycle.create({
  //         data: {
  //           fromDate: nextCycleStartDate,
  //           toDate: nextCycleEndDate,
  //           processed: false
  //         }
  //       })
  //     }

  //     await this.prisma.payrollCycle.update({
  //       where: {
  //         id: payrollCycle.id
  //       },
  //       data: {
  //         processing: true
  //       }
  //     })

  //     this.payrollQueue.add('preparePayrollReport', {
  //       message: "Start Preparing Payroll Report",
  //       data: payrollCycle
  //     }, { removeOnComplete: true })
  //   } else {
  //     this.logger.log("No payroll found to process");
  //   }
  // }

  async preparePayrollReportOfProvidedCycle(payrollCycle: PayrollCycle) {
    await this.prisma.payrollCycle.update({
      where: {
        id: payrollCycle.id
      },
      data: {
        processing: true,
      }
    })

    this.payrollQueue.add('preparePayrollReport', {
      message: "Start Preparing Payroll Report",
      data: payrollCycle
    }, { removeOnComplete: true })
  }

}

