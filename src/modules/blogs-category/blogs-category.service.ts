import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError, SEOData } from 'src/common-types/common-types';
import { BlogsCategoryStatus, BlogsStatus} from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { BlogCategoryStatusDto } from './dto/blog-category-status.dto';
import { BlogsCategoryFiltersDto, BlogsCategoryPublicFiltersDto } from './dto/blogs-category-filter.dto';
import { BlogsCategoryPaginationDto } from './dto/blogs-category-pagination.dto';
import { BlogsCategorySortableFields, BlogsCategorySortingDto } from './dto/blogs-category-sorting.dto';
import { CreateBlogCategoryDto } from './dto/create-category-blog.dto';
import { UpdateBlogCategoryDto } from './dto/update-category-blog.dto';

@Injectable()
export class BlogsCategoryService {

  private readonly logger = new Logger(BlogsCategoryService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createBlogCategoryDto: CreateBlogCategoryDto) {
    return this.prisma.blogsCategory.create({
      data: createBlogCategoryDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.BlogsCategoryWhereInput, pagination: BlogsCategoryPaginationDto, sorting: BlogsCategorySortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.BlogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === BlogsCategorySortableFields.title) { __sorter = { slug: sorting.sortOrder } }
    let records = this.prisma.blogsCategory.findMany({
      where: filters,
      take: take,
      skip: skip,
      orderBy: __sorter
    });
    return records;
  }

  findAllPublished(filters: Prisma.BlogsCategoryWhereInput, pagination: BlogsCategoryPaginationDto, sorting: BlogsCategorySortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.BlogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === BlogsCategorySortableFields.title) { __sorter = { slug: sorting.sortOrder } }
    let records = this.prisma.blogsCategory.findMany({
      where: filters,
      select: {
        slug: true,
        image: true,
        imageAlt: true,
        addedDate: true,
        title: true,
        highlight: true
      },
      take: take,
      skip: skip,
      orderBy: __sorter
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.blogsCategory.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  findOneBySlug(slug: string, pagination: BlogsCategoryPaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.blogsCategory.findFirst({
      where: {
        slug: slug,
        isDeleted:false,
        status: BlogsCategoryStatus['Verified & Published']
      },
      include: {
        blogs:{
          where:{
            isDeleted: false,
            status: BlogsStatus['Verified & Published'],
          },
          select:{
            slug: true,
            image: true,
            imageAlt: true,
            addedDate: true,
            title: true,
            highlight: true
          },
          take: take,
          skip: skip
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateBlogCategoryDto: UpdateBlogCategoryDto) {
  
    return this.prisma.blogsCategory.update({
      data: updateBlogCategoryDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  updateStatus(blogId: number, status: BlogsCategoryStatus){
    return this.prisma.blogsCategory.update({
      where: {
        id: blogId
      },
      data: {
        status: status
      }
    })
  }

  remove(id: number, userId: number) {
    return this.prisma.blogsCategory.update({
      data: {
        isDeleted: true,
        deletedById: userId,
        deletedDate: new Date()
      },
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  applyAdminFilters(filters: BlogsCategoryFiltersDto) {
    let condition: Prisma.BlogsCategoryWhereInput = { isDeleted: false };
    if (Object.entries(filters).length > 0) {
      if (filters.status) {
        condition = { ...condition, status: filters.status }
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

  applyPublicFilters(filters: BlogsCategoryPublicFiltersDto) {
    let condition: Prisma.BlogsCategoryWhereInput = {
      isDeleted: false,
      status: BlogsCategoryStatus['Verified & Published']
    };

    if (Object.entries(filters).length > 0) {
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

  countBlogsCategory(filters: Prisma.BlogsCategoryWhereInput) {
    return this.prisma.blogsCategory.count({
      where: filters
    })
  }

  countBlogs(filters: Prisma.BlogsWhereInput) {
    return this.prisma.blogs.count({
      where: filters
    })
  }


  updateSEOData(blogId: number, seoData: SEOData){
    return this.prisma.blogsCategory.update({
      where: {
        id: blogId
      },
      data: seoData
    })
  }


  publishUnpublish(blogCategoryId: number, userId: number, status: boolean){
    return this.prisma.blogsCategory.update({
      where: {
        id: blogCategoryId
      },
      data: {
        isPublished: status,
        modifiedDate: new Date(),
        modifiedById: userId
      }
    })
  }
}

