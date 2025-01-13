import { Controller, Get, Post, Body, Patch, Param, Delete,Request, HttpException, UploadedFile, UseInterceptors, Req } from '@nestjs/common';
import { ApiConsumes, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CountryService } from './country.service';
import { countryFileUploadPath, CountryResponseObject, CountryResponseArray } from './dto/country-dto';
import { CreateCountryDto } from './dto/create-country.dto';
import { ParamsDto } from './dto/params-dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { CountryPermissionSet } from './country.permissions';
import { uploadFile } from 'src/helpers/file-management';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { Prisma } from '@prisma/client';
import { Public } from 'src/authentication/public-metadata';
// const multerOptions = getMulterOptions({ destination: countryFileUploadPath });

@ApiTags("Country")
@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) { }

  @CheckPermissions(CountryPermissionSet.CREATE)
  @ApiOperation({ summary: 'Add a new country in the system' })
  @ApiResponse({ status: 200, type: CountryResponseObject, isArray: false, description: 'Returns the new record on success' })
  @Post()
  async create(@Body() createCountryDto: CreateCountryDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.countryService.create(createCountryDto);
      return { message: "Country data saved successfully", statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }

  }

  @ApiOperation({ summary: 'Fetch all country data from the system' })
  @ApiResponse({ status: 200, type: CountryResponseArray, isArray: false, description: 'Returns the list of county in the system' })
  @Get()
  async findAll(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.countryService.findAll(req.user);
      return { message: "Country fetched Successfully", statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: 'Fetch all country data from the system' })
  @ApiResponse({ status: 200, type: CountryResponseArray, isArray: false, description: 'Returns the list of county in the system' })
  @Get('all')
  async findAllAvailableCountry(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.countryService.findAllAvailableCountry();
      return { message: "Country fetched Successfully", statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: 'Fetch all country data from the system' })
  @ApiResponse({ status: 200, type: CountryResponseArray, isArray: false, description: 'Returns the list of county in the system' })
  @Get('available-country')
  async findAvailableCountry(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.countryService.findAvailableCountry();
      return { message: "Country fetched Successfully", statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(CountryPermissionSet.UPDATE)
  @ApiOperation({ summary: 'Update country', description: "Only the white listed fields are considered, other fields are striped out by default" })
  @ApiResponse({ status: 200, type: CountryResponseObject, isArray: false, description: 'Returns the updated country object if found on the system' })
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updateCountryDto: UpdateCountryDto, 
  @Request() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      updateCountryDto['modifiedDate'] = new Date();
      let data = await this.countryService.update(params.id, updateCountryDto);
      return { message: "Country updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(CountryPermissionSet.DELETE)
  @ApiOperation({ summary: 'Delete country' })
  @ApiResponse({ status: 200, type: CountryResponseObject, isArray: false, description: 'Returns the deleted country object if found on the system' })
  @Delete(':id')
  async remove(@Param() params: ParamsDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let metaData : Prisma.CountryUncheckedUpdateInput = {
        deletedDate: new Date()
      }
      let data = await this.countryService.remove(params.id, metaData);
      return { message: "Country deleted successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(CountryPermissionSet.READ)
  @ApiOperation({ summary: 'Fetch country by id' })
  @ApiResponse({ status: 200, type: CountryResponseObject, isArray: false, description: 'Returns the country object if found on the system' })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.countryService.findOne(params.id);
      return { message: "Country data Fetched Successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
