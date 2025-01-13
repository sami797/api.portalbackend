import { Injectable, Logger } from '@nestjs/common';
import { BiometricsChecks, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { BiometricsFilters } from './dto/biometrics-filters.dto';
import { CreateBiometricDto } from './dto/create-biometric.dto';
import { UpdateBiometricDto } from './dto/update-biometric.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { BiometricsEntryType, TEST_EMAIL } from 'src/config/constants';
import { getDayRange, getDifferenceInDays } from 'src/helpers/common';
import { CheckInCheckOutBiometricDto } from './dto/checkin-checkout-biometric.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { CoordinatesService } from './coordinates.service';

@Injectable()
export class BiometricsService {

  private readonly logger = new Logger(BiometricsService.name);
  constructor(private prisma: PrismaService, private readonly coordinatesService: CoordinatesService) {
  }

  create(createDto: CreateBiometricDto, user: AuthenticatedUser) {
    let daysDifference = Math.abs(getDifferenceInDays(new Date(), createDto.checkIn));
    if (daysDifference > 31) {
      throw {
        message: "You cannot add check in data older than 31 days",
        statusCode: 404
      }
    }

    if (createDto.checkIn > new Date()) {
      throw {
        message: "You cannot add biometrics data for future dates",
        statusCode: 404
      }
    }

    return this.prisma.biometricsChecks.create({
      data: {
        ...createDto,
        type: BiometricsEntryType.manual,
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

  findAll(filters: Prisma.BiometricsChecksWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.biometricsChecks.findMany({
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
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.BiometricsChecksWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.biometricsChecks.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.biometricsChecks.findUnique({
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

  update(id: number, updateDto: UpdateBiometricDto, user: AuthenticatedUser) {
    if (updateDto.checkIn) {
      let daysDifference = Math.abs(getDifferenceInDays(new Date(), updateDto.checkIn));
      if (daysDifference > 31) {
        throw {
          message: "You cannot add check in data older than 31 days",
          statusCode: 404
        }
      }

      if (updateDto.checkIn > new Date()) {
        throw {
          message: "You cannot add biometrics data for future dates",
          statusCode: 404
        }
      }
    }
    return this.prisma.biometricsChecks.update({
      data: {
        ...updateDto,
        isProcessed: false,
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


  applyFilters(filters: BiometricsFilters) {
    let condition: Prisma.BiometricsChecksWhereInput = {
    };

    if (Object.entries(filters).length > 0) {
      if (filters.type) {
        condition = { ...condition, type: filters.type }
      }

      if (filters.userId) {
        condition = { ...condition, userId: filters.userId }
      }

      if (filters.organizationId) {
        condition = { ...condition, User:{
          organizationId: filters.organizationId
        } }
      }

      if (filters.mode) {
        condition = { ...condition, mode: filters.mode }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              checkIn: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              checkIn: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, checkIn: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, checkIn: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.BiometricsChecksWhereInput) {
    return this.prisma.biometricsChecks.count({
      where: filters
    })
  }

  checkInCheckOut(createDto: CheckInCheckOutBiometricDto, user: AuthenticatedUser) {
    return this.prisma.biometricsChecks.create({
      data: {
        mode: createDto.mode,
        type: (createDto.force) ? BiometricsEntryType.force : BiometricsEntryType.auto,
        checkIn: createDto.checkIn,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        selfie: createDto.selfie,
        userAgent: createDto.userAgent,
        userIP: createDto.userIP,
        userId: user.userId,
        addedDate: new Date(),
      }
    })
  }

  async validateCheckInCheckOut(createDto: CheckInCheckOutBiometricDto, user: AuthenticatedUser) {
    let mode = createDto.mode;

    let userData = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: user.userId
      },
      select: {
        enableRemoteCheckin: true
      }
    })

    if (!userData.enableRemoteCheckin) {
      if (!createDto.force) {
        let validProximity = this.coordinatesService.validateProximity(createDto.latitude, createDto.longitude);
        if (!validProximity) {
          throw {
            message: "You are not near by office location. If you are near try moving to adjust your location and try again",
            statusCode: 400
          }
        }
      }
    }

    if (mode === 'out') {
      let dt = new Date(createDto.checkIn);
      dt.setHours(0, 0, 0, 0);

      let checkInData = await this.prisma.biometricsChecks.findFirst({
        where: {
          checkIn: {
            gte: dt
          },
          mode: 'in'
        }
      })

      if (!checkInData) {
        throw {
          message: "You haven't check in today. You should check in first in order to check out later",
          statusCode: 400
        }
      }

      // let checkOutData = await this.prisma.biometricsChecks.findFirst({
      //   where:{
      //     checkIn:{
      //       gte: dt
      //     },
      //     mode: 'out'
      //   }
      // })

      // if(checkOutData){
      //   throw {
      //     message: "You have already checked out for today.",
      //     statusCode: 400
      //   }
      // }
    } else {
      let dt = new Date(createDto.checkIn);
      dt.setHours(0, 0, 0, 0);
      // let checkInData = await this.prisma.biometricsChecks.findFirst({
      //   where:{
      //     checkIn:{
      //       gte: dt
      //     },
      //     mode: 'in'
      //   }
      // })

      // if(checkInData){
      //   throw {
      //     message: "You have already checked in for today.",
      //     statusCode: 400
      //   }
      // }
    }
  }

  async getTodayCheckInCheckOut(userId: number) {
    let response: { checkIn: BiometricsChecks, checkOut: BiometricsChecks } = {
      checkIn: null,
      checkOut: null
    }

    const { dayStart, dayEnd } = getDayRange(new Date());
    const checkIn = await this.prisma.biometricsChecks.findFirst({
      where: {
        userId: userId,
        mode: 'in',
        AND: [
          { checkIn: { gte: dayStart } },
          { checkIn: { lte: dayEnd } }
        ]
      },
      orderBy: { checkIn: 'asc' }
    })

    if (checkIn && checkIn.id) {
      response.checkIn = checkIn;
      const checkOut = await this.prisma.biometricsChecks.findFirst({
        where: {
          userId: userId,
          mode: 'out',
          NOT: {
            id: checkIn.id
          },
          AND: [
            { checkIn: { gte: dayStart } },
            { checkIn: { lte: dayEnd } }
          ]
        },
        orderBy: { checkIn: 'desc' }
      })

      if (checkOut && checkOut.id) {
        response.checkOut = checkOut;
      }
    }

    return response;
  }

  delete(id: number) {
    return this.prisma.biometricsChecks.delete({
      where: {
        id: id
      }
    })
  }
}


