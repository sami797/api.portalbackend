import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { ProjectComponentsService } from './project-components.service';
import { CreateProjectComponentDto } from './dto/create-project-component.dto';
import { UpdateProjectComponentDto } from './dto/update-project-component.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ProjectComponentResponseObject, ProjectComponentResponseArray } from './dto/project-component.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ProjectComponentPermissionSet } from './project-component.permissions';
import { Public } from 'src/authentication/public-metadata';
import { ProjectComponentFiltersDto } from './dto/project-component-filters.dto';
const moduleName = "project-components";

@ApiTags("project-components")
@Controller('project-components')
export class ProjectComponentsController {
  constructor(private readonly projectComponentsService: ProjectComponentsService) { }
  
  @CheckPermissions(ProjectComponentPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateProjectComponentDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectComponentsService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: ProjectComponentFiltersDto,
    @Query() pagination: Pagination,
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.projectComponentsService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let dt = await this.projectComponentsService.findAllPublished(appliedFilters, pagination);
      let tCount = this.projectComponentsService.countFaqs(appliedFilters);
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
  @ApiResponse({ status: 200, type: ProjectComponentResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectComponentsService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectComponentPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: ProjectComponentFiltersDto,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.projectComponentsService.applyFilters(filters);
      let dt = await this.projectComponentsService.findAll(appliedFilters, pagination);
      let tCount = this.projectComponentsService.countFaqs(appliedFilters);
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

  @CheckPermissions(ProjectComponentPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectComponentsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectComponentPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateProjectComponentDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectComponentsService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectComponentPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectComponentResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectComponentsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
