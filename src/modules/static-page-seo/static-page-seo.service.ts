import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { StaticPageSEOPaginationDto } from './dto/static-page-seo.pagination.dto';
import { CreateStaticPageSeoDto } from './dto/create-static-page-seo.dto';
import { UpdateStaticPageSeoDto } from './dto/update-static-page-seo.dto';
import { StaticPageSEOFiltersDto } from './dto/static-page-seo-filters.dto';

@Injectable()
export class StaticPageSeoService {

  private readonly logger = new Logger(StaticPageSeoService.name);
  constructor(private prisma: PrismaService) {}

  create(createStaticPageSeoDto: CreateStaticPageSeoDto) {
    return this.prisma.staticPageSEO.create({
      data: createStaticPageSeoDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(condition: Prisma.StaticPageSEOWhereInput,pagination: StaticPageSEOPaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.staticPageSEO.findMany({
      where: condition,
      orderBy: {
        addedDate : 'desc'
      },
      skip: skip,
      take: take
    });
  }
  

  async findOne(id: number) {
    try {
      let data = await this.prisma.staticPageSEO.findUnique({
        where: {
          id: id
        }
      });
      return data;
    } catch (err) {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} };
      throw errorResponse;
    }
  }
  async findOneByPageSlug(slug: string) {
    try {
      let data = await this.prisma.staticPageSEO.findFirst({
        where: {
          OR: [
            {
              SitePage:{
                slug: slug
              },
            }
          ]
        },
        orderBy: {
          isDefault: 'asc'
        }
      });
      return data;
    } catch (err) {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} };
      throw errorResponse;
    }
  }

  update(id: number, updateStaticPageSeoDto: UpdateStaticPageSeoDto) {
    return this.prisma.staticPageSEO.update({
      data: updateStaticPageSeoDto,
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
    return this.prisma.staticPageSEO.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }


  countStaticPageSEO(filters: Prisma.StaticPageSEOWhereInput) {
    return this.prisma.staticPageSEO.count({
      where: filters
    })
  }

  async makeDefault(staticPageSEOId: number){
    let data = await this.prisma.staticPageSEO.update({
      data:{
        isDefault: 1
      },
      where:{
        id: staticPageSEOId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    await this.prisma.staticPageSEO.updateMany({
      where:{
        NOT:{
          id: data.id
        }
      },
      data:{
        isDefault: 0
      }
    })

    return data

  }

  applyFilters (filters: StaticPageSEOFiltersDto){
    let condition : Prisma.StaticPageSEOWhereInput  = {};
    if(Object.entries(filters).length > 0){
      if(filters.sitePageId){
        condition = {...condition, sitePageId: filters.sitePageId}
      }
    }
    return condition;
  }
}
