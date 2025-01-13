import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req } from '@nestjs/common';
import { LeaveCreditService } from './leave-credit.service';
import { CreateLeaveCreditDto } from './dto/create-leave-credit.dto';
import { UpdateLeaveCreditDto } from './dto/update-leave-credit.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { LeaveCreditResponseObject, LeaveCreditResponseArray } from './dto/leave-credit.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { LeaveCreditPermissionSet } from './leave-credit.permissions';
const moduleName = "leave-credit";

@ApiTags("leave-credit")
@Controller('leave-credit')
export class LeaveCreditController {
  constructor(private readonly leaveCreditService: LeaveCreditService) { }
  
  @CheckPermissions(LeaveCreditPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: LeaveCreditResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateLeaveCreditDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveCreditService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveCreditPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: LeaveCreditResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateLeaveCreditDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveCreditService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(LeaveCreditPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: LeaveCreditResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.leaveCreditService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
