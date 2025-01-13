
import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req, Query } from '@nestjs/common';
import { SmsService } from './sms.service';
import { CreateSmDto } from './dto/create-sm.dto';
import { UpdateSmDto } from './dto/update-sm.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { SMSResponseObject, SMSResponseArray } from './dto/sms.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SMSPermissionSet } from './sms.permissions';
import { TestSMSDto } from './dto/test-sms.dto';
import { Public } from 'src/authentication/public-metadata';
import { SMSLogsFiltersDto } from './dto/sms-logs-filters.dto';
import { SMSLogsPaginationDto } from './dto/sms-logs-pagination.dto';
import { SMSLogsSortingDto } from './dto/sms-logs-sorting.dto';
const moduleName = "SMS Configuration";

@ApiTags("SMS")
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) { }
  
  @CheckPermissions(SMSPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SMSResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createSmDto: CreateSmDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.create(createSmDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SMSPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SMSResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(SMSPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SMSResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateSmDto: UpdateSmDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.update(params.id, updateSmDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SMSPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SMSResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SMSPermissionSet.MAKE_DEFAULT)
  @ApiOperation({summary: "Make default SMS Gateway"})
  @Patch('makeDefaultSMSGateway/:id')
  async makeDefaultSMSGateway(@Param() params: ParamsDto ) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.makeDefault(params.id);
      return { message: `${moduleName} updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SMSPermissionSet.READ_LOGS)
  @ApiOperation({summary: "Finds SMS Sent history"})
  @Get('readSmsSentLogs')
  async readSmsSentLogs(
    @Query() filters: SMSLogsFiltersDto,
    @Query() pagination: SMSLogsPaginationDto,
    @Query() sorting: SMSLogsSortingDto,
    ) : Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.smsService.applyFilters(filters);
      let dt = this.smsService.findSmsLogs(pagination, sorting, filtersApplied);
      let tCount = this.smsService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt,tCount]);
      let pageCount =  Math.floor(totalCount/ pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1 );
      return { message: `${moduleName} updated successfully`, statusCode: 200, data: data,
      meta: {
        page: pagination.page, 
        perPage: pagination.perPage,
        total: totalCount, 
        pageCount: pageCount
      }
    }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SMSPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SMSResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('testSMS')
  async testSMS(@Body() testSMSDto: TestSMSDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.sendSms({ phone:testSMSDto.phone, phoneCode: testSMSDto.phoneCode, message: testSMSDto.message, smsType: testSMSDto.smsType});
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @Post('countrySms-response')
  async countrySmsResponse(@Req() req: any){
    let requestData = req.body;
    return {message: "Response received successfully", statusCode: 200, data: requestData}
  }

  @CheckPermissions(SMSPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SMSResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.smsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
