import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FindBySlugDto, ParamsDto, ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ProductResponseObject, ProductResponseArray } from './dto/product.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { ProductPermissionSet } from './product.permissions';
const moduleName = "product";

@ApiTags("product")
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) { }
  
  @CheckPermissions(ProductPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProductResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createDto: CreateProductDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.create(createDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProductPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProductResponseObject, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get('find-by-product-code/:slug')
  async findBySlug( @Param() findBySlugDto: FindBySlugDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.findBySlug(findBySlugDto.slug);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProductPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: ProductResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.findAll({});
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data};
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProductPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: ProductResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProductPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: ProductResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, 
  @Body() updateDto: UpdateProductDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.update(params.id, updateDto);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(ProductPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: ProductResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.productService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
       throw new HttpException(err.message, err.statusCode);
    }
  }
}
