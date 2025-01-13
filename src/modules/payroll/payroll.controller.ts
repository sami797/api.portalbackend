import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UploadedFiles, UseInterceptors, Req, Res } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { UpdatePayrollDto } from './dto/update-payroll.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { PayrollResponseObject, PayrollResponseArray } from './dto/payroll.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { PayrollPermissionSet } from './payroll.permissions';
import { PayrollFiltersDto } from './dto/payroll-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { PaidPayrollsDto } from './dto/paid-payroll.dto';
import { PayrollAuthorizationService } from './payroll.authorization.service';
import { GeneratePayrollReport } from './dto/generate-report.dto';
import * as fs from "fs";
const moduleName = "payroll";

@ApiTags("payroll")
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService, private readonly authorizationService: PayrollAuthorizationService) { }

  @CheckPermissions(PayrollPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PayrollResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: PayrollFiltersDto,
    @Query() pagination: Pagination,
    @Req() req: AuthenticatedRequest,
    ): Promise<ResponseSuccess | ResponseError> {
    try {

      let permissions =  await this.authorizationService.findUserPermissionsAgainstSlugs<[PayrollPermissionSet.READ_ALL]>(req.user,[PayrollPermissionSet.READ_ALL])
      if(!permissions.readAllPayroll){
        filters.userId = req.user.userId
      }

      let appliedFilters = this.payrollService.applyFilters(filters);
      let dt = this.payrollService.findAll(appliedFilters, pagination);
      let tCount = this.payrollService.countRecords(appliedFilters);
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

  @CheckPermissions(PayrollPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PayrollResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForPayroll(params.id, req.user);
      let data = await this.payrollService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PayrollResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('update/:id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdatePayrollDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.payrollService.update(params.id, updateDto, req.user);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PayrollResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markAsPaid')
  async markAsPaid(
  @Body() paidPayrollsDto: PaidPayrollsDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.payrollService.markAsPaid(paidPayrollsDto, req.user);
      return { message: `Payrolls has been marked as paid successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PayrollPermissionSet.UPDATE)
  @ApiOperation({ summary: `Recalculate ${moduleName} of a user` })
  @ApiResponse({ status: 200, type: PayrollResponseObject})
  @Patch('recalculate/:id')
  async recalculate(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.payrollService.recalculate(params.id);
      return { message: `Recalculating payroll in background`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @CheckPermissions(PayrollPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: PayrollResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('delete/:id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.payrollService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @CheckPermissions(PayrollPermissionSet.GENERATE_REPORT)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PayrollResponseObject, isArray: false, description: `Returns the excel file of the payroll report` })
  @Post('generateReport')
  async generateReport(@Body() reportDto: GeneratePayrollReport, @Res() res: any) {
    try {
      let data = await this.payrollService.generateReport(reportDto);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${data.fileName}`);
      const fileStream = fs.createReadStream(data.filePath);
      fileStream.pipe(res);
  
      fileStream.on('end', () => {
        // fs.unlinkSync(data.filePath);
      });
      return;
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
