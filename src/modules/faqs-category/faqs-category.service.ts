import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateFaqsCategoryDto } from './dto/create-faqs-category.dto';
import { FaqsCategoryFiltersDto } from './dto/faqs-category-filter.dto';
import { FaqsCategoryPaginationDto } from './dto/faqs-category-pagination.dto';
import { UpdateFaqsCategoryDto } from './dto/update-faqs-category.dto';

@Injectable()
export class FaqsCategoryService {

  private readonly logger = new Logger(FaqsCategoryService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createFaqsCategoryDto: CreateFaqsCategoryDto) {
    return this.prisma.faqsCategory.create({
      data: createFaqsCategoryDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.FaqsCategoryWhereInput, pagination: FaqsCategoryPaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.faqsCategory.findMany({
      where: filters,
      include: {
        Parent: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true
          }
        }
      },
      take: take,
      skip: skip,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished() {
    // throw new Error;
    let records = this.prisma.faqsCategory.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        parentId: null
      },
      include: {
        ChildCategory: {
          select: {
            slug: true,
            _count: {
              select: {
                Faqs: true
              }
            },
            title: true,
            description: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.faqsCategory.findUnique({
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
    return this.prisma.faqsCategory.findUnique({
      where: {
        slug: slug
      },
      include: {
        Faqs: {
          where: {
            isDeleted: false,
            isPublished: true
          },
          select: {
            slug: true,
            title: true,
            description: true
          }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateFaqsCategoryDto: UpdateFaqsCategoryDto) {
  
    return this.prisma.faqsCategory.update({
      data: updateFaqsCategoryDto,
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
    return this.prisma.faqsCategory.update({
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


  applyFilters(filters: FaqsCategoryFiltersDto) {
    let condition: Prisma.FaqsCategoryWhereInput = {
      isDeleted: false,
      // parentId: {
      //   not: null
      // }
    };

    if (Object.entries(filters).length > 0) {
      if (filters.isRoot) {
        condition = { ...condition, parentId: null }
      }

      if (filters.parentId) {
        condition = { ...condition, parentId: filters.parentId }
      }

      if (filters.forAdminpanel || filters.forAdminpanel === false) {
        condition = { ...condition, forAdminpanel: filters.forAdminpanel }
      }

      if (filters.title) {
        condition = {
          ...condition, title: {
            contains: filters.title,
            mode: 'insensitive'
          }
        }
      }
    }
    return condition;
  }

  countFaqsCategory(filters: Prisma.FaqsCategoryWhereInput) {
    return this.prisma.faqsCategory.count({
      where: filters
    })
  }

}

