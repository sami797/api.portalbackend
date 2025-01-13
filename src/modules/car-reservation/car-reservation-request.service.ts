import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateCarReservationRequestDto } from './dto/create-car-reservation.dto';
import { DepartmentDefaultAttributes, UserDefaultAttributes } from '../user/dto/user.dto';
import { CarReservationRequestFiltersDto } from './dto/car-reservation-request-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { CarReservationRequestStatus, CompanyAssetType, Departments } from 'src/config/constants';
import { CarReservationRequestAdminAction } from './dto/car-reservation-request-admin-action.dto';
import { getEnumKeyByEnumValue } from 'src/helpers/common';
import { CheckCarAvailabilityDto } from './dto/check-car-availability.dto';
import { CarReservationRequestPermissionSetType } from './car-reservation-request.permissions';

@Injectable()
export class CarReservationRequestService {

  private readonly logger = new Logger(CarReservationRequestService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createDto: CreateCarReservationRequestDto, user: AuthenticatedUser) {

    return this.prisma.carReservationRequest.create({
      data: {
        purpose: createDto.purpose,
        fromDate: new Date(createDto.fromDate),
        toDate: new Date(createDto.toDate),
        projectId: (createDto.projectId) ? createDto.projectId : undefined,
        requestById: user.userId,
        addedDate: new Date()
      },
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.CarReservationRequestWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.carReservationRequest.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        _count:{
          select:{
            AdminActions: true,
            Attachments: true
          }
        },
        RequestBy:{
          select: UserDefaultAttributes
        },
        AdminActions:{
          take: 1,
          orderBy: {
            addedDate: 'desc'
          },
          include:{
            ActionBy:{
              select: UserDefaultAttributes
            }
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.carReservationRequest.findUnique({
      where: {
        id: id
      },
      include: {
        RequestBy:{
          select: UserDefaultAttributes
        },
        AdminActions:{
          include:{
            Department:{
              select: DepartmentDefaultAttributes
            },
            ActionBy:{
              select: UserDefaultAttributes
            }
          }
        },
        Attachments: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async hrUpdate(carReservationRequestId: number, carReservationRequestAdminAction: CarReservationRequestAdminAction, user: AuthenticatedUser) {
    let recordData = await this.prisma.carReservationRequest.findFirst({
      where:{
        id: carReservationRequestId
      },
      include:{
        AdminActions: true
      }
    })

    if(recordData.status !== CarReservationRequestStatus.submitted){
      throw {
        message: `This request has been already marked as ${getEnumKeyByEnumValue( CarReservationRequestStatus ,recordData.status)}`,
        statusCode: 400
      }
    }

    await this.prisma.adminAction.create({
      data:{
        Department:{
          connect:{
            slug: Departments.hr
          }
        },
        status: carReservationRequestAdminAction.status,
        comment: carReservationRequestAdminAction.comment,
        // actionById: user.userId,
        ActionBy:{
          connect:{
            id: user.userId
          }
        },
        CarReservationRequest:{
          connect:{
            id: carReservationRequestId
          }
        }
      }
    })

    let status = carReservationRequestAdminAction.status
    await this.prisma.carReservationRequest.update({
      where:{
        id: carReservationRequestId
      },
      data:{
        status: status,
        companyCarId: carReservationRequestAdminAction.companyCarId
      }
    })

      return this.findOne(carReservationRequestId);
  }

  async withdraw(id: number) {

    let record = await this.prisma.carReservationRequest.findFirst({
      where:{
        id
      }
    })

    if(record.status === CarReservationRequestStatus.rejected){
      throw {
        message: "You cannot withdraw your request as the request is already" + getEnumKeyByEnumValue(CarReservationRequestStatus, record.status),
        statuCode: 400
      }
    }

    return this.prisma.carReservationRequest.update({
      data: {
        status: CarReservationRequestStatus.withdrawn
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

  async submitRequest(carReservationRequestId: number){
    let record = await this.prisma.carReservationRequest.findFirst({
      where:{
        id: carReservationRequestId
      }
    })

    return this.prisma.carReservationRequest.update({
      data: {
        status: CarReservationRequestStatus.submitted
      },
      where: {
        id: carReservationRequestId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  applyFilters(filters: CarReservationRequestFiltersDto, permissions?: Partial<CarReservationRequestPermissionSetType>) {
    let condition: Prisma.CarReservationRequestWhereInput = {};

    if (Object.entries(filters).length > 0) {
      if (filters.userId) {
        condition = { ...condition, requestById: filters.userId }
      }

      if(filters.status){
        condition = {
          ...condition, status: filters.status
        }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              fromDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              fromDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, fromDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, fromDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }
    }


    if(filters.fetchOpenRequest && permissions && Object.entries(filters).length > 0){
      let statusCode = [];
      if(permissions.carReservationRequestHRApproval){
        statusCode.push(CarReservationRequestStatus.submitted)
      }

      condition = {
        ...condition,
        status: {
          in: statusCode
        }
      }
    }

    return condition;
  }

  countRecords(filters: Prisma.CarReservationRequestWhereInput) {
    return this.prisma.carReservationRequest.count({
      where: filters
    })
  }


  async handleFiles(carReservationRequestId: number, files: Array<Express.Multer.File>) {
    let insertData: Array<Prisma.RequestAttachmentUncheckedCreateInput> = []
    files.forEach((ele, index) => {
      let newRecord : Prisma.RequestAttachmentUncheckedCreateInput = {
        title: ele.filename,
        mimeType: ele.mimetype,
        file: extractRelativePathFromFullPath(ele.path),
        carReservationRequestId: carReservationRequestId
      }
      insertData.push(newRecord)
    });

    if (insertData.length > 0) {
      await this.prisma.requestAttachment.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })
    } else {
      return []
    }
  }

  async checkAvailability(checkCarAvailabilityDto: CheckCarAvailabilityDto){
    let availableCars = await this.prisma.companyAsset.count({
      where:{
       id: (checkCarAvailabilityDto.companyCarId) ? checkCarAvailabilityDto.companyCarId : undefined,
        type: CompanyAssetType.car,
        CarReservationRequest:{
          none:{
            status: CarReservationRequestStatus.approved,
            AND: [
              {
                fromDate:{
                  lte: new Date(checkCarAvailabilityDto.toDate),
                }
              },
              {
                toDate: {
                  gte: new Date(checkCarAvailabilityDto.fromDate)
                }
              }
            ]
          }
        }
      }
    })

    return availableCars !== 0;

  }

}


