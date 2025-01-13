import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaPromise, TokenTypes, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';
import { ResponseError } from 'src/common-types/common-types';
import { OrganizationType, ProjectRole, SUPER_ADMIN, UserStatus, UserType } from 'src/config/constants';
import { generateHash } from 'src/helpers/bcrypt-helpers';
import { generateSEOFriendlyFileName } from 'src/helpers/helpers';
import { createAvatarImage } from 'src/helpers/user-avatar';
import { PrismaService } from 'src/prisma.service';
import { UserAuthTokensIssuedDto } from './dto/auth-token-issued.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserMetaDto } from './dto/update-user-meta.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { SortableFields, UserSortingDto } from './dto/user-sorting.dto';
import { UserDefaultAttributes, userAttributes, userAttributesTypes } from './dto/user.dto';
import { UserMetaKeys } from './types/user.types';
import { UploadUserDocuments } from './dto/user-document.dto';
import { extractRelativePathFromFullPath } from 'src/helpers/file-upload.utils';
import { UpdateUserDocuments } from './dto/user-document-update.dto';
import { UserSalaryDto } from './dto/user-salary.dto';
import { extractIds } from 'src/helpers/common';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name);
  constructor(private prisma: PrismaService) {
  }

  async create(createUserDto: CreateUserDto) {

    createUserDto.password = generateHash(createUserDto.password);

    let dataRestrictions = [];
    if(createUserDto.dataAccessRestrictedTo){
      dataRestrictions = createUserDto.dataAccessRestrictedTo.filter((ele) => ele !== 0);
    }

    return this.prisma.user.create({
      data: {
        ...createUserDto,
        dataAccessRestrictedTo: dataRestrictions
      },
      select: userAttributes.general
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  findAll(pagination: UserPaginationDto, sorting: UserSortingDto, condition: Prisma.UserWhereInput): PrismaPromise<Array<Partial<User>>> {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === SortableFields.name) {
      __sorter = {
        firstName: sorting.sortOrder
      }
    }

    return this.prisma.user.findMany({
      where: condition,
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        phoneCode: true,
        email: true,
        phone: true,
        address: true,
        preferences: true,
        profile: true,
        phoneVerified: true,
        emailVerified: true,
        userSignupSource: true,
        addedDate: true,
        designation: true,
        status: true,
        dateOfJoining: true,
        lastWorkingDate: true,
        enableRemoteCheckin: true,
        _count: {
          select: {
            AssetAllocation: true
          }
        },
        Department: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        organizationId: true,
        Organization: {
          select: {
            id: true,
            name: true,
            uuid: true,
            logo: true
          }
        },
        managerId: true,
        Manager: {
          select: UserDefaultAttributes
        },
        AddedBy: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        isPublished: true,
        userRole: {
          select: {
            Role: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
      skip: skip,
      take: take,
      orderBy: __sorter
    });

  }

  findAllBasic(pagination: UserPaginationDto, sorting: UserSortingDto, condition: Prisma.UserWhereInput): PrismaPromise<Array<Partial<User>>> {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;
    let __sorter: Prisma.Enumerable<Prisma.UserOrderByWithRelationInput> = { [sorting.sortByField]: sorting.sortOrder };
    if (sorting.sortByField === SortableFields.name) {
      __sorter = {
        firstName: sorting.sortOrder
      }
    }

    return this.prisma.user.findMany({
      where: condition,
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        phoneCode: true,
        email: true,
        phone: true,
        profile: true,
        isPublished: true,
        designation: true,
      },
      skip: skip,
      take: take,
      orderBy: __sorter
    });

  }


  findAllAuthTokensIssued(pagination: UserPaginationDto, condition: Prisma.AuthTokensWhereInput): PrismaPromise<Array<Partial<User>>> {

    let skip = (pagination.perPage * (pagination.page - 1));
    let take = pagination.perPage;

    return this.prisma.authTokens.findMany({
      where: condition,
      select: {
        id: true,
        userAgent: true,
        userIP: true,
        tokenType: true,
        addedDate: true,
        status: true,
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            status: true,
          }
        }
      },
      skip: skip,
      take: take,
      orderBy: {
        addedDate: 'desc'
      }
    });

  }

  findAllocatedResource(id: number) {
    return this.prisma.assetAllocation.findMany({
      where: {
        userId: id
      },
      include: {
        CompanyAsset: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            assetName: true,
            type: true,
            code: true,
            assetDetail: true,
          }
        }
      }
    })
  }

  findOne(id: number): Promise<Partial<User>> {
    return this.prisma.user.findUnique({
      where: {
        id: id
      },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        phoneCode: true,
        email: true,
        phone: true,
        address: true,
        preferences: true,
        profile: true,
        phoneVerified: true,
        emailVerified: true,
        whatsapp: true,
        UserMeta: true,
        status: true,
        departmentId: true,
        designation: true,
        dateOfJoining: true,
        lastWorkingDate: true,
        dataAccessRestrictedTo: true,
        Salary: {
          orderBy:{
            addedDate: 'asc'
          }
        },
        LeaveCredits:{
          orderBy:{
            addedDate: 'desc'
          }
        },
        AddedBy: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        AssetAllocation: {
          select: {
            label: true,
            id: true,
            CompanyAsset: {
              where: {
                isDeleted: false
              },
              select: {
                id: true,
                assetName: true,
                type: true,
                code: true,
                assetDetail: true,
              }
            }
          }
        },
        Department: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        organizationId: true,
        Organization: {
          select: {
            id: true,
            name: true,
            uuid: true,
            logo: true
          }
        },
        managerId: true,
        Manager: {
          select: UserDefaultAttributes
        },
        UserDocuments: {
          include: {
            AddedBy: {
              select: UserDefaultAttributes
            }
          },
          where: {
            isDeleted: false
          },
          orderBy: {
            addedDate: 'desc'
          }
        },
        isPublished: true
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }


  findOneByEmail(email: string, atttibutes: userAttributesTypes = userAttributesTypes.GENERAL) {
    const __attributes = userAttributes[atttibutes];
    return this.prisma.user.findFirst({
      select: __attributes,
      where: {
        email: email
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }


  //think before adding removing any attributes, it is used in auth system
  findLoggedInUserDetails(email: string, extraParams: Prisma.UserSelect = {}) {
    return this.prisma.user.findFirst({
      where: {
        isDeleted: false,
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneCode: true,
        phone: true,
        profile: true,
        status: true,
        dataAccessRestrictedTo: true,
        _count: {
          select: {
            Employees: true
          }
        },
        userSignupSource: (extraParams && extraParams.userSignupSource) ? extraParams.userSignupSource : false,
        password: (extraParams && extraParams.password) ? extraParams.password : false,
        Department: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        Organization: {
          select: {
            id: true,
            name: true,
            logo: true,
            uuid: true,
            status: true,
            type: true
          }
        }
      }
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;
    if (password) {
      updateUserDto.password = generateHash(updateUserDto.password);
      await this.prisma.authTokens.deleteMany({
        where: {
          userId: id,
          tokenType: TokenTypes.refreshToken
        }
      })
    }

    let dataRestrictions = [];
    if(updateUserDto.dataAccessRestrictedTo){
      dataRestrictions = updateUserDto.dataAccessRestrictedTo.filter((ele) => ele !== 0);
    }
    return this.prisma.user.update({
      data: {
        ...updateUserDto,
        dataAccessRestrictedTo: updateUserDto.dataAccessRestrictedTo ? dataRestrictions : undefined
      },
      where: {
        id: id
      },
      select: userAttributes.general
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  remove(id: number, user: AuthenticatedUser) {
    return this.prisma.user.update({
      data: {
        isPublished: false,
        status: UserStatus.suspended,
        isDeleted: true,
        deletedDate: new Date(),
        deletedById: user.userId
      },
      where: {
        id: id
      },
      select: userAttributes.general
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  addUserRole(id: number, roles: Array<number>) {
    let insertData = roles.map((key) => { return { userId: id, roleId: key } });
    return this.prisma.userRole.createMany({
      data: insertData
    }).catch((err: PrismaClientKnownRequestError) => {
      this.logger.error("Error on " + this.constructor.name + " \n Error code : " + err.code + " \n Error message : " + err.message);
      let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
      throw errorResponse;
    })
  }

  removeAllUserRoles(id: number) {
    return this.prisma.userRole.deleteMany({
      where: {
        userId: id
      }
    })
  }

  findUserRolesByRoleIds(userId: number, roleIds: number[]) {
    let condition: Prisma.UserRoleScalarWhereInput = { userId: userId };
    condition = { ...condition, roleId: { in: roleIds } }
    return this.prisma.userRole.findMany({
      where: condition
    })
  }

  removeUserRolesByRoleIds(userId: number, roleIds: number[]) {
    let condition: Prisma.UserRoleScalarWhereInput = { userId: userId };
    condition = { ...condition, roleId: { in: roleIds } }
    return this.prisma.userRole.deleteMany({
      where: condition
    })
  }



  findLoggedInUserMenu(user: AuthenticatedUser) {
    let result;

    if (user.roles.slugs.includes(SUPER_ADMIN)) {
      result = this.prisma.modules.findMany({
        where: {
          isMenuItem: true
        },
        include: {
          Permissions: {
            where: {
              isMenuItem: true
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      })
    }
    else {
      result = this.prisma.modules.findMany({
        where: {
          AND: [
            {
              Permissions: {
                some: {
                  AND: [
                    {
                      RolePermissions: {
                        some: {
                          roleId: {
                            in: user.roles.ids
                          }
                        }
                      }
                    },
                    {
                      isMenuItem: true
                    }
                  ]
                }
              }
            },
            {
              isMenuItem: true
            }
          ]
        },
        include: {
          Permissions: {
            where: {
              isMenuItem: true,
              RolePermissions: {
                some: {
                  roleId: {
                    in: user.roles.ids
                  }
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      })
    }
    return result;
  }

  async findUserPermissionsAgainstSlugs(user: AuthenticatedUser, slugs: string | string[]) {
    let results = {};
    let __slugs = Array.isArray(slugs) ? slugs : [slugs]
    if (user.roles.slugs.includes(SUPER_ADMIN)) {
      __slugs.map(function (ele) {
        results[ele] = true;
      })
      return results;
    } else {
      let dt = await this.prisma.rolePermissions.findMany({
        where: {
          AND: [
            {
              roleId: {
                in: user.roles.ids
              }
            },
            {
              Permission: {
                action: {
                  in: __slugs
                }
              }
            }
          ]
        },
        select: {
          Permission: {
            select: {
              action: true
            }
          }
        }
      })

      let foundSlugs = dt.map((ele) => {
        return ele.Permission.action;
      })

      __slugs.map(function (ele) {
        results[ele] = foundSlugs.includes(ele);
      })

      return results;
    }
  }

  applyFilters(filters: UserFiltersDto) {
    let condition: Prisma.UserWhereInput = { isDeleted: false };
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
      if (filters.organizationId) {
        condition = { ...condition, organizationId: filters.organizationId }
      }

      if (filters.ids) {
        if (filters.ids) {
          if (Array.isArray(filters.ids)) {
            condition = { ...condition, id: { in: filters.ids } }
          } else {
            condition = { ...condition, id: filters.ids }
          }
        }
      }


      if (filters.roleIds) {
        condition = {
          ...condition, userRole: {
            some: {
              roleId: {
                in: filters.roleIds
              }
            }
          }
        }
      }

      if (filters.roleSlugs) {
        condition = {
          ...condition, userRole: {
            some: {
              Role: {
                slug: {
                  in: filters.roleSlugs
                }
              }
            }
          }
        }
      }

      if (filters.departmentSlug) {
        condition = {
          ...condition, Department: {
            slug: filters.departmentSlug
          }
        }
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
        let allIds = extractIds(filters.name);
        condition = {
          ...condition, OR: [
            {
              firstName: { contains: filters.name, mode: 'insensitive' }
            },
            {
              lastName: { contains: filters.name, mode: 'insensitive' }
            },
            {
              email: { contains: filters.name, mode: 'insensitive' }
            },
            ...(allIds && allIds.length > 0 ? [{ id: { in: allIds } }] : [])
            // (allIds && allIds.length > 0) ?
            //   {
            //     id: {
            //       in: allIds
            //     }
            //   }
            //   : undefined
          ]
        }
      }

      if (filters.departmentId) {
        condition = {
          ...condition,
          departmentId: filters.departmentId
        }
      }
    }
    return condition
  }

  applyFiltersAuthTokensIssued(filters: UserAuthTokensIssuedDto) {
    let condition: Prisma.AuthTokensWhereInput = {};
    if (Object.entries(filters).length > 0) {

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

      if (filters.userAgent) {
        condition = {
          ...condition, userAgent: {
            contains: filters.userAgent,
            mode: 'insensitive'
          }
        }
      }

      if (filters.userIP) {
        condition = {
          ...condition, userIP: {
            contains: filters.userIP,
            mode: 'insensitive'
          }
        }
      }

      if (filters.userId) {
        condition = {
          ...condition, user: {
            id: filters.userId
          }
        }
      }

      if (filters.tokenType) {
        condition = { ...condition, tokenType: filters.tokenType }
      }
    }
    return condition
  }

  countTotalRecord(filters: Prisma.UserWhereInput) {
    return this.prisma.user.count({
      where: filters
    })
  }

  countTotalAuthToken(filters: Prisma.AuthTokensWhereInput) {
    return this.prisma.authTokens.count({
      where: filters
    })
  }

  async createUserAvatar(userId: number, meta: { username: string, shouldFetch: boolean } = { username: "", shouldFetch: true }) {
    let username = meta.username;
    if (meta.shouldFetch === true) {
      let user = await this.findOne(userId);
      if (!user || user.profile) {
        return false;
      }
      username = user.firstName + " " + user.lastName;
    }
    let filename = generateSEOFriendlyFileName(username) + "-" + Date.now() + ".png";
    let currentDate = new Date().toISOString().split('T')[0];
    let fileLocation = 'public/user/' + currentDate;
    try {
      createAvatarImage(username, fileLocation, filename);
      let profileUploaded = fileLocation + "/" + filename;
      await this.prisma.user.update({
        data: {
          profile: profileUploaded,
          isAvatar: true
        },
        where: {
          id: userId
        }
      })
      return profileUploaded;
    } catch (err) {
      this.logger.error("some error while creating user avatar", err);
    }
  }


  updateUserMeta(userId: number, updateUserMetaDto: UpdateUserMetaDto) {
    let allPromises = [];
    updateUserMetaDto.userMeta?.map((ele) => {
      let data = this.prisma.userMeta.upsert({
        where: {
          key_userId: {
            userId: userId,
            key: ele.key
          }
        },
        create: {
          key: ele.key,
          value: ele.value,
          userId: userId
        },
        update: {
          value: ele.value
        }
      })
      allPromises.push(data);
    })

    return Promise.all(allPromises);
  }

  async deleteUserMeta(metaId: number) {
    return this.prisma.userMeta.delete({
      where: {
        id: metaId
      }
    })
  }

  async deleteUserMetaByKey(userId: number, key: keyof typeof UserMetaKeys) {
    return this.prisma.userMeta.delete({
      where: {
        key_userId: {
          key: key,
          userId: userId
        }
      }
    })
  }

  findUserRoles(userId: number) {
    return this.prisma.userRole.findMany({
      where: {
        userId: userId
      },
      select: {
        Role: {
          select: {
            id: true,
            slug: true
          }
        }
      }
    })
  }

  deactivateUser(userId: number) {
    return this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        isDeleted: true,
        isPublished: false,
        status: UserStatus.suspended
      }
    })
  }

  async handleUserDocuments(userDocuments: UploadUserDocuments, files: Array<Express.Multer.File>, user: AuthenticatedUser) {

    let userData = await this.prisma.user.findUnique({
      where: {
        id: userDocuments.userId
      }
    })

    if (!userData) {
      throw new NotFoundException({ message: "userData with the provided userDataId not Found", statusCode: 400 })
    }
    let insertedIds = []
    let insertData: Array<Prisma.UserDocumentCreateInput> = files.map((ele, index) => {
      let newRecord: Prisma.UserDocumentUncheckedCreateInput = {
        title: userDocuments.title ? userDocuments.title : ele.originalname,
        documentType: userDocuments.documentType,
        file: extractRelativePathFromFullPath(ele.path),
        mimeType: ele.mimetype,
        addedById: user.userId,
        userId: userDocuments.userId
      }
      return newRecord;
    });

    if (insertData.length > 0) {
      return this.prisma.userDocument.createMany({
        data: insertData
      }).catch((err: PrismaClientKnownRequestError) => {
        this.logger.error("Error on " + this.constructor.name + "Custom Error code: ERR437 \n Error code : " + err.code + " \n Error message : " + err.message);
        let errorResponse: ResponseError = { message: err.message, statusCode: 404, data: {} }
        throw errorResponse;
      })

    } else {
      return []
    }
  }

  updateUserDocument(updateDocuments: UpdateUserDocuments) {
    const { documentId, ...rest } = updateDocuments;
    return this.prisma.userDocument.update({
      where: {
        id: documentId
      },
      data: rest
    })
  }

  deleteUserDocument(documentId: number) {
    return this.prisma.userDocument.update({
      where: {
        id: documentId
      },
      data: {
        isDeleted: true
      }
    })
  }

  async findDashboardElements(user: AuthenticatedUser) {
    let userRole = await this.prisma.role.findFirst({
      where: {
        UserRole: {
          some: {
            userId: user.userId
          }
        },
        DashboardElements: {
          some: {
            DashboardElement: {
              isDeleted: false
            }
          }
        }
      },
      orderBy: {
        level: 'asc'
      }
    })

    return this.prisma.roleDashboardElement.findMany({
      where: {
        roleId: userRole.id,
        DashboardElement: {
          isDeleted: false
        }
      },
      orderBy: {
        order: 'asc'
      }
    })
  }

  async updateSalary(userId: number, userSalaryDto: UserSalaryDto) {

    let existing = await this.prisma.salary.findFirst({
      where:{
        isActive: true,
        userId: userId
      }
    })

    if(existing && userSalaryDto.startDate < existing.startDate){
      throw {
        message: "You cannot choose new salary start date smaller than current salary start date",
        statusCode: 400
      }
    }

    let newSalary = await this.prisma.salary.create({
      data: {
        userId: userId,
        isActive: true,
        amount: userSalaryDto.amount,
        startDate: userSalaryDto.startDate
      }
    })

    let endDate = new Date(userSalaryDto.startDate);
    endDate.setDate(endDate.getDate() - 1);
    await this.prisma.salary.updateMany({
      where: {
        userId: userId,
        NOT: {
          id: newSalary.id
        },
        isActive: true
      },
      data: {
        endDate: endDate,
        isActive: false
      }
    })

    return newSalary;
  }
}
