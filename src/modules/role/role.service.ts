import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { SUPER_ADMIN } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleFiltersDto } from './dto/role-filters.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleDashboardElements } from './dto/role-dashboard-elements.dto';

@Injectable()
export class RoleService {

  private readonly logger = new Logger(RoleService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createRoleDto: CreateRoleDto, user: AuthenticatedUser) {
    let { copyRoleId, ...rest } = createRoleDto;
    let insertData = rest;
    let newRole = await this.prisma.role.create({
      data: insertData
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })

    if (newRole && copyRoleId) {
      await this.copyAllPermissionsFromRole(copyRoleId, newRole.id, user.userId)
    }
    return newRole;
  }

  async copyAllPermissionsFromRole(copyFromId: number, copyToId: number, copiedBy: number) {
    let allPermissions = await this.prisma.rolePermissions.findMany({
      where: {
        roleId: copyFromId
      }
    })

    let permissionToNewRole: Array<Prisma.RolePermissionsCreateManyInput> = [];
    allPermissions.forEach((ele) => {
      permissionToNewRole.push({
        permissionsId: ele.permissionsId,
        roleId: copyToId,
        addedById: copiedBy
      })
    });

    let assignedPermissions = await this.prisma.rolePermissions.createMany({
      data: permissionToNewRole
    })

    return assignedPermissions;

  }

  findAll(condition: Prisma.RoleWhereInput, filters: RoleFiltersDto) {
    // throw new Error;
    let records = this.prisma.role.findMany({
      where: condition,
      include: {
        DashboardElements: {
          where:{
            DashboardElement:{
              isDeleted: false
            }
          },
          orderBy:{
            order: 'asc'
          },
          include: {
            DashboardElement: true
          }
        }
      },
      orderBy: {
        addedDate: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.role.findUnique({
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateRoleDto: UpdateRoleDto) {
    return this.prisma.role.update({
      data: updateRoleDto,
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
    return this.prisma.role.update({
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

  applyFilters(filters: RoleFiltersDto, user: AuthenticatedUser) {
    let condition: Prisma.RoleWhereInput = { isDeleted: false };
    return condition;
  }

  async addDashboardElement(roleId: number, roleDashboardElements: RoleDashboardElements) {
    let elementIds = [];
    if (Array.isArray(roleDashboardElements.elementIds)) {
      elementIds = roleDashboardElements.elementIds
    } else {
      elementIds = [roleDashboardElements.elementIds]
    }
    let elements = await this.prisma.dashboardElement.findMany({
      where: {
        id: {
          in: elementIds
        }
      }
    })

    let allRecords = [];
    elements.forEach((ele) => {
      let t = this.prisma.roleDashboardElement.upsert({
        where: {
          roleId_dashboardElementId: {
            roleId: roleId,
            dashboardElementId: ele.id
          }
        },
        create: {
          dashboardElementId: ele.id,
          roleId: roleId,
          order: elementIds.indexOf(ele.id)
        },
        update: {
          order: elementIds.indexOf(ele.id)
        }
      })
      allRecords.push(t);
    })

    return await Promise.all(allRecords);
  }

  removeDashboardElement(roleId: number, roleDashboardElements: RoleDashboardElements) {
    let elementIds = [];
    if (Array.isArray(roleDashboardElements.elementIds)) {
      elementIds = roleDashboardElements.elementIds
    } else {
      elementIds = [roleDashboardElements.elementIds]
    }
    return this.prisma.roleDashboardElement.deleteMany({
      where: {
        roleId: roleId,
        dashboardElementId: {
          in: elementIds
        }
      }
    })
  }
}
