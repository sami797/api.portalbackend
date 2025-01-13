import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req } from '@nestjs/common';
import { BulkUploadFormatService } from './bulk-upload-format.service';
import { CreateBulkUploadFormatDto } from './dto/create-bulk-upload-format.dto';
import { UpdateBulkUploadFormatDto } from './dto/update-bulk-upload-format.dto';
import { BulkUploadFormatResponseObject, BulkUploadFormatResponseArray } from './dto/bulk-upload-format.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BulkUploadFormatPermissionSet } from './bulk-upload-format.permissions';

const moduleName = "bulk-upload-format";

@ApiTags("bulk-upload-format")
@Controller('bulk-upload-format')
export class BulkUploadFormatController {
  constructor(private readonly BulkUploadFormatService: BulkUploadFormatService) {}
  
  @CheckPermissions(BulkUploadFormatPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createBulkUploadFormatDto: CreateBulkUploadFormatDto) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.BulkUploadFormatService.create(createBulkUploadFormatDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BulkUploadFormatPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll() : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.BulkUploadFormatService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findAllPublished() : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.BulkUploadFormatService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BulkUploadFormatPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.BulkUploadFormatService.findOne(params.id);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BulkUploadFormatPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateBulkUploadFormatDto: UpdateBulkUploadFormatDto)  : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.BulkUploadFormatService.update(params.id, updateBulkUploadFormatDto);
      return { message: "Record updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BulkUploadFormatPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: BulkUploadFormatResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto)  : Promise<ResponseSuccess | ResponseError>{
    try {
      let data = await this.BulkUploadFormatService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

}
