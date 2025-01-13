import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { FaqsCategoryService } from './faqs-category.service';
import { CreateFaqsCategoryDto } from './dto/create-faqs-category.dto';
import { UpdateFaqsCategoryDto } from './dto/update-faqs-category.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindBySlugDto, ParamsDto } from './dto/params.dto';
import { FaqsCategoryResponseObject, FaqsCategoryResponseArray } from './dto/faqs-category.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { FaqsCategoryPermissionSet } from './faqs-category.permissions';
import { Public } from 'src/authentication/public-metadata';
import { FaqsCategoryFiltersDto } from './dto/faqs-category-filter.dto';
import { FaqsCategoryPaginationDto } from './dto/faqs-category-pagination.dto';
const moduleName = "Faqs category";

@ApiTags("faqs-category")
@Controller('faqs-category')
export class FaqsCategoryController {
  constructor(private readonly faqsCategoryService: FaqsCategoryService) { }
  
  @CheckPermissions(FaqsCategoryPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createFaqsCategoryDto: CreateFaqsCategoryDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.create(createFaqsCategoryDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.findAllPublished();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }


  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug(@Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsCategoryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
  @Query() filters: FaqsCategoryFiltersDto,
  @Query() pagination: FaqsCategoryPaginationDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.faqsCategoryService.applyFilters(filters);
      let dt = await this.faqsCategoryService.findAll(appliedFilters, pagination);
      let tCount = this.faqsCategoryService.countFaqsCategory(appliedFilters);
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

  @CheckPermissions(FaqsCategoryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsCategoryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateFaqsCategoryDto: UpdateFaqsCategoryDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.update(params.id, updateFaqsCategoryDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsCategoryPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: FaqsCategoryResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsCategoryService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
