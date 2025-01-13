import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { TaxRateService } from './tax-rate.service';
import { CreateTaxRateDto } from './dto/create-tax-rate.dto';
import { UpdateTaxRateDto } from './dto/update-tax-rate.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { TaxRateResponseObject, TaxRateResponseArray } from './dto/tax-rate.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { TaxRatePermissionSet } from './tax-rate.permissions';
import { TaxRateFiltersDto } from './dto/tax-rate.filters.dto';
import { Prisma } from '@prisma/client';
const moduleName = "tax-rate";

@ApiTags("tax-rate")
@Controller('tax-rate')
export class TaxRateController {
  constructor(private readonly taxRateService: TaxRateService) { }
  
  @CheckPermissions(TaxRatePermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaxRateResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateTaxRateDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taxRateService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaxRateResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-tax-code/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taxRateService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TaxRateResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(@Query() filters: TaxRateFiltersDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let condition: Prisma.TaxRateWhereInput = {};
      if(filters.tenantId){
        condition = {
          ...condition,
          xeroTenantId: filters.tenantId
        }
      }

      if(filters.leadId){
        let leadData = await this.taxRateService.getLeadData(filters.leadId);
        if(leadData && leadData.xeroTenantId){
          condition = {
            ...condition,
            xeroTenantId: leadData.xeroTenantId
          }
        }
      }

      let data = await this.taxRateService.findAll(condition);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: TaxRateResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taxRateService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: TaxRateResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateTaxRateDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taxRateService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TaxRateResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.taxRateService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
