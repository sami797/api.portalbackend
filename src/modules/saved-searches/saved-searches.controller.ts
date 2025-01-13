import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req, Query } from '@nestjs/common';
import { SavedSearchesService } from './saved-searches.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { SavedSearchesResponseObject, SavedSearchesResponseArray } from './dto/saved-searches.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SavedSearchesPermissionSet } from './saved-searches.permissions';
import { Public } from 'src/authentication/public-metadata';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { SavedSearchesFiltersDto } from './dto/saved-searches-filters.dto';
import { SavedSearchesPaginationDto } from './dto/saved-searches-pagination.dto';
import { SavedSearchesSortingDto } from './dto/saved-searches-sorting.dto';
import { AuthorizationService } from 'src/authorization/authorization.service';
import { CreateAdminSavedSearchDto } from './dto/create-saved-search-admin.dto';
import { SavedSearchesAdminFiltersDto } from './dto/saved-searches-admin-filters.dto';
const moduleName = "saved-searches";

@ApiTags("saved-searches")
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService, private readonly authorizationService: AuthorizationService) { }

  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createAlertDto: CreateSavedSearchDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      createAlertDto['userId'] = req.user.userId;
      let data = await this.savedSearchesService.create(createAlertDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('admin')
  async createFilters(@Body() createAlertDto: CreateAdminSavedSearchDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      if(createAlertDto.visibility === 'global'){
        let hasPermission = await this.authorizationService.checkIfUserAuthorized(req.user, [SavedSearchesPermissionSet.CREATE_GLOBAL]);
        if(!hasPermission){
          throw {message: "You don't have enough permission to add global filters", statusCode: 403}
        }
      }
      let data = await this.savedSearchesService.createAdminpanelFilters(createAlertDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }



  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get('findAdminPanelFilters')
  async findAllAdminpanel(
    @Req() req: AuthenticatedRequest,
    @Query() filters: SavedSearchesAdminFiltersDto,
    @Query() pagination: SavedSearchesPaginationDto,
    @Query() sorting: SavedSearchesSortingDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.savedSearchesService.applyAdminFilters(filters);
      appliedFilters = {...appliedFilters, forAdminpanel: true,
      AND:{
        OR:[
          {
            userId: req.user.userId, 
            visibility: 'self',
          },
          {
            visibility: 'global'
          }
        ]
      }
      };
      let dt = this.savedSearchesService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.savedSearchesService.countSavedSearches(appliedFilters);
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


  @ApiOperation({ summary: `Fetch all ${moduleName}(s) in the system` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseArray, isArray: false, description: `Return a list of ${moduleName}(s) available` })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filters: SavedSearchesFiltersDto,
    @Query() pagination: SavedSearchesPaginationDto,
    @Query() sorting: SavedSearchesSortingDto
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let appliedFilters = this.savedSearchesService.applyFilters(filters);
      appliedFilters = {...appliedFilters, userId: req.user.userId, visibility: 'self', forAdminpanel: false};
      let dt = this.savedSearchesService.findAll(appliedFilters, pagination, sorting);
      let tCount = this.savedSearchesService.countSavedSearches(appliedFilters);
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


  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest ): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.checkIfUserAuthorizedForSavedSearches(req.user, params.id)
      let data = await this.savedSearchesService.findOne(params.id, req.user);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('all')
  async removeAll(@Req() req: AuthenticatedRequest ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.savedSearchesService.removeAllSavedSearches(req.user.userId, false);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete('all-adminpanel-saved-searches')
  async removeAllAdminpanelFilters(@Req() req: AuthenticatedRequest ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.savedSearchesService.removeAllSavedSearches(req.user.userId, true);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SavedSearchesResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,  @Req() req: AuthenticatedRequest ): Promise<ResponseSuccess | ResponseError> {
    try {
      let savedSearch = await this.savedSearchesService.findOneById(params.id);
      if(savedSearch.visibility === 'global'){
        let hasPermission = await this.authorizationService.checkIfUserAuthorized(req.user, [SavedSearchesPermissionSet.DELETE_GLOBAL]);
        if(!hasPermission){
          throw {message: "You don't have enough permission to delete a global filter", statusCode: 403}
        }
      }else if(savedSearch.visibility === 'organization'){
        let hasPermission = await this.authorizationService.checkIfUserAuthorized(req.user, [SavedSearchesPermissionSet.DELETE_ORGANIZATION]);
        if(!hasPermission){
          throw {message: "You don't have enough permission to delete a organization filter", statusCode: 403}
        }
        await this.authorizationService.checkIfUserAuthorizedForSavedSearches(req.user, params.id)
      }else{
        await this.authorizationService.checkIfUserAuthorizedForSavedSearches(req.user, params.id)
      }
      let data = await this.savedSearchesService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

}
