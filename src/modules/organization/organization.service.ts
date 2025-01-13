import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ResponseError } from 'src/common-types/common-types';
import { OrganizationStatus, OrganizationType } from 'src/config/constants';
import { PrismaService } from 'src/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationFiltersDto } from './dto/organization-filters.dto';
import { OrganizationMetaDataDto } from './dto/organization-meta.dto';
import { OrganizationPaginationDto } from './dto/organization-pagination.dto';
import { OrganizationSortingDto } from './dto/organization-sorting.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { generateSEOFriendlyFileName } from 'src/helpers/helpers';
import { createAvatarImage } from 'src/helpers/user-avatar';

@Injectable()
export class OrganizationService {

  private readonly logger = new Logger(OrganizationService.name);
  constructor(private prisma: PrismaService) {
  }

async create(createOrganizationDto: CreateOrganizationDto, user: AuthenticatedUser) {
  let country = await this.prisma.country.findFirst({
    where: {
      isoCode: {
        equals: "AE",
        mode: 'insensitive'
      }
    }
  })

  let parent : undefined | number = undefined;
  if(createOrganizationDto.type === OrganizationType.branch){
    if(!createOrganizationDto.parentId){
      throw {
        message: "Please choose a parent company",
        statusCode: 400
      }
    }else{
      parent = createOrganizationDto.parentId
    }
  }

    return this.prisma.organization.create({
      data: {
        ...createOrganizationDto,
        addedById: user.userId,
        countryId: country.id,
        parentId: parent
      },
    })
      .catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
        throw errorResponse;
      })
  }

  findAll(pagination: OrganizationPaginationDto, sorting: OrganizationSortingDto, condition: Prisma.OrganizationWhereInput, meta: OrganizationMetaDataDto) {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.OrganizationOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };

    let records = this.prisma.organization.findMany({
      where: condition,
      include: {
        Country: {
          select: {
            name: true,
            isoCode: true,
            displayName: true
          }
        },
        WorkingHours: true
      },
      skip: skip,
      take: take,
      orderBy: __sorter
    });
    return records;
  }


  findAllPublished(pagination: OrganizationPaginationDto, sorting: OrganizationSortingDto, condition: Prisma.OrganizationWhereInput) {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.OrganizationOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };

    let records = this.prisma.organization.findMany({
      where: condition,
      select: {
        id: true,
        uuid: true,
        email: true,
        phone: true,
        phoneCode: true,
        whatsapp: true,
        address: true,
        logo: true,
        name: true
      },
      skip: skip,
      take: take,
      orderBy: [
        {
          addedDate: 'desc'
        },
        __sorter
      ],
    });
    return records;
  }

  findOne(id: number) {
    return this.prisma.organization.findUnique({
      where: {
        id: id
      },
      include:{
        WorkingHours: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  findOneByUUID(uuid: string) {
    return this.prisma.organization.findFirst({
      where: {
        uuid: uuid,
        status: OrganizationStatus.active
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  update(id: number, updateOrganizationDto: UpdateOrganizationDto) {

    if(updateOrganizationDto.parentId && updateOrganizationDto.parentId === id){
      throw {
        message: "Organization cannot be a parent of itself",
        statusCode: 400
      }
    }
    return this.prisma.organization.update({
      data: updateOrganizationDto,
      where: {
        id: id
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 400, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number, userId: number) {
    return this.prisma.organization.update({
      data: {
        isPublished: false,
        isDeleted: true,
        deletedById: userId,
        deletedDate: new Date()
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

  applyFilters(filters: OrganizationFiltersDto) {
    let condition: Prisma.OrganizationWhereInput = { isDeleted: false };
    if (Object.entries(filters).length > 0) {
      if (filters.email) {
        condition = { ...condition, email: filters.email }
      }
      if (filters.isPublished !== undefined) {
        condition = { ...condition, isPublished: filters.isPublished }
      }
      if (filters.phone) {
        condition = { ...condition, phone: { contains: filters.phone } }
      }
      if (filters.status) {
        condition = { ...condition, status: filters.status }
      }

      if (filters.ids) {
        condition = { ...condition, id: {
          in: filters.ids
        }}
      }

      if (filters.fromDate && filters.toDate) {
        condition = {
          ...condition, AND: [
            {
              addedDate: {
                gte: new Date(filters.fromDate + "T00:00:00")
              }
            },
            {
              addedDate: {
                lte: new Date(filters.toDate + "T23:59:59")
              }
            }
          ]
        }
      } else {
        if (filters.fromDate) {
          condition = { ...condition, addedDate: { gte: new Date(filters.fromDate + "T00:00:00") } }
        }

        if (filters.toDate) {
          condition = { ...condition, addedDate: { lte: new Date(filters.toDate + "T23:59:59") } }
        }
      }

      if (filters.name) {
        condition = {
          ...condition, name: {
            contains: filters.name,
            mode: 'insensitive'
          }
        }
      }

      if(filters.fetchParentOnly){
        condition = {
          ...condition,
          parentId: null
        }
      }

      if(filters.type){
        if(filters.includeBranches){
          condition = {
            ...condition,
            OR: [
              {
                Parent:{
                  type: filters.type
                }
              },
              {
                type: filters.type
              }
            ]
          }
        }else{
          condition = {
            ...condition,
            type: filters.type
          }
        }
      }
    }
    return condition
  }

  countTotalRecord(filters: Prisma.OrganizationWhereInput) {
    return this.prisma.organization.count({
      where: filters
    })
  }



  publishOrganization(organizationId: number){
    return this.prisma.organization.update({
      where:{
        id: organizationId
      },
      data:{
        status: OrganizationStatus.active
      }
    })
  }

  suspendOrganization(organizationId: number){
    return this.prisma.organization.update({
      where:{
        id: organizationId
      },
      data:{
        status: OrganizationStatus.suspended
      }
    })
  }

  async createOrganizationAvatar(organizationId: number, meta: { organizationName: string, shouldFetch: boolean } = { organizationName: "", shouldFetch: true }) {
    let organizationName = meta.organizationName;
    if (meta.shouldFetch === true) {
      let org = await this.findOne(organizationId);
      if (!org || org.logo) {
        return false;
      }
      organizationName = org.name
    }
    let filename = generateSEOFriendlyFileName(organizationName) + "-" + Date.now() + ".png";
    let currentDate = new Date().toISOString().split('T')[0];
    let fileLocation = 'public/organization/' + currentDate;
    try {
      createAvatarImage(organizationName, fileLocation, filename);
      let profileUploaded = fileLocation + "/" + filename;
      await this.prisma.organization.update({
        data: {
          logo: profileUploaded,
        },
        where: {
          id: organizationId
        }
      })
      return profileUploaded;
    } catch (err) {
      this.logger.error("some error while creating organization avatar", err);
    }
  }

}

