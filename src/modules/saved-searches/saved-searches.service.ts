

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { SavedSearchesFiltersDto } from './dto/saved-searches-filters.dto';
import { SavedSearchesPaginationDto } from './dto/saved-searches-pagination.dto';
import { SavedSearchesSortableFields, SavedSearchesSortingDto } from './dto/saved-searches-sorting.dto';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { SavedSearchesThresholdPerUser } from './enums/saved-searches.enums';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { CreateAdminSavedSearchDto } from './dto/create-saved-search-admin.dto';
import { SavedSearchesAdminFiltersDto } from './dto/saved-searches-admin-filters.dto';

@Injectable()
export class SavedSearchesService {

  private readonly logger = new Logger(SavedSearchesService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createSavedSearchDto: CreateSavedSearchDto) {
    if(Object.entries(createSavedSearchDto.savedSearchesFilters).length === 0) throw {message: "No filters provided. Please provide at least one filter", statusCode: 400}
    let filters = new SavedSearchesFiltersDto()
    filters.savedSearchesFilters = createSavedSearchDto.savedSearchesFilters;
    filters.userIds = createSavedSearchDto['userId'];
    filters["forAdminpanel"] = false;
    let appliedFilters = this.applyFilters(filters);
    let exisingRecord = await this.checkIfRecordExists(appliedFilters);
    if(exisingRecord){
      throw {
        message: "You have already saved this search",
        statusCode: 200
      }
    }
    let totalAlerts = await this.countSavedSearches({userId: createSavedSearchDto['userId'], isPublished: true})
    if(totalAlerts > SavedSearchesThresholdPerUser){
      throw {
        message: "You have reached your subscriptions limit. Please delete some to add new subscription",
        statusCode: 400
      }
    }
    let {savedSearchesFilters, ...rest} = createSavedSearchDto;
    let insertData : Prisma.SavedSearchesCreateInput = rest;
    insertData.filters = savedSearchesFilters as any;
    insertData.forAdminpanel = false;
    insertData.isPrivate = true;
    insertData.visibility = "self";

    return this.prisma.savedSearches.create({
      data: insertData
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }


  async createAdminpanelFilters(createSavedSearchDto: CreateAdminSavedSearchDto, user: AuthenticatedUser) {
    if(Object.entries(createSavedSearchDto.savedSearchesFilters).length === 0) throw {message: "No filters provided. Please provide at least one filter", statusCode: 400}
    let filters = new SavedSearchesAdminFiltersDto()
    filters.savedSearchesFilters = createSavedSearchDto.savedSearchesFilters;
    if(createSavedSearchDto.visibility === 'self'){
      filters.userIds = user.userId
    }

    filters["forAdminpanel"] = true;
    let appliedFilters = this.applyAdminFilters(filters);
    let exisingRecord = await this.checkIfRecordExists(appliedFilters);
    if(exisingRecord){
      throw {
        message: "You have already saved this search",
        statusCode: 200
      }
    }
    let totalAlerts = await this.countSavedSearches({userId: createSavedSearchDto['userId'], isPublished: true})
    if(totalAlerts > SavedSearchesThresholdPerUser){
      throw {
        message: "You have reached your subscriptions limit. Please delete some to add new subscription",
        statusCode: 400
      }
    }
    let {savedSearchesFilters, ...rest} = createSavedSearchDto;
    let insertData : Prisma.SavedSearchesUncheckedCreateInput = rest;
    insertData.filters = savedSearchesFilters as any;
    insertData.forAdminpanel = true;
    if(createSavedSearchDto.visibility === 'self'){
      insertData.userId = user.userId
    }

    return this.prisma.savedSearches.create({
      data: insertData
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }


  findAll(filters: Prisma.SavedSearchesWhereInput, pagination: SavedSearchesPaginationDto, sorting: SavedSearchesSortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.SavedSearchesOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    let records = this.prisma.savedSearches.findMany({
      where: filters,
      take: take,
      skip: skip,
      orderBy: __sorter
    });
    return records;
  }


  checkIfRecordExists(filters: Prisma.SavedSearchesWhereInput) {
   let records = this.prisma.savedSearches.findFirst({
      where: filters
    });
    return records;
  }

  findOne(id: number, user: AuthenticatedUser) {
    return this.prisma.savedSearches.findFirst({
      where: {
        id: id,
        userId: user.userId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findOneById(id: number) {
    return this.prisma.savedSearches.findFirst({
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
    return this.prisma.savedSearches.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  removeSavedSearches(id: number, userId: number) {
    return this.prisma.savedSearches.deleteMany({
      where: {
        id: id,
        userId: userId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  removeAllSavedSearches(userId: number, adminpanel : boolean) {
    return this.prisma.savedSearches.deleteMany({
      where: {
        userId: userId,
        forAdminpanel: adminpanel
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyFilters(filters: SavedSearchesFiltersDto) {
    let condition: Prisma.SavedSearchesWhereInput = {};
    if (Object.entries(filters).length > 0) {

      if (filters.isPublished || filters.isPublished === false) {
        condition = { ...condition, isPublished: filters.isPublished }
      }

      if(filters.userIds){
        if (Array.isArray(filters.userIds)) {
          condition = { ...condition, userId: { in: filters.userIds } }
        } else {
          condition = { ...condition, userId: filters.userIds }
        }
      }

      if(filters.organizationId){
        condition = {...condition, organizationId: filters.organizationId}
      }

      let alertFiltersCondition : Array<{filters: Prisma.JsonNullableFilter}> = [];
      if(filters?.savedSearchesFilters && Object.entries(filters.savedSearchesFilters).length > 0){

      if(filters.savedSearchesFilters.category){
        alertFiltersCondition.push({filters : {path: ['category'], equals: filters.savedSearchesFilters.category}})
      }

      if(filters.savedSearchesFilters.type){
        alertFiltersCondition.push({filters :{path: ['type'], equals: filters.savedSearchesFilters.type}})
      }

    }
      if(alertFiltersCondition.length > 0){
        condition = {...condition, AND: alertFiltersCondition}
      }

    }
    return condition;
  }

  applyAdminFilters(filters: SavedSearchesAdminFiltersDto) {
    let condition: Prisma.SavedSearchesWhereInput = {};
    if (Object.entries(filters).length > 0) {

      if (filters.isPublished || filters.isPublished === false) {
        condition = { ...condition, isPublished: filters.isPublished }
      }

      if(filters.userIds){
        if (Array.isArray(filters.userIds)) {
          condition = { ...condition, userId: { in: filters.userIds } }
        } else {
          condition = { ...condition, userId: filters.userIds }
        }
      }

      if(filters.organizationId){
        condition = {...condition, organizationId: filters.organizationId}
      }

      let alertFiltersCondition : Array<{filters: Prisma.JsonNullableFilter}> = [];
      if(filters?.savedSearchesFilters && Object.entries(filters.savedSearchesFilters).length > 0){

      if(filters.savedSearchesFilters.title){
        alertFiltersCondition.push({filters :{path: ['title'], string_contains: filters.savedSearchesFilters.title}})
      }

    }
      if(alertFiltersCondition.length > 0){
        condition = {...condition, AND: alertFiltersCondition}
      }

    }
    return condition;
  }

  countSavedSearches(filters: Prisma.SavedSearchesWhereInput) {
    return this.prisma.savedSearches.count({
      where: filters
    })
  }
}

