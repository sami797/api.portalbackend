import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionResponseObject, PermissionResponseArray, permissionIconUploadPath } from './dto/permissions.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ParamsDto } from './dto/params.dto';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { GrantPrivilegesDto } from './dto/grant-privileges.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { permissionSets, PermissionsPermissionSet } from './permissions.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, FileTypes, getMulterOptions } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { GetRolePermission } from './dto/get-role-permission.dto';
const multerOptions = getMulterOptions({ destination: permissionIconUploadPath, fileTypes: 'images_only_with_svg' });

const moduleName = "Permission(s)";

@ApiTags("Permissions")
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService, private readonly authorizationService: AuthorizationService) {}


  @CheckPermissions(PermissionsPermissionSet.VIEW_PERMISSIONS_LIST)
  @ApiOperation({ summary: `Fetch all permissions required to permission an action on respective modules` })
  @ApiResponse({ status: 200, description: `Returns all permissions required to permission an action on respective modules` })
  @Get('system-permissions-set')
  permissionSets(): ResponseSuccess | ResponseError {
    return {
      message: `Permissions Set Fetched Successfully`, statusCode: 200,
      data: permissionSets
    }
  }


  @CheckPermissions(PermissionsPermissionSet.GRANT)
  @ApiOperation({ summary: `Grant privileges to role` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the number of records added` })
  @Post('grantPrivilegesToRole')
  async grantPrivilegesToRole(@Body() grantPrivilegesDto: GrantPrivilegesDto, @Req() req: AuthenticatedRequest)  : Promise<ResponseSuccess | ResponseError>{
    try {
      let data = await this.permissionsService.grantPrivilegesToRole(grantPrivilegesDto.roleId, grantPrivilegesDto.permissionIds, req.user);
      return { message: `Permission added to the given roleId successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.REVOKE)
  @ApiOperation({ summary: `Revoke privileges from role` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the privileges removed` })
  @Post('revokePrivilegesFromRole')
  async revokePrivilegesFromRole(@Body() grantPrivilegesDto: GrantPrivilegesDto, @Req() req: AuthenticatedRequest)  : Promise<ResponseSuccess | ResponseError>{
    try {
      let data = await this.permissionsService.revokePrivilegesFromRole(grantPrivilegesDto.roleId, grantPrivilegesDto.permissionIds, req.user);
      return { message: `Permission revoked from the given roleId successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.READ_ROLE_PERMISSIONS)
  @Get('getRolePermissions/:roleId')
  async getRolePermissions(@Param() params: GetRolePermission, @Req() req: AuthenticatedRequest)  : Promise<ResponseSuccess | ResponseError> {
    try {
    let data = await this.permissionsService.getRolePermission(params.roleId);
     return { message: `Permission fetched for the given roleId successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.READ_ROLE_PERMISSIONS)
  @Get('getRolePermissions/:roleId/:moduleId')
  async getRolePermissionsForModule(@Param() params: GetRolePermission, @Req() req: AuthenticatedRequest)  : Promise<ResponseSuccess | ResponseError> {
    try {
    // await this.authorizationService.checkIfUserCanAlterModule(req.user, params.moduleId);
    let data = await this.permissionsService.getRolePermissionByModuleId(params.roleId, params.moduleId);
     return { message: `Permission fetched for the given roleId and moduleId successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
  
  @CheckPermissions(PermissionsPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('icon', multerOptions))
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto,
  @UploadedFile() icon: Express.Multer.File
  ) : Promise<ResponseSuccess | ResponseError> {
    try {
      if (icon) {
        createPermissionDto.icon = extractRelativePathFromFullPath(icon.path)
      }
      let data = await this.permissionsService.create(createPermissionDto);
      uploadFile(icon);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PermissionResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll() : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.permissionsService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.permissionsService.findOne(params.id);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @UseInterceptors(FileInterceptor('icon', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updatePermissionDto: UpdatePermissionDto,
  @UploadedFile() icon: Express.Multer.File,
  )  : Promise<ResponseSuccess | ResponseError> {
    try {
      if (icon) {
        updatePermissionDto.icon = extractRelativePathFromFullPath(icon.path);
      }
      let data = await this.permissionsService.update(params.id, updatePermissionDto);
      uploadFile(icon)
      return { message: "Record updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermissionsPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: PermissionResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto)  : Promise<ResponseSuccess | ResponseError>{
    try {
      let data = await this.permissionsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

}
