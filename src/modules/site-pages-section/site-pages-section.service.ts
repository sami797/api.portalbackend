import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { SitePagesSectionFiltersDto } from './dto/site-pages-section-filters.dto';
import { CreateSitePagesSectionDto } from './dto/create-site-pages-section.dto';
import { UpdateSitePagesSectionDto } from './dto/update-site-pages-section.dto';

@Injectable()
export class SitePagesSectionService {

  private readonly logger = new Logger(SitePagesSectionService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createSitePagesSectionDto: CreateSitePagesSectionDto) {
    return this.prisma.pagesSection.create({
      data: createSitePagesSectionDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  findAll(condition: Prisma.PagesSectionWhereInput) {
    // throw new Error;
    let records = this.prisma.pagesSection.findMany({
      where: condition,
      orderBy: {
        id : 'desc'
      },
      include:{
        PagesContent: {
          where:{
            isDeleted: false
          },
          select:{
            id: true,
            isPublished: true,
            title: true
          }
        }
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.pagesSection.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateSitePagesSectionDto: UpdateSitePagesSectionDto) {
    return this.prisma.pagesSection.update({
      data: updateSitePagesSectionDto,
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
    return this.prisma.pagesSection.update({
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

  applyFilters(filters: SitePagesSectionFiltersDto){
    let condition: Prisma.PagesSectionWhereInput = { isDeleted: false};
    if(Object.entries(filters).length > 0){
     if(filters.title){
      condition = {...condition, title: {
        contains: filters.title,
        mode: 'insensitive'
      }}
     }

     if(filters.slug){
      condition = {...condition,
      slug: filters.slug
      }
     }
    }
    return condition;
  }

  findAllContentOfSection(sectionId: number){
    return this.prisma.pagesContent.groupBy({
      by: ['pageSectionId'],
      where:{
        pageSectionId: sectionId,
        isDeleted: false
      },
      _count:{
        id: true
      }
    })
  }
}
