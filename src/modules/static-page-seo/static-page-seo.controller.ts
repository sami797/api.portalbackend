import { Controller, Get, Post, Body, Patch, Param, Delete,Request, HttpException, UploadedFile, UseInterceptors, Req, Query } from '@nestjs/common';
import { ApiConsumes, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { StaticPageSeoService } from './static-page-seo.service';
import { CreateStaticPageSeoDto } from './dto/create-static-page-seo.dto';
import { UpdateStaticPageSeoDto } from './dto/update-static-page-seo.dto';
import { StaticPageSEOFileUploadPath, StaticPageSEOResponseObject, StaticPageSEOResponseArray } from './dto/static-page-seo.dto';
import { FindItemBySlug, ParamsDto } from './dto/params.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { StaticPageSEOPermissionSet } from './static-page-seo.permissions';
import { uploadFile } from 'src/helpers/file-management';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { Public } from 'src/authentication/public-metadata';
import { StaticPageSEOPaginationDto } from './dto/static-page-seo.pagination.dto';
import { StaticPageSEOFiltersDto } from './dto/static-page-seo-filters.dto';
const multerOptions = getMulterOptions({ destination: StaticPageSEOFileUploadPath });

@ApiTags("static-page-seo")
@Controller('static-page-seo')
export class StaticPageSeoController {
  constructor(private readonly staticPageSeoService: StaticPageSeoService) { }

  @CheckPermissions(StaticPageSEOPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a new static-page-seo in the system' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseObject, isArray: false, description: 'Returns the new record on success' })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Post()
  async create(@Body() createStaticPageSeoDto: CreateStaticPageSeoDto,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (image) {
        createStaticPageSeoDto.image = extractRelativePathFromFullPath(image.path)
      }
      let data = await this.staticPageSeoService.create(createStaticPageSeoDto);
      uploadFile(image)
      return { message: "StaticPageSEO data saved successfully", statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(image);
      throw new HttpException(err.message, err.statusCode);
    }

  }

  @CheckPermissions(StaticPageSEOPermissionSet.READ)
  @ApiOperation({ summary: 'Fetch all StaticPageSEO data from the system' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseArray, isArray: false, description: 'Returns the list of county in the system' })
  @Get()
  async findAll(@Req() req: AuthenticatedRequest, 
  @Query() staticPageSEOFiltersDto : StaticPageSEOFiltersDto,
  @Query() pagination: StaticPageSEOPaginationDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.staticPageSeoService.applyFilters(staticPageSEOFiltersDto);
      let dt = this.staticPageSeoService.findAll(appliedFilters, pagination);
      let tCount = this.staticPageSeoService.countStaticPageSEO({});
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return { message: "StaticPageSEO fetched Successfully", statusCode: 200, data: data,
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
  @ApiOperation({ summary: 'Fetch all StaticPageSEO data from the system' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseArray, isArray: false, description: 'Returns the list of county in the system' })
  @Get('find-published')
  async findPublished(@Req() req: AuthenticatedRequest, 
  @Query() pagination: StaticPageSEOPaginationDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let dt = this.staticPageSeoService.findAll( {}, pagination);
      let tCount = this.staticPageSeoService.countStaticPageSEO({});
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return { message: "StaticPageSEO fetched Successfully", statusCode: 200, data: data,
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

  @CheckPermissions(StaticPageSEOPermissionSet.UPDATE)
  @ApiOperation({ summary: 'Make page SEO default for all pages' })
  @Patch('make-default/:id')
  async makeDefault(@Param() params: ParamsDto, 
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.staticPageSeoService.makeDefault(params.id);
      return { message: "StaticPageSEO updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(StaticPageSEOPermissionSet.UPDATE)
  @ApiOperation({ summary: 'Update StaticPageSEO', description: "Only the white listed fields are considered, other fields are striped out by default" })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseObject, isArray: false, description: 'Returns the updated StaticPageSEO object if found on the system' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateStaticPageSeoDto: UpdateStaticPageSeoDto, 
  @UploadedFile() image: Express.Multer.File,
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (image) {
        updateStaticPageSeoDto.image = extractRelativePathFromFullPath(image.path);
      }
      updateStaticPageSeoDto['modifiedById'] = req.user.userId;
      updateStaticPageSeoDto['modifiedDate'] = new Date();
      let data = await this.staticPageSeoService.update(params.id, updateStaticPageSeoDto);
      uploadFile(image)
      return { message: "StaticPageSEO updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(StaticPageSEOPermissionSet.DELETE)
  @ApiOperation({ summary: 'Delete StaticPageSEO' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseObject, isArray: false, description: 'Returns the deleted StaticPageSEO object if found on the system' })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.staticPageSeoService.remove(params.id);
      return { message: "StaticPageSEO deleted successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @Public()
  @ApiOperation({ summary: 'Fetch StaticPageSEO by id' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseObject, isArray: false, description: 'Returns the StaticPageSEO object if found on the system' })
  @Get(':slug')
  async findOneByPageSlug(@Param() params: FindItemBySlug,
  @Req() req: any
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.staticPageSeoService.findOneByPageSlug(params.slug);
      return { message: "StaticPageSEO data Fetched Successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(StaticPageSEOPermissionSet.READ)
  @ApiOperation({ summary: 'Fetch StaticPageSEO by id' })
  @ApiResponse({ status: 200, type: StaticPageSEOResponseObject, isArray: false, description: 'Returns the StaticPageSEO object if found on the system' })
  @Get('findById/:id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.staticPageSeoService.findOne(params.id);
      return { message: "StaticPageSEO data Fetched Successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

}
