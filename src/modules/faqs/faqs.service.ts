import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { FaqsFiltersDto } from './dto/faqs-filter.dto';
import { FaqsPaginationDto } from './dto/faqs-pagination.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { UploadFaqImage } from './dto/upload-image.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { generateUUID } from 'src/helpers/common';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';

@Injectable()
export class FaqsService {

  private readonly logger = new Logger(FaqsService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createFaqDto: CreateFaqDto) {

    return this.prisma.faqs.create({
      data: createFaqDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.FaqsWhereInput, pagination: FaqsPaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.faqs.findMany({
      where: filters,
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findAllPublished(filters: Prisma.FaqsWhereInput, pagination: FaqsPaginationDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    return this.prisma.faqs.findMany({
      where: filters,
      include: {
        FaqsCategory:{
          select: {
            slug: true,
            title: true,
            description: true
          }
        }
      },
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
  }

  findOne(id: number) {
    return this.prisma.faqs.findUnique({
      where: {
        id: id
      },
      include: {
        FaqsCategory:{
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

  findBySlug(slug: string) {
    return this.prisma.faqs.findUnique({
      where: {
        slug: slug
      },
      include:{
        FaqsCategory:{
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

  update(id: number, updateFaqDto: UpdateFaqDto) {

    return this.prisma.faqs.update({
      data: updateFaqDto,
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
    return this.prisma.faqs.update({
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


  applyFilters(filters: FaqsFiltersDto) {
    let condition: Prisma.FaqsWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {
      if (filters.faqsCategoryId) {
        condition = { ...condition, faqsCategoryId: filters.faqsCategoryId }
      }

      if(filters.faqsCategorySlug){
        condition = {...condition, FaqsCategory : {slug: filters.faqsCategorySlug}}
      }

      if (filters.forAdminpanel || filters.forAdminpanel === false) {
        condition = { ...condition, forAdminpanel: filters.forAdminpanel }
      }

      if (filters.title) {
        condition = {
          ...condition, AND:{
            OR:[
              {
                title: {
                  contains: filters.title,
                  mode: 'insensitive'
                }
              },
              {
                description: {
                  contains: filters.title,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      }
    }
    return condition;
  }

  countFaqs(filters: Prisma.FaqsWhereInput) {
    return this.prisma.faqs.count({
      where: filters
    })
  }


  async handleFaqImages(uploadImage: UploadFaqImage, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    if (uploadImage.faqId) {
      let faqData = await this.prisma.faqs.findUnique({
        where: {
          id: uploadImage.faqId
        }
      })

      if (!faqData) {
        throw new NotFoundException({ message: "Faq not found", statusCode: 400 })
      }
    }

    let insertedIds = []
    let insertData: Array<Prisma.FaqsMediaUncheckedCreateInput> = files.map((ele, index) => {
      let uuid = generateUUID();
      insertedIds.push(uuid)
      let __t : Prisma.FaqsMediaUncheckedCreateInput = {
        uuid: uuid,
        title: "Faq Image",
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        faqId: uploadImage.faqId ? uploadImage.faqId : null
      }
      return __t;
    });

    if (insertData.length > 0) {
      await this.prisma.faqsMedia.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

      return this.prisma.faqsMedia.findMany({
        where: {
          uuid: {
            in: insertedIds
          }
        },
        select: {
          id: true,
          uuid: true,
          file: true,
          faqId: true,
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
    let imageData = await this.prisma.faqsMedia.findUnique({ where: { id: id } });
    return this.prisma.faqsMedia.updateMany({
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

  getFaqsImages(faqId: number) {
    return this.prisma.faqsMedia.findMany({
      where:{
        faqId: faqId,
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
}

