import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { DiaryResponseObject, DiaryResponseArray } from './dto/diary.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { DairyPermissionSet } from './diary.permissions';
import { DiaryFilters } from './dto/diary-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { getDifferenceInDays } from 'src/helpers/common';
const moduleName = "diary";

@ApiTags("diary")
@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) { }
  
  @CheckPermissions(DairyPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DiaryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateDiaryDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      createDto.userId = req.user.userId;
      let data = await this.diaryService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DairyPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DiaryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: DiaryFilters,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.diaryService.applyFilters(filters);
      let dt = await this.diaryService.findAll(appliedFilters, pagination);
      let tCount = this.diaryService.countRecords(appliedFilters);
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

  @CheckPermissions(DairyPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DiaryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('getReport')
  async findDiaryReport(
    @Query() filters: DiaryFilters,
    @Query() pagination: Pagination,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.diaryService.applyFilters(filters);
      let employees = await this.diaryService.findEmployeesUnderUser(req.user);
      let dt = await this.diaryService.findUserReport(appliedFilters, pagination, employees);
      let tCount = this.diaryService.countRecords(appliedFilters);
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

  @CheckPermissions(DairyPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: DiaryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('getReport/:id')
  async findDiaryReportOfUser(
    @Query() filters: DiaryFilters,
    @Query() pagination: Pagination,
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto
    ): Promise<ResponseSuccess | ResponseError> {
    try {

      if(filters.fromDate && filters.toDate){
        let days = getDifferenceInDays(filters.fromDate, filters.toDate);
        if(days > 30){
          throw {
            message: "You can get report of max 30 days, please use proper pagination",
            statusCode: 400
          }
        }
      }
      let appliedFilters = this.diaryService.applyFilters(filters);
      let dt = await this.diaryService.findUserReportByUserId(params.id, appliedFilters);
      let tCount = this.diaryService.countRecords(appliedFilters);
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

  @CheckPermissions(DairyPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: DiaryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.diaryService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DairyPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: DiaryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateDiaryDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.diaryService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(DairyPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: DiaryResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.diaryService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
