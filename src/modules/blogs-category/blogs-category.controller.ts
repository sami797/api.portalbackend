import { Controller, Get, Post, Body, Patch, Request, Param, Delete, HttpException, UseInterceptors, UploadedFile, Query, Req } from '@nestjs/common';
import { BlogsCategoryService } from './blogs-category.service';
import { CreateBlogCategoryDto } from './dto/create-category-blog.dto';
import { UpdateBlogCategoryDto } from './dto/update-category-blog.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess, SEOData } from 'src/common-types/common-types';
import { BlogsDetail, ParamsDto } from './dto/params.dto';
import { blogsFileUploadPath, BlogsCategoryResponseObject, BlogsCategoryResponseArray } from './dto/blogs-category.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BlogsCategoryPermissionSet } from './blogs-category.permissions';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { BlogsCategoryFiltersDto, BlogsCategoryPublicFiltersDto } from './dto/blogs-category-filter.dto';
import { BlogsCategoryPaginationDto } from './dto/blogs-category-pagination.dto';
import { BlogsCategorySortingDto } from './dto/blogs-category-sorting.dto';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { BlogsCategoryStatus, SUPER_ADMIN } from 'src/config/constants';
import { Public } from 'src/authentication/public-metadata';
import { BlogCategoryStatusDto } from './dto/blog-category-status.dto';
import { SystemLogger } from '../system-logs/system-logger.service';
import { PublishUnpublish } from './dto/blog-category-publish-unpublish.dto';
const multerOptions = getMulterOptions({ destination: blogsFileUploadPath });
const moduleName = "blogs-category";

@ApiTags("blogs-category")
@Controller('blogs-category')
export class BlogsCategoryController {
  constructor(private readonly blogsCategoryService: BlogsCategoryService, private readonly authorizationService: AuthorizationService, private readonly systemLogger: SystemLogger) { }

  @CheckPermissions(BlogsCategoryPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Post()
  async create(@Body() createBlogCategoryDto: CreateBlogCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        createBlogCategoryDto.image = extractRelativePathFromFullPath(file.path);
      }
      createBlogCategoryDto["addedById"] = req.user.userId;
      let data = await this.blogsCategoryService.create(createBlogCategoryDto);
      uploadFile(file);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
        field: 'id',
        value: data.id,
        actionType: 'CREATE',
        valueType: "number",
        user: req.user.userId,
        data: createBlogCategoryDto,
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

  @CheckPermissions(BlogsCategoryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filters: BlogsCategoryFiltersDto,
    @Query() pagination: BlogsCategoryPaginationDto,
    @Query() sorting: BlogsCategorySortingDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.blogsCategoryService.applyAdminFilters(filters);
      let dt = this.blogsCategoryService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.blogsCategoryService.countBlogsCategory(appliedFilters);
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
  @ApiResponse({ status: 200, type: BlogsCategoryResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('find-published')
  async findPublished(
    @Query() filters: BlogsCategoryPublicFiltersDto,
    @Query() pagination: BlogsCategoryPaginationDto,
    @Query() sorting: BlogsCategorySortingDto,
    @Req() req
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      // await new Promise(resolve => setTimeout(resolve, 5000));
      let appliedFilters = this.blogsCategoryService.applyPublicFilters(filters);
      let dt = await this.blogsCategoryService.findAllPublished(appliedFilters, pagination, sorting);
      let tCount = this.blogsCategoryService.countBlogsCategory(appliedFilters);
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

  @CheckPermissions(BlogsCategoryPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOneBySlug/:slug')
  async findOneBySlug(@Param() params: BlogsDetail, 
  @Query() pagination: BlogsCategoryPaginationDto,
  @Req() req
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let dt =  this.blogsCategoryService.findOneBySlug(params.slug, pagination);
      let tCount = this.blogsCategoryService.countBlogs({ BlogCategory: { slug: params.slug}});
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

  @CheckPermissions(BlogsCategoryPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @Body() updateBlogCategoryDto: UpdateBlogCategoryDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        updateBlogCategoryDto.image = extractRelativePathFromFullPath(file.path)
      }
      updateBlogCategoryDto["modifiedDate"] = new Date();
      updateBlogCategoryDto["modifiedById"] = req.user.userId
      let data = await this.blogsCategoryService.update(params.id, updateBlogCategoryDto);
      uploadFile(file);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: updateBlogCategoryDto,
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

  @CheckPermissions(BlogsCategoryPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.remove(params.id, req.user.userId);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
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

  @CheckPermissions(BlogsCategoryPermissionSet.CHANGE_STATUS)
  @ApiOperation({ summary: `Change Blog Status` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the updated blog` })
  @Patch('changeStatus/:id')
  async updateBlogStatus(@Param() params: ParamsDto,
    @Body() blogCategoryStatusDto: BlogCategoryStatusDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.updateStatus(params.id, blogCategoryStatusDto.status);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: blogCategoryStatusDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Blog Change Status"
      })
      return { message: `Blog status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsCategoryPermissionSet.VERIFY_AND_PUBLISH)
  @ApiOperation({ summary: `Verify and Publish Blog` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the updated blog` })
  @Patch('verifyAndPublish/:id')
  async verifyAndPublish(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.updateStatus(params.id, BlogsCategoryStatus['Verified & Published']);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: { status: BlogsCategoryStatus['Verified & Published'] },
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Verify and Publish Blog"
      })
      return { message: `Blog status updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BlogsCategoryPermissionSet.UPDATE_SEO)
  @ApiOperation({ summary: `Update blog SEO meta data` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the updated page` })
  @Patch('update-seo/:id')
  async updateSEO(@Param() params: ParamsDto,
    @Body() seoData: SEOData,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.updateSEOData(params.id, seoData);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
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

  @CheckPermissions(BlogsCategoryPermissionSet.UPDATE)
  @ApiOperation({ summary: `Unpublish ${moduleName}` })
  @ApiResponse({ status: 200, type: BlogsCategoryResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('publish-unpublish/:id')
  async publishUnpublishBlogCategory(@Param() params: ParamsDto,
    @Request() req: AuthenticatedRequest,
    @Body() publishUnpublish : PublishUnpublish
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.blogsCategoryService.publishUnpublish(params.id, req.user.userId, publishUnpublish.status);
      this.systemLogger.logData({
        tableName: "BlogsCategory",
        field: 'id',
        value: params.id,
        actionType: 'UPDATE',
        valueType: "number",
        user: req.user.userId,
        data: {isPublished: false},
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Blog Category updated successfully"
      })
      return { message: `${moduleName} ${publishUnpublish.status ? 'published' : 'unpublished'} successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
