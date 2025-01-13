import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { SitePagesService } from './site-pages.service';
import { CreateSitePageDto } from './dto/create-site-page.dto';
import { UpdateSitePageDto } from './dto/update-site-page.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { DataBySlugDto, ParamsDto, RemoveMultipleRelationDto, RemoveRelationDto } from './dto/params.dto';
import { SitePageResponseObject, SitePageResponseArray } from './dto/site-pages.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SitePagesPermissionSet } from './site-pages.permissions';
import { SitePagesFiltersDto } from './dto/site-pages-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { Public } from 'src/authentication/public-metadata';
const moduleName = "site pages";

@ApiTags("site-pages")
@Controller('site-pages')
export class SitePagesController {
  constructor(private readonly sitePagesService: SitePagesService) { }

  @CheckPermissions(SitePagesPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createSitePageDto: CreateSitePageDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.create(createSitePageDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePageResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: SitePagesFiltersDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.sitePagesService.applyFilters(filters);
      let data = await this.sitePagesService.findAll(filtersApplied);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('find-page-content/:slug')
  async findPageContent(
    @Param() params: DataBySlugDto,
    @Req() req: any,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let pageData = await this.sitePagesService.findPageBySlug(params.slug);
      if(!pageData){
        throw {message: "Site Page with provided slug not found", statusCode: 404}
      }
      let pageSectionAndContent =  this.sitePagesService.findPageContent(pageData.id);
      let pageSeoData =  this.sitePagesService.findPageSeo(pageData.id);
      let [pageSectionData, seoData] = await Promise.all([pageSectionAndContent, pageSeoData])
      let __pageSectionData = pageSectionData.map((ele) => ele.PageSection);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: {
        pageSections : __pageSectionData,
        seoMeta: seoData
      }}
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateSitePageDto: UpdateSitePageDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.update(params.id, updateSitePageDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName} section` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the deleted ${moduleName} relation object if found on the system` })
  @Delete('removeSectionFromPage/:pageId/:sectionId')
  async removeSectionFromPage(@Param() params: RemoveRelationDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.removeSectionFromPage(params.pageId, params.sectionId);
      return { message: `Section From page has been deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName} section` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the deleted ${moduleName} relation object if found on the system` })
  @Delete('removeMultipleSectionFromPage')
  async removeMultipleSectionFromPage(@Query() removeRelationDto: RemoveMultipleRelationDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.removeMultipleSectionFromPage(removeRelationDto.pageId, removeRelationDto.sectionIds);
      return { message: `Section From page has been deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SitePageResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
