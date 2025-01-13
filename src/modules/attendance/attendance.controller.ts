import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req, Res } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { AttendanceResponseObject, AttendanceResponseArray } from './dto/attendance.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AttendancePermissionSet } from './attendance.permissions';
import { AttendanceFilters } from './dto/attendance-filters.dto';
import { UserAttendanceFilters } from './dto/user-attendance-filters.dto';
import { AttendanceSortingDto } from './dto/attendance-sorting.dto';
import { AttendanceAuthorizationService } from './attendance.authorization.service';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { getDifferenceInDays } from 'src/helpers/common';
import { GenerateAttendanceReport } from './dto/generate-report.dto';
import * as fs from "fs";
const moduleName = "attendance";

@ApiTags("attendance")
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService, private readonly authorizationService: AttendanceAuthorizationService) { }
  
  @CheckPermissions(AttendancePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateAttendanceDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.attendanceService.create(createDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.READ_ALL)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('triggerBulkAttendanceCalculation')
  async triggerBulkAttendanceCalculation(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = this.attendanceService.triggerBulkAttendanceCalculation();
      return { message: `Process started successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AttendanceResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: AttendanceFilters,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.authorizationService.findUserPermissionsAgainstSlugs<[AttendancePermissionSet.READ_ALL]>(req.user,[AttendancePermissionSet.READ_ALL])
      if(!permissions.readAllAttendance){
        filters.userId = req.user.userId
      }
      let appliedFilters = this.attendanceService.applyFilters(filters);
      let dt = await this.attendanceService.findAll(appliedFilters, pagination, {'sortByField': 'addedDate', 'sortOrder': 'desc'});
      let tCount = this.attendanceService.countRecords(appliedFilters);
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

  @CheckPermissions(AttendancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AttendanceResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('getUserAttendance')
  async findUserAttendance(
    @Query() filters: UserAttendanceFilters,
    @Query() sorting: AttendanceSortingDto,
    @Req() req: AuthenticatedRequest,
    ): Promise<ResponseSuccess | ResponseError> {
    try {

      let permissions =  await this.authorizationService.findUserPermissionsAgainstSlugs<[AttendancePermissionSet.READ_ALL]>(req.user,[AttendancePermissionSet.READ_ALL])
      if(!permissions.readAllAttendance){
        filters.userId = req.user.userId
      }

      let userData = await this.attendanceService.validateUser(filters.userId);
      let appliedFilters = this.attendanceService.applyFilters(filters);
      let publicHolidayFilters = this.attendanceService.applyFiltersPublicHolidays(filters);
      let leaveRequestFilters = this.attendanceService.leaveRequestFilters(filters);
      let __organizationData = this.attendanceService.findOrganization(userData.organizationId);
      let __publicHolidays =  this.attendanceService.findPublicHolidays(publicHolidayFilters);
      let __approvedLeaveRequest =  this.attendanceService.findApprovedLeaveRequest(leaveRequestFilters);
      let __userAttendance =  this.attendanceService.findAll(appliedFilters,{page: 1, perPage: 32}, sorting);
      const [publicHolidays, userAttendance, approvedLeaveRequest, organizationData] = await Promise.all([__publicHolidays, __userAttendance, __approvedLeaveRequest, __organizationData ]);

      if(!organizationData.WorkingHours){
        throw {
          message: "No Working Hours Defined for the Company. Please assign working hour and try again",
          statusCode: 400
        }
      }

      let attendanceData = this.attendanceService.prepareAttendance(userAttendance, publicHolidays, filters, organizationData.WorkingHours);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: {
        publicHolidays: publicHolidays,
        leaves: approvedLeaveRequest,
        attendanceData: attendanceData,
        workingHour: organizationData.WorkingHours
      },
    };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AttendanceResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('findUserAttendanceForPayroll')
  async findUserAttendanceForPayroll(
    @Query() filters: AttendanceFilters,
    @Query() sorting: AttendanceSortingDto,
    @Req() req: AuthenticatedRequest,
    ): Promise<ResponseSuccess | ResponseError> {
    try {

      let permissions =  await this.authorizationService.findUserPermissionsAgainstSlugs<[AttendancePermissionSet.READ_ALL]>(req.user,[AttendancePermissionSet.READ_ALL])
      if(!permissions.readAllAttendance){
        filters.userId = req.user.userId
      }

      if(!filters.fromDate || !filters.toDate || !filters.userId){
        throw {
          message: "fromDate, toDate or userId is missing", 
          statusCode: 400
        }
      }

      if(filters.fromDate > filters.toDate){
        throw {
          message: "fromDate cannot be greater than toDate",
          statusCode: 400
        }
      }

      let daysDifference =  Math.abs(getDifferenceInDays(filters.fromDate, filters.toDate));
      if(daysDifference > 45){
        throw {
          message: "Days difference cannot be greater than 45 days",
          statusCode: 400
        }
      }

      let userData = await this.attendanceService.validateUser(filters.userId);
      let appliedFilters = this.attendanceService.applyFilters(filters);
      let publicHolidayFilters = this.attendanceService.applyFiltersPublicHolidays(filters);
      let leaveRequestFilters = this.attendanceService.leaveRequestFilters(filters);
      let __publicHolidays = this.attendanceService.findPublicHolidays(publicHolidayFilters);
      let __organizationData = this.attendanceService.findOrganization(userData.organizationId);
      let __approvedLeaveRequest = this.attendanceService.findApprovedLeaveRequest(leaveRequestFilters);
      let __userAttendance = this.attendanceService.findAll(appliedFilters,{page: 1, perPage: 32}, sorting);
      const [publicHolidays, userAttendance, approvedLeaveRequest, organizationData] = await Promise.all([__publicHolidays, __userAttendance, __approvedLeaveRequest, __organizationData ]);

      if(!organizationData.WorkingHours){
        throw {
          message: "No Working Hours Defined for the Company of the User. Please assign working hour and try again",
          statusCode: 400
        }
      }

      let attendanceData = this.attendanceService.prepareAttendanceFromD1ToD2(userAttendance, publicHolidays, filters, organizationData.WorkingHours);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: {
        publicHolidays: publicHolidays,
        leaves: approvedLeaveRequest,
        attendanceData: attendanceData
      },
    };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.GENERATE_REPORT)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Post('generateReport')
  async generateReport(@Body() reportDto: GenerateAttendanceReport, @Res() res: any) {
    try {
      let data = await this.attendanceService.generateReport(reportDto);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${data.fileName}`);
      const fileStream = fs.createReadStream(data.filePath);
      fileStream.pipe(res);
  
      fileStream.on('end', () => {
        fs.unlinkSync(data.filePath);
      });
      return;
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForAttendance(params.id, req.user);
      let data = await this.attendanceService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateAttendanceDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.attendanceService.update(params.id, updateDto, req.user);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AttendancePermissionSet.DELETE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: AttendanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Delete(':id')
  async delete(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.attendanceService.remove(params.id);
      return { message: `${moduleName}  deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
