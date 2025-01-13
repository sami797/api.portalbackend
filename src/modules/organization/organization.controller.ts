import { Controller, Get, Post, Body, Patch,Request, Param, Delete, HttpException, UseInterceptors, UploadedFile, Query, Req, UploadedFiles } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindOrgByUUID, ParamsDto } from './dto/params.dto';
import { organizationFileUploadPath, OrganizationResponseObject, OrganizationResponseArray, getDynamicUploadPath } from './dto/organization.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { OrganizationPermissionSet } from './organization.permissions';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { OrganizationPaginationDto } from './dto/organization-pagination.dto';
import { OrganizationSortingDto } from './dto/organization-sorting.dto';
import { OrganizationFiltersDto } from './dto/organization-filters.dto';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { OrganizationStatus, SUPER_ADMIN } from 'src/config/constants';
import { Public } from 'src/authentication/public-metadata';
import { MailService } from 'src/mail/mail.service';
import { SuspendOrganizationDto } from './dto/suspend-organization.dto';
import { OrganizationMetaDataDto } from './dto/organization-meta.dto';
const multerOptions = getMulterOptions({ destination: getDynamicUploadPath('public') });
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "organization";

@ApiTags("organization")
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService, 
    private authorizationService: AuthorizationService, 
    private mailService: MailService
    ) { }

  @CheckPermissions(OrganizationPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'digitalStamp', maxCount: 1 },
  ], multerOptions))
  @Post()
  async create(@Body() createOrganizationDto: CreateOrganizationDto,
  @UploadedFiles() files: { logo?: Express.Multer.File[], digitalStamp?: Express.Multer.File[] },
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files.logo && files.logo.length > 0) {
        createOrganizationDto.logo = extractRelativePathFromFullPath(files.logo[0].path);
        uploadFile(files.logo);
      }
      if (files.digitalStamp && files.digitalStamp.length > 0) {
        createOrganizationDto.digitalStamp = extractRelativePathFromFullPath(files.digitalStamp[0].path);
        uploadFile(files.digitalStamp);
      }
      let data = await this.organizationService.create(createOrganizationDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(files?.logo);
      removeUploadedFiles(files?.digitalStamp);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(OrganizationPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: OrganizationResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Query() pagination: OrganizationPaginationDto,
    @Query() sorting: OrganizationSortingDto,
    @Query() filters: OrganizationFiltersDto,
    @Query() fetchMeta : OrganizationMetaDataDto,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.organizationService.applyFilters(filters);
      let dt = this.organizationService.findAll(pagination, sorting, filtersApplied, fetchMeta);
      let tCount = this.organizationService.countTotalRecord(filtersApplied);
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

  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: OrganizationResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('find-published')
  async findAllPublished(
    @Query() pagination: OrganizationPaginationDto,
    @Query() sorting: OrganizationSortingDto,
    @Query() filters: OrganizationFiltersDto,
    @Req() req: AuthenticatedRequest
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.isPublished = true;
      filters["isDeleted"] = false;
      let filtersApplied = this.organizationService.applyFilters(filters);
      let dt = this.organizationService.findAllPublished(pagination, sorting, filtersApplied);
      let tCount = this.organizationService.countTotalRecord(filtersApplied);
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

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('find-by-uuid/:uuid')
  async findOneByUUID(@Param() params: FindOrgByUUID): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.organizationService.findOneByUUID(params.uuid);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(OrganizationPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'logo', maxCount: 1 },
    { name: 'digitalStamp', maxCount: 1 },
  ], multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateOrganizationDto: UpdateOrganizationDto,
  @UploadedFiles() files: { logo?: Express.Multer.File[], digitalStamp?: Express.Multer.File[] },
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files.logo && files.logo.length > 0) {
        updateOrganizationDto.logo = extractRelativePathFromFullPath(files.logo[0].path);
        uploadFile(files.logo);
      }

      if (files.digitalStamp && files.digitalStamp.length > 0) {
        updateOrganizationDto.digitalStamp = extractRelativePathFromFullPath(files.digitalStamp[0].path);
        uploadFile(files.digitalStamp);
      }

      updateOrganizationDto["modifiedDate"] = new Date();
      updateOrganizationDto["modifiedById"] = req.user.userId
      let data = await this.organizationService.update(params.id, updateOrganizationDto);

      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(files?.logo);     
      removeUploadedFiles(files?.digitalStamp);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(OrganizationPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.organizationService.remove(params.id, req.user.userId);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(OrganizationPermissionSet.SUSPEND)
  @ApiOperation({ summary: `Suspend the organization to add perform any actions` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Suspend the organization to add perform any actions` })
  @Patch('suspendOrganization/:id')
  async suspendOrganization(
    @Req() req: AuthenticatedRequest,
    @Param() params: ParamsDto,
    @Body() suspendOrganizationDto: SuspendOrganizationDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let organizationOldData = await this.organizationService.findOne(params.id);
      if(organizationOldData.status === OrganizationStatus.suspended){
        throw {message: "You can only suspend the active organization", statusCode: 400}
      }
      let organization = await this.organizationService.suspendOrganization(params.id);

      return { message: `Organization suspended successfully`, statusCode: 200, data: organization }
    } catch (err) {
      throw new HttpException({message: err.message, error: err.data, statusCode: err.statusCode}, err.statusCode);
    }
  }

  @CheckPermissions(OrganizationPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: OrganizationResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.organizationService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


}
