import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { FeedbackFiltersDto } from './dto/feedback-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { FeedbackSortingDto } from './dto/feedback-sorting.dto';

@Injectable()
export class FeedbackService {

  private readonly logger = new Logger(FeedbackService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateFeedbackDto, user: AuthenticatedUser) {
    return this.prisma.feedback.create({
      data: createDto,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.FeedbackWhereInput, pagination: Pagination, sorting: FeedbackSortingDto) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.FeedbackOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder};
    let records = this.prisma.feedback.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        AddedBy:{
          select: UserDefaultAttributes
        },
        Attatchments: true
      },
      orderBy: __sorter
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.feedback.findUnique({
      where: {
        id: id
      },
      include:{
        AddedBy:{
          select: UserDefaultAttributes
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  applyFilters(filters: FeedbackFiltersDto) {
    let condition: Prisma.FeedbackWhereInput = {};

    if (Object.entries(filters).length > 0) {
      if (filters.addedById) {
        condition = { ...condition, addedById: filters.addedById }
      }
    }

    return condition;
  }

  countRecords(filters: Prisma.FeedbackWhereInput) {
    return this.prisma.feedback.count({
      where: filters
    })
  }


  async handleFiles(feedbackId: number, files: Array<Express.Multer.File>) {
    let insertData: Array<Prisma.FeedbackFilesUncheckedCreateInput> = []
    files.forEach((ele, index) => {
      let newRecord : Prisma.FeedbackFilesUncheckedCreateInput = {
        file: extractRelativePathFromFullPath(ele.path),
        feedbackId: feedbackId
      }
      insertData.push(newRecord)
    });

    if (insertData.length > 0) {
      await this.prisma.feedbackFiles.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })
    } else {
      return []
    }
  }

}


