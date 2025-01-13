import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FileManagement, FileVisibility, Permit, Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Pagination, ResponseError } from 'src/common-types/common-types';
import { PrismaService } from 'src/prisma.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { PermitFiltersDto } from './dto/permit-filters.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ProjectDocumentsTypes } from '../project/entities/project.entity';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { FileStatus } from 'src/config/constants';
import { ProjectDefaultAttributes } from '../project/dto/project.dto';
import { UserDefaultAttributes } from '../user/dto/user.dto';
import { ClientDefaultAttributes } from '../client/dto/client.dto';
import { AuthorityDefaultAttributes } from '../authorities/dto/authority.dto';

@Injectable()
export class PermitsService {

  private readonly logger = new Logger(PermitsService.name);
  constructor(private prisma: PrismaService) {
  }

  create(createDto: CreatePermitDto) {
    return this.prisma.permit.create({
      data: createDto,
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(filters: Prisma.PermitWhereInput, pagination: Pagination) {
    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let records = this.prisma.permit.findMany({
      where: filters,
      include: {
        _count: {
          select: {
            Resources: {
              where: {
                isDeleted: false
              }
            }
          }
        },
        Project: {
          select: ProjectDefaultAttributes
        },
        AddedBy: {
          select: UserDefaultAttributes
        },
        Client: {
          select: ClientDefaultAttributes
        },
        Authority: {
          select: AuthorityDefaultAttributes
        }
      },
      skip: skip,
      take: take,
      orderBy: {
        id: 'desc'
      }
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.permit.findUnique({
      where: {
        id: id
      },
      include: {
        Resources: {
          where: {
            isDeleted: false
          }
        },
        Project: {
          select: ProjectDefaultAttributes
        },
        AddedBy: {
          select: UserDefaultAttributes
        },
        Client: {
          select: ClientDefaultAttributes
        },
        Authority: {
          select: AuthorityDefaultAttributes
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateDto: UpdatePermitDto) {

    return this.prisma.permit.update({
      data: updateDto,
      where: {
        id: id
      },
      include: {
        Resources: {
          where: {
            isDefault: false
          }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number) {
    return this.prisma.permit.update({
      data: {
        isDeleted: true,
        Resources: {
          updateMany: {
            where: {
              permitId: id
            },
            data: {
              isDeleted: true
            }
          }
        }
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

  applyFilters(filters: PermitFiltersDto) {
    let condition: Prisma.PermitWhereInput = {
      isDeleted: false
    };

    if (Object.entries(filters).length > 0) {

      if (filters.financeStatus) {
        condition = { ...condition, financeStatus: filters.financeStatus }
      }

      if (filters.clientStatus) {
        condition = { ...condition, clientStatus: filters.clientStatus }
      }

      if (filters.projectId) {
        condition = {
          ...condition,
          projectId: filters.projectId
        }
      }

      if (filters.clientId) {
        condition = {
          ...condition,
          clientId: filters.clientId
        }
      }

      if (filters.authorityId) {
        condition = {
          ...condition,
          authorityId: filters.authorityId
        }
      }

      if(filters.onlyActive){
        let today = new Date();
        today.setHours(0,0,0,0);
        condition = {
          ...condition,
          expiryDate: {
            gte: today,
          },
          approvedDate:{
            lte: today
          }
        }
      }

      if(filters.onlyExpired){
        let today = new Date();
        today.setHours(0,0,0,0);
        condition = {
          ...condition,
          expiryDate: {
            lt: today,
          }
        }
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              expiryDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              expiryDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, expiryDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, expiryDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

    }
    return condition;
  }

  async handleDocuments(permit: Permit, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    if (!permit) {
      throw new NotFoundException({ message: "Permit with the provided id not Found", statusCode: 400 })
    }
    let insertData: Array<Prisma.FileManagementCreateInput> = files.map((ele, index) => {
      let newRecord: Prisma.FileManagementUncheckedCreateInput = {
        documentType: ProjectDocumentsTypes.permit,
        title: permit.title,
        name: ele.originalname,
        file: ele.filename,
        fileType: ele.mimetype,
        path: extractRelativePathFromFullPath(ele.path),
        isTemp: false,
        status: FileStatus.Verified,
        addedById: user.userId,
        visibility: FileVisibility.organization,
        projectId: permit.projectId,
        permitId: permit.id,
        fileSize: ele.size / 1024 //in KB
      }
      return newRecord;
    });

    if (insertData.length > 0) {
      return this.prisma.fileManagement.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    }
  }

  async markAllPermitAsSent(permit: Permit & { Resources: FileManagement[] }, user: AuthenticatedUser) {
    let allRecords: Prisma.FileshareLogsUncheckedCreateInput[] = [];
    let lastBatch = await this.prisma.fileshareLogs.aggregate({
      _max: {
        batchNumber: true
      }
    })
    let newBatch = (lastBatch && lastBatch._max.batchNumber) ? lastBatch._max.batchNumber + 1 : 1;
    for (const ele of permit.Resources) {
      let isExisting = await this.prisma.fileshareLogs.findFirst({
        where: {
          clientId: permit.clientId,
          projectId: ele.projectId,
          fileId: ele.id,
        }
      })

      if (!isExisting) {
        let t: Prisma.FileshareLogsUncheckedCreateInput = {
          clientId: permit.clientId,
          projectId: ele.projectId,
          fileId: ele.id,
          addedDate: new Date(),
          sharedById: user.userId,
          batchNumber: newBatch
        }
        allRecords.push(t);
      }
    }

    await this.prisma.fileshareLogs.createMany({
      data: allRecords
    })
  }

  countRecords(filters: Prisma.PermitWhereInput) {
    return this.prisma.permit.count({
      where: filters
    })
  }

}

