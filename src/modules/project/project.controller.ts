import { Controller, Get, Post, Body, Patch, Param, Request, Delete, HttpException, Query, UseInterceptors, UploadedFiles, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { FindBySlugDto, Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ProjectResponseObject, ProjectResponseArray, getDynamicUploadPath } from './dto/project.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ProjectPermissionSet } from './project.permissions';
import { ProjectFiltersDto } from './dto/project-filters.dto';
import { getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadProjectFiles } from './dto/upload-files.dto';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { uploadFile } from 'src/helpers/file-management';
import { RemoveProjectClient, RemoveProjectMember } from './dto/remove-project-member.dto';
import { UpdateProjectMember } from './dto/update-project-member.dto';
import { UpdateProjectStatus } from './dto/update-project-status.dto';
import { ProjectResourcesFiltersDto } from './dto/project-resouces-filters.dto';
import { CreateProjectNoteDto } from './dto/create-project-note.dto';
import { HoldProjectDto, UnholdProjectDto } from './dto/hold-project.dto';
import { UpdateProjectFiles } from './dto/update-files.dto';
import { ProjectAuthorizationService } from './project.authorization.service';
import { ProjectNotePaginationDto } from './dto/project-note.pagination.dto';
import { ProjectChatFiltersDto } from './dto/project-chat-filters.dto';
import { ShareFilesToClient } from './dto/share-files-to-client.dto';

import { CreateProjectEnableStateDto } from './dto/create-project-enable-state.dto';

import { ParseIntPipe } from '@nestjs/common';


const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath("organization"), fileTypes: 'all_files', limit: 100000000 });
const moduleName = "project";

@ApiTags("project")
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService, private readonly authorizationService: ProjectAuthorizationService) { }
  @CheckPermissions(ProjectPermissionSet.UPLOAD_PROJECT_FILES)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload property Files` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post("uploadProjectFiles")
  async uploadPropertyFiles(@Body() uploadPropertyFiles: UploadProjectFiles,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT, ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT,ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!(hasGlobalPermission.updateAnyProject || hasGlobalPermission.readAllProject)) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, uploadPropertyFiles.projectId);
      }
      if (files && files.length > 0) {
        let data = await this.projectService.handlePropertyFiles(uploadPropertyFiles, files, req.user);
        await uploadFile(files);
        return { message: `Images uploaded successfully`, statusCode: 200, data: data };
      } else {
        throw Error("No files to upload")
      }
    } catch (err) {
      removeUploadedFiles(files);
      throw new HttpException(err.message, err.statusCode = 400);
    }
  }

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Upload conversation Files` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the uploaded files on success` })
  @UseInterceptors(FilesInterceptor('files[]', 20, multerOptionsProtected))
  @Post("uploadConversationFiles/:id")
  async uploadConversationFiles(
    @Param() params: ParamsDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      if (files && files.length > 0) {
        let data = await this.projectService.handleConversationFiles(params.id, files, req.user);
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

  @CheckPermissions(ProjectPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system`, deprecated: true, description: "You can no longer create project directly, it should be created from Approved Quotation" })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateProjectDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      throw {
        message: "You can no longer create project directly, it should be created from Approved Quotation",
        statusCode: 400
      }
      createDto.addedById = req.user.userId;
      let data = await this.projectService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  


  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-slug/:slug')
  async findBySlug(@Param() findBySlugDto: FindBySlugDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT, ProjectPermissionSet.READ_FINANCE_REPORT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT, ProjectPermissionSet.READ_FINANCE_REPORT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProjectBySlug(req.user, findBySlugDto.slug);
      }
      let data = await this.projectService.findBySlug(findBySlugDto.slug);
      if (hasGlobalPermission.readFinanceReport) {
        let financeReport = await this.projectService.prepareFinanceReport(data.id, data.projectEstimate);
        data["FinanceReport"] = financeReport;
      }
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: ProjectFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      let appliedFilters = this.projectService.applyFilters(filters, req.user, hasGlobalPermission.readAllProject);
      let dt = await this.projectService.findAll(appliedFilters, pagination, filters);
      let tCount = this.projectService.countProject(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
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

  // @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('getProjectForConversation')
  async getProjectForConversation(
    @Query() filters: ProjectChatFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      let appliedFilters = this.projectService.applyConversationFilter(filters, req.user, hasGlobalPermission.readAllProject);
      let dt = await this.projectService.getProjectForConversation(filters, pagination, req.user, hasGlobalPermission.readAllProject);
      let tCount = this.projectService.countProject(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
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
  @ApiResponse({ status: 200, type: ProjectResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('project-list')
  async findProjectList(
    @Query() filters: ProjectFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.projectService.applyFilters(filters, req.user, true);
      let dt = await this.projectService.findProjectList(appliedFilters, pagination);
      let tCount = this.projectService.countProject(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findOne/:id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('findEnableStates/:id')
  async findMany(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Post('shareFiles')
  async shareFiles(@Body() shareFiles: ShareFilesToClient, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, shareFiles.projectId);
      }
      let data = await this.projectService.shareFilesToClient(shareFiles, req.user);
      return { message: shareFiles.shareInEmail ? "Files shared to client successfully" : "Files are marked as shared successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('sharedFiles/:id')
  async sharedFiles(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.findSharedFiles(params.id);
      return { message: "Files fetched Successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('update/:id')
  async update(@Param() params: ParamsDto,
    @Body() updateDto: UpdateProjectDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      updateDto["modifiedById"] = req.user.userId
      let data = await this.projectService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch('updateFiles/:id')
  async updateFiles(@Param() params: ParamsDto,
    @Body() updateDto: UpdateProjectFiles,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.checkIfUserAuthorizedForProjectFile(req.user, params.id);
      updateDto["modifiedById"] = req.user.userId
      let data = await this.projectService.updateFiles(params.id, updateDto);
      return { message: `File updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.HOLD_UNHOLD_PROJECT)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Hold the project` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `SetHold to true` })
  @Patch('holdProject/:id')
  async holdProject(@Param() params: ParamsDto,
    @Body() updateDto: HoldProjectDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.holdProject(params.id, updateDto, req.user);
      return { message: `Project is now on hold`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.HOLD_UNHOLD_PROJECT)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Resume project` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `SetHold to false` })
  @Patch('unholdProject/:id')
  async unholdProject(@Param() params: ParamsDto,
    @Body() updateDto: UnholdProjectDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.unholdProject(params.id, updateDto, req.user);
      return { message: `Project is now active`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE_PROJECT_MEMBERS)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false })
  @Delete('removeProjectMembers/:projectId/:userId')
  async removeProjectMembers(@Param() params: RemoveProjectMember, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.projectId);
      }
      let data = await this.projectService.removeProjectMember(params);
      return { message: `Project member has been removed from the project successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE_PROJECT_MEMBERS)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false })
  @Delete('removeProjectClient/:projectId/:clientId')
  async removeProjectClient(@Param() params: RemoveProjectClient, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.projectId);
      }
      let data = await this.projectService.removeProjectClient(params);
      return { message: `Client has been removed from the project successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.DELETE_PROJECT_FILES)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false })
  @Delete('removeProjectFiles/:id')
  async removeProjectFiles(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProjectResources(req.user, params.id);
      }
      let data = await this.projectService.removeProjectFiles(params.id, req.user);
      return { message: `Project files has been removed from the project successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.UPDATE_PROJECT_MEMBERS)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false })
  @Patch('updateProjectMembers')
  async updateProjectMembers(@Body() updateProjectMember: UpdateProjectMember, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, updateProjectMember.projectId);
      }
      let data = await this.projectService.updateProjectMember(updateProjectMember);
      return { message: `Project member has been updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProjectPermissionSet.CHANGE_STATUS)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false })
  @Patch('updateProjectStatus')
  async updateProjectStatus(@Body() updateProjectStatus: UpdateProjectStatus, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT])
      if (!hasGlobalPermission.updateAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProjectResources(req.user, updateProjectStatus.projectId);
      }
      let data = await this.projectService.updateProjectStatus(updateProjectStatus, req.user);
      return { message: `Project status has been updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


@Post('addProjectStates/:id')
async addProjectStates(
  @Param() params: ParamsDto,
  @Body() CreateProjectEnableStateDto: CreateProjectEnableStateDto,
  @Req() req: AuthenticatedRequest
): Promise<ResponseSuccess | ResponseError> {
  // Logging data for debugging
  console.log('Received data:', CreateProjectEnableStateDto);

  try {
    // Check if `projectStateIds` is an array
    let newStates = Array.isArray(CreateProjectEnableStateDto.projectStateIds) 
      ? CreateProjectEnableStateDto.projectStateIds
      : [CreateProjectEnableStateDto.projectStateIds];

    console.log('Processed new states:', newStates);

    // Find existing states and filter unique
    let projectEnableStates = await this.projectService.findProjectStatesByStateIds(params.id, newStates);
    let existingStates = projectEnableStates.map((ele) => ele.pstateId);
    let uniqueStates = newStates.filter((ele) => !existingStates.includes(ele));

    console.log('Unique states to insert:', uniqueStates);

    let data = await this.projectService.addProjectStates(params.id, uniqueStates);
    return { message: `Project states fetched successfully`, statusCode: 200, data: data };
  } catch (err) {
    console.error('Error occurred:', err);
    throw new HttpException(err.message, err.statusCode);
  }
}


@ApiOperation({ summary: `Remove project states` })
@ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the states of the project` })
@Patch('removeProjectStates/:id')
async removeProjectStates(@Param() params: ParamsDto,
  @Body() CreateProjectEnableStateDto: CreateProjectEnableStateDto,
  @Req() req: AuthenticatedRequest
): Promise<ResponseSuccess | ResponseError> {
  try {
    // Ensure projectStateIds is always an array of numbers
    const states = Array.isArray(CreateProjectEnableStateDto.projectStateIds)
      ? CreateProjectEnableStateDto.projectStateIds
      : [CreateProjectEnableStateDto.projectStateIds];

    // Call the service with the correct data format
    const data = await this.projectService.removeProjectStatesByStateIds(params.id, states);
    return { message: `Project states deleted successfully`, statusCode: 200, data: data };
  } catch (err) {
    throw new HttpException(err.message, err.statusCode);
  }
}



  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} files from the system` })
  @ApiResponse({ status: 200, type: ProjectResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('getProjectResources')
  async findProjectFiles(
    @Query() filters: ProjectResourcesFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, filters.projectId);
      }
      let appliedFilters = this.projectService.applyResourcesFilters(filters);
      let dt = await this.projectService.findAllResources(appliedFilters, pagination);
      let tCount = this.projectService.countProjectResources(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} resources fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} notes from the system` })
  @ApiResponse({ status: 200, type: ProjectResponseArray, isArray: false, description: `Return a list of ${moduleName} notes available` })
  @Get('getProjectNotes')
  async findProjectNotes(
    @Query() filters: ProjectResourcesFiltersDto,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: ProjectNotePaginationDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!hasGlobalPermission.readAllProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, filters.projectId);
      }
      let appliedFilters = this.projectService.applyNotesFilters(filters);
      let dt = await this.projectService.findProjectNotes(appliedFilters, pagination);
      this.projectService.readAllConversation(filters.projectId, req.user);
      let tCount = this.projectService.countProjectNotes(appliedFilters);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} notes fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(ProjectPermissionSet.READ)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('addProjectNote')
  async createProjectNote(@Body() createDto: CreateProjectNoteDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.UPDATE_ANY_PROJECT, ProjectPermissionSet.REAL_ALL_PROJECT]>(req.user, [ProjectPermissionSet.UPDATE_ANY_PROJECT, ProjectPermissionSet.REAL_ALL_PROJECT])
      if (!(hasGlobalPermission.updateAnyProject || hasGlobalPermission.readAllProject)) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, createDto.projectId);
      }
      let data = await this.projectService.createProjectNote(createDto, req.user);
      return { message: `Message sent successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('removeNote/:id')
  async removeProjectNote(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.checkIfUserAuthorizedForProjectNote(req.user, params.id);
      let data = await this.projectService.removeNote(params.id);
      return { message: `Message deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('removeNoteMedia/:id')
  async removeNoteMedia(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.checkIfUserAuthorizedForProjectNote(req.user, params.id);
      let data = await this.projectService.removeNoteMedia(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, (err.statusCode) ? err.statusCode : 404);
    }
  }

  @CheckPermissions(ProjectPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProjectResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let hasGlobalPermission = await this.authorizationService.findUserPermissionsAgainstSlugs<[ProjectPermissionSet.DELETE_ANY_PROJECT]>(req.user, [ProjectPermissionSet.DELETE_ANY_PROJECT])
      if (!hasGlobalPermission.deleteAnyProject) {
        await this.authorizationService.checkIfUserAuthorizedForProject(req.user, params.id);
      }
      let data = await this.projectService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
