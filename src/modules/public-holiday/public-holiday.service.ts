import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { PublicHolidayFilters } from './dto/public-holiday-filters.dto';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';
import { UpdatePublicHolidayDto } from './dto/update-public-holiday.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { getDifferenceInDays } from 'src/helpers/common';

@Injectable()
export class PublicHolidayService {

  private readonly logger = new Logger(PublicHolidayService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreatePublicHolidayDto, user: AuthenticatedUser) {
    const {title, dates} = createDto;
    let insertData : Array<Prisma.PublicHolidayUncheckedCreateInput> = dates.map((ele) => {
      return {
        title: title,
        date: new Date(ele),
        addedDate: new Date(),
        addedById: user.userId
      }
    })
    return this.prisma.publicHoliday.createMany({
      data: insertData,
    })
    .catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: Prisma.PublicHolidayWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.publicHoliday.findMany({
      where: filters,
      skip: skip,
      take: take,
      include:{
        AddedBy:{
          select: UserDefaultAttributes
        },
      },
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.publicHoliday.findUnique({
      where: {
        id: id
      },
      include:{
        AddedBy:{
          select: UserDefaultAttributes
        },
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdatePublicHolidayDto) {
    const {title} = updateDto;
    if(title){
    return this.prisma.publicHoliday.update({
      data: updateDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
    }else{
      return this.findOne(id);
    }
  }


  applyFilters(filters: PublicHolidayFilters) {
    let condition: Prisma.PublicHolidayWhereInput = {
    };

    if (Object.entries(filters).length > 0) {

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              date: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              date: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, date: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, date: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }
    }
    return condition;
  }

  countRecords(filters: Prisma.PublicHolidayWhereInput) {
    return this.prisma.publicHoliday.count({
      where: filters
    })
  }

  async delete(recordId: number){
    let recordData = await this.prisma.publicHoliday.findFirst({
      where:{
        id: recordId
      }
    })

    let today = new Date();
    let difference = Math.abs(getDifferenceInDays(recordData.date, today));
    if(difference > 60){
      throw {
        message: "You cannot delete a record that is older than 60 days",
        statusCode: 400
      }
    }

    return this.prisma.publicHoliday.delete({
      where: {
        id: recordId
      }
    })
  }
}


