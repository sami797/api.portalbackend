import { Injectable, Logger } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateLeaveCreditDto } from './dto/create-leave-credit.dto';
import { UpdateLeaveCreditDto } from './dto/update-leave-credit.dto';
import { UserStatus } from 'src/config/constants';
import * as BluebirdPromise from 'bluebird';

@Injectable()
export class LeaveCreditService {

  private readonly logger = new Logger(LeaveCreditService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateLeaveCreditDto) {
    return this.prisma.leaveCredits.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.LeaveCreditsWhereInput) {
    let records = this.prisma.leaveCredits.findMany({
      where: filters,
      orderBy: {
        addedDate: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.leaveCredits.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateLeaveCreditDto) {
    return this.prisma.leaveCredits.update({
      data: updateDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number) {
    return this.prisma.leaveCredits.update({
      data: {
        isDeleted: true
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
}

