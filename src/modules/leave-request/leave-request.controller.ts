
import { Controller, Get, Post,Request, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { LeaveRequestResponseObject, LeaveRequestResponseArray, getDynamicUploadPath } from './dto/leave-request.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { LeaveRequestPermissionSet, LeaveRequestPermissionSetType } from './leave-request.permissions';
import { LeaveRequestFiltersDto } from './dto/leave-request-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { LeaveRequestAdminAction } from './dto/leave-request-admin-action.dto';
import { LeaveRequestAuthorizationService } from './leave-request.authorization.service';
import { LeaveRequestInfoDto } from './dto/get-leave-request-info.dto';
import { UserPermissionSet } from '../user/user.permissions';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "leave-request";

@ApiTags("leave-request")
@Controller('leave-request')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService, private readonly leaveRequestAuthorizationService: LeaveRequestAuthorizationService) { }
  
  @CheckPermissions(LeaveRequestPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @UseInterceptors(FilesInterceptor("files[]", 10, multerOptionsProtected))
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() createDto: CreateLeaveRequestDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveRequestService.create(createDto, req.user);
      await this.leaveRequestService.handleFiles(data.id, files);
      uploadFile(files);
      let recordData = await this.leaveRequestService.findOne(data.id);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: recordData };
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveRequestPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: LeaveRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.leaveRequestAuthorizationService.findUserPermissionsAgainstSlugs<[LeaveRequestPermissionSet.HR_APPROVAL]>(req.user,[LeaveRequestPermissionSet.HR_APPROVAL])
      // if(!permissions.readAllLeaveRequest){
      //   filters.userId = req.user.userId
      // }
      let appliedFilters = this.leaveRequestService.applyFilters(filters, req.user, permissions);
      let dt = await this.leaveRequestService.findAll(appliedFilters, pagination);
      let tCount = this.leaveRequestService.countRecords(appliedFilters);
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
  @ApiResponse({ status: 200, type: LeaveRequestResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('own')
  async readOwnRequest(
    @Query() filters: LeaveRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.userId = req.user.userId
      let appliedFilters = this.leaveRequestService.applyFilters(filters, req.user);
      let dt = await this.leaveRequestService.findAll(appliedFilters, pagination);
      let tCount = this.leaveRequestService.countRecords(appliedFilters);
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

  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('getLeaveInfo/:id')
  async getLeaveInfo(@Param() params: LeaveRequestInfoDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveRequestService.getLeaveInfo(params, req.user);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, (err.statusCode)? err.statusCode: 404);
    }
  }

  @CheckPermissions(LeaveRequestPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.leaveRequestAuthorizationService.findUserPermissionsAgainstSlugs<[LeaveRequestPermissionSet.HR_APPROVAL, UserPermissionSet.MANAGE_ALL]>(req.user,[LeaveRequestPermissionSet.HR_APPROVAL, UserPermissionSet.MANAGE_ALL])
      if(!(permissions.leaveRequestHRApproval || permissions.manageAllUser)){
        await this.leaveRequestAuthorizationService.isAuthorizedForLeaveRequestToRead(params.id, req.user);
      }
      let data = await this.leaveRequestService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findLeavesReport')
  async findLeavesReport(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveRequestService.findLeavesReport(req.user.userId);
      return { message: `Leaves report fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(UserPermissionSet.MANAGE_ALL)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findLeavesReportOfUser/:id')
  async findLeavesReportOfUser(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveRequestService.findLeavesReport(params.id);
      return { message: `Leaves report fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveRequestPermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('withdraw/:id')
  async withdraw(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.leaveRequestAuthorizationService.isAuthorizedForLeaveRequest(params.id, req.user);
      let data = await this.leaveRequestService.withdraw(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveRequestPermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('submitRequest/:id')
  async submitRequest(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.leaveRequestAuthorizationService.isAuthorizedForLeaveRequest(params.id, req.user);
      let data = await this.leaveRequestService.submitRequest(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveRequestPermissionSet.HR_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `HR Action on cash advance request` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('hrAction/:id')
  async hrAction(@Param() params: ParamsDto, 
  @Body() LeaveRequestAdminAction: LeaveRequestAdminAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveRequestService.hrUpdate(params.id, LeaveRequestAdminAction, req.user);
      return { message: `Your action has been saved successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Update ${moduleName} `, description: `Action from finance department` })
  @ApiResponse({ status: 200, type: LeaveRequestResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('projectManagerAction/:id')
  async projectManagerAction(@Param() params: ParamsDto, 
  @Body() action: LeaveRequestAdminAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.leaveRequestAuthorizationService.isUserProjectManager(params.id, req.user);
      let data = await this.leaveRequestService.projectManagerAction(params.id, action, req.user);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
