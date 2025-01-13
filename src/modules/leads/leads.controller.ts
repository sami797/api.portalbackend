import { Controller, Get, Post, Body, Patch, Request, Param, HttpException, Query, Req, Logger, Delete, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { LeadsResponseObject, LeadsResponseArray, getDynamicUploadPath } from './dto/leads.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { LeadsPermissionSet } from './leads.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { LeadsPaginationDto } from './dto/lead-pagination.dto';
import { LeadsSortingDto } from './dto/lead-sorting.dto';
import { LeadsFiltersDto } from './dto/lead-filters.dto';
import { LeadsStatusDto } from './dto/lead-status.dto';
import { SystemLogger } from '../system-logs/system-logger.service';
import { AssignLeadsDto } from './dto/assign-leads.dto';
import { CreateLeadNoteDto } from './dto/create-load-note.dto';
import { LeadsAuthorizationService } from './leads.authorization.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { UploadLeadDocuments } from './dto/upload-files.dto';
import { uploadFile } from 'src/helpers/file-management';
import { LeadsStatus } from 'src/config/constants';
import { sleep } from 'src/helpers/common';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'all_files', limit: 50000000 });
const moduleName = "leads";

@ApiTags("leads")
@Controller('leads')
export class LeadsController {
  private readonly logger = new Logger(LeadsController.name);
  constructor(private readonly leadsService: LeadsService,
    private authorizationService: LeadsAuthorizationService,
    private readonly systemLogger: SystemLogger) { }

  @CheckPermissions(LeadsPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload Leads Files` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post("uploadLeadsDocuments")
  async uploadPropertyDocuments(@Body() uploadDocuments: UploadLeadDocuments,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files && files.length > 0) {
        let data = await this.leadsService.handleDocuments(uploadDocuments, files, req.user);
        await uploadFile(files);
        await sleep(1500);
        return { message: `Documents uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }


  @CheckPermissions(LeadsPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createLeadDto: CreateLeadDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leadsService.create(createLeadDto);
      return { message: `Your request has been submitted successfully.`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @CheckPermissions(LeadsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: LeadsResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Query() pagination: LeadsPaginationDto,
    @Query() sorting: LeadsSortingDto,
    @Query() filters: LeadsFiltersDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[LeadsPermissionSet.READ_ALL]>(req.user, [LeadsPermissionSet.READ_ALL])
      let filtersApplied = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);
      if (filters.projectTypeTitle) {
        filtersApplied = {
          ...filtersApplied,
         Client: {  // Assuming ProjectType is the model name
            name: {
              contains: filters.projectTypeTitle,
              mode: 'insensitive'  // For case-insensitive search
            }
          }
        };
      }
      
      let dt = this.leadsService.findAll(pagination, sorting, filtersApplied);
      let tCount = this.leadsService.countTotalRecord(filtersApplied);
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


  @CheckPermissions(LeadsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: LeadsResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('getCounts')
  async findCounts(
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let allPromises = [];
      let responseData = {
        all: 0,
        active: 0,
        confirmed: 0,
        completed: 0, 
        unqualified: 0,
        hasConcerns: 0
      }
      let filters : LeadsFiltersDto = {}
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[LeadsPermissionSet.READ_ALL]>(req.user, [LeadsPermissionSet.READ_ALL])
      let allDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      filters = {__status : [LeadsStatus.new, LeadsStatus.in_progress]}
      let activeDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      filters = {__status: [LeadsStatus.confirmed]}
      let confirmedDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      filters = {__status: [LeadsStatus.canceled, LeadsStatus.invalid_request, LeadsStatus.unqualified, LeadsStatus.spam]}
      let unQualifiedDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      filters = {__status : [LeadsStatus.new, LeadsStatus.in_progress], hasConcerns: true}
      let hasConcernsDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      filters = {fetchCompleted: true}
      let completedDataFilters = this.leadsService.applyFilters(filters, req.user, permissions.readAllLeads);

      allPromises.push(this.leadsService.countTotalRecord(allDataFilters).then(data => responseData.all = data).catch(err => {this.logger.error("Some error while counting all records")}))
      allPromises.push(this.leadsService.countTotalRecord(activeDataFilters).then(data => responseData.active = data).catch(err => {this.logger.error("Some error while counting all active records")}))
      allPromises.push(this.leadsService.countTotalRecord(confirmedDataFilters).then(data => responseData.confirmed = data).catch(err => {this.logger.error("Some error while counting all confirmed records")}))
      allPromises.push(this.leadsService.countTotalRecord(unQualifiedDataFilters).then(data => responseData.unqualified = data).catch(err => {this.logger.error("Some error while counting all unqualified records")}))
      allPromises.push(this.leadsService.countTotalRecord(hasConcernsDataFilters).then(data => responseData.hasConcerns = data).catch(err => {this.logger.error("Some error while counting all records having converns")}))
      allPromises.push(this.leadsService.countTotalRecord(completedDataFilters).then(data => responseData.completed = data).catch(err => {this.logger.error("Some error while counting all completed records")}))
      await Promise.all(allPromises);

      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: responseData,
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.UPDATE_STATUS)
  @ApiOperation({ summary: `Update ${moduleName} status` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('changeStatus/:id')
  async updateStatus(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() leadsStatusDto: LeadsStatusDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      leadsStatusDto["modifiedById"] = req.user.userId;
      leadsStatusDto["modifiedDate"] = new Date()
      let data = await this.leadsService.updateStatus(params.id, leadsStatusDto);
      return { message: `${moduleName} status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

 

  @CheckPermissions(LeadsPermissionSet.ASSIGN_LEADS)
  @ApiOperation({ summary: `Assign Leads to a User` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Assign leads to a User` })
  @Patch('assignLead/:id')
  async assignLead(@Param() params: ParamsDto,
    @Body() assignLeadsDto: AssignLeadsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      let data = await this.leadsService.assignLeads(params.id, assignLeadsDto, req.user);
      this.systemLogger.logData({
        tableName: "Leads",
        field: 'id',
        value: params.id,
        actionType: 'ASSIGN_LEADS',
        valueType: "number",
        user: req.user.userId,
        data: assignLeadsDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Leads Assigned"
      })
      return { data: data, statusCode: 200, message: "Leads Assigned Successfully" }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Add a note to the lead` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the added note` })
  @Post('addNote/:id')
  async addNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() createLeadNoteDto: CreateLeadNoteDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      let data = await this.leadsService.addNote(params.id, createLeadNoteDto, req.user);
      return { message: `Note added successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.DELETE_NOTE)
  @ApiOperation({ summary: `Remove a note` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the removed note` })
  @Delete('removeNote/:id')
  async removeNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeadsNote(params.id, req.user);
      let data = await this.leadsService.removeNote(params.id);
      return { message: `Note deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Remove a note` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the removed note` })
  @Delete('removeDocument/:id')
  async removeDocument(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeadsDocument(params.id, req.user);
      let data = await this.leadsService.removeDocument(params.id);
      return { message: `Document deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('notes/:id')
  async findNotes(
    @Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      let data = await this.leadsService.findAllNotes(params.id);
      return { message: `${moduleName} notes  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `})
  @ApiResponse({ status: 200, type: LeadsResponseObject})
  @Patch('markConcernAsResolved/:id')
  async markConcernAsResolved(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeadsNote(params.id, req.user);
      let data = await this.leadsService.markConcernAsResolved(params.id);
      return { message: `Concern has been marked as resolved successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.DELETE)
  @ApiOperation({ summary: `Remove a Lead` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the lead removed` })
  @Delete('remove/:id')
  async removeEnquiry(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      let data = await this.leadsService.removeLead(params.id);
      return { message: `Lead deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      let data = await this.leadsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeadsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: LeadsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForLeads(params.id, req.user);
      updateLeadDto["modifiedDate"] = new Date();
      updateLeadDto["modifiedById"] = req.user.userId
      let data = await this.leadsService.update(params.id, updateLeadDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


}
