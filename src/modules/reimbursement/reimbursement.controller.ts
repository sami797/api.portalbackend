import { Controller, Get, Post,Request, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { ReimbursementService } from './reimbursement.service';
import { CreateReimbursementDto } from './dto/create-reimbursement.dto';
import { UpdateReimbursementDto } from './dto/update-reimbursement.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ReimbursementResponseObject, ReimbursementResponseArray, getDynamicUploadPath } from './dto/reimbursement.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ReimbursementPermissionSet, ReimbursementPermissionSetType } from './reimbursement.permissions';
import { ReimbursementFiltersDto } from './dto/reimbursement-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { ReimbursementHrAction } from './dto/reimbursement-hr-action.dto';
import { ReimbursementFinanceAction } from './dto/reimbursement-finance-action.dto';
import { ReimbursementAuthorizationService } from './reimbursement.authorization.service';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "reimbursement";

let receipts = [...Array(20)].map((item, i) => {
  return {
    name: "reimbursementReceipts["+i+"][file]",
    maxCount: 1
  }
})


@ApiTags("reimbursement")
@Controller('reimbursement')
export class ReimbursementController {
  constructor(private readonly reimbursementService: ReimbursementService, private readonly reimbursementAuthorizationService: ReimbursementAuthorizationService) { }
  
  @CheckPermissions(ReimbursementPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @UseInterceptors(FileFieldsInterceptor(receipts, multerOptionsProtected))
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() createDto: CreateReimbursementDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    let allFiles = []
    try {
      Object.entries(files).map((key,value) => {
        allFiles.push(key[1][0])
      })
      if(allFiles.length !== createDto.reimbursementReceipts.length){
        throw {
          message: "Recipt count does not equals receipt data. Please upload all receipts",
          statusCode: 400
        }
      }
      let data = await this.reimbursementService.create(createDto, req.user);
      await this.reimbursementService.handleFiles(data.id, createDto.reimbursementReceipts, files, req.user);
      uploadFile(allFiles);
      let recordData = await this.reimbursementService.findOne(data.id);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: recordData };
    } catch (err) {
      removeUploadedFiles(allFiles);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ReimbursementPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ReimbursementResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: ReimbursementFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.reimbursementAuthorizationService.findUserPermissionsAgainstSlugs<[ReimbursementPermissionSet.HR_APPROVAL, ReimbursementPermissionSet.FINANCE_APPROVAL]>(req.user,[ReimbursementPermissionSet.HR_APPROVAL, ReimbursementPermissionSet.FINANCE_APPROVAL])
      if(!permissions.reimbursementFinanceApproval && !permissions.reimbursementHRApproval){
          filters.userId = req.user.userId;
      }
      let appliedFilters = this.reimbursementService.applyFilters(filters, permissions);
      let dt = await this.reimbursementService.findAll(appliedFilters, pagination);
      let tCount = this.reimbursementService.countRecords(appliedFilters);
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


  @CheckPermissions(ReimbursementPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ReimbursementResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('own')
  async readOwnRequest(
    @Query() filters: ReimbursementFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.userId = req.user.userId
      let appliedFilters = this.reimbursementService.applyFilters(filters);
      let dt = await this.reimbursementService.findAll(appliedFilters, pagination);
      let tCount = this.reimbursementService.countRecords(appliedFilters);
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

  @CheckPermissions(ReimbursementPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.reimbursementAuthorizationService.findUserPermissionsAgainstSlugs<[ReimbursementPermissionSet.HR_APPROVAL, ReimbursementPermissionSet.FINANCE_APPROVAL]>(req.user,[ReimbursementPermissionSet.HR_APPROVAL, ReimbursementPermissionSet.FINANCE_APPROVAL])
      if(!permissions.reimbursementFinanceApproval && !permissions.reimbursementHRApproval){
        await this.reimbursementAuthorizationService.isAuthorizedForReimbursement(params.id, req.user);
      }
      let data = await this.reimbursementService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ReimbursementPermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw reimbursement` })
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('withdraw/:id')
  async withdraw(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.reimbursementAuthorizationService.isAuthorizedForReimbursement(params.id, req.user);
      let data = await this.reimbursementService.withdraw(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ReimbursementPermissionSet.HR_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw reimbursement` })
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('hrAction/:id')
  async hrAction(@Param() params: ParamsDto, 
  @Body() reimbursementHrAction: ReimbursementHrAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.reimbursementService.hrUpdate(params.id, reimbursementHrAction, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ReimbursementPermissionSet.FINANCE_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw reimbursement` })
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('financeAction/:id')
  async financeAction(@Param() params: ParamsDto, 
  @Body() reimbursementAction: ReimbursementFinanceAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.reimbursementService.financeUpdate(params.id, reimbursementAction, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ReimbursementPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ReimbursementResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('remove/:id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.reimbursementAuthorizationService.isAuthorizedForReimbursement(params.id, req.user);
      let data = await this.reimbursementService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
