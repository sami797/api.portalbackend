import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';

@Injectable()
export class PaymentGatewayService {

  private readonly logger = new Logger(PaymentGatewayService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createPaymentGatewayDto: CreatePaymentGatewayDto) {
    return this.prisma.paymentGateway.create({
      data: createPaymentGatewayDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  findAll() {
    let records = this.prisma.paymentGateway.findMany({
      where: {isDeleted: false}
      ,orderBy: {addedDate : 'desc'}});
    return records;
  }

  findOne(id: number) {
    return this.prisma.paymentGateway.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updatePaymentGatewayDto: UpdatePaymentGatewayDto) {
    return this.prisma.paymentGateway.update({
      data: updatePaymentGatewayDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number, updateFields: Prisma.PaymentGatewayUncheckedUpdateInput) {
    return this.prisma.paymentGateway.update({
      where: {
        id: id
      },
      data: {
        ...updateFields,
        isDeleted: true,
        isPublished: false
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

}
