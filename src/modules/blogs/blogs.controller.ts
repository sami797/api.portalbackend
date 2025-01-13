import { Controller, Get, Post, Body, Patch, Request, Param, Delete, HttpException, UseInterceptors, UploadedFile, Query, Req, UploadedFiles } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess, SEOData } from 'src/common-types/common-types';
import { BlogsDetail, ParamsDto } from './dto/params.dto';
import { blogsFileUploadPath, BlogsResponseObject, BlogsResponseArray } from './dto/blogs.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BlogsPermissionSet } from './blogs-permissions';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { BlogsFiltersDto, BlogsPublicFiltersDto } from './dto/blogs-filter.dto';
import { BlogsPaginationDto } from './dto/blogs-pagination.dto';
import { BlogsSortingDto } from './dto/blogs-sorting.dto';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { BlogsStatus, SUPER_ADMIN } from 'src/config/constants';
import { Public } from 'src/authentication/public-metadata';
import { BlogStatusDto } from './dto/blog-status.dto';
import { SystemLogger } from '../system-logs/system-logger.service';
import { UploadBlogImage } from './dto/upload-image.dto';
const multerOptions = getMulterOptions({ destination: blogsFileUploadPath });
const moduleName = "blogs";

@ApiTags("blogs")
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService, private readonly authorizationService: AuthorizationService, private readonly systemLogger: SystemLogger) { }


  @CheckPermissions(BlogsPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload Blog images` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the uploaded images on success` })
  @UseInterceptors(FilesInterceptor('file', 20, multerOptions))
  @Post("uploadImages")
  async uploadBlogImages(@Body() uploadBlogImage: UploadBlogImage,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (files && files.length > 0) {
        await this.blogsService.checkImagesThreshold(uploadBlogImage.blogId);
        let data = await this.blogsService.handleBlogImages(uploadBlogImage, files, req.user);
        uploadFile(files);
        return { message: `Images uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }
  
  @CheckPermissions(BlogsPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Post()
  async create(@Body() createBlogDto: CreateBlogDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        createBlogDto.image = extractRelativePathFromFullPath(file.path);
      }
      createBlogDto["addedById"] = req.user.userId;
      let data = await this.blogsService.create(createBlogDto);
      uploadFile(file);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: data.id,
        actionType: 'CREATE',
        valueType: "number",
        user: req.user.userId,
        data: createBlogDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Create Blog"
      })
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: BlogsResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filters: BlogsFiltersDto,
    @Query() pagination: BlogsPaginationDto,
    @Query() sorting: BlogsSortingDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.blogsService.applyAdminFilters(filters);
      let dt = this.blogsService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.blogsService.countBlogs(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: data,
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
  @ApiResponse({ status: 200, type: BlogsResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: BlogsPublicFiltersDto,
    @Query() pagination: BlogsPaginationDto,
    @Query() sorting: BlogsSortingDto,
    @Req() req
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      // await new Promise(resolve => setTimeout(resolve, 5000));
      let appliedFilters = this.blogsService.applyPublicFilters(filters);
      let dt = await this.blogsService.findAllPublished(appliedFilters, pagination, sorting);
      let tCount = this.blogsService.countBlogs(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName}(s) fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(BlogsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOneBySlug/:slug')
  async findOneBySlug(@Param() params: BlogsDetail): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.findOneBySlug(params.slug);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateBlogDto: UpdateBlogDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        updateBlogDto.image = extractRelativePathFromFullPath(file.path)
      }
      updateBlogDto["modifiedDate"] = new Date();
      updateBlogDto["modifiedById"] = req.user.userId
      let data = await this.blogsService.update(params.id, updateBlogDto);
      uploadFile(file);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: updateBlogDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Update Blog"
      })
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(file);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.remove(params.id, req.user.userId);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: params.id,
        actionType: 'DELETE',
        valueType: "number",
        user: req.user.userId,
        data: {},
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Delete Blog"
      })
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.CHANGE_STATUS)
  @ApiOperation({ summary: `Change Blog Status` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the updated blog` })
  @Post('changeStatus/:id')
  async updateBlogStatus(@Param() params: ParamsDto,
    @Body() blogStatusDto: BlogStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.updateStatus(params.id, blogStatusDto.status);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: blogStatusDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Blog Change Status"
      })
      return { message: `Blog status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.VERIFY_AND_PUBLISH)
  @ApiOperation({ summary: `Verify and Publish Blog` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the updated blog` })
  @Post('verifyAndPublish/:id')
  async verifyAndPublish(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.updateStatus(params.id, BlogsStatus['Verified & Published']);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: { status: BlogsStatus['Verified & Published'] },
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Verify and Publish Blog"
      })
      return { message: `Blog status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.UPDATE_SEO)
  @ApiOperation({ summary: `Update blog SEO meta data` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the updated page` })
  @Post('update-seo/:id')
  async updateSEO(@Param() params: ParamsDto,
    @Body() seoData: SEOData,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.updateSEOData(params.id, seoData);
      this.systemLogger.logData({
        tableName: "Blogs",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: seoData,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Blog SEO Updates"
      })
      return { message: `Blog SEO records updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Delete Blog images` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the deleted Blog image object if found on the system` })
  @Delete('removeImages/:id')
  async removeImages(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.removeFiles(params.id, req.user);
      this.systemLogger.logData({
        tableName: "BlogImages",
        field: 'id',
        value: params.id,
        actionType: 'DELETE',
        valueType: "number",
        user: req.user.userId,
        data: {},
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Delete a Blog Image"
      })
      return { message: `${moduleName} image deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsPermissionSet.READ)
  @ApiOperation({ summary: `Get Blog Images` })
  @ApiResponse({ status: 200, type: BlogsResponseObject, isArray: false, description: `Returns the blog image` })
  @Get('getBlogImages/:id')
  async getBlogImages(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsService.getBlogImages(params.id);
      return { message: `${moduleName} image deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
