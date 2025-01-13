import { Controller, Get, Post,Request, Body, Patch, Param, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { FeedbackResponseObject, FeedbackResponseArray, getDynamicUploadPath } from './dto/feedback.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { FeedbackPermissionSet } from './feedback.permissions';
import { FeedbackFiltersDto } from './dto/feedback-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { FeedbackSortingDto } from './dto/feedback-sorting.dto';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "feedback";

@ApiTags("feedback")
@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) { }
  
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @UseInterceptors(FilesInterceptor("files", 10, multerOptionsProtected))
  @ApiResponse({ status: 200, type: FeedbackResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @Post()
  async create(
    @Body() createDto: CreateFeedbackDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      createDto.addedById = req.user.userId;
      let data = await this.feedbackService.create(createDto, req.user);
      await this.feedbackService.handleFiles(data.id, files);
      uploadFile(files);
      let recordData = await this.feedbackService.findOne(data.id);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: recordData };
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(FeedbackPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: FeedbackResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: FeedbackFiltersDto,
    @Query() sorting: FeedbackSortingDto,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.feedbackService.applyFilters(filters);
      let dt = await this.feedbackService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.feedbackService.countRecords(appliedFilters);
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

  @CheckPermissions(FeedbackPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: FeedbackResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.feedbackService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
