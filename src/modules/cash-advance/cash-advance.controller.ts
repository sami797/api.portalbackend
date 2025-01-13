import { Controller, Get, Post,Request, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { CashAdvanceService } from './cash-advance.service';
import { CreateCashAdvanceDto } from './dto/create-cash-advance.dto';
import { UpdateCashAdvanceDto } from './dto/update-cash-advance.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CashAdvanceResponseObject, CashAdvanceResponseArray, getDynamicUploadPath } from './dto/cash-advance.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { CashAdvancePermissionSet, CashAdvancePermissionSetType } from './cash-advance.permissions';
import { CashAdvanceRequestFiltersDto } from './dto/cash-advance-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { CashAdvanceHrAction } from './dto/cash-advance-hr-action.dto';
import { CashAdvanceFinanceAction } from './dto/cash-advance-finance-action.dto';
import { CashAdvanceAuthorizationService } from './cash-advance.authorization.service';
import { InstallmentPaidDto } from './dto/installment-paid.dto';
import { cashAdvanceManagerAction } from './dto/cash-advance-manager-action.dto';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "cash-advance";

@ApiTags("cash-advance")
@Controller('cash-advance')
export class CashAdvanceController {
  constructor(private readonly cashAdvanceService: CashAdvanceService, private readonly cashAdvanceAuthorizationService: CashAdvanceAuthorizationService) { }
  
  @CheckPermissions(CashAdvancePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @UseInterceptors(FilesInterceptor("files[]", 10, multerOptionsProtected))
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() createDto: CreateCashAdvanceDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.cashAdvanceService.create(createDto, req.user);
      await this.cashAdvanceService.handleFiles(data.id, files);
      uploadFile(files);
      let recordData = await this.cashAdvanceService.findOne(data.id);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: recordData };
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CashAdvancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: CashAdvanceRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.cashAdvanceAuthorizationService.findUserPermissionsAgainstSlugs<[CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL]>(req.user,[CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL])
      if(!permissions.cashAdvanceFinanceApproval && !permissions.cashAdvanceHRApproval){
         filters.userId = req.user.userId;
      }
      let appliedFilters = this.cashAdvanceService.applyFilters(filters, permissions);
      let dt = await this.cashAdvanceService.findAll(appliedFilters, pagination);
      let tCount = this.cashAdvanceService.countRecords(appliedFilters);
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

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('own')
  async readOwnRequest(
    @Query() filters: CashAdvanceRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.userId = req.user.userId;
      let appliedFilters = this.cashAdvanceService.applyFilters(filters);
      let dt = await this.cashAdvanceService.findAll(appliedFilters, pagination);
      let tCount = this.cashAdvanceService.countRecords(appliedFilters);
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

  @CheckPermissions(CashAdvancePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.cashAdvanceAuthorizationService.findUserPermissionsAgainstSlugs<[CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL]>(req.user,[CashAdvancePermissionSet.HR_APPROVAL, CashAdvancePermissionSet.FINANCE_APPROVAL])
      if(!permissions.cashAdvanceFinanceApproval && !permissions.cashAdvanceHRApproval){
        await this.cashAdvanceAuthorizationService.isAuthorizedForCashAdvance(params.id, req.user);
      }
      let data = await this.cashAdvanceService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CashAdvancePermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('withdraw/:id')
  async withdraw(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.cashAdvanceAuthorizationService.isAuthorizedForCashAdvance(params.id, req.user);
      let data = await this.cashAdvanceService.withdraw(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CashAdvancePermissionSet.FINANCE_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markAsPaid')
  async markAsPaid(@Body() installmentPaidDto: InstallmentPaidDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.cashAdvanceAuthorizationService.isAuthorizedForCashAdvance(installmentPaidDto.cashAdvanceId, req.user);
      let data = await this.cashAdvanceService.markAsPaid(installmentPaidDto);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, (err.statusCode)? err.statusCode : 404);
    }
  }

  @CheckPermissions(CashAdvancePermissionSet.HR_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `HR Action on cash advance request` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('hrAction/:id')
  async hrAction(@Param() params: ParamsDto, 
  @Body() CashAdvanceHrAction: CashAdvanceHrAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.cashAdvanceService.hrUpdate(params.id, CashAdvanceHrAction, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
  @CheckPermissions(CashAdvancePermissionSet.MANAGER_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `MANAGER Action on cash advance request` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('managerAction/:id')
  async managerAction(@Param() params: ParamsDto, 
  @Body() CashAdvanceManagerAction: cashAdvanceManagerAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.cashAdvanceService.managerUpdate(params.id, CashAdvanceManagerAction, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
  @CheckPermissions(CashAdvancePermissionSet.FINANCE_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Action from finance department` })
  @ApiResponse({ status: 200, type: CashAdvanceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('financeAction/:id')
  async financeAction(@Param() params: ParamsDto, 
  @Body() action: CashAdvanceFinanceAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.cashAdvanceService.financeUpdate(params.id, action, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
