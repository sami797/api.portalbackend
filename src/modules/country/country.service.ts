import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountryService {

  model: any;
  private readonly logger = new Logger(CountryService.name);
  constructor(private prisma: PrismaService) {
    // this.prisma.country = this.prisma.country
    // let country = Prisma.Coun
  }

  create(createCountryDto: CreateCountryDto) {
    return this.prisma.country.create({
      data: createCountryDto,
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findAll(user: AuthenticatedUser) {
    let condition : Prisma.CountryWhereInput = { isDeleted: false };
    return this.prisma.country.findMany({
      where: condition,
      orderBy: {
        addedDate : 'desc'
      }
    });
  }

  findAllAvailableCountry() {
    let condition : Prisma.CountryWhereInput = { isDeleted: false };
    return this.prisma.country.findMany({
      where: condition,
      orderBy: {
        addedDate : 'desc'
      }
    });
  }

  findAvailableCountry() {
    return this.prisma.country.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        // status: 1
      },
      orderBy: {
        addedDate : 'desc'
      }
    });
  }
  

  async findOne(id: number) {
    try {
      let data = await this.prisma.country.findUnique({
        where: {
          id: id
        },
      });
      return data;
    } catch (err) {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} };
      throw errorResponse;
    }
  }

  update(id: number, updateCountryDto: UpdateCountryDto) {
    return this.prisma.country.update({
      data: updateCountryDto,
      where: {
        id: id
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number, metaData : Prisma.CountryUncheckedUpdateInput) {
    return this.prisma.country.update({
      data: {
        isPublished: false,
        isDeleted: true,
        ...metaData
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

  updateResources(resouceId: number, fieldName: string, fieldValue: string | number) {
    return this.prisma.country.update({
      data: {
        [fieldName]: fieldValue
      },
      where: {
        id: resouceId
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }
}
