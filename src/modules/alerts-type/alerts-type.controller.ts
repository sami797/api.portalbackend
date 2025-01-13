import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { AlertsTypeService } from './alerts-type.service';
import { CreateAlertsTypeDto } from './dto/create-alerts-type.dto';
import { UpdateAlertsTypeDto } from './dto/update-alerts-type.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindBySlugDto, ParamsDto } from './dto/params.dto';
import { AlertsTypeResponseObject, AlertsTypeResponseArray } from './dto/alerts-type.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AlertsTypePermissionSet } from './alerts-type.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
const moduleName = "alerts-type";

@ApiTags("alerts-type")
@Controller('alerts-type')
export class AlertsTypeController {
  constructor(private readonly alertsTypeService: AlertsTypeService) { }

  @CheckPermissions(AlertsTypePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createAlertsTypeDto: CreateAlertsTypeDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.create(createAlertsTypeDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.findAllPublished(req.user);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.findBySlug(findBySlugDto.slug, req.user);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AlertsTypePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AlertsTypePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AlertsTypePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateAlertsTypeDto: UpdateAlertsTypeDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.update(params.id, updateAlertsTypeDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AlertsTypePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: AlertsTypeResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.alertsTypeService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
