import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError, SEOData } from 'src/common-types/common-types';
import { BlogsStatus, ImagesThresholdForBlogs } from 'src/config/constants';
import { generateUUID } from 'src/helpers/common';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { PrismaService } from 'src/prisma.service';
import { BlogStatusDto } from './dto/blog-status.dto';
import { BlogsFiltersDto, BlogsPublicFiltersDto } from './dto/blogs-filter.dto';
import { BlogsPaginationDto } from './dto/blogs-pagination.dto';
import { BlogsSortableFields, BlogsSortingDto } from './dto/blogs-sorting.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UploadBlogImage } from './dto/upload-image.dto';

@Injectable()
export class BlogsService {

  private readonly logger = new Logger(BlogsService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createBlogDto: CreateBlogDto) {
    return this.prisma.blogs.create({
      data: createBlogDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.BlogsWhereInput, pagination: BlogsPaginationDto, sorting: BlogsSortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.BlogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === BlogsSortableFields.title) { __sorter = { slug: sorting.sortOrder } }
    let records = this.prisma.blogs.findMany({
      where: filters,
      include: {
        BlogCategory: {
          select: {
            slug: true,
            id: true,
            title: true,
            highlight: true
          }
        }
      },
      take: take,
      skip: skip,
      orderBy: __sorter
    });
    return records;
  }

  findAllPublished(filters: Prisma.BlogsWhereInput, pagination: BlogsPaginationDto, sorting: BlogsSortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.BlogsOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === BlogsSortableFields.title) { __sorter = { slug: sorting.sortOrder } }
    let records = this.prisma.blogs.findMany({
      where: filters,
      select: {
        slug: true,
        image: true,
        imageAlt: true,
        addedDate: true,
        category: true,
        title: true,
        highlight: true,
        BlogCategory:{
          select:{
            slug: true,
            title: true,
            highlight: true
          }
        }
      },
      take: take,
      skip: skip,
      orderBy: __sorter
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.blogs.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findOneBySlug(slug: string) {
    return this.prisma.blogs.findFirst({
      where: {
        slug: slug,
        isDeleted:false,
        status: BlogsStatus['Verified & Published']
      },
      include: {
        BlogCategory:{
          select:{
            slug: true,
            title: true,
            highlight: true,
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

  update(id: number, updateBlogDto: UpdateBlogDto) {

    return this.prisma.blogs.update({
      data: updateBlogDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  updateStatus(blogId: number, status: BlogsStatus){
    return this.prisma.blogs.update({
      where: {
        id: blogId
      },
      data: {
        status: status
      }
    })
  }

  remove(id: number, userId: number) {
    return this.prisma.blogs.update({
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
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyAdminFilters(filters: BlogsFiltersDto) {
    let condition: Prisma.BlogsWhereInput = { isDeleted: false };
    if (Object.entries(filters).length > 0) {
      if (filters.category) {
        condition = { ...condition, category: filters.category }
      }
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

  applyPublicFilters(filters: BlogsPublicFiltersDto) {
    let condition: Prisma.BlogsWhereInput = {
      isDeleted: false,
      status: BlogsStatus['Verified & Published']
    };

    if (Object.entries(filters).length > 0) {
      if (filters.category) {
        condition = { ...condition, category: filters.category }
      }
      if (filters.excludeId) {
        condition = { ...condition, id: {
          not: filters.excludeId
        }}
      }

      if(filters.blogCategorySlug){
        condition = {...condition, BlogCategory : {slug: filters.blogCategorySlug}}
      }
      if(filters.blogCategoryId){
        condition = {...condition, blogCategoryId : filters.blogCategoryId}
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

  countBlogs(filters: Prisma.BlogsWhereInput) {
    return this.prisma.blogs.count({
      where: filters
    })
  }


  updateSEOData(blogId: number, seoData: SEOData){
    return this.prisma.blogs.update({
      where: {
        id: blogId
      },
      data: seoData
    })
  }


  async handleBlogImages(uploadPropertyImage: UploadBlogImage, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    if (uploadPropertyImage.blogId) {
      let blogs = await this.prisma.blogs.findUnique({
        where: {
          id: uploadPropertyImage.blogId
        }
      })

      if (!blogs) {
        throw new NotFoundException({ message: "Blog not found", statusCode: 400 })
      }
    }

    let insertedIds = []
    let insertData: Array<Prisma.BlogImagesUncheckedCreateInput> = files.map((ele, index) => {
      let uuid = generateUUID();
      insertedIds.push(uuid)
      let __t : Prisma.BlogImagesUncheckedCreateInput = {
        uuid: uuid,
        title: "Blog Image",
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        blogId: uploadPropertyImage.blogId ? uploadPropertyImage.blogId : null
      }
      return __t;
    });

    if (insertData.length > 0) {
      await this.prisma.blogImages.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

      return this.prisma.blogImages.findMany({
        where: {
          uuid: {
            in: insertedIds
          }
        },
        select: {
          id: true,
          uuid: true,
          file: true,
          blogId: true,
          path: true
        }
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return {}
    }
  }

  async removeFiles(id: number, user: AuthenticatedUser) {
    let imageData = await this.prisma.blogImages.findUnique({ where: { id: id } });
    return this.prisma.blogImages.updateMany({
      where: {
        id: id
      },
      data: {
        isDeleted: true,
        isPublished: false
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + "\n Custom Error code: ERR396 \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  getBlogImages(blogId: number) {
    return this.prisma.blogImages.findMany({
      where:{
        blogId: blogId,
        isDeleted: false,
        isPublished: true,
      },
      select:{
        id: true,
        title: true,
        file: true,
        fileType: true,
        path: true
      }
    })
  }

  async checkImagesThreshold(blogId: number){
    let totalImages = await this.prisma.blogImages.count({
      where:{
        blogId: blogId,
        isDeleted: false,
        isPublished: true
      }
    })

    if(totalImages >= ImagesThresholdForBlogs){
      throw {
        message: "Images threshold reached, one blog can contain at max "+ImagesThresholdForBlogs+" images per blog",
        statusCode: 400
      }
    }
  }
}

