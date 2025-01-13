import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { LeaveTypeService } from './leave-type.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { LeaveTypeResponseObject, LeaveTypeResponseArray } from './dto/leave-type.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { LeaveTypePermissionSet } from './leave-type.permissions';
import { LeaveTypeFilters } from './dto/leave-type-filters.dto';
const moduleName = "leave-type";

@ApiTags("leave-type")
@Controller('leave-type')
export class LeaveTypeController {
  constructor(private readonly leaveTypeService: LeaveTypeService) { }
  
  @CheckPermissions(LeaveTypePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateLeaveTypeDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveTypeService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: LeaveTypeFilters): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.leaveTypeService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let data = await this.leaveTypeService.findAll(appliedFilters);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveTypePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: LeaveTypeFilters): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.leaveTypeService.applyFilters(filters);
      let data = await this.leaveTypeService.findAll(appliedFilters);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveTypePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveTypeService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveTypePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateLeaveTypeDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveTypeService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveTypePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: LeaveTypeResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveTypeService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
