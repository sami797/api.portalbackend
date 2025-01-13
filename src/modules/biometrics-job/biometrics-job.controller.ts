import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BiometricsJobService } from './biometrics-job.service';
import { CreateBiometricsJobDto } from './dto/create-biometrics-job.dto';
import { UpdateBiometricsJobDto } from './dto/update-biometrics-job.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { BiometricsJobResponseObject, BiometricsJobResponseArray, getDynamicUploadPath } from './dto/biometrics-jobs.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BiometricsJobPermissionSet } from './biometrics-job.permissions';
import { BiometricsJobFilters } from './dto/biometrics-job-filters.dto';
import { BiometricsJobRollbackDto } from './dto/biometrics-job-rollback.dto';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadFile } from 'src/helpers/file-management';
const multerOptions = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes:'json_and_excel', limit: 10000000 });
const moduleName = "biometrics-job";

@ApiTags("biometrics-job")
@Controller('biometrics-job')
export class BiometricsJobController {
  constructor(private readonly biometricsJobService: BiometricsJobService) { }
  
  @CheckPermissions(BiometricsJobPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post()
  async create(@Body() createDto: CreateBiometricsJobDto, @UploadedFile() file: Express.Multer.File,): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        createDto.file = extractRelativePathFromFullPath(file.path);
      }
      let data = await this.biometricsJobService.create(createDto);
      uploadFile(file);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(file)
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: BiometricsJobFilters,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.biometricsJobService.applyFilters(filters);
      let dt = await this.biometricsJobService.findAll(appliedFilters, pagination);
      let tCount = this.biometricsJobService.countRecords(appliedFilters);
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
      console.log(err.message);
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.CREATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('process/:id')
  async process(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.bulkUploadBiometrics(params.id);
      return { message: `Job processing started`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.CREATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('stop/:id')
  async stop(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.stopUploadBiometrics(params.id);
      return { message: `Job stopped successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.ROLLBACK)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('rollback/:id')
  async rollback(@Param() params: ParamsDto, 
  @Body() updateDto: BiometricsJobRollbackDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.rollback(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateBiometricsJobDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsJobPermissionSet.DELETE)
  @ApiOperation({ summary: `Remove a biometrics job` })
  @ApiResponse({ status: 200, type: BiometricsJobResponseObject, isArray: false, description: `Returns the lead removed` })
  @Delete('remove/:id')
  async remove(@Param() params: ParamsDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsJobService.remove(params.id);
      return { message: `Job deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
