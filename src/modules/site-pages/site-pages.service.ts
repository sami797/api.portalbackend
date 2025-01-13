import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN} from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateSitePageDto } from './dto/create-site-page.dto';
import { SitePagesFiltersDto } from './dto/site-pages-filters.dto';
import { UpdateSitePageDto } from './dto/update-site-page.dto';

@Injectable()
export class SitePagesService {

  private readonly logger = new Logger(SitePagesService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createSitePageDto: CreateSitePageDto) {
    const {pageSectionIds , ...rest} = createSitePageDto;
    let sitePage = await this.prisma.sitePages.create({
      data: rest
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if(sitePage && pageSectionIds && pageSectionIds.length > 0){
      await this.createOrUpdatePageSectionRelation(pageSectionIds, sitePage.id)
    }
    return sitePage;

  }

  async createOrUpdatePageSectionRelation(pageSectionIds: number[], pageId: number) {
    let allPromises = [];
    let sectionIds = await this.validateSectionIds(pageSectionIds);
    for(const ele of sectionIds){
    let t = this.prisma.pageSectionRelation.upsert({
      where: {
        sitePageId_pageSectionId: {
          sitePageId: pageId,
          pageSectionId: ele
        }
      },
      create: {sitePageId : pageId, pageSectionId: ele},
      update: {}
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let __infoText = ""
      if(pageSectionIds.length > 1){
        __infoText = ". Data might have partially updated"
      }
      let errorResponse: ResponseError = { message: err.message + __infoText, statusCode: 400, data: {} }
      throw errorResponse;
    })
    allPromises.push(t);
  }
  return await Promise.all(allPromises);
}


  findAll(condition: Prisma.SitePagesWhereInput) {
    // throw new Error;
    let records = this.prisma.sitePages.findMany({
      where: condition,
      orderBy: {
        id : 'desc'
      },
      include:{
        PageSectionRelation:{
          where:{
            PageSection:{
              isDeleted: false
            }
          },
          include:{
            PageSection: true,
          }
        }
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.sitePages.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateSitePageDto: UpdateSitePageDto) {
    const {pageSectionIds , ...rest} = updateSitePageDto;
    let sitePage = this.prisma.sitePages.update({
      data: rest,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if(sitePage && pageSectionIds && pageSectionIds.length > 0){
      await this.createOrUpdatePageSectionRelation(pageSectionIds, id)
    }
    return sitePage;
  }

  remove(id: number) {
    return this.prisma.sitePages.update({
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

  applyFilters(filters: SitePagesFiltersDto){
    let condition: Prisma.SitePagesWhereInput = { isDeleted: false};
    if(Object.entries(filters).length > 0){
     if(filters.title){
      condition = {...condition, title: {
        contains: filters.title,
        mode: 'insensitive'
      }}
     }
    }
    return condition;
  }

  async validateSectionIds(sectionIds : number[]){
    let pageSectionIds = await this.prisma.pagesSection.findMany({
      where: {
        id: {
          in: sectionIds
        }
      }
    })

    let ids = pageSectionIds.map((ele) =>  ele.id);
    return ids;
  }

  removeSectionFromPage(pageId: number, sectionId: number){
    return this.prisma.pageSectionRelation.delete({
      where:{
        sitePageId_pageSectionId:{
          sitePageId: pageId,
          pageSectionId: sectionId
        }
      }
    })
  }

  removeMultipleSectionFromPage(pageId: number, sectionIds: number[]){
    return this.prisma.pageSectionRelation.deleteMany({
      where:{
        sitePageId: pageId,
        pageSectionId: {
          in: sectionIds
        }
      }
    })
  }

  findPageBySlug(slug: string){
    return this.prisma.sitePages.findFirst({
      where:{
        isDeleted: false,
        isPublished: true,
        slug: slug
      }
    })
  }

  findPageContent(pageId: number){
    return this.prisma.pageSectionRelation.findMany({
      where: {
        sitePageId: pageId
      },
      select:{
        PageSection:{
          select:{
            slug: true,
            title: true,
            description: true,
            PagesContent:{
              where:{
                isPublished: true,
                isDeleted: false
              },
              orderBy: {
                isDefault: 'asc'
              },
              select:{
                image: true,
                imageAlt: true,
                title: true,
                highlight: true, 
                description: true
              }
            }
          }
        }
      }
    })  
  }

  findPageSeo(pageId: number){
    return this.prisma.staticPageSEO.findFirst({
      where:{
        OR:[
          {
            sitePageId: pageId,
          },
          {
            isDefault: 1
          }
        ]
      },
      select:{
        seoTitle: true,
        seoDescription: true,
        image: true
      },
      orderBy: {
        isDefault : 'asc'
      }
    })
  }
}
