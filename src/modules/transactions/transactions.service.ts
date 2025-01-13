import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN, TransactionStatus, SYSTEM_USERS, TransactionRecordType } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { TransactionPaginationDto } from './dto/transaction-pagination.dto';
import { TransactionSortingDto } from './dto/transaction-sorting.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { ProjectDefaultAttributes } from '../project/dto/project.dto';
import { ClientDefaultAttributes } from '../client/dto/client.dto';
import { AuthorityDefaultAttributes } from '../authorities/dto/authority.dto';
import { AssignTransactionDto } from './dto/assign-transaction.dto';

@Injectable()
export class TransactionsService {

  private readonly logger = new Logger(TransactionsService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createDto: CreateTransactionDto, user: AuthenticatedUser) {
    let projectData = await this.prisma.project.findUniqueOrThrow({
      where:{
        id: createDto.projectId
      },
      select:{
        id: true,
        clientId: true
      }
    })

    return this.prisma.transactions.create({
      data: {
        ...createDto,
        clientId: projectData.clientId,
        addedById: user.userId,
        recordType: TransactionRecordType.government_fees
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(pagination: TransactionPaginationDto, sorting: TransactionSortingDto, condition: Prisma.TransactionsWhereInput ) {
    
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.TransactionsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder};

    let records = this.prisma.transactions.findMany({
      where: condition,
      include:{
        Project:{
          select: ProjectDefaultAttributes
        },
        Client:{
          select: ClientDefaultAttributes
        },
        AddedBy:{
          select: UserDefaultAttributes
        },
        Authority:{
          select: AuthorityDefaultAttributes
        },
        AssignedTo:{
          select: UserDefaultAttributes
        },
        Invoice:{
          select:{
            id: true,
            status: true,
            invoiceNumber: true
          }
        }
      },
      skip: skip,
      take: take,
      orderBy: __sorter,
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.transactions.findFirst({
      where: {
        id: id
      },
      include:{
        Project:{
          select: ProjectDefaultAttributes
        },
        Client:{
          select: ClientDefaultAttributes
        },
        AddedBy:{
          select: UserDefaultAttributes
        },
        Authority:{
          select: AuthorityDefaultAttributes
        },
        AssignedTo:{
          select: UserDefaultAttributes
        },
        Invoice:{
          select:{
            id: true,
            status: true,
            invoiceNumber: true
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateTransactionDto: UpdateTransactionDto) {
    return this.prisma.transactions.update({
      data: updateTransactionDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyFilters(filters: TransactionFiltersDto){
    let condition : Prisma.TransactionsWhereInput= {
      isDeleted: false
    }

    if(Object.entries(filters).length > 0){

      if(filters.__status){
        condition = {...condition, status: {
          in: filters.__status
        }}
      }

      if(filters.onlyGovernmentFees){
        condition = {...condition, recordType: TransactionRecordType.government_fees}
      }
      if(filters.onlyInvoicePayments){
        condition = {...condition, recordType: TransactionRecordType.invoice_transaction}
      }

      if(filters.transactionReference){
        condition = {...condition, transactionReference: {
          contains: filters.transactionReference
        }}
      }

      if(filters.projectId){
        condition = {
          ...condition,
          projectId: filters.projectId
        }
      }

      if(filters.clientId){
        condition = {
          ...condition,
          clientId: filters.clientId
        }
      }

      if(filters.authorityId){
        condition = {
          ...condition,
          authorityId: filters.authorityId
        }
      }

      if(filters.fromDate && filters.toDate){
        condition = {...condition, AND: [ 
          {
            transactionDate: {
              gte: new Date(filters.fromDate + "T00:00:00")
            }
          },
          {
            transactionDate: {
              lte: new Date(filters.toDate + "T23:59:59")
            }
          }
      ]}
      }else{
        if(filters.fromDate){
          condition = {...condition, transactionDate: { gte: new Date(filters.fromDate + "T00:00:00")}}
        }

        if(filters.toDate){
          condition = {...condition, transactionDate: { lte: new Date(filters.toDate + "T23:59:59")}}
        }
      }

    }

    return condition;
  }

  countTotalRecord(condition: Prisma.TransactionsWhereInput){
    return this.prisma.transactions.count({
      where: condition
    })
  }

  remove(id: number) {
    return this.prisma.transactions.update({
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

  assignTransaction(transactionId: number, asignPropertyDto: AssignTransactionDto, user: AuthenticatedUser){
    return this.prisma.transactions.update({
      where:{
        id: transactionId,
      },
      data:{
        assignedToId: asignPropertyDto.assignedToId,
      }
    })
  }

}
