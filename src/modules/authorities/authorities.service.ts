import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';
import { AuthorityFiltersDto } from './dto/authority-filters.dto';

@Injectable()
export class AuthoritiesService {

  private readonly logger = new Logger(AuthoritiesService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateAuthorityDto) {

    return this.prisma.authorities.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.AuthoritiesWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.authorities.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.AuthoritiesWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.authorities.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.authorities.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findBySlug(slug: string) {
    return this.prisma.authorities.findUnique({
      where: {
        slug: slug
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateAuthorityDto) {

    return this.prisma.authorities.update({
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
    return this.prisma.authorities.update({
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


  applyFilters(filters: AuthorityFiltersDto) {
    let condition: Prisma.AuthoritiesWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if(filters.slug){
        condition = {...condition, slug : filters.slug}
      }

      if(filters.id){
        condition = {...condition, id : filters.id}
      }

      if (filters.title) {
        condition = {
          ...condition, 
          title:{
            contains: filters.title,
            mode: 'insensitive'
          }
        }
      }
    }
    return condition;
  }

  countFaqs(filters: Prisma.AuthoritiesWhereInput) {
    return this.prisma.authorities.count({
      where: filters
    })
  }

}

