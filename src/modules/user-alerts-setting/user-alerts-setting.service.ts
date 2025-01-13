import { Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateUserAlertsSettingDto } from './dto/create-user-alerts-setting.dto';
import { UpdateUserAlertsSettingDto } from './dto/update-user-alerts-setting.dto';

@Injectable()
export class UserAlertsSettingService {

  private readonly logger = new Logger(UserAlertsSettingService.name);
  constructor(private prisma: PrismaService) {
  }

  createOrUpdate(createAndUpdateData: CreateUserAlertsSettingDto | UpdateUserAlertsSettingDto, user: AuthenticatedUser) {
    return this.prisma.userAlertsSetting.upsert({
      where:{
        userId_alertsTypeId:{
          alertsTypeId: createAndUpdateData.alertsTypeId,
          userId: user.userId
        }
      },
      create: {
        mobile: createAndUpdateData.mobile,
        app: createAndUpdateData.app,
        desktop: createAndUpdateData.desktop,
        email: createAndUpdateData.email,
        userId: user.userId,
        alertsTypeId: createAndUpdateData.alertsTypeId
      },
      update:{
        mobile: createAndUpdateData.mobile,
        app: createAndUpdateData.app,
        desktop: createAndUpdateData.desktop,
        email: createAndUpdateData.email,
        modifiedDate: new Date()
      }
    }).catch(err => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findOne(userAlertsTypeId: number, userId: number) {
    return this.prisma.userAlertsSetting.findUnique({
      where: {
        userId_alertsTypeId: {
          alertsTypeId: userAlertsTypeId,
          userId: userId
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findBySlug(userAlertsTypeSlug: string, userId: number) {
    return this.prisma.userAlertsSetting.findFirst({
      where: {
        userId: userId,
        AlertsType:{
          slug: userAlertsTypeSlug
        }
      },
      include:{
        AlertsType: {
          select:{
            id: true,
            slug: true,
          }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  unsubscribeAll(user: AuthenticatedUser){
    return this.prisma.userAlertsSetting.updateMany({
      where:{
        userId: user.userId
      },
      data:{
        email: false,
        desktop: false,
        app: false,
        mobile: false
      }
    })
  }
}
