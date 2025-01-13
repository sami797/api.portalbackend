import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { CompanyAssetService } from './company-asset.service';
import { CreateCompanyAssetDto } from './dto/create-company-asset.dto';
import { UpdateCompanyAssetDto } from './dto/update-company-asset.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CompanyAssetsResponseObject, CompanyAssetsResponseArray } from './dto/company-asset.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { CompanyAssetPermissionSet } from './company-asset.permissions';
import { CompanyAssetFiltersDto } from './dto/company-asset-filters.dto';
import { AllocateAssetToUserDto } from './dto/allocate-asset-to-user.dto';
const moduleName = "company-asset";

@ApiTags("company-asset")
@Controller('company-asset')
export class CompanyAssetController {
  constructor(private readonly companyAssetService: CompanyAssetService) { }
  
  @CheckPermissions(CompanyAssetPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateCompanyAssetDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CompanyAssetPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('allocate')
  async allocateResource(@Body() createDto: AllocateAssetToUserDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.allocateResource(createDto);
      return { message: `Resource has been allocated successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: CompanyAssetFiltersDto,
    @Query() pagination: Pagination,
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.companyAssetService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let dt = await this.companyAssetService.findAllPublished(appliedFilters, pagination);
      let tCount = this.companyAssetService.countRecords(appliedFilters);
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
  @ApiResponse({ status: 200, type: CompanyAssetsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('findCompanyCars')
  async findCars(
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.findCompanyCars();
      return { message: `Company cars fetched Successfully`, statusCode: 200, data: data,};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CompanyAssetPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: CompanyAssetFiltersDto,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.companyAssetService.applyFilters(filters);
      let dt = await this.companyAssetService.findAll(appliedFilters, pagination);
      let tCount = this.companyAssetService.countRecords(appliedFilters);
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

  @CheckPermissions(CompanyAssetPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CompanyAssetPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateCompanyAssetDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CompanyAssetPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('revoke/:id')
  async revoke(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.revoke(params.id);
      return { message: `Resource has been revoked successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CompanyAssetPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: CompanyAssetsResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.companyAssetService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
