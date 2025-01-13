import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationFilters } from './dto/notification-filters.dto';
import { NotificationPaginationDto } from './dto/notification-pagination.dto';
import * as BluebirdPromise from 'bluebird';
import { DepartmentDefaultAttributes, UserDefaultAttributes } from '../user/dto/user.dto';
@Injectable()
export class NotificationService {

  private readonly logger = new Logger(NotificationService.name);
  constructor(private prisma: PrismaService) { }

  async create(createNotificationDto: CreateNotificationDto) {
    const {userIds, ...rest} = createNotificationDto
    let noti = await this.prisma.notification.create({
      data: {
        ...rest,
        mode: 'manual'
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if(noti && createNotificationDto.type === 'user' && userIds){
      await this.prisma.subscribers.createMany({
        data: userIds.map((ele) => {
          return {
            notificationId: noti.id,
            userId: ele
          }
        })
      })
    }

    return noti;
  }

  findAll(condition: Prisma.NotificationWhereInput, pagination: NotificationPaginationDto) {
    let recordData = this.prisma.notification.findMany({
      where: condition,
      orderBy: {
        id: 'desc'
      }
    });
    return recordData;
  }

  findAllAnnouncement(condition: Prisma.NotificationWhereInput, pagination: NotificationPaginationDto) {
    let recordData = this.prisma.notification.findMany({
      where: condition,
      include:{
        Department:{
          select: DepartmentDefaultAttributes
        },
        Subscribers:{
          select:{
            User:{
              select: UserDefaultAttributes
            }
          }
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
    return recordData;
  }

  remove(id: number) {
    return this.prisma.notification.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async readNotification(id: number, user: AuthenticatedUser) {
    let notiData = await this.prisma.notification.findUnique({
      where:{
        id: id,
        AND:{
          OR:[
            {
              Subscribers:{
                some: {
                  userId: user.userId
                }
              }
            },
            {
              type:'broadcast'
            },
            (user.department)?
            {
              type: 'department',
              departmentId: user.department.id
            }
            : undefined
          ]
        }
      }
    })

    if(!notiData){
      throw {
        message: "No Notification Found With Provided ID or You don't have permission to update this record",
        statusCode: 404
      }
    }

    return this.prisma.subscribers.upsert({
      where: {
        notificationId_userId: {
          userId: user.userId,
          notificationId: id
        }
      },
      create: {
        userId: user.userId,
        notificationId: id,
        read: true
      },
      update:{
        read: true
      }
    })

  }

  async readAllNotification(user: AuthenticatedUser) {
    let allRecords = await this.prisma.notification.findMany({
      where: {
        AND:{
          OR:[
            {
              Subscribers:{
                some: {
                  userId: user.userId
                }
              }
            },
            {
              type:'broadcast'
            },
            (user.department)?
            {
              type: 'department',
              departmentId: user.department.id
            }
            : undefined
          ]
        }
      }
    })

    if(!allRecords){
      return true
    }

    let updatedRecords = [];
    const MAX_CONCURRENT_OPERATIONS = 10;
      await BluebirdPromise.map(allRecords, async (ele) => {
      let dt = this.prisma.subscribers.upsert({
        where: {
          notificationId_userId: {
            userId: user.userId,
            notificationId: ele.id
          }
        },
        create: {
          userId: user.userId,
          notificationId: ele.id,
          read: true
        },
        update:{
          read: true
        }
      })
      updatedRecords.push(dt);
    }, { concurrency: MAX_CONCURRENT_OPERATIONS });

    await Promise.all(updatedRecords);
    return true;

  }



  applyFilters(filters: NotificationFilters, user: AuthenticatedUser) {
    let condition: Prisma.NotificationWhereInput = {};

    if (Object.entries(filters).length > 0) {
      if (filters.showUnreadOnly === true) {
        condition = {
          ...condition,
          AND: {
            OR: [
              {
                type: 'user',
                Subscribers: {
                  some: {
                    userId: user.userId,
                    read: false
                  }
                }
              },
              {
                type: 'broadcast',
                NOT: {
                  Subscribers: {
                    some: {
                      userId: user.userId,
                      read: true
                    }
                  }
                }
              },
              (user.department)?
              {
                type: 'department',
                departmentId: user.department.id,
                NOT: {
                  Subscribers: {
                    some: {
                      userId: user.userId,
                      read: true
                    }
                  }
                }
              }
              : undefined
            ]
          }
        }
      } else {
        condition = {
          ...condition,
          AND: {
            OR: [
              {
                Subscribers: {
                  some: {
                    userId: user.userId
                  }
                }
              },
              {
                type: 'broadcast'
              },
              (user.department)?
              {
                type: 'department',
                departmentId: user.department.id
              }
              : undefined
            ]
          }
        }
      }
    }
    return condition;
  }

  applyAnnouncementFilters() {
    let condition: Prisma.NotificationWhereInput = {
      mode: 'manual'
    };
    return condition;
  }

  countNotifications(filters: Prisma.NotificationWhereInput) {
    return this.prisma.notification.count({
      where: filters
    })
  }
}
