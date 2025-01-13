import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { RoleResponseObject, RoleResponseArray } from './dto/role.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { RolePermissionSet } from './role.permissions';
import { RoleFiltersDto } from './dto/role-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { RoleDashboardElements } from './dto/role-dashboard-elements.dto';
const moduleName = "Role(s)";

@ApiTags("Roles")
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService, private readonly authorizationService: AuthorizationService) { }
  
  @CheckPermissions(RolePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.create(createRoleDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(RolePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: RoleResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters : RoleFiltersDto, 
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.roleService.applyFilters(filters, req.user);
      let data = await this.roleService.findAll(filtersApplied, filters);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }



  @CheckPermissions(RolePermissionSet.UPDATE)
  @ApiOperation({ summary: `Add user roles` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the roles of the user` })
  @Post('addDashboardElement/:id')
  async addDashboardElement(@Param() params: ParamsDto,
    @Body() roleDashboardElements: RoleDashboardElements,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.addDashboardElement(params.id, roleDashboardElements);
      return { message: `Dashboard elements updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(RolePermissionSet.UPDATE)
  @ApiOperation({ summary: `Add user roles` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the roles of the user` })
  @Post('removeDashboardElement/:id')
  async removeDashboardElement(@Param() params: ParamsDto,
    @Body() roleDashboardElements: RoleDashboardElements,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.removeDashboardElement(params.id, roleDashboardElements);
      return { message: `Dashboard elements updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(RolePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(RolePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateRoleDto: UpdateRoleDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.update(params.id, updateRoleDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(RolePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: RoleResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.roleService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
