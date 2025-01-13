import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { calculateTotalHours } from 'src/helpers/common';

@Injectable()
export class WorkingHoursService {

  private readonly logger = new Logger(WorkingHoursService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreateWorkingHourDto) {
    let hours = createDto.openingHours;
    hours.forEach((ele, index) =>{
      if(ele.closed !== true){
        const openDate = new Date(`2000-01-01T${ele.open}:00`);
        const closeDate = new Date(`2000-01-01T${ele.close}:00`);
        let totalHours = calculateTotalHours(openDate, closeDate);
        hours[index]['totalHours'] = totalHours
      }
    })
    return this.prisma.workingHours.create({
      data: {
        title: createDto.title,
        hours: hours as any
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.WorkingHoursWhereInput) {
    let records = this.prisma.workingHours.findMany({
      where: filters,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.workingHours.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdateWorkingHourDto) {
    let hours = updateDto.openingHours;
    if(hours && hours.length > 0){
      hours.forEach((ele, index) =>{
        if(ele.closed !== true){
          const openDate = new Date(`2000-01-01T${ele.open}:00`);
          const closeDate = new Date(`2000-01-01T${ele.close}:00`);
          let totalHours = calculateTotalHours(openDate, closeDate);
          hours[index]['totalHours'] = totalHours
        }
      })
    }

    return this.prisma.workingHours.update({
      data: {
        title: (updateDto.title) ? updateDto.title : undefined,
        hours: hours && hours.length > 0 ? hours as any: undefined
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

  remove(id: number) {
    return this.prisma.workingHours.delete({
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

