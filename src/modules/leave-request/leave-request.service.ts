import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { DepartmentDefaultAttributes, UserDefaultAttributes } from '../user/dto/user.dto';
import { LeaveRequestFiltersDto } from './dto/leave-request-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { LeaveRequestStatus, LeaveType } from 'src/config/constants';
import { LeaveRequestAdminAction } from './dto/leave-request-admin-action.dto';
import { getDifferenceInDays, getEnumKeyByEnumValue } from 'src/helpers/common';
import { LeaveRequestPermissionSetType } from './leave-request.permissions';
import { LeaveRequestInfoDto } from './dto/get-leave-request-info.dto';

@Injectable()
export class LeaveRequestService {

  private readonly logger = new Logger(LeaveRequestService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createDto: CreateLeaveRequestDto, user: AuthenticatedUser) {
    let leaveType = await this.prisma.leaveType.findUniqueOrThrow({
      where:{
        id: createDto.leaveTypeId
      }
    })

    let totalDays = Math.abs(getDifferenceInDays(createDto.leaveFrom, createDto.leaveTo));
    return this.prisma.leaveRequest.create({
      data: {
        purpose: createDto.purpose,
        leaveFrom: new Date(createDto.leaveFrom),
        leaveTo: new Date(createDto.leaveTo),
        leaveTypeId: createDto.leaveTypeId,
        requestById: user.userId,
        isPaid: leaveType.isPaid,
        totalDays: totalDays,
        addedDate: new Date()
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.LeaveRequestWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.leaveRequest.findMany({
      where: filters,
      skip: skip,
      take: take,
      include: {
        _count: {
          select: {
            AdminActions: true,
            Attachments: true
          }
        },
        RequestBy:{
          select: UserDefaultAttributes
        },
        LeaveType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        AdminActions: {
          take: 1,
          orderBy: {
            addedDate: 'desc'
          },
          include: {
            ActionBy: {
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
    return this.prisma.leaveRequest.findUnique({
      where: {
        id: id
      },
      include: {
        LeaveType:{
          select:{
            id: true,
            title: true,
            slug: true
          }
        },
        RequestBy:{
          select: UserDefaultAttributes
        },
        AdminActions: {
          include: {
            Department: {
              select: DepartmentDefaultAttributes
            },
            ActionBy: {
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

  async projectManagerAction(leaveRequestId: number, leaveRequestAdminAction: LeaveRequestAdminAction, user: AuthenticatedUser) {
    let recordData = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId
      },
      include: {
        AdminActions: true
      }
    })

    if (recordData.status === LeaveRequestStatus.new) {
      throw {
        message: "Employee has not submitted the request yet",
        statusCode: 400
      }
    }

    if (recordData.status !== LeaveRequestStatus.submitted) {
      if (recordData.AdminActions && recordData.AdminActions.length > 0) {
        let otherDept = await this.prisma.adminAction.count({
          where: {
            leaveRequestId: leaveRequestId,
            actionById: {
              not: user.userId
            },
            departmentId: {
              not: user.department?.id
            }
          }
        })
        if (otherDept > 0) {
          throw {
            message: `This request is already marked as ${getEnumKeyByEnumValue(LeaveRequestStatus, recordData.status)}. You cannot make any further changes.`,
            statusCode: 400
          }
        }
      }
    }

    await this.prisma.adminAction.create({
      data: {
        departmentId: user.department?.id,
        status: leaveRequestAdminAction.status,
        comment: leaveRequestAdminAction.comment,
        actionById: user.userId,
        leaveRequestId: leaveRequestId
      }
    })

    let status = (leaveRequestAdminAction.status === LeaveRequestStatus.approved) ? LeaveRequestStatus.in_progress : leaveRequestAdminAction.status
    await this.prisma.leaveRequest.update({
      where: {
        id: leaveRequestId
      },
      data: {
        status: status
      }
    })

    return this.findOne(leaveRequestId);

  }

  async hrUpdate(leaveRequestId: number, leaveRequestAdminAction: LeaveRequestAdminAction, user: AuthenticatedUser) {
    let recordData = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId
      },
      include: {
        AdminActions: true
      }
    })

    if (recordData.status !== LeaveRequestStatus.in_progress) {
      throw {
        message: "This request has to be approved by project manager before you make any action",
        statusCode: 400
      }
    }

    await this.prisma.adminAction.create({
      data: {
        Department: {
          connect: {
            id: user.department.id
          }
        },
        status: leaveRequestAdminAction.status,
        comment: leaveRequestAdminAction.comment,
        ActionBy: {
          connect: {
            id: user.userId
          }
        },
        LeaveRequest: {
          connect: {
            id: leaveRequestId
          }
        }
      }
    })

    let status = leaveRequestAdminAction.status
    await this.prisma.leaveRequest.update({
      where: {
        id: leaveRequestId
      },
      data: {
        status: status,
        isPaid: (leaveRequestAdminAction.isPaid) ? leaveRequestAdminAction.isPaid: undefined
      }
    })

    return this.findOne(leaveRequestId);
  }

  async withdraw(id: number) {

    let record = await this.prisma.leaveRequest.findFirst({
      where: {
        id
      }
    })

    if (record.status === LeaveRequestStatus.rejected) {
      throw {
        message: "You cannot withdraw your request as the request is already" + getEnumKeyByEnumValue(LeaveRequestStatus, record.status),
        statuCode: 400
      }
    }

    return this.prisma.leaveRequest.update({
      data: {
        status: LeaveRequestStatus.withdrawn
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

  async submitRequest(leaveRequestId: number) {
    let record = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId
      }
    })

    if (!(record.status === LeaveRequestStatus.new || record.status === LeaveRequestStatus.request_modification)) {
      throw {
        message: "You have already submitted your request",
        statuCode: 400
      }
    }

    return this.prisma.leaveRequest.update({
      data: {
        status: LeaveRequestStatus.submitted
      },
      where: {
        id: leaveRequestId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  applyFilters(filters: LeaveRequestFiltersDto, user: AuthenticatedUser, permissions?: Partial<LeaveRequestPermissionSetType>) {
    let condition: Prisma.LeaveRequestWhereInput = {};

    if (Object.entries(filters).length > 0) {
      if (filters.userId) {
        condition = { ...condition, requestById: filters.userId }
      }

      if (filters.status) {
        condition = {
          ...condition, status: filters.status
        }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              leaveFrom: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              leaveFrom: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, leaveFrom: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, leaveFrom: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

    }

    if (filters.fetchOpenRequest && permissions && Object.entries(filters).length > 0) {
      let statusCode = [];
      if (permissions.leaveRequestHRApproval) {
        statusCode.push(LeaveRequestStatus.in_progress)
      }

      condition = {
        ...condition,
        AND: {
          OR: [
            {
              status: {
                in: statusCode
              }
            },
            {
              status: LeaveRequestStatus.submitted,
              RequestBy: {
                managerId: user.userId
              }
            }
          ]
        }
      }
    }else{
      if(!permissions?.leaveRequestHRApproval){
        condition = {
          ...condition,
          AND: {
            OR: [
              {
                RequestBy: {
                  managerId: user.userId
                }
              },
              {
                RequestBy: {
                  id: user.userId
                }
              }
            ]
          }
        }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.LeaveRequestWhereInput) {
    return this.prisma.leaveRequest.count({
      where: filters
    })
  }


  async handleFiles(leaveRequestId: number, files: Array<Express.Multer.File>) {
    let insertData: Array<Prisma.RequestAttachmentUncheckedCreateInput> = []
    files.forEach((ele, index) => {
      let newRecord: Prisma.RequestAttachmentUncheckedCreateInput = {
        title: ele.filename,
        mimeType: ele.mimetype,
        file: extractRelativePathFromFullPath(ele.path),
        leaveRequestId: leaveRequestId
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

  async getLeaveInfo(leaveRequestInfoDto: LeaveRequestInfoDto, user: AuthenticatedUser){
    let leaveTypeData = await this.prisma.leaveType.findUniqueOrThrow({
      where:{
        id: leaveRequestInfoDto.leaveTypeId
      }
    })

    if(leaveTypeData.slug === LeaveType['annual-leave']){

    }
  }

  async findLeavesReport(userId: number){
    let paidLeaves = await this.prisma.leaveRequest.aggregate({
      _sum:{
        totalDays: true
      },
      where:{
        status: LeaveRequestStatus.approved,
        isPaid: true,
        requestById: userId
      }
    })

    let unpaidLeaves = await this.prisma.leaveRequest.aggregate({
      _sum:{
        totalDays: true
      },
      where:{
        status: LeaveRequestStatus.approved,
        isPaid: false,
        requestById: userId
      }
    })

    let totalLeaveCredits = await this.prisma.leaveCredits.aggregate({
      where:{
        userId: userId,
        isDeleted: false
      },
      _sum:{
        daysCount: true
      }
    })

    return {
      paidLeaves: paidLeaves._sum.totalDays,
      unpaidLeaves: unpaidLeaves._sum.totalDays,
      totalLeaveCredits: totalLeaveCredits._sum.daysCount,
      remainingLeaves: totalLeaveCredits._sum.daysCount - paidLeaves._sum.totalDays
    }
  }
}


