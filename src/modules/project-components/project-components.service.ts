import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectComponentDto } from './dto/create-project-component.dto';
import { UpdateProjectComponentDto } from './dto/update-project-component.dto';
import { ProjectComponentFiltersDto } from './dto/project-component-filters.dto';

@Injectable()
export class ProjectComponentsService {

  private readonly logger = new Logger(ProjectComponentsService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateProjectComponentDto) {

    return this.prisma.projectComponent.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.ProjectComponentWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.projectComponent.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.ProjectComponentWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.projectComponent.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.projectComponent.findUnique({
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
    return this.prisma.projectComponent.findUnique({
      where: {
        slug: slug
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateProjectComponentDto) {

    return this.prisma.projectComponent.update({
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
    return this.prisma.projectComponent.update({
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


  applyFilters(filters: ProjectComponentFiltersDto) {
    let condition: Prisma.ProjectComponentWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

    

      if(filters.slug){
        condition = {...condition, slug : filters.slug}
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

  countFaqs(filters: Prisma.ProjectComponentWhereInput) {
    return this.prisma.projectComponent.count({
      where: filters
    })
  }

}

