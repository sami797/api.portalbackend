import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { UserAlertsSettingService } from './user-alerts-setting.service';
import { CreateUserAlertsSettingDto } from './dto/create-user-alerts-setting.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindBySlugDto, ParamsDto, } from './dto/params.dto';
import { UserAlertsSettingResponseObject } from './dto/user-alerts-setting.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
const moduleName = "user-alerts-setting";

@ApiTags("user-alerts-setting")
@Controller('user-alerts-setting')
export class UserAlertsSettingController {
  constructor(private readonly UserAlertsSettingService: UserAlertsSettingService) { }

  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: UserAlertsSettingResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('subscribe-unsubscribe')
  async create(@Body() createPropertyTypeCategoryRelationDto: CreateUserAlertsSettingDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.UserAlertsSettingService.createOrUpdate(createPropertyTypeCategoryRelationDto, req.user);
      return { message: `Alerts updated successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: UserAlertsSettingResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Patch('unsubscribe-all')
  async unsubscribeAll(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.UserAlertsSettingService.unsubscribeAll(req.user);
      return { message: `You have been unsubscribed from all notifications.`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch ${moduleName}  by category Id and type Id` })
  @ApiResponse({ status: 200, type: UserAlertsSettingResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('find-user-alert-by-slug/:alertTypeSlug')
  async findOneBySlug(@Param() params: FindBySlugDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.UserAlertsSettingService.findBySlug(params.alertTypeSlug, req.user.userId);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch ${moduleName}  by category Id and type Id` })
  @ApiResponse({ status: 200, type: UserAlertsSettingResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':alertTypeId')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.UserAlertsSettingService.findOne(params.alertTypeId, req.user.userId);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

}
