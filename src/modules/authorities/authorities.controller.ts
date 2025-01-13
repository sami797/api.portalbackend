import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { AuthoritiesService } from './authorities.service';
import { CreateAuthorityDto } from './dto/create-authority.dto';
import { UpdateAuthorityDto } from './dto/update-authority.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { AuthorityResponseObject, AuthorityResponseArray } from './dto/authority.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AuthoritiesPermissionSet } from './authorities.permissions';
import { Public } from 'src/authentication/public-metadata';
import { AuthorityFiltersDto } from './dto/authority-filters.dto';
const moduleName = "authorities";

@ApiTags("authorities")
@Controller('authorities')
export class AuthoritiesController {
  constructor(private readonly authoritiesService: AuthoritiesService) { }
  
  @CheckPermissions(AuthoritiesPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AuthorityResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateAuthorityDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authoritiesService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AuthorityResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: AuthorityFiltersDto,
    @Query() pagination: Pagination,
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.authoritiesService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let dt = await this.authoritiesService.findAllPublished(appliedFilters, pagination);
      let tCount = this.authoritiesService.countFaqs(appliedFilters);
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
  @ApiResponse({ status: 200, type: AuthorityResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authoritiesService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AuthoritiesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AuthorityResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: AuthorityFiltersDto,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.authoritiesService.applyFilters(filters);
      let dt = await this.authoritiesService.findAll(appliedFilters, pagination);
      let tCount = this.authoritiesService.countFaqs(appliedFilters);
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

  @CheckPermissions(AuthoritiesPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AuthorityResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authoritiesService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AuthoritiesPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: AuthorityResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateAuthorityDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authoritiesService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AuthoritiesPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: AuthorityResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.authoritiesService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
