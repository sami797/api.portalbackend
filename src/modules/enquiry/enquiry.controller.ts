import { Controller, Get, Post, Body, Patch, Request, Param, HttpException, Query, Req, Logger, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { EnquiryService } from './enquiry.service';
import { CreateEnquiryDto } from './dto/create-enquiry.dto';
import { UpdateEnquiryDto } from './dto/update-enquiry.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { EnquiryResponseObject, EnquiryResponseArray, getDynamicUploadPath } from './dto/enquiry.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { EnquiryPermissionSet } from './enquiry.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { EnquiryFiltersDto } from './dto/enquiry-filters.dto';
import { Public } from 'src/authentication/public-metadata';
import { EnquiryStatusDto } from './dto/enquiry-status.dto';
import { Prisma } from '@prisma/client';
import { SystemLogger } from '../system-logs/system-logger.service';
import { findClientIpAddress } from 'src/helpers/helpers';
import { CreateEnquiryNoteDto } from './dto/create-enquiry-note.dto';
import { AssignEnquiryDto } from './dto/assign-enquiry.dto';
import { EnquiryAuthorizationService } from './enquiry.authorization.service';
import { AutoCreateLeadFromEnquiryDto } from './dto/auto-create-lead-from-enquiry.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { UploadEnquiryDocuments } from './dto/upload-files.dto';
import { uploadFile } from 'src/helpers/file-management';
import { EnquiryStatus } from 'src/config/constants';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'all_files', limit: 10000000 });
const moduleName = "enquiry";

@ApiTags("enquiry")
@Controller('enquiry')
export class EnquiryController {
  private readonly logger = new Logger(EnquiryController.name);
  constructor(private readonly enquiryService: EnquiryService,
    private authorizationService: EnquiryAuthorizationService,
    private readonly systemLogger: SystemLogger) { }



  @CheckPermissions(EnquiryPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload Enquiry Files` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post("uploadEnquiryDocuments")
  async uploadPropertyDocuments(@Body() enquiryDocuments: UploadEnquiryDocuments,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files && files.length > 0) {
        let data = await this.enquiryService.handleDocuments(enquiryDocuments, files, req.user);
        await uploadFile(files);
        return { message: `Documents uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }


  @CheckPermissions(EnquiryPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createLeadDto: CreateEnquiryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      if (!createLeadDto.email && !createLeadDto.phone) {
        throw { message: "Either phone or email must be provided", statusCode: 400 }
      }

      createLeadDto['addedById'] = req.user.userId;
      let data = await this.enquiryService.create(createLeadDto);
      return { message: `Your request has been submitted successfully.`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @Public()
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('create')
  async createEnquiry(@Body() createLeadDto: CreateEnquiryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      if (!createLeadDto.email && !createLeadDto.phone) {
        throw { message: "Either phone or email must be provided", statusCode: 400 }
      }

      let hasRequestedAlready = await this.enquiryService.checkIfAlreadyRequested(createLeadDto);
      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);
      let requestType = await this.enquiryService.isFalseRequest(clientIPAddress, userAgent);
      createLeadDto["userAgent"] = userAgent;
      createLeadDto["userIP"] = clientIPAddress;

      if (requestType.canActivate !== true) {
        throw {
          statusCode: 400,
          message: requestType.message,
          data: {
            waitTime: requestType.waitTime
          }
        }
      }

      if (hasRequestedAlready) {
        let logger = new Logger(EnquiryController.name);
        logger.error("From: " + this.constructor.name + " \n Error message : User has already submitted a request. \n User Request Data: " + JSON.stringify(createLeadDto));
        return {
          message: "You have already made a request. Our representitive will be in touch with you within 24 hours. Thank You!",
          statusCode: 200,
          data: {
            name: hasRequestedAlready.name,
            email: hasRequestedAlready.email,
            phone: hasRequestedAlready.phone,
            phoneCode: hasRequestedAlready.phoneCode
          }
        }
      }
      let data = await this.enquiryService.create(createLeadDto);
      return { message: `Your request has been submitted successfully.`, statusCode: 200, data: {} };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Auto creates lead using the enquiry data` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('autoCreateLeadFromEnquiry')
  async autoCreateUsingEnquiry(@Body() createLeadDto: AutoCreateLeadFromEnquiryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(createLeadDto.enquiryId, req.user);
      let data = await this.enquiryService.autoCreateLeadUsingEnquiry(createLeadDto, req.user);
      return { message: `Lead has been created using the enquiry data successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: EnquiryResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query() filters: EnquiryFiltersDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[EnquiryPermissionSet.READ_ALL]>(req.user, [EnquiryPermissionSet.READ_ALL])
      let filtersApplied = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);
      let dt = this.enquiryService.findAll(pagination, filtersApplied);
      let tCount = this.enquiryService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: EnquiryResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('getCounts')
  async findCounts(
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let allPromises = [];
      let responseData = {
        all: 0,
        active: 0,
        qualified: 0,
        unqualified: 0, 
        hasConcerns: 0,
        spam: 0
      }
      let filters : EnquiryFiltersDto = {}
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[EnquiryPermissionSet.READ_ALL]>(req.user, [EnquiryPermissionSet.READ_ALL])
      let allDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      filters = {status: EnquiryStatus.New}
      let activeDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      filters = {status: EnquiryStatus.Qualified}
      let qualifiedDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      filters = {status: EnquiryStatus.Unqualified}
      let unQualifiedDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      filters = {status: EnquiryStatus.New, hasConcerns: true}
      let hasConcernsDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      filters = {status: EnquiryStatus.Spam}
      let spamDataFilters = this.enquiryService.applyFilters(filters, req.user, permissions.readAllEnquiry);

      allPromises.push(this.enquiryService.countTotalRecord(allDataFilters).then(data => responseData.all = data).catch(err => {this.logger.error("Some error while counting all records")}))
      allPromises.push(this.enquiryService.countTotalRecord(activeDataFilters).then(data => responseData.active = data).catch(err => {this.logger.error("Some error while counting all active records")}))
      allPromises.push(this.enquiryService.countTotalRecord(qualifiedDataFilters).then(data => responseData.qualified = data).catch(err => {this.logger.error("Some error while counting all qualified records")}))
      allPromises.push(this.enquiryService.countTotalRecord(unQualifiedDataFilters).then(data => responseData.unqualified = data).catch(err => {this.logger.error("Some error while counting all unqualified records")}))
      allPromises.push(this.enquiryService.countTotalRecord(hasConcernsDataFilters).then(data => responseData.hasConcerns = data).catch(err => {this.logger.error("Some error while counting all records having converns")}))
      allPromises.push(this.enquiryService.countTotalRecord(spamDataFilters).then(data => responseData.spam = data).catch(err => {this.logger.error("Some error while counting all spam records")}))
      await Promise.all(allPromises);

      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: responseData,
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('find/:id')
  async findOne(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findDuplicateClient/:id')
  async findDuplicateClient(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.findDuplicateClient(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('update/:id')
  async update(@Param() params: ParamsDto,
    @Body() updateEnquiryDto: UpdateEnquiryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.update(params.id, updateEnquiryDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(EnquiryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markConcernAsResolved/:id')
  async markConcernAsResolved(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiryNote(params.id, req.user);
      let data = await this.enquiryService.markConcernAsResolved(params.id);
      return { message: `Concern has been marked as resolved successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.UPDATE_STATUS)
  @ApiOperation({ summary: `Update ${moduleName} status` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('changeStatus/:id')
  async updateStatus(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() EnquiryStatusDto: EnquiryStatusDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      EnquiryStatusDto["modifiedById"] = req.user.userId;
      EnquiryStatusDto["modifiedDate"] = new Date()
      let data = await this.enquiryService.updateStatus(params.id, EnquiryStatusDto);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(EnquiryPermissionSet.READ_LOGS)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('logs/:id')
  async findLogs(
    @Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Query() pagination: Pagination,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.findOne(params.id);
      let filters: Prisma.EnquiryWhereInput = {
        OR: [
          {
            email: data.email,
          },
          {
            phone: data.phone
          }
        ],
        NOT: {
          id: data.id
        }
      }
      let dt = await this.enquiryService.findAll(pagination, filters);
      let tCount = this.enquiryService.countTotalRecord(filters);
      const [logs, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName}  fetched Successfully`, statusCode: 200, data: logs,
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

  @CheckPermissions(EnquiryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('notes/:id')
  async findNotes(
    @Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.findAllNotes(params.id);
      return { message: `${moduleName} notes  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Add a note` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the added note` })
  @Post('addNote/:id')
  async addNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() createNote: CreateEnquiryNoteDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.addNote(params.id, createNote, req.user);
      return { message: `Note added successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.DELETE_NOTE)
  @ApiOperation({ summary: `Remove a note` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the removed note` })
  @Delete('removeNote/:id')
  async removeNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiryNote(params.id, req.user);
      let data = await this.enquiryService.removeNote(params.id);
      return { message: `Note deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Remove a note` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the removed note` })
  @Delete('removeDocument/:id')
  async removeDocument(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiryDocument(params.id, req.user);
      let data = await this.enquiryService.removeDocument(params.id);
      return { message: `Document deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(EnquiryPermissionSet.ASSIGN_ENQUIRY)
  @ApiOperation({ summary: `Assign Leads to a User` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Assign leads to a User` })
  @Patch('assignEnquiry/:id')
  async assignEnquiry(@Param() params: ParamsDto,
    @Body() assignEnquiryDto: AssignEnquiryDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.assignEnquiry(params.id, assignEnquiryDto, req.user);
      this.systemLogger.logData({
        tableName: "Enquiry",
        field: 'id',
        value: params.id,
        actionType: 'ASSIGN_ENQUIRY',
        valueType: "number",
        user: req.user.userId,
        data: assignEnquiryDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Enquiry Assigned"
      })
      return { data: data, statusCode: 200, message: "Enquiry Assigned Successfully" }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(EnquiryPermissionSet.DELETE)
  @ApiOperation({ summary: `Remove a enquiry` })
  @ApiResponse({ status: 200, type: EnquiryResponseObject, isArray: false, description: `Returns the enquiry removed` })
  @Delete('remove/:id')
  async removeEnquiry(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForEnquiry(params.id, req.user);
      let data = await this.enquiryService.removeEnquiry(params.id);
      return { message: `Enquiry deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

}
