import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { TaskResponseObject, TaskResponseArray, getDynamicUploadPath } from './dto/task.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { TaskPermissionSet } from './task.permissions';
import { TaskFilters } from './dto/task-filters.dto';
import { UpdateTaskOrderDto } from './dto/update-task-order.dto';
import { TaskSortingDto } from './dto/task-sorting.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { UploadTaskFiles } from './dto/upload-files.dto';
import { uploadFile } from 'src/helpers/file-management';
import { UpdateTaskMember } from './dto/update-task-member.dto';
import { RemoveTaskMember } from './dto/remove-task-member.dto';
import { TaskType } from 'src/config/constants';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'images_and_pdf', limit: 10000000 });

const moduleName = "task";

@ApiTags("task")
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService, private readonly authorizationService: AuthorizationService) { }
  
  @CheckPermissions(TaskPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload property Files` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post("uploadTaskFiles")
  async uploadTaskFiles(@Body() uploadPropertyFiles: UploadTaskFiles,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.updateAnyTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, uploadPropertyFiles.taskId, hasGlobalPermission.manageTechSupportTask);
      }
      if (files && files.length > 0) {
        let data = await this.taskService.handleTaskFiles(uploadPropertyFiles, files, req.user);
        uploadFile(files);
        return { message: `Files uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(TaskPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateTaskDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taskService.create(createDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaskPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaskResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: TaskFilters,
    @Query() sorting: TaskSortingDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      if(!filters?.taskType){
        filters.taskType = TaskType.normal;
      }
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.READ_ALL_TASK,  TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.READ_ALL_TASK, TaskPermissionSet.TECH_SUPPORT])
      let appliedFilters = this.taskService.applyFilters(filters, req.user, hasGlobalPermission.readAllTask);
      let dt = await this.taskService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.taskService.countRecords(appliedFilters);
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


  @CheckPermissions(TaskPermissionSet.TECH_SUPPORT)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaskResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('techSupport')
  async tehcSupport(
    @Query() filters: TaskFilters,
    @Query() sorting: TaskSortingDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      filters.taskType = TaskType.techSupport;
      let appliedFilters = this.taskService.applyFilters(filters, req.user, true);
      let dt = await this.taskService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.taskService.countRecords(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return { message: `Tech Support Tasks Fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(TaskPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.READ_ALL_TASK,  TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.READ_ALL_TASK,  TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.readAllTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
      }
      let data = await this.taskService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaskPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} order `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('updateOrder/:id')
  async updateTaskOrder(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateTaskOrderDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.updateAnyTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
      }
      let data = await this.taskService.updateTaskOrder(params.id, updateDto);
      return { message: `${moduleName} order  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  /*@CheckPermissions(TaskPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('update/:id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateTaskDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.UPDATE, TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.UPDATE, TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.updateTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
      }
      let data = await this.taskService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }*/

@CheckPermissions(TaskPermissionSet.UPDATE)
@ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are stripped out by default` })
@ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
@Patch('update/:id')
async update(
  @Param() params: ParamsDto, 
  @Body() updateDto: UpdateTaskDto,
  @Req() req: AuthenticatedRequest
): Promise<ResponseSuccess | ResponseError> {
  try {
    let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<
      [TaskPermissionSet.UPDATE, TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]
    >(req.user, [TaskPermissionSet.UPDATE, TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]);

    if (hasGlobalPermission.updateAnyTask) {
      // User has global permission, allow update
      let data = await this.taskService.update(params.id, updateDto);
      return { message: `${moduleName} updated successfully`, statusCode: 200, data: data };
    } else if (hasGlobalPermission.updateTask) {
      // Check if the user is authorized to update the specific task
      let isAuthorized = await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
      if (isAuthorized) {
        let data = await this.taskService.update(params.id, updateDto);
        return { message: `${moduleName} updated successfully`, statusCode: 200, data: data };
      } else {
        throw {
          message: "Forbidden resource",
          statusCode: 403
        }
      }
    } else {
      throw {
        message: "Forbidden resource",
        statusCode: 403
      }
    }
  } catch (err) {
    throw new HttpException(err.message, err.statusCode);
 }
}

@CheckPermissions(TaskPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('delete/:id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.DELETE_ANY_TASK, TaskPermissionSet.DELETE, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.DELETE_ANY_TASK, TaskPermissionSet.DELETE, TaskPermissionSet.TECH_SUPPORT])
      // if(!hasGlobalPermission.deleteAnyTask){
      //   await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
      // }

      // let data = await this.taskService.remove(params.id);
      // return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }

      if (hasGlobalPermission.deleteAnyTask) {
        // User has global permission, allow delete
        let data = await this.taskService.remove(params.id);
        return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data };

      } else if (hasGlobalPermission.deleteTask) {
        // Check if the user is authorized to delete the specific task
        let isAuthorized = await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
        if (isAuthorized) {
          let data = await this.taskService.remove(params.id);
          return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data };
        } else {
          throw {
            message: "Forbidden resource",
            statusCode: 403
          }
        }
      } else {
        throw {
          message: "Forbidden resource",
          statusCode: 403
        }
      }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }



  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('removeFiles/:id')
  async removeFiles(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.DELETE_FILE, TaskPermissionSet.DELETE_OWN_FILE, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.DELETE_FILE,  TaskPermissionSet.DELETE_OWN_FILE, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.deleteTaskFiles){
        if(!hasGlobalPermission.deleteTaskOwnFiles){
          await this.authorizationService.checkIfUserAuthorizedForTaskFile(req.user, params.id, hasGlobalPermission.manageTechSupportTask);
        }else{
          throw {
            message: "Forbidden resource",
            statusCode: 403
          }
        }
      }
      let data = await this.taskService.removeTaskFile(params.id, req.user);
      return { message: `File deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  

  @CheckPermissions(TaskPermissionSet.UPDATE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false })
  @Patch('updateProjectMembers')
  async updateProjectMembers(@Body() updateProjectMember: UpdateTaskMember, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.updateAnyTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, updateProjectMember.taskId, hasGlobalPermission.manageTechSupportTask);
      }
      let data = await this.taskService.updateTaskMember(updateProjectMember);
      return { message: `Project member has been updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaskPermissionSet.UPDATE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TaskResponseObject, isArray: false })
  @Delete('removeProjectMembers/:taskId/:userId')
  async removeProjectMembers(@Param() params: RemoveTaskMember, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT]>(req.user, [TaskPermissionSet.UPDATE_ANY_TASK, TaskPermissionSet.TECH_SUPPORT])
      if(!hasGlobalPermission.updateAnyTask){
        await this.authorizationService.checkIfUserAuthorizedForTask(req.user, params.taskId, hasGlobalPermission.manageTechSupportTask);
      }
      let data = await this.taskService.removeTaskMember(params);
      return { message: `Project member has been removed from the project successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
