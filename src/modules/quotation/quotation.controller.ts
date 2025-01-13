import { Controller, Get, Post, Body, Patch,Request, Param, HttpException, Query, Req, Logger, Delete, UseInterceptors, UploadedFile, Render, HttpCode, HttpStatus, UseGuards, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { QuotationResponseObject, QuotationResponseArray, getDynamicUploadPath } from './dto/quotation.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { QuotationPermissionSet } from './quotation.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { QuotationFiltersDto } from './dto/quotation-filters.dto';
import { QuotationStatusDto } from './dto/quotation-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { QuotationType, SupervisionPaymentSchedule, ejsTemplateDefaults } from 'src/config/constants';
import { Public } from 'src/authentication/public-metadata';
import { addDaysToDate, convertDate, getEnumKeyByEnumValue, getTaxData } from 'src/helpers/common';
import { AutoCreateProjectDto } from './dto/auto-create-project-from-quote.dto';
import { QuotationAuthorizationService } from './quotation.authorization.service';
import { CheckQuoteDuplicacyDto } from './dto/check-quote-number-duplicacy.dto';
import { CreateUniqueQuoteNumberyDto } from './dto/create-unique-quote-number.dto';
import { QuickUpdateQuotation } from './dto/quick-update.dto';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';
import { AuthenticatedUser } from 'src/authentication/jwt-payload';

const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 50000000 });

const moduleName = "quotation";

@ApiTags("quotation")
@Controller('quotation')
export class QuotationController {
  constructor(private readonly quotationService: QuotationService,
    private authorizationService: QuotationAuthorizationService,
    ) { }
 
    @Post('/draft')
    async autoSaveDraft(
      @Body() createDto: CreateQuotationDto,
      @Request() req: AuthenticatedRequest,
    ): Promise<ResponseSuccess | ResponseError> {
      console.log('Received request to save draft with data:', createDto);
      try {
        // Call the service to save or update the draft
        const data = await this.quotationService.saveAsDraft(createDto, req.user);
        console.log('Draft saved successfully:', data);
        return { message: 'Draft saved successfully', statusCode: 200, data: data };
      } catch (error) {
        console.error('Error in autoSaveDraft:', error);
        throw new InternalServerErrorException('Error saving draft', error.message);
      }
    }
    
    
  
  @CheckPermissions(QuotationPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptionsProtected))
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateQuotationDto,
  @Request() req: AuthenticatedRequest,
  @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      if(!(createDto.clientId || createDto.leadId)){
        throw {
          message: "Please provide either Lead ID or Client Data",
          statusCode: 400
        }
      }

      if(createDto.type === QuotationType.manual && !file){
        throw{
          message: "You must upload a file if you want to submit manual quotation to client",
          statusCode: 400
        }
      }

      if (file) {
        createDto.file = extractRelativePathFromFullPath(file.path);
      }
      let data = await this.quotationService.create(createDto, req.user);
      if(createDto.type === QuotationType.auto){
        data = await this.quotationService.generateQuotationPdf(data.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await uploadFile(file);
      return { message: `Your request has been submitted successfully.`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @CheckPermissions(QuotationPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: QuotationResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query() filters: QuotationFiltersDto,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions = await this.authorizationService.findUserPermissionsAgainstSlugs<[QuotationPermissionSet.READ_ALL]>(req.user, [QuotationPermissionSet.READ_ALL])
      let filtersApplied = this.quotationService.applyFilters(filters, req.user, permissions.readAllQuotation);
      let dt = this.quotationService.findAll(pagination, filtersApplied);
      let tCount = this.quotationService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt,tCount]);
      let pageCount =  Math.floor(totalCount/ pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1 );
      return { message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(QuotationPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.findOne(params.id );
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('templates/viewEmailQuotation/:id')
  @Render('email-templates/quotation')
  async viewEmailQuotation(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest) {
    try {
      let quotation = await this.quotationService.findOne(params.id );
      if(!quotation){
        throw {
          message: "Quotation Not found",
          statusCode: 404
        }
      }
      return {  
        ...ejsTemplateDefaults,
        hideFooter: true,
        emailTitle: "Quotation - "+quotation.quoteNumber,
        clientData: quotation.Lead?.Client,
        lead: quotation.Lead,
        submissionBy: quotation.Lead?.SubmissionBy,
        quotation: quotation
    }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('templates/viewNotificationTemplete/:id')
  @Render('email-templates/quotation-approved-notification')
  async viewNotificationTemplete(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest) {
    try {
      let quotation = await this.quotationService.findOne(params.id );
      if(!quotation){
        throw {
          message: "Quotation Not found",
          statusCode: 404
        }
      }
      return {  
        ...ejsTemplateDefaults,
        hideFooter: false,
        emailTitle: "Quotation - "+quotation.quoteNumber,
        clientData: quotation.Lead?.Client,
        lead: quotation.Lead,
        submissionBy: quotation.Lead?.SubmissionBy,
    }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('templates/viewQuotationPdf/:id')
  @Render("pdf-templates/quotation.ejs")
  async viewQuotationPdf(@Request() req: AuthenticatedRequest, @Param() params: ParamsDto){
    try {
      let data = await this.quotationService.viewQuotationPdf(params.id);
      return { message: `PDF generated Successfully`, statusCode: 200, data: data,
      clientData: data.Lead.Client, 
      projectType: data.Lead?.ProjectType,
      quotation: data,
      submissionBy: data.Lead?.SubmissionBy,
      taxData: getTaxData(data.QuotationMilestone),
      convertDate,
      addDaysToDate,
      getEnumKeyByEnumValue,
      SupervisionPaymentSchedule
    }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @ApiConsumes('multipart/form-data')
  @Patch('updateOne/:id')
  async update(@Param() params: ParamsDto, 
  @Body() updateQuotationDto: UpdateQuotationDto,
  @Request() req: AuthenticatedRequest,
  @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      updateQuotationDto["modifiedDate"] = new Date();
      updateQuotationDto["modifiedById"] = req.user.userId

      if (file) {
        updateQuotationDto.file = extractRelativePathFromFullPath(file.path);
      }

      let data = await this.quotationService.update(params.id, updateQuotationDto, req.user);
      if(updateQuotationDto.type === QuotationType.auto){
        data = await this.quotationService.generateQuotationPdf(data.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await uploadFile(file);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.COMPLETE_MILESTONE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('completeMilestone/:id')
  async completeMilestone(@Param() params: ParamsDto, 
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.completeMilestone(params.id, req.user);
      return { message: `Milestone  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.SUBMIT_QUOTATION)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('submitQuotation/:id')
  async submitQuotation(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.submitQuotation(params.id, req.user);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.UPDATE_STATUS)
  @ApiOperation({ summary: `Update ${moduleName} status` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('changeStatus/:id')
  async updateStatus(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest,
  @Body() quotationStatusDto: QuotationStatusDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      quotationStatusDto["modifiedById"] = req.user.userId;
      quotationStatusDto["modifiedDate"] = new Date()
      let data = await this.quotationService.updateStatus(params.id, quotationStatusDto);
      return { message: `${moduleName} status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.SUBMIT_QUOTATION)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markAsSent/:id')
  async markAsSent(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.markAsSent(params.id, req.user);
      return { message: `Quotion has been marked as sent successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.DELETE)
  @ApiOperation({ summary: `Remove a Lead` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the lead removed` })
  @Delete('remove/:id')
  async removeEnquiry(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.removeQuotation(params.id, req.user);
      return { message: `Quotation deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Check for Duplicacy of Quote Number` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the lead removed` })
  @Get('checkForDuplicacy')
  async checkForDuplicacy(
  @Query() query: CheckQuoteDuplicacyDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.checkForDuplicacy(query);
      return { message: `Data fetched successfully`, statusCode: 200, data: {
        isDuplicate: data
      } }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @ApiOperation({ summary: `Preapare a unique quote number` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the lead removed` })
  @Get('prepareUniqueQuoteNumber')
  async prepareUniqueQuoteNumber(
    @Query() query: CreateUniqueQuoteNumberyDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.prepareUniqueQuoteNumber(query.leadId, query.revisionId);
      // if(query.revisionId){
      //   let dt = await this.quotationService.findOne(query.revisionId);
      //   data = data + "-" + dt.revisionCount + 1;
      // }
      return { message: `Data fetched successfully`, statusCode: 200, data: {
        quoteNumber: data
      } }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.READ)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post("autoCreateProjectFromApprovedQuotation")
  async autoCreate(@Body() createDto: AutoCreateProjectDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let recordData = await this.quotationService.findOne(createDto.quoteId);
      let data = await this.quotationService.autoCreateProjectFromApprovedQuotation(createDto, req.user);
      let message =  "Quotation has been marked as approved successfully";
      if(recordData.projectId){
        message += `. Quotation Reference ${recordData.quoteNumber} has been attatched to the existing project`;
      }else{
        message += ` and a new project has been created.  A notification has been sent to finance for the advance payment collection`
      }
      return { message: message, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode)? err.statusCode : 400);
    }
  }

  @CheckPermissions(QuotationPermissionSet.UPDATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: QuotationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Patch("quickUpdate/:id")
  async quickUpdate(@Param() params: ParamsDto, @Body() quickUpdateQuotation: QuickUpdateQuotation, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.quotationService.quickUpdate(params.id, quickUpdateQuotation, req.user);
      let message =  "Quotation Updated Successfully";
      return { message: message, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode)? err.statusCode : 400);
    }
  }
  
}
