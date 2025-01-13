import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { AccountResponseObject, AccountResponseArray } from './dto/account.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { AccountPermissionSet } from './account.permissions';
import { AccountFiltersDto } from './dto/account.filters.dto';
import { Prisma } from '@prisma/client';
const moduleName = "account";

@ApiTags("account")
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) { }
  
  @CheckPermissions(AccountPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AccountResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateAccountDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.accountService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AccountPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AccountResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-account-code/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.accountService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AccountPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: AccountResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(@Query() filters: AccountFiltersDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let condition: Prisma.AccountWhereInput = {};
    if(filters.tenantId){
        condition = {
          ...condition,
          xeroTenantId: filters.tenantId
        }
      }

      if(filters.leadId){
        let leadData = await this.accountService.getLeadData(filters.leadId);
        if(leadData && leadData.xeroTenantId){
          condition = {
            ...condition,
            xeroTenantId: leadData.xeroTenantId
          }
        }
      }

      let data = await this.accountService.findAll(condition);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AccountPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: AccountResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.accountService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AccountPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: AccountResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateAccountDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.accountService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(AccountPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: AccountResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.accountService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
