import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { SitePagesSectionService } from './site-pages-section.service';
import { CreateSitePagesSectionDto } from './dto/create-site-pages-section.dto';
import { UpdateSitePagesSectionDto } from './dto/update-site-pages-section.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { SitePagesSectionResponseObject, SitePagesSectionResponseArray } from './dto/site-pages-section.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SitePagesSectionPermissionSet } from './site-pages-section.permissions';
import { SitePagesSectionFiltersDto } from './dto/site-pages-section-filters.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
const moduleName = "site pages section";

@ApiTags("site-pages-section")
@Controller('site-pages-section')
export class SitePagesSectionController {
  constructor(private readonly sitePagesSectionService: SitePagesSectionService) { }

  @CheckPermissions(SitePagesSectionPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createSitePagesSectionDto: CreateSitePagesSectionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesSectionService.create(createSitePagesSectionDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesSectionPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: SitePagesSectionFiltersDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.sitePagesSectionService.applyFilters(filters);
      let data = await this.sitePagesSectionService.findAll(filtersApplied);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesSectionPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesSectionService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesSectionPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('allowMultiples/:id')
  async allowMultiples(@Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      let updateSitePagesSectionDto = new UpdateSitePagesSectionDto();
      updateSitePagesSectionDto["hasMultipleItems"] = true;
      let data = await this.sitePagesSectionService.update(params.id, updateSitePagesSectionDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(SitePagesSectionPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('disallowMultiples/:id')
  async disallowMultiples(@Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      let existingItems = await this.sitePagesSectionService.findAllContentOfSection(params.id);
      let hasUniqueItems = true;
      for(let ele of existingItems){
        if(ele._count.id > 1){
          hasUniqueItems = false;
          break
        }
      }

      if(!hasUniqueItems){
        throw {message: "This section already has multiple sections uploaded please delete the existing sections first and try again", statusCode: 400}
      }

      let updateSitePagesSectionDto = new UpdateSitePagesSectionDto();
      updateSitePagesSectionDto["hasMultipleItems"] = false;
      let data = await this.sitePagesSectionService.update(params.id, updateSitePagesSectionDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesSectionPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateSitePagesSectionDto: UpdateSitePagesSectionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesSectionService.update(params.id, updateSitePagesSectionDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesSectionPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SitePagesSectionResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesSectionService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
