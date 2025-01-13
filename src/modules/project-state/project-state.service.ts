import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateProjectStateDto } from './dto/create-project-state.dto';
import { UpdateProjectStateDto } from './dto/update-project-state.dto';
import { ProjectStateFiltersDto } from './dto/project-state-filters.dto';

@Injectable()
export class ProjectStateService {

  private readonly logger = new Logger(ProjectStateService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateProjectStateDto) {
    let recordData = createDto;
    if(!recordData.bgColor){
      recordData.bgColor = "#ddd";
    }

    if(!recordData.textColor){
      recordData.textColor = "#555";
    }

    return this.prisma.projectState.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.ProjectStateWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.projectState.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.ProjectStateWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.projectState.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findAllPublishedStates(filters: Prisma.ProjectStateWhereInput) {
    return this.prisma.projectState.findMany({
      where: filters,
      orderBy: {
        id: 'desc'
      }
    });
}

  findOne(id: number) {
    return this.prisma.projectState.findUnique({
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
    return this.prisma.projectState.findUnique({
      where: {
        slug: slug
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateProjectStateDto) {

    return this.prisma.projectState.update({
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
    return this.prisma.projectState.update({
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


  applyFilters(filters: ProjectStateFiltersDto) {
    let condition: Prisma.ProjectStateWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if(filters.id){
        condition = {...condition, id : filters.id}
      }

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

  countFaqs(filters: Prisma.ProjectStateWhereInput) {
    return this.prisma.projectState.count({
      where: filters
    })
  }

}

