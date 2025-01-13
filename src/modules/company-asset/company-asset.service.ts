import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CompanyAssetFiltersDto } from './dto/company-asset-filters.dto';
import { CreateCompanyAssetDto } from './dto/create-company-asset.dto';
import { UpdateCompanyAssetDto } from './dto/update-company-asset.dto';
import { AllocateAssetToUserDto } from './dto/allocate-asset-to-user.dto';
import { CompanyAssetType } from 'src/config/constants';
import { UserDefaultAttributes } from '../user/dto/user.dto';

@Injectable()
export class CompanyAssetService {

  private readonly logger = new Logger(CompanyAssetService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateCompanyAssetDto) {

    return this.prisma.companyAsset.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  allocateResource(createDto: AllocateAssetToUserDto){
    return this.prisma.assetAllocation.create({
      data: createDto
    })
  }

  findAll(filters: Prisma.CompanyAssetWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.companyAsset.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        AssetAllocation:{
          include:{
            User:{
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

  findCompanyCars(){
    return this.prisma.companyAsset.findMany({
      where: {
        type: CompanyAssetType.car,
        isDeleted: false,
        NOT: {
          AssetAllocation:{
            none:{}
          }
        }
      }
    })
  }

  findAllPublished(filters: Prisma.CompanyAssetWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.companyAsset.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.companyAsset.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateCompanyAssetDto) {

    return this.prisma.companyAsset.update({
      data: updateDto,
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
    return this.prisma.companyAsset.update({
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

  revoke(id: number) {
    return this.prisma.assetAllocation.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  applyFilters(filters: CompanyAssetFiltersDto) {
    let condition: Prisma.CompanyAssetWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {
      if (filters.code) {
        condition = { ...condition, code: {
          contains: filters.code,
          mode: 'insensitive'
        } }
      }

      if (filters.assetName) {
        condition = { ...condition, assetName: {
          contains: filters.assetName,
          mode: 'insensitive'
        } }
      }

      if (filters.type) {
        condition = { ...condition, type: filters.type }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.CompanyAssetWhereInput) {
    return this.prisma.companyAsset.count({
      where: filters
    })
  }

}


