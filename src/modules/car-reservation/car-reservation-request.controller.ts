
import { Controller, Get, Post,Request, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { CreateCarReservationRequestDto } from './dto/create-car-reservation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CarReservationResponseObject, CarReservationResponseArray, getDynamicUploadPath } from './dto/car-reservation-request.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { CarReservationRequestPermissionSet, CarReservationRequestPermissionSetType } from './car-reservation-request.permissions';
import { CarReservationRequestFiltersDto } from './dto/car-reservation-request-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { CarReservationRequestAdminAction } from './dto/car-reservation-request-admin-action.dto';
import { CarReservationAuthorizationService } from './car-reservation-request.authorization.service';
import { CarReservationRequestService } from './car-reservation-request.service';
import { CheckCarAvailabilityDto } from './dto/check-car-availability.dto';
import { CarReservationRequestStatus } from 'src/config/constants';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "car-reservation-request";

@ApiTags("car-reservation-request")
@Controller('car-reservation-request')
export class CarReservationRequestController {
  constructor(private readonly carReservationRequestService: CarReservationRequestService, private readonly carReservationRequestAuthorizationService: CarReservationAuthorizationService) { }
  
  @CheckPermissions(CarReservationRequestPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @UseInterceptors(FilesInterceptor("files[]", 10, multerOptionsProtected))
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() createDto: CreateCarReservationRequestDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.carReservationRequestService.create(createDto, req.user);
      await this.carReservationRequestService.handleFiles(data.id, files);
      uploadFile(files);
      let recordData = await this.carReservationRequestService.findOne(data.id);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: recordData };
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CarReservationRequestPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CarReservationResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: CarReservationRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.carReservationRequestAuthorizationService.findUserPermissionsAgainstSlugs<[CarReservationRequestPermissionSet.HR_APPROVAL]>(req.user,[CarReservationRequestPermissionSet.HR_APPROVAL])
      if(!permissions.carReservationRequestHRApproval){
        filters.userId = req.user.userId
      }
      let appliedFilters = this.carReservationRequestService.applyFilters(filters, permissions);
      let dt = await this.carReservationRequestService.findAll(appliedFilters, pagination);
      let tCount = this.carReservationRequestService.countRecords(appliedFilters);
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
  @ApiResponse({ status: 200, type: CarReservationResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('own')
  async readOwnRequest(
    @Query() filters: CarReservationRequestFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.userId = req.user.userId;
      let appliedFilters = this.carReservationRequestService.applyFilters(filters);
      let dt = await this.carReservationRequestService.findAll(appliedFilters, pagination);
      let tCount = this.carReservationRequestService.countRecords(appliedFilters);
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

  @CheckPermissions(CarReservationRequestPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.carReservationRequestAuthorizationService.findUserPermissionsAgainstSlugs<[CarReservationRequestPermissionSet.HR_APPROVAL]>(req.user,[CarReservationRequestPermissionSet.HR_APPROVAL])
      if(!permissions.carReservationRequestHRApproval){
        await this.carReservationRequestAuthorizationService.isAuthorizedForCarReservation(params.id, req.user);
      }
      let data = await this.carReservationRequestService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CarReservationRequestPermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('withdraw/:id')
  async withdraw(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.carReservationRequestAuthorizationService.isAuthorizedForCarReservation(params.id, req.user);
      let data = await this.carReservationRequestService.withdraw(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CarReservationRequestPermissionSet.READ)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Withdraw cash advance request` })
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('submitRequest/:id')
  async submitRequest(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.carReservationRequestAuthorizationService.isAuthorizedForCarReservation(params.id, req.user);
      let data = await this.carReservationRequestService.submitRequest(params.id);
      return { message: `Your request has been withdrawn successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CarReservationRequestPermissionSet.HR_APPROVAL)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `HR Action on cash advance request` })
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('hrAction/:id')
  async hrAction(@Param() params: ParamsDto, 
  @Body() CarReservationRequestAdminAction: CarReservationRequestAdminAction,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if(CarReservationRequestAdminAction.status === CarReservationRequestStatus.approved){
        let requestData = await this.carReservationRequestService.findOne(params.id);
        let isAvailable = await this.carReservationRequestService.checkAvailability({fromDate: requestData.fromDate, toDate: requestData.toDate, companyCarId: CarReservationRequestAdminAction.companyCarId})
        if(!isAvailable){
          throw {
            message: "This car is no longer available in the requested date",
            statusCode: 400
          }
        }
      }

      let data = await this.carReservationRequestService.hrUpdate(params.id, CarReservationRequestAdminAction, req.user);
      return { message: `Your action has been saved successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Update ${moduleName} `, description: `HR Action on cash advance request` })
  @ApiResponse({ status: 200, type: CarReservationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('checkAvailability')
  async checkAvailability(
  @Body() checkCarAvailabilityDto: CheckCarAvailabilityDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.carReservationRequestService.checkAvailability(checkCarAvailabilityDto);
      return { message: `Car Availability fetched successfully`, statusCode: 200, data: {
        isAvailable: data
      } }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
