import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { SitePagesContentService } from './site-pages-content.service';
import { CreateSitePagesContentDto } from './dto/create-site-pages-content.dto';
import { UpdateSitePagesContentDto } from './dto/update-site-pages-content.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { SitePagesContentResponseObject, SitePagesContentResponseArray, sitePagesContentFileUploadPath } from './dto/site-pages-content.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { SitePagesContentPermissionSet } from './site-pages-content.permissions';
import { extractRelativePathFromFullPath, getMulterOptions } from 'src/helpers/file-upload.utils';
import { FileInterceptor } from '@nestjs/platform-express';
import { uploadFile } from 'src/helpers/file-management';
const multerOptions = getMulterOptions({ destination: sitePagesContentFileUploadPath, fileTypes:'images_only_with_svg' });
const moduleName = "Site pages content";

@ApiTags("site-pages-content")
@Controller('site-pages-content')
export class SitePagesContentController {
  constructor(private readonly sitePagesContentService: SitePagesContentService) { }
  
  @CheckPermissions(SitePagesContentPermissionSet.CREATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Post()
  async create(@Body() createSitePagesContentDto: CreateSitePagesContentDto,  
  @UploadedFile() image: Express.Multer.File,): Promise<ResponseSuccess | ResponseError> {
    try {
      if (image) {
        createSitePagesContentDto.image = extractRelativePathFromFullPath(image.path);
      }

      let sectionData = await this.sitePagesContentService.getSectionData(createSitePagesContentDto.pageSectionId);
      if(!sectionData.hasMultipleItems){
        let existingData = await this.sitePagesContentService.checkIfSectionHasContentForCountry(sectionData.id);
        if(existingData){
          throw {message: "This page section allows only single item, please change to multiple items if you want to add more items to the section", statusCode: 400}
        }
      }

      let data = await this.sitePagesContentService.create(createSitePagesContentDto);
      uploadFile(image);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesContentPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesContentService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(SitePagesContentPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('pageContentByCategory/:id')
  async findAllByPageSection( @Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesContentService.findAllByPageSection(params.id);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesContentPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesContentService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesContentPermissionSet.UPDATE)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @UseInterceptors(FileInterceptor('image', multerOptions))
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateSitePagesContentDto: UpdateSitePagesContentDto,
  @UploadedFile() image: Express.Multer.File,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      if (image) {
        updateSitePagesContentDto.image = extractRelativePathFromFullPath(image.path)
      }
      let data = await this.sitePagesContentService.update(params.id, updateSitePagesContentDto);
      uploadFile(image);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(SitePagesContentPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: SitePagesContentResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.sitePagesContentService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
