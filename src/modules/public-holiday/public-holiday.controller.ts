import { Controller, Get, Post, Body,Req, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { PublicHolidayService } from './public-holiday.service';
import { CreatePublicHolidayDto } from './dto/create-public-holiday.dto';
import { UpdatePublicHolidayDto } from './dto/update-public-holiday.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { PublicHolidayResponseObject, PublicHolidayResponseArray } from './dto/public-holiday.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { PublicHolidayPermissionSet } from './public-holiday.permissions';
import { PublicHolidayFilters } from './dto/public-holiday-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
const moduleName = "public-holiday";

@ApiTags("public-holiday")
@Controller('public-holiday')
export class PublicHolidayController {
  constructor(private readonly publicHolidayService: PublicHolidayService) { }
  
  @CheckPermissions(PublicHolidayPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PublicHolidayResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreatePublicHolidayDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.publicHolidayService.create(createDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PublicHolidayPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PublicHolidayResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: PublicHolidayFilters,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.publicHolidayService.applyFilters(filters);
      let dt = await this.publicHolidayService.findAll(appliedFilters, pagination);
      let tCount = this.publicHolidayService.countRecords(appliedFilters);
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

  @CheckPermissions(PublicHolidayPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PublicHolidayResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.publicHolidayService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PublicHolidayPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PublicHolidayResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdatePublicHolidayDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.publicHolidayService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PublicHolidayPermissionSet.DELETE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PublicHolidayResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Delete(':id')
  async delete(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.publicHolidayService.delete(params.id);
      return { message: `${moduleName}  deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
