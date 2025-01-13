import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { ProjectStateService } from './project-state.service';
import { CreateProjectStateDto } from './dto/create-project-state.dto';
import { UpdateProjectStateDto } from './dto/update-project-state.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ProjectStateResponseObject, ProjectStateResponseArray } from './dto/project-state.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ProjectStatePermissionSet } from './project-state.permissions';
import { ProjectStateFiltersDto } from './dto/project-state-filters.dto';
const moduleName = "project-state";

@ApiTags("project-state")
@Controller('project-state')
export class ProjectStateController {
  constructor(private readonly projectStateService: ProjectStateService) { }
  
  @CheckPermissions(ProjectStatePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectStateResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateProjectStateDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectStateService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectStateResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: ProjectStateFiltersDto,
    @Query() pagination: Pagination,
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.projectStateService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let dt = await this.projectStateService.findAllPublished(appliedFilters, pagination);
      let tCount = this.projectStateService.countFaqs(appliedFilters);
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
@ApiResponse({ status: 200, type: ProjectStateResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
@Get('find-published-states')
async findPublishedStates(
    @Query() filters: ProjectStateFiltersDto,
): Promise<ResponseSuccess | ResponseError> {
    try {
        let appliedFilters = this.projectStateService.applyFilters(filters);
        appliedFilters = { ...appliedFilters, isPublished: true };
        let data = await this.projectStateService.findAllPublishedStates(appliedFilters);
        
        // Providing default values for pagination metadata
        const defaultPage = 1;
        const defaultPerPage = data.length;
        const defaultPageCount = 1;

        return {
            message: `${moduleName} fetched Successfully`,
            statusCode: 200,
            data: data,
            meta: {
                page: defaultPage,
                perPage: defaultPerPage,
                total: data.length,
                pageCount: defaultPageCount
            }
        };
    } catch (err) {
        throw new HttpException(err.message, err.statusCode);
    }
}



  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectStateResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectStateService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectStatePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectStateResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: ProjectStateFiltersDto,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.projectStateService.applyFilters(filters);
      let dt = await this.projectStateService.findAll(appliedFilters, pagination);
      let tCount = this.projectStateService.countFaqs(appliedFilters);
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

  @CheckPermissions(ProjectStatePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectStateResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectStateService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectStatePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: ProjectStateResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateProjectStateDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectStateService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectStatePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectStateResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.projectStateService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
