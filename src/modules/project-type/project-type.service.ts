import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectTypeDto } from './dto/create-project-type.dto';
import { UpdateProjectTypeDto } from './dto/update-project-type.dto';
import { ProjectTypeFiltersDto } from './dto/project-type-filters.dto';

@Injectable()
export class ProjectTypeService {

  private readonly logger = new Logger(ProjectTypeService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateProjectTypeDto) {

    return this.prisma.projectType.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.ProjectTypeWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.projectType.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.ProjectTypeWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.projectType.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.projectType.findUnique({
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
    return this.prisma.projectType.findUnique({
      where: {
        slug: slug
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateProjectTypeDto) {

    return this.prisma.projectType.update({
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
    return this.prisma.projectType.update({
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


  applyFilters(filters: ProjectTypeFiltersDto) {
    let condition: Prisma.ProjectTypeWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if (filters.slug) {
        condition = { ...condition, slug: filters.slug }
      }

      if (filters.title) {
        condition = {
          ...condition,
          title: {
            contains: filters.title,
            mode: 'insensitive'
          }
        }
      }
    }
    return condition;
  }

  countFaqs(filters: Prisma.ProjectTypeWhereInput) {
    return this.prisma.projectType.count({
      where: filters
    })
  }

}

