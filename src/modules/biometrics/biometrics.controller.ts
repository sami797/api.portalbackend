import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { BiometricsService } from './biometrics.service';
import { CreateBiometricDto } from './dto/create-biometric.dto';
import { UpdateBiometricDto } from './dto/update-biometric.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { Pagination, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { BiometricsResponseObject, BiometricsResponseArray, getDynamicUploadPath } from './dto/biometrics.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { BiometricsPermissionSet } from './biometrics.permissions';
import { BiometricsFilters } from './dto/biometrics-filters.dto';
import { Public } from 'src/authentication/public-metadata';
import { findClientIpAddress } from 'src/helpers/helpers';
import { BiometricsAuthorizationService } from './biometrics.authorization.service';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { CheckInCheckOutBiometricDto } from './dto/checkin-checkout-biometric.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
// const ZKLib = require('zklib');
const moduleName = "biometrics";
const multerOptions = getMulterOptions({ destination: getDynamicUploadPath('protected'), fileTypes: 'all_files', limit: 10000000 });


@ApiTags("biometrics")
@Controller('biometrics')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService, private readonly authorizationService: BiometricsAuthorizationService) { }
   

  @Public()
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('test')
  async createData(@Req() req: any): Promise<ResponseSuccess | ResponseError> {
    try {
      console.log("Body",req.body);
      console.log("Params",req.params);
      console.log("Query",req.query);
      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);
      console.log("userAgent", userAgent);
      console.log("clientIPAddress", clientIPAddress);

      // const ZK = new ZKLib({
      //   ip: '192.168.1.222',
      //   // port: 4370,
      //   inport: 4370,
      //   timeout: 5000,
      // })
       
      // // connect to access control device
      // ZK.connect(function(err) {
      //   if (err) {
      //     console.log("Some error while connecting to zklib", err.message);
      //     return;
      //     // throw err
      //   };
       
      //   // read the time info from th device
      //   // ZK.getTime(function(err, t) {
      //     // disconnect from the device
      //     // ZK.disconnect();
       
      //     // if (err) throw err;
       
      //   //   console.log("Device clock's time is " + t.toString());
      //   // });

      //   ZK.getAttendance(function(err, t){
      //     if(err){
      //       console.log("Some error while reading attendance");
      //       return
      //     }
      //     console.log("Attendance Data", t);
      //     // ZK.clearAttendanceLog(function(err, clearDT){
      //       ZK.disconnect();
      //     //   if(err){
      //     //     console.log("Some error while clearing attendance");
      //     //     return
      //     //   }
      //     //   console.log("Cleared Data", clearDT);
      //     // })
      //   })
      // });

      let data = "";
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @Public()
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Get('test')
  async createDataTest(@Req() req: any): Promise<ResponseSuccess | ResponseError> {
    try {
      console.log("Body Get",req.body);
      console.log("Params",req.params);
      console.log("Query",req.query);
      let userAgent = req.headers["user-agent"];
      let clientIPAddress = findClientIpAddress(req);
      console.log("userAgent", userAgent);
      console.log("clientIPAddress", clientIPAddress);
      let data = "";
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateBiometricDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsService.create(createDto, req.user);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post('checkInCheckout')
  @UseInterceptors(FileInterceptor('selfie', multerOptions))
  async checkInCheckout(
    @Body() createDto: CheckInCheckOutBiometricDto,
    @UploadedFile() selfie: Express.Multer.File,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {

      if(!selfie){
        throw {
          message: "Please upload a selfie image",
          statusCode: 400
        }
      }

      if(selfie){
        createDto.selfie = extractRelativePathFromFullPath(selfie.path);
      }
      
      createDto.checkIn = new Date();
      let userAgent = req.headers["user-agent"];
      if(userAgent){
        createDto.userAgent = userAgent.slice(0,250);
      }
      let clientIPAddress = findClientIpAddress(req);
      if(clientIPAddress){
        createDto.userIP = clientIPAddress;
      }

      await this.biometricsService.validateCheckInCheckOut(createDto, req.user);
      let data = await this.biometricsService.checkInCheckOut(createDto, req.user);
      uploadFile(selfie)
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(selfie);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get('todayCheckInCheckOut')
  async getTodayCheckInCheckOut(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsService.getTodayCheckInCheckOut(req.user.userId);
      return { message: `Biometrics Data of today for the userId ${req.user.userId} fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: BiometricsResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Query() filters: BiometricsFilters,
    @Req() req: AuthenticatedRequest,
    @Query() pagination: Pagination): Promise<ResponseSuccess | ResponseError> {
    try {
      let permissions =  await this.authorizationService.findUserPermissionsAgainstSlugs<[BiometricsPermissionSet.READ_ALL]>(req.user,[BiometricsPermissionSet.READ_ALL])
      if(!permissions.readAllBiometrics){
        filters.userId = req.user.userId
      }
      let appliedFilters = this.biometricsService.applyFilters(filters);
      let dt = await this.biometricsService.findAll(appliedFilters, pagination);
      let tCount = this.biometricsService.countRecords(appliedFilters);
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

  @CheckPermissions(BiometricsPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto, @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      await this.authorizationService.isAuthorizedForBiometrics(params.id, req.user);
      let data = await this.biometricsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateBiometricDto,
  @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsService.update(params.id, updateDto, req.user);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(BiometricsPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName} `})
  @ApiResponse({ status: 200, type: BiometricsResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async delete(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.biometricsService.delete(params.id);
      return { message: `${moduleName}  deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
