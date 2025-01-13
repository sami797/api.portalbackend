import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { SystemModulesService } from './system-modules.service';
import { CreateSystemModuleDto } from './dto/create-system-module.dto';
import { UpdateSystemModuleDto } from './dto/update-system-module.dto';
import { SystemModuleResponseObject, SystemModuleResponseArray, systemModulesIconUploadPath } from './dto/system-modules.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ParamsDto } from './dto/params.dto';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SystemModulesPermissionSet } from './system-modules.permissions';
import { extractRelativePathFromFullPath, FileTypes, getMulterOptions } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemModuleFilters } from './dto/system-modules.filters';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
const multerOptions = getMulterOptions({ destination: systemModulesIconUploadPath, fileTypes: 'images_only_with_svg' });

const moduleName = "System Module(s)";

@ApiTags("System Modules")
@Controller('system-modules')
export class SystemModulesController {
  constructor(private readonly systemModulesService: SystemModulesService) {}

  @CheckPermissions(SystemModulesPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon', multerOptions))
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SystemModuleResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createSystemModuleDto: CreateSystemModuleDto,
  @UploadedFile() icon: Express.Multer.File
  ) : Promise<ResponseSuccess | ResponseError> {
    try {
      if (icon) {
        createSystemModuleDto.icon = extractRelativePathFromFullPath(icon.path)
      }
      let data = await this.systemModulesService.create(createSystemModuleDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SystemModulesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SystemModuleResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(@Param() filters: SystemModuleFilters, @Req() req: AuthenticatedRequest) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.systemModulesService.findAll(filters, req.user);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SystemModulesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SystemModuleResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.systemModulesService.findOne(params.id, req.user);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SystemModulesPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon', multerOptions))
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SystemModuleResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateSystemModuleDto: UpdateSystemModuleDto,
  @UploadedFile() icon: Express.Multer.File,
  )  : Promise<ResponseSuccess | ResponseError> {
    try {
      if (icon) {
        updateSystemModuleDto.icon = extractRelativePathFromFullPath(icon.path);
      }
      let data = await this.systemModulesService.update(params.id, updateSystemModuleDto);
      uploadFile(icon);
      return { message: "Record updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SystemModulesPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SystemModuleResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto)  : Promise<ResponseSuccess | ResponseError>{
    try {
      let data = await this.systemModulesService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
