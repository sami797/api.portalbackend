import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, UseInterceptors, UploadedFile, Req, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { NotificationResponseObject, NotificationResponseArray, notificationFileUploadPath } from './dto/notification.dto';
import { extractRelativePathFromFullPath, getMulterOptions } from 'src/helpers/file-upload.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadFile } from 'src/helpers/file-management';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { NotificationFilters } from './dto/notification-filters.dto';
import { NotificationPaginationDto } from './dto/notification-pagination.dto';
import { NotificationPermissionSet } from './notification.permissions';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
const multerOptions = getMulterOptions({ destination: notificationFileUploadPath, fileTypes:'images_only_with_svg' });
const moduleName = "notification";

@ApiTags("notification")
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }
  
  @CheckPermissions(NotificationPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: NotificationResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto,  
  @UploadedFile() file: Express.Multer.File,): Promise<ResponseSuccess | ResponseError> {
    try {
      if (file) {
        createNotificationDto.file = extractRelativePathFromFullPath(file.path);
      }
      let data = await this.notificationService.create(createNotificationDto);
      uploadFile(file);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: NotificationResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(@Req() req: AuthenticatedRequest, 
  @Query() filters: NotificationFilters,
  @Query() pagination: NotificationPaginationDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.notificationService.applyFilters(filters, req.user);
      let dt = await this.notificationService.findAll(appliedFilters, pagination);
      let tCount = this.notificationService.countNotifications(appliedFilters);
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

  @CheckPermissions(NotificationPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all announcement in the system` })
  @ApiResponse({ status: 200, type: NotificationResponseArray, isArray: false, description: `Return a list of announcement available` })
  @Get('announcement')
  async findAllAnnouncements(@Req() req: AuthenticatedRequest, 
  @Query() filters: NotificationFilters,
  @Query() pagination: NotificationPaginationDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.notificationService.applyAnnouncementFilters();
      let dt = await this.notificationService.findAllAnnouncement(appliedFilters, pagination);
      let tCount = this.notificationService.countNotifications(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return { message: `Announcements fetched Successfully`, statusCode: 200, data: data,
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


  @ApiOperation({ summary: `Mark as Read ${moduleName}` })
  @ApiResponse({ status: 200, type: NotificationResponseObject, isArray: false, description: `Returns the read ${moduleName} object if found on the system` })
  @Patch('read/all')
  async markAsReadAll(@Req() req: AuthenticatedRequest ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.notificationService.readAllNotification(req.user);
      return { message: `${moduleName} read successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Mark as Read ${moduleName}` })
  @ApiResponse({ status: 200, type: NotificationResponseObject, isArray: false, description: `Returns the read ${moduleName} object if found on the system` })
  @Patch('read/:id')
  async markAsRead(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.notificationService.readNotification(params.id, req.user);
      return { message: `${moduleName} read successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: NotificationResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.notificationService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
