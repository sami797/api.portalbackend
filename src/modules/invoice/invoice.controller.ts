import { Controller, Get, Post, Body, Patch,Request, Param, HttpException, Query, Req, Render, Delete, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { InvoiceResponseObject, InvoiceResponseArray, getDynamicUploadPath, FollowupResponseObject } from './dto/invoice.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { InvoicePermissionSet } from './invoice.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { InvoiceFiltersDto } from './dto/invoice-filters.dto';
import { InvoiceStatusDto } from './dto/invoice-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { InvoiceStatus, InvoiceType, SupervisionPaymentSchedule, ejsTemplateDefaults } from 'src/config/constants';
import { Public } from 'src/authentication/public-metadata';
import { addDaysToDate, convertDate, getEnumKeyByEnumValue, getTaxData } from 'src/helpers/common';
import { CheckInvoiceDuplicacyDto } from './dto/check-invoice-number-duplicacy.dto';
import { QuickUpdateInvoice } from './dto/quick-update.dto';
import { CreateInvoiceNoteDto } from './dto/create-invoice-note.dto';
import { CreateUniqueInvoiceNumberyDto } from './dto/create-unique-invoice-number.dto';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });

const moduleName = "invoice";

@ApiTags("invoice")
@Controller('invoice')
export class InvoiceController {
  private readonly logger = new Logger(InvoiceController.name);
  constructor(private readonly invoiceService: InvoiceService) { }
  
  @CheckPermissions(InvoicePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptionsProtected))
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateInvoiceDto,
  @Request() req: AuthenticatedRequest,
  @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if(createDto.type === InvoiceType.manual && !file){
        throw{
          message: "You must upload a file if you want to submit manual invoice to client",
          statusCode: 400
        }
      }

      if (file) {
        createDto.file = extractRelativePathFromFullPath(file.path);
      }
      let data = await this.invoiceService.create(createDto, req.user);
      if(createDto.type === InvoiceType.auto){
        data = await this.invoiceService.generateInvoicePdf(data.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await uploadFile(file);
      return { message: `Your request has been submitted successfully.`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 400);
    }
  }

  @CheckPermissions(InvoicePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: InvoiceResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query() filters: InvoiceFiltersDto,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.invoiceService.applyFilters(filters);
      let dt = this.invoiceService.findAll(pagination, filtersApplied);
      let tCount = this.invoiceService.countTotalRecord(filtersApplied);
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

  @CheckPermissions(InvoicePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.findOne(params.id );
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  // @Public()
  // @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  // @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  // @Get('generatePdf')
  // async generatePdf(@Request() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
  //   try {
  //     let data = await this.invoiceService.generateInvoicePdf();
  //     return { message: `PDF generated Successfully`, statusCode: 200, data: data }
  //   } catch (err) {
  //     throw new HttpException(err.message, err.statusCode);
  //   }
  // }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('templates/viewInvoicePdf/:id')
  @Render("pdf-templates/invoice.ejs")
  async viewInvoicePdf(@Request() req: AuthenticatedRequest, @Param() params: ParamsDto){
    try {
      let data = await this.invoiceService.viewInvoicePdf(params.id);
      return { message: `PDF generated Successfully`, statusCode: 200, data: data,
      clientData: data?.Client, 
      invoice: data,
      submissionBy: data?.Project?.SubmissionBy,
      convertDate,
      taxData: getTaxData(data?.InvoiceItems),
      addDaysToDate,
      getEnumKeyByEnumValue,
      SupervisionPaymentSchedule
    }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('templates/viewEmailInvoice/:id')
  @Render("email-templates/invoice")
  async viewInvoiceEmailTemplate(@Param() params: ParamsDto){
    try {
      let invoice = await this.invoiceService.findOne(params.id );
      if(!invoice){
        throw {
          message: "Invoice Not found",
          statusCode: 404
        }
      }
      return {  
        ...ejsTemplateDefaults,
        hideFooter: true,
        emailTitle: "invoice - "+invoice.invoiceNumber,
        clientData: invoice?.Client,
        project: invoice.Project,
        submissionBy: invoice?.Project?.SubmissionBy,
        invoice: invoice
    }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(InvoicePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', multerOptionsProtected))
  @Patch('updateOne/:id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateInvoiceDto,
  @Request() req: AuthenticatedRequest,
  @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      updateDto["modifiedDate"] = new Date();
      updateDto["modifiedById"] = req.user.userId

      if (file) {
        updateDto.file = extractRelativePathFromFullPath(file.path);
      }
      let data = await this.invoiceService.update(params.id, updateDto, req.user);
      if(updateDto.type === InvoiceType.auto){
        data = await this.invoiceService.generateInvoicePdf(data.id);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await uploadFile(file);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.SUBMIT_INVOICE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('submitInvoice/:id')
  async submitInvoice(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.submitInvoice(params.id, req.user);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.SUBMIT_INVOICE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markAsSent/:id')
  async markAsSent(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.submitInvoice(params.id, req.user);
      return { message: `Invoice has been marked as sent successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.UPDATE_STATUS)
  @ApiOperation({ summary: `Update ${moduleName} status` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('changeStatus/:id')
  async updateStatus(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest,
  @Body() InvoiceStatusDto: InvoiceStatusDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      InvoiceStatusDto["modifiedById"] = req.user.userId;
      InvoiceStatusDto["modifiedDate"] = new Date()
      let data = await this.invoiceService.updateStatus(params.id, InvoiceStatusDto, req.user);
      return { message: `${moduleName} status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @ApiOperation({ summary: `Check for Duplicacy of Invoice Number` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the lead removed` })
  @Get('checkForDuplicacy')
  async checkForDuplicacy(
  @Query() query: CheckInvoiceDuplicacyDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.checkForDuplicacy(query);
      return { message: `Data fetched successfully`, statusCode: 200, data: {
        isDuplicate: data
      } }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @ApiOperation({ summary: `Preapare a unique invoice number` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the lead removed` })
  @Get('prepareUniqueInvoiceNumber')
  async prepareUniqueInvoiceNumber(
    @Query() createUniqueInvoiceNumberyDto: CreateUniqueInvoiceNumberyDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.prepareUniqueInvoiceNumber(createUniqueInvoiceNumberyDto.projectId);
      return { message: `Data fetched successfully`, statusCode: 200, data: {
        invoiceNumber: data
      } }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(InvoicePermissionSet.DELETE)
  @ApiOperation({ summary: `Remove a Lead` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the lead removed` })
  @Delete('remove/:id')
  async removeInvoice(@Param() params: ParamsDto,
  @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.removeInvoice(params.id, req.user);
      return { message: `Lead deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.UPDATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: InvoiceResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Patch("quickUpdate/:id")
  async quickUpdate(@Param() params: ParamsDto, @Body() quickUpdateInvoice: QuickUpdateInvoice, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.quickUpdate(params.id, quickUpdateInvoice, req.user);
      let message =  "Invoice Updated Successfully";
      return { message: message, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode)? err.statusCode : 400);
    }
  }


  @CheckPermissions(InvoicePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: FollowupResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('notes/:id')
  async findNotes(
    @Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.findAllNotes(params.id);
      return { message: `${moduleName} notes  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.UPDATE)
  @ApiOperation({ summary: `Add a note` })
  @ApiResponse({ status: 200, type: FollowupResponseObject, isArray: false, description: `Returns the added note` })
  @Post('addNote/:id')
  async addNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() createNote: CreateInvoiceNoteDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.addNote(params.id, createNote, req.user);
      return { message: `Note added successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.DELETE_NOTE)
  @ApiOperation({ summary: `Remove a note` })
  @ApiResponse({ status: 200, type: FollowupResponseObject, isArray: false, description: `Returns the removed note` })
  @Delete('removeNote/:id')
  async removeNote(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.removeNote(params.id);
      return { message: `Note deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: FollowupResponseObject, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('getCounts')
  async findCounts(
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let allPromises = [];
      let responseData = {
        all: 0,
        active: 0,
        paid: 0,
        draft: 0, 
        canceled: 0,
        hasConcerns: 0
      }
      let filters : InvoiceFiltersDto = {}
      let allDataFilters = this.invoiceService.applyFilters(filters);

      filters = {__status : [InvoiceStatus.generated, InvoiceStatus.sent]}
      let activeDataFilters = this.invoiceService.applyFilters(filters);

      filters = {__status: [InvoiceStatus.paid]}
      let paidDataFilters = this.invoiceService.applyFilters(filters);

      filters = {__status: [InvoiceStatus.generated]}
      let draftDataFilters = this.invoiceService.applyFilters(filters);

      filters = {__status : [InvoiceStatus.generated, InvoiceStatus.sent], hasConcerns: true}
      let hasConcernsDataFilters = this.invoiceService.applyFilters(filters);

      filters = {__status : [InvoiceStatus.canceled]}
      let canceledDataFilters = this.invoiceService.applyFilters(filters);

      allPromises.push(this.invoiceService.countTotalRecord(allDataFilters).then(data => responseData.all = data).catch(err => {this.logger.error("Some error while counting all records")}))
      allPromises.push(this.invoiceService.countTotalRecord(activeDataFilters).then(data => responseData.active = data).catch(err => {this.logger.error("Some error while counting all active records")}))
      allPromises.push(this.invoiceService.countTotalRecord(paidDataFilters).then(data => responseData.paid = data).catch(err => {this.logger.error("Some error while counting all paid records")}))
      allPromises.push(this.invoiceService.countTotalRecord(hasConcernsDataFilters).then(data => responseData.hasConcerns = data).catch(err => {this.logger.error("Some error while counting all records having converns")}))
      allPromises.push(this.invoiceService.countTotalRecord(draftDataFilters).then(data => responseData.draft = data).catch(err => {this.logger.error("Some error while counting all draft records")}))
      allPromises.push(this.invoiceService.countTotalRecord(canceledDataFilters).then(data => responseData.canceled = data).catch(err => {this.logger.error("Some error while counting all canceled records")}))
      await Promise.all(allPromises);

      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: responseData,
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(InvoicePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: FollowupResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('markConcernAsResolved/:id')
  async markConcernAsResolved(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.invoiceService.markConcernAsResolved(params.id);
      return { message: `Concern has been marked as resolved successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
  
}
