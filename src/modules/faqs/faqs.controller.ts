import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FindBySlugDto, ParamsDto } from './dto/params.dto';
import { FaqsResponseObject, FaqsResponseArray, getDynamicUploadPath } from './dto/faqs.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { FaqsPermissionSet } from './faqs.permissions';
import { Public } from 'src/authentication/public-metadata';
import { FaqsPaginationDto } from './dto/faqs-pagination.dto';
import { FaqsFiltersDto } from './dto/faqs-filter.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadFaqImage } from './dto/upload-image.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
const multerOptions = getMulterOptions({ destination: getDynamicUploadPath() });
const moduleName = "faqs";

@ApiTags("faqs")
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) { }
  
  @CheckPermissions(FaqsPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload Faqs images` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the uploaded images on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptions))
  @Post("uploadImages")
  async uploadFaqImages(@Body() uploadFaqImage: UploadFaqImage,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files && files.length > 0) {
        let data = await this.faqsService.handleFaqImages(uploadFaqImage, files, req.user);
        await uploadFile(files);
        return { message: `Files uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(FaqsPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createFaqDto: CreateFaqDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.create(createFaqDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: FaqsFiltersDto,
    @Query() pagination: FaqsPaginationDto,
    ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.faqsService.applyFilters(filters);
      appliedFilters = {...appliedFilters, isPublished: true};
      let dt = await this.faqsService.findAllPublished(appliedFilters, pagination);
      let tCount = this.faqsService.countFaqs(appliedFilters);
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


  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FaqsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: FaqsFiltersDto,
    @Query() pagination: FaqsPaginationDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.faqsService.applyFilters(filters);
      let dt = await this.faqsService.findAll(appliedFilters, pagination);
      let tCount = this.faqsService.countFaqs(appliedFilters);
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

  @CheckPermissions(FaqsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Delete Faqs images` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the deleted Faqs image object if found on the system` })
  @Delete('removeImages/:id')
  async removeImages(@Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.removeFiles(params.id, req.user);
      return { message: `${moduleName} image deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsPermissionSet.READ)
  @ApiOperation({ summary: `Get Faqs Images` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the Faqs image` })
  @Get('getFaqsImages/:id')
  async getFaqsImages(@Param() params: ParamsDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.getFaqsImages(params.id);
      return { message: `${moduleName} image fetched successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateFaqDto: UpdateFaqDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.update(params.id, updateFaqDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FaqsPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: FaqsResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.faqsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
