import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';

import { CreateAlertsTypeDto } from './dto/create-alerts-type.dto';
import { UpdateAlertsTypeDto } from './dto/update-alerts-type.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AlertsTypeService {

  private readonly logger = new Logger(AlertsTypeService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createAlertsTypeDto: CreateAlertsTypeDto) {
    return this.prisma.alertsType.create({
      data: createAlertsTypeDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll() {
    // throw new Error;
    let records = this.prisma.alertsType.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(user: AuthenticatedUser) {
    return this.prisma.alertsType.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
      },
      include: {
       UserAlertsSetting:{
        where:{
          userId: user.userId
        }
       }
      },
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.alertsType.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findBySlug(slug: string,  user: AuthenticatedUser) {
    return this.prisma.alertsType.findUnique({
      where: {
        slug: slug
      },
      include: {
        UserAlertsSetting:{
          where:{
            userId: user.userId
          }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateAlertsTypeDto: UpdateAlertsTypeDto) {


    return this.prisma.alertsType.update({
      data: updateAlertsTypeDto,
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
    return this.prisma.alertsType.update({
      data: {
        isPublished: false,
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

