import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateSitePagesContentDto } from './dto/create-site-pages-content.dto';
import { UpdateSitePagesContentDto } from './dto/update-site-pages-content.dto';

@Injectable()
export class SitePagesContentService {

  private readonly logger = new Logger(SitePagesContentService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createSitePagesContentDto: CreateSitePagesContentDto) {

    return this.prisma.pagesContent.create({
      data: createSitePagesContentDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll() {
    // throw new Error;
    let records = this.prisma.pagesContent.findMany({
      where: {
        isDeleted: false
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllByPageSection(sectionId: number) {
    // throw new Error;
    let records = this.prisma.pagesSection.findFirst({
      where: {
        isDeleted: false,
        id: sectionId
      },
     include:{
      PagesContent:{
        where:{
          isDeleted: false,
        },
         orderBy: {
           id: 'desc'
         }
      }
     }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.pagesContent.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateSitePagesContentDto: UpdateSitePagesContentDto) {

    return this.prisma.pagesContent.update({
      data: updateSitePagesContentDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  getSectionData(sectionId: number){
    return this.prisma.pagesSection.findUnique({
      where:{
        id: sectionId
      }
    })
  }

  checkIfSectionHasContentForCountry(sectionId: number){
    return this.prisma.pagesContent.findFirst({
      where:{
        pageSectionId: sectionId,
        isDeleted: false
      }
    })
  }

  remove(id: number) {
    return this.prisma.pagesContent.update({
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
}

