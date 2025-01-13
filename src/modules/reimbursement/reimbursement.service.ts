import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateReimbursementDto, ReimbursementReceipts } from './dto/create-reimbursement.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';
import { DepartmentDefaultAttributes, UserDefaultAttributes } from '../user/dto/user.dto';
import { ReimbursementFiltersDto } from './dto/reimbursement-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { ActionStatus, Departments, ReimbursementStatus } from 'src/config/constants';
import { ReimbursementHrAction } from './dto/reimbursement-hr-action.dto';
import { getEnumKeyByEnumValue } from 'src/helpers/common';
import { ReimbursementFinanceAction } from './dto/reimbursement-finance-action.dto';
import { ReimbursementPermissionSetType } from './reimbursement.permissions';

@Injectable()
export class ReimbursementService {

  private readonly logger = new Logger(ReimbursementService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateReimbursementDto, user: AuthenticatedUser) {
    let totalAmount = 0;
    createDto.reimbursementReceipts.forEach((ele) => {
      totalAmount += ele.claimedAmount
    })
    return this.prisma.reimbursement.create({
      data: {
        purpose: createDto.purpose,
        claimedAmount: totalAmount,
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

  findAll(filters: Prisma.ReimbursementWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.reimbursement.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        _count:{
          select:{
            AdminActions: true,
            ReimbursementReceipt: true
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
    return this.prisma.reimbursement.findUnique({
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
        ReimbursementReceipt: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  async hrUpdate(reimbursementId: number, reimbursementHrAction: ReimbursementHrAction, user: AuthenticatedUser) {
    let allReceipts = await this.prisma.reimbursement.findFirst({
      where:{
        id: reimbursementId
      },
      include:{
        ReimbursementReceipt: true,
        AdminActions: true
      }
    })

    if(allReceipts.status !== ReimbursementStatus.submitted){
      if(allReceipts.AdminActions && allReceipts.AdminActions.length > 0){
        let otherDept = await this.prisma.adminAction.count({
          where:{
            reimbursementId: reimbursementId,
            actionById:{
              not: user.userId
            },
            Department:{
              NOT: {
                slug: Departments.hr
              }
            }
          }
        })
        if(otherDept > 0){
          throw {
            message: `This reimbursement is already marked as ${getEnumKeyByEnumValue(ReimbursementStatus, allReceipts.status)}. You cannot make any further changes.`,
            statusCode: 400
          }
        }
      }
      throw {
        message: `This reimbursement has been marked as ${getEnumKeyByEnumValue(ReimbursementStatus, allReceipts.status)} by HR department already. If you want to make any changes on your action, kindly reset and continue.`,
        statusCode: 400
      }
    }

    let allProvidedReceitsId = reimbursementHrAction.reimbursementReceipts.map((ele) => ele.receiptId);
    let receiptData = await this.prisma.reimbursementReceipt.count({
      where: {
        id:{
          in: allProvidedReceitsId
        },
        reimbursementId: reimbursementId
      }
    })

    if(receiptData !== allReceipts.ReimbursementReceipt.length){
      throw {
        message: "Partial information Provided. Please provide all receipt action to make the changes",
        statusCode: 400
      }
    }

    let allUpdatedRecord = [];
    let totalAmount = 0;

      reimbursementHrAction.reimbursementReceipts.forEach((ele) => {
        let current = allReceipts.ReimbursementReceipt.find((rect) => ele.receiptId === rect.id);
        if(!current){
          return
        }
        let status = ele.status;
        let approvedAmount = ele.approvedAmount;
        if(status === ReimbursementStatus.approved || status === ReimbursementStatus.partially_approved){
          totalAmount += ele.approvedAmount;
          if(ele.approvedAmount !== current.claimedAmount){
            status = ReimbursementStatus.partially_approved
          }
        }else{
          approvedAmount = 0;
        }

        let t = this.prisma.reimbursementReceipt.update({
          where:{
            id: ele.receiptId,
            reimbursementId: reimbursementId
          },
          data:{
            status: status,
            approvedAmount: approvedAmount,
            comment: ele.comment,
            addedDate: new Date(),
          }
        })
        allUpdatedRecord.push(t);
      })

      let reimStatus : ReimbursementStatus;
      if(totalAmount === 0){
        reimStatus = ReimbursementStatus.rejected
      }else if(totalAmount === allReceipts.claimedAmount){
        reimStatus = ReimbursementStatus.approved
      }else{
        reimStatus = ReimbursementStatus.partially_approved
      }

      let r = this.prisma.reimbursement.update({
        where:{
          id: reimbursementId
        },
        data:{
          status: reimStatus,
          approvedAmount: totalAmount
        }
      })
      allUpdatedRecord.push(r);

      let actionData = this.prisma.adminAction.create({
        data:{
          Department:{
            connect: {
              slug: Departments.hr
            }
          } ,
          status: reimStatus,
          ActionBy: {
            connect:{
              id: user.userId
            }
          },
          comment: reimbursementHrAction.comment,
          Reimbursement:{
            connect:{
              id: reimbursementId
            }
          },
          addedDate: new Date()
        }
      })

      allUpdatedRecord.push(actionData)
      await Promise.all(allUpdatedRecord);
      return this.findOne(reimbursementId);
  }

  async financeUpdate(reimbursementId: number, reimbursementAction: ReimbursementFinanceAction, user: AuthenticatedUser){
    let recordData = await this.prisma.reimbursement.findUniqueOrThrow({
      where:{
        id: reimbursementId
      }
    })

    if(recordData.status === ReimbursementStatus.rejected){
      throw {
        message: "This reimbursement has been rejected already, you cannot make any further actions",
        statusCode: 400
      }
    }
    else if(recordData.status === ReimbursementStatus.paid_and_closed){
      throw {
        message: "This reimbursement has been paid and closed already, you cannot make any further actions",
        statusCode: 400
      }
    }
    else if(!(recordData.status === ReimbursementStatus.approved || recordData.status === ReimbursementStatus.partially_approved)){
      throw {
        message: "This reimbursement has not been aproved by HR yet. You can approve/reject only after HR approval",
        statusCode: 400
      }
    }

    await this.prisma.adminAction.create({
      data:{
        Department: {
          connect:{
            slug: Departments.finance
          }
        },
        status: (reimbursementAction.status === ReimbursementStatus.paid_and_closed) ? ActionStatus.Approved : ActionStatus.Rejected,
        ActionBy: {
          connect:{
            id: user.userId
          }
        },
        Reimbursement:{
          connect:{
            id: reimbursementId
          }
        },
        comment: reimbursementAction.comment,
        addedDate: new Date()
      }
    })

    let updatedRecord = await this.prisma.reimbursement.update({
      where:{
        id: reimbursementId
      },
      include: {
        AdminActions:{
          include:{
            ActionBy:{
              select: UserDefaultAttributes
            }
          }
        },
        ReimbursementReceipt: true
      },
      data:{
        status: reimbursementAction.status
      }
    })
    return updatedRecord;
  }

  async withdraw(id: number) {
    let record = await this.prisma.reimbursement.findFirst({
      where:{
        id
      }
    })

    if(record.status == ReimbursementStatus.paid_and_closed || record.status === ReimbursementStatus.rejected){
      throw {
        message: "You cannot withdraw your request as the reimbursement is already" + getEnumKeyByEnumValue(ReimbursementStatus, record.status),
        statuCode: 400
      }
    }

    return this.prisma.reimbursement.update({
      data: {
        status: ReimbursementStatus.withdrawn
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

  remove(id: number) {
    return this.prisma.reimbursement.update({
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


  applyFilters(filters: ReimbursementFiltersDto, permissions?: Partial<ReimbursementPermissionSetType>) {
    let condition: Prisma.ReimbursementWhereInput = {
      isDeleted: false
    };

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

    if(filters.fetchOpenRequest && permissions && Object.entries(filters).length > 0){
      let statusCode = [];
      if(permissions.reimbursementHRApproval){
        statusCode.push(ReimbursementStatus.submitted)
      }

      if(permissions.reimbursementFinanceApproval){
        statusCode.push(ReimbursementStatus.approved)
        statusCode.push(ReimbursementStatus.partially_approved)
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

  countRecords(filters: Prisma.ReimbursementWhereInput) {
    return this.prisma.reimbursement.count({
      where: filters
    })
  }


  async handleFiles(reimbursementId: number, reimbursementReceipts: ReimbursementReceipts[], files: Array<Express.Multer.File>, user: AuthenticatedUser) {
    let insertData: Array<Prisma.ReimbursementReceiptUncheckedCreateInput> = []
    reimbursementReceipts.forEach((ele, index) => {
      if(!files['reimbursementReceipts['+index+"][file]"]){
        return;
      }
      let newRecord : Prisma.ReimbursementReceiptUncheckedCreateInput = {
        title: reimbursementReceipts[index].title,
        claimedAmount: reimbursementReceipts[index].claimedAmount,
        mimeType: files['reimbursementReceipts['+index+"][file]"][0]?.mimetype,
        file: extractRelativePathFromFullPath(files['reimbursementReceipts['+index+"][file]"][0]?.path),
        status: ActionStatus['New / No Action Yet'],
        reimbursementId: reimbursementId
      }
      insertData.push(newRecord)
    });

    if (insertData.length > 0) {
      await this.prisma.reimbursementReceipt.createMany({
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

}

