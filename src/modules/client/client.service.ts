import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { ClientFiltersDto } from './dto/client-filters.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { XeroProcessNames } from '../xero-accounting/process/xero.process.config';

@Injectable()
export class ClientService {

  private readonly logger = new Logger(ClientService.name);
  constructor(private prisma: PrismaService, @InjectQueue('xero') private xeroQueue: Queue) {
  }

  async create(createDto: CreateClientDto) {

    let newClient = await this.prisma.client.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
    return newClient;
  }

  findAll(filters: Prisma.ClientWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.client.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.ClientWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.client.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.client.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateDto: UpdateClientDto) {
    let updatedData = await this.prisma.client.update({
      data: updateDto,
      where: {
        id: id
      },
      include:{
        ClientXeroConnection: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if(updatedData && updatedData.ClientXeroConnection.length > 0){
      updatedData.ClientXeroConnection.forEach((ele) =>{
        this.xeroQueue.add(XeroProcessNames.syncClient, {
          message: "Sync Client With Xero",
          data: {
            ...updatedData,
            xeroTenantId: ele.xeroTenantId,
            xeroReference: ele.xeroReference 
          }
        }, { removeOnComplete: true })
      })
    }

    return updatedData;

  }

  async remove(id: number) {
    let recordData = await this.prisma.client.update({
      data: {
        isDeleted: true
      },
      where: {
        id: id
      },
      include:{
        ClientXeroConnection: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if(recordData && recordData.ClientXeroConnection.length > 0){
      recordData.ClientXeroConnection.forEach((ele) =>{
        this.xeroQueue.add(XeroProcessNames.syncClient, {
          message: "Sync Client With Xero",
          data: {
            ...recordData,
            xeroTenantId: ele.xeroTenantId,
            xeroReference: ele.xeroReference 
          }
        }, { removeOnComplete: true })
      })
    }

    return recordData;
  }


  applyFilters(filters: ClientFiltersDto) {
    let condition: Prisma.ClientWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if (filters.ids) {
        let allIds = [];
        if (Array.isArray(filters.ids)) {
          allIds = filters.ids
        } else {
          allIds = [filters.ids]
        }

        if (allIds.length > 0) {
          condition = {
            ...condition,
            id: {
              in: allIds
            }
          }
        }
      }

      if (filters.name) {
        condition = {
          ...condition, name: {
            contains: filters.name,
            mode: 'insensitive'
          }
        }
      }

      if (filters.email) {
        condition = {
          ...condition, email: {
            contains: filters.email,
            mode: 'insensitive'
          }
        }
      }


      if (filters.phone) {
        condition = {
          ...condition, phone: {
            contains: filters.phone
          }
        }
      }

      if (filters.type) {
        condition = { ...condition, type: filters.type }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.ClientWhereInput) {
    return this.prisma.client.count({
      where: filters
    })
  }

}


