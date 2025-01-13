import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreateBulkUploadFormatDto } from './dto/create-bulk-upload-format.dto';
import { UpdateBulkUploadFormatDto } from './dto/update-bulk-upload-format.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class BulkUploadFormatService {

  private readonly logger = new Logger(BulkUploadFormatService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createBulkUploadFormatDto: CreateBulkUploadFormatDto) {
    return this.prisma.bulkUploadFormat.create({
      data: createBulkUploadFormatDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  findAll() {
    let records = this.prisma.bulkUploadFormat.findMany({
      orderBy: {addedDate : 'desc'}});
    return records;
  }

  findOne(id: number) {
    return this.prisma.bulkUploadFormat.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateBulkUploadFormatDto: UpdateBulkUploadFormatDto) {
    return this.prisma.bulkUploadFormat.update({
      data: updateBulkUploadFormatDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number) {
    return this.prisma.bulkUploadFormat.delete({
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

}
