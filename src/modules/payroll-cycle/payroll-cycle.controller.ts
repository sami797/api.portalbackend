import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UploadedFiles, UseInterceptors, Req } from '@nestjs/common';
import { PayrollCycleService } from './payroll-cycle.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { UpdatePayrollCycleDto } from './dto/update-payroll-cycle.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { PayrollCycleResponseObject, PayrollCycleResponseArray } from './dto/payroll-cycle.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { PayrollCyclePermissionSet } from './payroll-cycle.permissions';
const moduleName = "payroll-cycle";

@ApiTags("payroll-cycle")
@Controller('payroll-cycle')
export class PayrollCycleController {
  constructor(private readonly payrollCycleService: PayrollCycleService) { }
  
  @CheckPermissions(PayrollCyclePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PayrollCycleResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreatePayrollCycleDto): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.payrollCycleService.validateDates(createDto);
      let data = await this.payrollCycleService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollCyclePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PayrollCycleResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() pagination: Pagination
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let dt = this.payrollCycleService.findAll({}, pagination);
      let tCount = this.payrollCycleService.countRecords({});
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

  @CheckPermissions(PayrollCyclePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PayrollCycleResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Patch('process/:id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {

      let data = await this.payrollCycleService.findOne(params.id);
      if(!data){
        throw{
          message: "No Payroll Cycle record found",
          statusCode: 404
        }
      }

      if(data.processed){
        throw {
          message: "This cycle is already processed. You cannot re process the same",
          statusCode: 400
        }
      }

      if(data.processing){
        throw {
          message: "This cycle is under processing. Please wait till it is completed",
          statusCode: 400
        }
      }

      let today = new Date();
      today.setDate(today.getDate() + 1);
      if(data.toDate > today){
        throw {
          message: "Please wait until the payroll cycle is completed. The system has identified that the pay date for this cycle has not yet occurred.",
          statusCode: 400
        }
      }

      this.payrollCycleService.preparePayrollReportOfProvidedCycle(data);
      return { message: `Process started on background to calculate payroll for the given cycle`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollCyclePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PayrollCycleResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdatePayrollCycleDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.payrollCycleService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollCyclePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: PayrollCycleResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let dt = await this.payrollCycleService.findOne(params.id);

      if(dt.processed || dt.processing){
        throw {
          message: "You cannot delete a record which is already processed or processing",
          statusCode: 400
        }
      }

      let data = await this.payrollCycleService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}

