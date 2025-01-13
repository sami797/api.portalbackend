import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateCashAdvanceDto } from './dto/create-cash-advance.dto';
import { UpdateCashAdvanceDto } from './dto/update-cash-advance.dto';
import { DepartmentDefaultAttributes, UserDefaultAttributes } from '../user/dto/user.dto';
import { CashAdvanceRequestFiltersDto } from './dto/cash-advance-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { ActionStatus, CashAdvanceRequestStatus, Departments } from 'src/config/constants';
import { CashAdvanceHrAction } from './dto/cash-advance-hr-action.dto';
import { getEnumKeyByEnumValue } from 'src/helpers/common';
import { CashAdvanceFinanceAction } from './dto/cash-advance-finance-action.dto';
import { CashAdvancePermissionSetType } from './cash-advance.permissions';
import { InstallmentPaidDto } from './dto/installment-paid.dto';
import { cashAdvanceManagerAction } from './dto/cash-advance-manager-action.dto';

@Injectable()
export class CashAdvanceService {

  private readonly logger = new Logger(CashAdvanceService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateCashAdvanceDto, user: AuthenticatedUser) {
    return this.prisma.cashAdvanceRequest.create({
      data: {
        purpose: createDto.purpose,
        requestAmount: createDto.requestAmount,
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

  findAll(filters: Prisma.CashAdvanceRequestWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.cashAdvanceRequest.findMany({
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
    return this.prisma.cashAdvanceRequest.findUnique({
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
        Installments: true,
        Attachments: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async hrUpdate(cashAdvanceRequestId: number, cashAdvanceHrAction: CashAdvanceHrAction, user: AuthenticatedUser) {
    let recordData = await this.prisma.cashAdvanceRequest.findFirst({
      where: { id: cashAdvanceRequestId },
      include: { AdminActions: true },
    });
  
    // Ensure HR actions are allowed only if the request is not in a final status
    if (recordData.status === CashAdvanceRequestStatus.withdrawn || recordData.status === CashAdvanceRequestStatus.paid_and_closed) {
      throw {
        message: `This request has already been ${getEnumKeyByEnumValue(CashAdvanceRequestStatus, recordData.status)}.`,
        statusCode: 400,
      };
    }
  
    // HR can approve or partially approve the amount
    let status: CashAdvanceRequestStatus = CashAdvanceRequestStatus.approved; // Default approved for HR
    if (cashAdvanceHrAction.status === CashAdvanceRequestStatus.rejected) {
      status = CashAdvanceRequestStatus.rejected;
    } else if (recordData.requestAmount === cashAdvanceHrAction.approvedAmount) {
      status = CashAdvanceRequestStatus.approved;
    } else {
      status = CashAdvanceRequestStatus.partially_approved;
    }
  
    // Update the request with HR approval
    let r = this.prisma.cashAdvanceRequest.update({
      where: { id: cashAdvanceRequestId },
      data: {
        status: status, // HR approval status
        approvedAmount: cashAdvanceHrAction.approvedAmount,
      },
    });
  
    // Log HR action
    let actionData = this.prisma.adminAction.create({
      data: {
        status: status,
        comment: cashAdvanceHrAction.comment,
        Department: { connect: { slug: Departments.hr } },
        ActionBy: { connect: { id: user.userId } },
        CashAdvanceRequest: { connect: { id: cashAdvanceRequestId } },
        addedDate: new Date(),
      },
    });
  
    await Promise.all([r, actionData]); // Run HR approval
    return this.findOne(cashAdvanceRequestId); // Return updated request
  }
  
  
  async managerUpdate(cashAdvanceRequestId: number, cashAdvanceManagerAction: cashAdvanceManagerAction, user: AuthenticatedUser) {
    let recordData = await this.prisma.cashAdvanceRequest.findUniqueOrThrow({
      where: { id: cashAdvanceRequestId },
    });
  
    // Ensure Manager actions are allowed only if HR has approved the request
    if (recordData.status !== CashAdvanceRequestStatus.approved && recordData.status !== CashAdvanceRequestStatus.partially_approved) {
      throw {
        statusCode: 200,
        message: "Th action has been successfully processed.",
      };
    }
  
    // Manager can approve or reject the request
    let status: CashAdvanceRequestStatus = cashAdvanceManagerAction.status;
    if (status === CashAdvanceRequestStatus.approved) {
      status = CashAdvanceRequestStatus.approved;
    } else if (status === CashAdvanceRequestStatus.rejected) {
      status = CashAdvanceRequestStatus.rejected;
    }
  
    // Update request with Manager's decision
    let t = this.prisma.cashAdvanceRequest.update({
      where: { id: cashAdvanceRequestId },
      data: {
        status: status,
      },
    });
  
    // Log Manager action
    let managerAction = this.prisma.adminAction.create({
      data: {
        status: status === CashAdvanceRequestStatus.approved ? ActionStatus.Approved : ActionStatus.Rejected,
        comment: cashAdvanceManagerAction.comment,
        Department: { connect: { slug: Departments.manager } },
        ActionBy: { connect: { id: user.userId } },
        CashAdvanceRequest: { connect: { id: cashAdvanceRequestId } },
        addedDate: new Date(),
      },
    });
  
    await Promise.all([t, managerAction]); // Run Manager approval
    return this.findOne(cashAdvanceRequestId); // Return updated request
  }
  
  
 async financeUpdate(cashAdvanceRequestId: number, cashAdvanceFinanceAction: CashAdvanceFinanceAction, user: AuthenticatedUser) {
  let recordData = await this.prisma.cashAdvanceRequest.findUniqueOrThrow({
    where: { id: cashAdvanceRequestId },
  });

  // Ensure Finance actions are allowed only after Manager approval
  if (recordData.status !== CashAdvanceRequestStatus.approved && recordData.status !== CashAdvanceRequestStatus.partially_approved) {
    throw {
      statusCode: 200,
      message: "Th action has been successfully processed.",
      
    };
  }

  // Finance can approve or reject the request
  let status: CashAdvanceRequestStatus = cashAdvanceFinanceAction.status;
  if (status === CashAdvanceRequestStatus.paid_and_closed) {
    status = CashAdvanceRequestStatus.paid_and_closed;
  } else if (status === CashAdvanceRequestStatus.rejected) {
    status = CashAdvanceRequestStatus.rejected;
  }

  // Update request with Finance's decision
  let t = this.prisma.cashAdvanceRequest.update({
    where: { id: cashAdvanceRequestId },
    data: {
      status: status,
      numberOfInstallments: cashAdvanceFinanceAction.numberOfInstallments,
    },
  });

  // Log Finance action
  let financeAction = this.prisma.adminAction.create({
    data: {
      status: status === CashAdvanceRequestStatus.paid_and_closed ? ActionStatus.Approved : ActionStatus.Rejected,
      comment: cashAdvanceFinanceAction.comment,
      Department: { connect: { slug: Departments.finance } },
      ActionBy: { connect: { id: user.userId } },
      CashAdvanceRequest: { connect: { id: cashAdvanceRequestId } },
      addedDate: new Date(),
    },
  });

  await Promise.all([t, financeAction]); // Run Finance action
  return this.findOne(cashAdvanceRequestId); // Return updated request
}

    async withdraw(id: number) {

    let record = await this.prisma.cashAdvanceRequest.findFirst({
      where:{
        id
      }
    })

    if(record.status == CashAdvanceRequestStatus.paid_and_closed || record.status === CashAdvanceRequestStatus.rejected){
      throw {
        message: "You cannot withdraw your request as the request is already" + getEnumKeyByEnumValue(CashAdvanceRequestStatus, record.status),
        statuCode: 400
      }
    }

    return this.prisma.cashAdvanceRequest.update({
      data: {
        status: CashAdvanceRequestStatus.withdrawn
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


  applyFilters(filters: CashAdvanceRequestFiltersDto, permissions?: Partial<CashAdvancePermissionSetType>) {
    let condition: Prisma.CashAdvanceRequestWhereInput = {};

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
              addedDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              addedDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }
    }

    if(filters.fetchOpenRequest &&  permissions && Object.entries(filters).length > 0){
      let statusCode = [];
      if(permissions.cashAdvanceHRApproval){
        statusCode.push(CashAdvanceRequestStatus.submitted)
      }

      if(permissions.cashAdvanceFinanceApproval){
        statusCode.push(CashAdvanceRequestStatus.approved)
        statusCode.push(CashAdvanceRequestStatus.partially_approved)
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

  countRecords(filters: Prisma.CashAdvanceRequestWhereInput) {
    return this.prisma.cashAdvanceRequest.count({
      where: filters
    })
  }


  async handleFiles(cashAdvanceRequestId: number, files: Array<Express.Multer.File>) {
    let insertData: Array<Prisma.RequestAttachmentUncheckedCreateInput> = []
    files.forEach((ele, index) => {
      let newRecord : Prisma.RequestAttachmentUncheckedCreateInput = {
        title: ele.filename,
        mimeType: ele.mimetype,
        file: extractRelativePathFromFullPath(ele.path),
        cashAdvanceRequestId: cashAdvanceRequestId
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

  async markAsPaid(installmentPaidDto: InstallmentPaidDto){

    let recordData = await this.prisma.cashAdvanceInstallment.findUniqueOrThrow({
      where:{
        id: installmentPaidDto.installmentId
      }
    })

    if(recordData.isPaid){
      throw {
        message: "This installment has been paid already",
        statusCode: 200
      }
    }

    return this.prisma.cashAdvanceInstallment.update({
      where:{
        id: installmentPaidDto.installmentId,
        cashAdvanceRequestId: installmentPaidDto.cashAdvanceId
      },
      data:{
        isPaid: true,
        paidDate: installmentPaidDto.paidDate
      }
    })
  }

}


