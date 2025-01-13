import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { PermitsService } from './permits.service';
import { CreatePermitDto } from './dto/create-permit.dto';
import { UpdatePermitDto } from './dto/update-permit.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { PermitResponseObject, PermitResponseArray, getDynamicUploadPath } from './dto/permit.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { PermitPermissionSet } from './permits.permissions';
import { PermitFiltersDto } from './dto/permit-filters.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { PermitClientStatus } from 'src/config/constants';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "permits";

@ApiTags("permits")
@Controller('permits')
export class PermitsController {
  constructor(private readonly permitsService: PermitsService) { }
  
  @CheckPermissions(PermitPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PermitResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post()
  async create(@Body() createDto: CreatePermitDto,
  @UploadedFiles() files: Array<Express.Multer.File>,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (!files || files.length === 0) {
        throw {
          message: "Please upload permit file",
          statusCode: 400
        }
      }
      let data = await this.permitsService.create(createDto);
      await this.permitsService.handleDocuments(data, files, req.user);
      await uploadFile(files);
      let updatedRecord = await this.permitsService.findOne(data.id);
      if(createDto.clientStatus && createDto.clientStatus === PermitClientStatus.sent){
      this.permitsService.markAllPermitAsSent(updatedRecord, req.user);
      }
      return { message: `${moduleName} created successfully`, statusCode: 200, data: updatedRecord };
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermitPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PermitResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: PermitFiltersDto,
    @Query() pagination: Pagination
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.permitsService.applyFilters(filters);
      let dt = this.permitsService.findAll(appliedFilters, pagination);
      let tCount = this.permitsService.countRecords(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(PermitPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PermitResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.permitsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermitPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PermitResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdatePermitDto,
  @UploadedFiles() files: Array<Express.Multer.File>,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.permitsService.update(params.id, updateDto);
      if(files && files.length>0){
        await this.permitsService.handleDocuments(data, files, req.user);
        await uploadFile(files);
        data = await this.permitsService.findOne(data.id);
        if(updateDto.clientStatus && updateDto.clientStatus === PermitClientStatus.sent){
        this.permitsService.markAllPermitAsSent(data, req.user);
        }
      }
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(files);
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PermitPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: PermitResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.permitsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
