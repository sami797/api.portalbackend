import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, UploadedFile, UseInterceptors, Req, Query, UploadedFiles } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiConsumes, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ManualAction, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindUserByUUID, ParamsDto } from './dto/params.dto';
import { userFileUploadPath, UserResponseObject, UserResponseArray, getDynamicUploadPath } from './dto/user.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { UserRoleDto } from './dto/user-role.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { UserPermissionSet } from './user.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { UserSortingDto } from './dto/user-sorting.dto';
import { UserFiltersDto } from './dto/user-filters.dto';
import { SUPER_ADMIN, USER_SIGNUP_SOURCE_TYPES, SYSTEM_USERS } from 'src/config/constants';
import { DeleteUserMetaByKeyDto, DeleteUserMetaDto, UpdateUserMetaDto } from './dto/update-user-meta.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { MeDto } from './dto/me.dto';
import { UserAuthTokensIssuedDto } from './dto/auth-token-issued.dto';
import { TaskPermissionSet } from '../task/task.permissions';
import { ProjectPermissionSet } from '../project/project.permissions';
import { Prisma } from '@prisma/client';
import { UploadUserDocuments } from './dto/user-document.dto';
import { UpdateUserDocuments } from './dto/user-document-update.dto';
import { UserAuthorizationService } from './user.authorization.service';
import { UserSalaryDto } from './dto/user-salary.dto';
const multerOptions = getMulterOptions({ destination: getDynamicUploadPath('public'), fileTypes: 'images_only', limit: 2000000 });
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath('organization'), fileTypes: 'images_only', limit: 2000000 });
const moduleName = "User(s)";

@ApiTags("Users")
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly authorizationService: UserAuthorizationService
  ) { }


  @CheckPermissions(ProjectPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload property Files` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('file', 20, multerOptionsProtected))
  @Post("uploadUserDocuments")
  async uploadUserDocuments(@Body() uploadDocuments: UploadUserDocuments,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(uploadDocuments.userId, req.user);
      if (files && files.length > 0) {
        let data = await this.userService.handleUserDocuments(uploadDocuments, files, req.user);
        uploadFile(files);
        return { message: `Document uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update property Files` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @Patch("updateUserDocument")
  async updateUserDocument(@Body() updateDocuments: UpdateUserDocuments,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUserDocument(updateDocuments.documentId, req.user);
      let data = await this.userService.updateUserDocument(updateDocuments);
      return { message: `Document updated successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE)
  @ApiOperation({ summary: `Delete user document` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false })
  @Delete("deleteUserDocument/:id")
  async deleteUserDocument(
    @Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUserDocument(params.id, req.user);
      let data = await this.userService.deleteUserDocument(params.id);
      return { message: `Document deleted successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(UserPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('profile', multerOptions))
  @Post()
  async create(@Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        createUserDto.profile = extractRelativePathFromFullPath(file.path);
        createUserDto["isAvatar"] = false;
      }

      createUserDto['addedById'] = req.user.userId;
      let userAgent = req.headers["user-agent"];
      createUserDto["userSignupSource"] = USER_SIGNUP_SOURCE_TYPES.organization,
        createUserDto["userSignupDeviceAgent"] = userAgent;
      let data = await this.userService.create(createUserDto);
      if (!file) {
        let profile = await this.userService.createUserAvatar(data.id, { username: data.firstName + " " + data.lastName, shouldFetch: false })
        if (profile) {
          data.profile = profile;
        }
      } else {
        uploadFile(file);
      }
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: UserResponseArray, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() pagination: UserPaginationDto,
    @Query() sorting: UserSortingDto,
    @Query() filters: UserFiltersDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[UserPermissionSet.MANAGE_ALL]>(req.user, [UserPermissionSet.MANAGE_ALL])
      let filtersApplied = this.userService.applyFilters(filters);
      let dt;
      if (permissions.manageAllUser) {
        dt = this.userService.findAll(pagination, sorting, filtersApplied);
      } else {
        dt = this.userService.findAllBasic(pagination, sorting, filtersApplied);
      }
      let tCount = this.userService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
        meta: {
          page: pagination.page,
          perPage: pagination.perPage,
          total: totalCount,
          pageCount: pageCount
        }
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.READ_AUTH_TOKENS_ISSUED)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: UserResponseArray, description: `Return a list of ${moduleName} available` })
  @Get('findAuthTokensIssued')
  async findUserLoginHistory(
    @Query() pagination: UserPaginationDto,
    @Query() filters: UserAuthTokensIssuedDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.userService.applyFiltersAuthTokensIssued(filters);
      let dt = this.userService.findAllAuthTokensIssued(pagination, filtersApplied);
      let tCount = this.userService.countTotalAuthToken(filtersApplied);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      // data.forEach(async (ele) => {
      //   this.userService.createUserAvatar(ele.id, {username: "", shouldFetch: true})
      // })
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
        meta: {
          page: pagination.page,
          perPage: pagination.perPage,
          total: totalCount,
          pageCount: pageCount
        }
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch logged in user data using access token` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('me')
  async findUserByToken(@Req() req: AuthenticatedRequest, @Query() meDto: MeDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let user = req.user;
      let data = await this.userService.findLoggedInUserDetails(user.userEmail);
      if (meDto.roles) {
        let userRoles = await this.userService.findUserRoles(user.userId);
        const userRoleIds = userRoles.map((key) => key.Role.id);
        const userRoleSlugs = userRoles.map((key) => key.Role.slug);
        data["roles"] = { ids: userRoleIds, slugs: userRoleSlugs };
      }
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch logged in user menu list` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('user-menu')
  async findUserMenuList(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let user = req.user;
      let data = await this.userService.findLoggedInUserMenu(user);
      return { message: `User menu fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Check if the user has permission for the provided slug` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('check-user-permissions')
  async findUserPermissions(@Req() req: AuthenticatedRequest, @Query('slugs') slugs: string[]): Promise<ResponseSuccess | ResponseError> {
    try {
      let user = req.user;
      let data = await this.userService.findUserPermissionsAgainstSlugs(user, slugs);
      return { message: `User menu fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: 'Returns the updated record object if found on the system' })
  @UseInterceptors(FileInterceptor('profile', multerOptions))
  @Patch('update-me')
  async updateMe(@Body() updateUserDto: UpdateMeDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        updateUserDto.profile = extractRelativePathFromFullPath(file.path);
        updateUserDto["isAvatar"] = false;
      }
      updateUserDto["modifiedDate"] = new Date();
      updateUserDto["modifiedById"] = req.user.userId;
      let data = await this.userService.update(req.user.userId, updateUserDto);
      uploadFile(file);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: 'Returns the updated record object if found on the system' })
  @UseInterceptors(FileInterceptor('profile', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      if (file) {
        updateUserDto.profile = extractRelativePathFromFullPath(file.path);
        updateUserDto["isAvatar"] = false;
      }
      updateUserDto["modifiedDate"] = new Date();
      updateUserDto["modifiedById"] = req.user.userId;

      let data = await this.userService.update(params.id, updateUserDto);
      uploadFile(file);

      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.userService.remove(params.id, req.user);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(UserPermissionSet.ADD_USER_ROLE)
  @ApiOperation({ summary: `Add user roles` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the roles of the user` })
  @Post('addUserRole/:id')
  async addRole(@Param() params: ParamsDto,
    @Body() userRoleDto: UserRoleDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let newRoles = [];
      if (Array.isArray(userRoleDto.roleIds)) {
        newRoles = userRoleDto.roleIds
      } else {
        newRoles = [userRoleDto.roleIds];
      }
      let userRoles = await this.userService.findUserRolesByRoleIds(params.id, newRoles);
      let existingRoles = userRoles.map((ele) => ele.roleId);
      let uniqueRoles = [];
      newRoles.map((ele) => {
        if (!existingRoles.includes(ele)) {
          uniqueRoles.push(ele)
        }
      })
      let data = await this.userService.addUserRole(params.id, uniqueRoles);
      return { message: `User roles fetched successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.ADD_USER_ROLE)
  @ApiOperation({ summary: `Remove user roles` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the roles of the user` })
  @Patch('removeUserRole/:id')
  async removeUserRole(@Param() params: ParamsDto,
    @Body() userRoleDto: UserRoleDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let roles = [];
      if (Array.isArray(userRoleDto.roleIds)) {
        roles = userRoleDto.roleIds
      } else {
        roles = [userRoleDto.roleIds];
      }
      let data = await this.userService.removeUserRolesByRoleIds(params.id, roles);
      return { message: `User roles deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.UPDATE)
  @ApiOperation({ summary: `Updates and returns the updated user meta data` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the updated user meta data` })
  @Patch('update-meta/:id')
  async updateUserMeta(
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto,
    @Body() updateUserMetaDto: UpdateUserMetaDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.updateUserMeta(params.id, updateUserMetaDto);

      return { message: `User meta data updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(UserPermissionSet.UPDATE)
  @ApiOperation({ summary: `Updates and returns the updated user meta data` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the updated user meta data` })
  @Patch('delete-meta/:id')
  async deleteOrgMeta(
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto,
    @Body() deleteUserMetaDto: DeleteUserMetaDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.deleteUserMeta(deleteUserMetaDto.id);

      return { message: `User meta data deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.UPDATE)
  @ApiOperation({ summary: `Updates and returns the updated user meta data` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the updated user meta data` })
  @Patch('updateSalary/:id')
  async updateSalary(
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto,
    @Body() userSalaryDto: UserSalaryDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.updateSalary(params.id, userSalaryDto);

      return { message: `Salary updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.UPDATE)
  @ApiOperation({ summary: `Updates and returns the updated user meta data` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the updated user meta data` })
  @Patch('delete-meta-by-key/:id')
  async deleteOrgMetaByKey(
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto,
    @Body() deleteUserMetaByKeyDto: DeleteUserMetaByKeyDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.deleteUserMetaByKey(params.id, deleteUserMetaByKeyDto.key);

      return { message: `User meta data deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  // @ApiOperation({ summary: `Delete User from the System` })
  // @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Delete account` })
  // @Post('deleteAccount')
  // async deleteAccount(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
  //   try {
  //     let data = await this.userService.deactivateUser(req.user.userId);
  //     return { message: `Your account has been deleted successfully. You can no longer access this account.`, statusCode: 200, data: data }
  //   } catch (err) {
  //     throw new HttpException(err.message, err.statusCode);
  //   }
  // }

  @CheckPermissions(UserPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findAllocatedResource/:id')
  async findAllocatedResource(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.findAllocatedResource(params.id);
      return { message: `Allocated resources of user fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('getMyDashboardElements')
  async findDashboardElements(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.userService.findDashboardElements(req.user);
      return { message: `Dashboard elements for user fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: UserResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForUser(params.id, req.user);
      let data = await this.userService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
