import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { BrandingThemeService } from './branding-theme.service';
import { CreateBrandingThemeDto } from './dto/create-branding-theme.dto';
import { UpdateBrandingThemeDto } from './dto/update-branding-theme.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { BrandingThemeResponseObject, BrandingThemeResponseArray } from './dto/branding-theme.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BrandingThemePermissionSet } from './branding-theme.permissions';
const moduleName = "branding-theme";

@ApiTags("branding-theme")
@Controller('branding-theme')
export class BrandingThemeController {
  constructor(private readonly brandingThemeService: BrandingThemeService) { }
  
  @CheckPermissions(BrandingThemePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BrandingThemeResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateBrandingThemeDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.brandingThemeService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(BrandingThemePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BrandingThemeResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.brandingThemeService.findAll({});
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BrandingThemePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BrandingThemeResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.brandingThemeService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BrandingThemePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BrandingThemeResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateBrandingThemeDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.brandingThemeService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BrandingThemePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: BrandingThemeResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.brandingThemeService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
