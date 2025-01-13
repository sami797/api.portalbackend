
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateSystemModuleDto } from './dto/create-system-module.dto';
import { SystemModuleFilters } from './dto/system-modules.filters';
import { UpdateSystemModuleDto } from './dto/update-system-module.dto';

@Injectable()
export class SystemModulesService {

  private readonly logger = new Logger(SystemModulesService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createSystemModuleDto: CreateSystemModuleDto) {
    return this.prisma.modules.create({
      data: createSystemModuleDto
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  findAll(filters: SystemModuleFilters, user: AuthenticatedUser) {
    // throw new Error;
    let condition : Prisma.ModulesWhereInput = {};

     let includes : Prisma.ModulesInclude = {}
     if(filters.fetchPermissions){
      includes = {...includes,
        Permissions: true
      }
     }

    let records = this.prisma.modules.findMany({
      where: condition,
      include: includes,
      orderBy: { order: 'asc'}
    });
    return records;
  }

  findOne(id: number,  user: AuthenticatedUser) {
    let condition : Prisma.ModulesWhereInput = {id: id};
    let permissionCondition: Prisma.PermissionsWhereInput = {};
    return this.prisma.modules.findFirst({
      where: condition,
      include:{
        Permissions: {
          where: permissionCondition,
          include:{
              RolePermissions:{
                select:{
                  Role:{
                    select:{
                      title: true
                    }
                  }
                }
              }
          }
        }
      },
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateSystemModuleDto: UpdateSystemModuleDto) {
    return this.prisma.modules.update({
      data: updateSystemModuleDto,
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
    return this.prisma.modules.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }
}
