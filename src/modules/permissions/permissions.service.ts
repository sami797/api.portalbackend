import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN, SYSTEM_USERS } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {

  private readonly logger = new Logger(PermissionsService.name);
  constructor(private prisma: PrismaService) {
  }

  // create(createPermissionDto: CreatePermissionDto) {
  //   return this.prisma.permissions.create({
  //     data: createPermissionDto
  //   }).catch((err: PrismaClientKnownRequestError) => {
  //     this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
  //     let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
  //     throw errorResponse;
  //   })
  // }

  create(createPermissionDto: CreatePermissionDto) {
    const { moduleId, ...rest } = createPermissionDto;
    return this.prisma.permissions.create({
      data: {
        ...rest,
        Module: {
          connect: { id: moduleId }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      const errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} };
      throw errorResponse;
    });
  }


  findAll() {
    let records = this.prisma.permissions.findMany({orderBy: {id : 'desc'}});
    return records;
  }

  findOne(id: number) {
    return this.prisma.permissions.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  // update(id: number, updatePermissionDto: UpdatePermissionDto) {
  //   return this.prisma.permissions.update({
  //     data: updatePermissionDto,
  //     where: {
  //       id: id
  //     }
  //   }).catch((err: PrismaClientKnownRequestError) => {
  //     this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
  //     let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
  //     throw errorResponse;
  //   })
  // }

  

  update(id: number, updatePermissionDto: UpdatePermissionDto) {
    const { moduleId, ...rest } = updatePermissionDto;
    return this.prisma.permissions.update({
      data: {
        ...rest,
        Module: {
          connect: { id: moduleId }
        }
      },
      where: { id }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      const errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} };
      throw errorResponse;
    });
  }


  remove(id: number) {
    return this.prisma.permissions.delete({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  async grantPrivilegesToRole(roleId: number, permissionsIds: Array<number>, user: AuthenticatedUser){

    let insertData: Array<Prisma.RolePermissionsUncheckedCreateInput> = [];
    let __permissionIds = await this.validatePermissionIds(permissionsIds, user);
    if(__permissionIds.length === 0){
      throw {message: "Please provide a valid permission Ids", statusCode: 400}
    }

    insertData = __permissionIds.map((ele) => { return {roleId: roleId, permissionsId: ele.id, addedById: user.userId }});

    await this.prisma.role.findUnique({where: { id: roleId}}).then(data => {
      if(!data){
        throw {message: "Provided role is not found in the system", statusCode: 404}
      }
    })

    let allPromises = insertData.map((ele) => {
      return this.prisma.rolePermissions.upsert({
        where: {
          roleId_permissionsId:{
            roleId: roleId, 
            permissionsId: ele.permissionsId 
          }
        },
        create: ele,
        update: {}
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
    })

    return Promise.all(allPromises)

  }

  validatePermissionIds(permissionIds: number[], user: AuthenticatedUser){
    let condition : Prisma.PermissionsWhereInput = {id: {
      in: permissionIds
    }};
    if (!(user.roles.slugs.includes(SUPER_ADMIN) || user.roles.slugs.includes(SYSTEM_USERS))) {
      condition = {
        ...condition, 
        visibility: 'organization'
      }
     }
     return this.prisma.permissions.findMany({
      where: condition
     })
  }


  async revokePrivilegesFromRole(roleId: number, permissionsIds: Array<number>, user: AuthenticatedUser){
    let condition : Prisma.RolePermissionsWhereInput = {
      roleId: roleId,
      permissionsId: {
        in: permissionsIds
      }
    };
      return this.prisma.rolePermissions.deleteMany({
        where: condition,
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })
  }

  async getRolePermission(roleId: number){
    return this.prisma.rolePermissions.findMany({
      where: {
        roleId: roleId
      },
      select: {
        id: true,
        Permission:{
          select: {
            action: true,
            id: true
          }
        }
      }
    })
  }
  async getRolePermissionByModuleId(roleId: number, moduleId: number){
    return this.prisma.rolePermissions.findMany({
      where: {
        roleId: roleId,
        Permission:{
          moduleId: moduleId
        }
      },
      select: {
        id: true,
        Permission:{
          select: {
            action: true,
            id: true
          }
        }
      }
    })
  }

}
