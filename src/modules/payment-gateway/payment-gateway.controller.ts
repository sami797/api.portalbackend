import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { PaymentGatewayResponseObject, PaymentGatewayResponseArray } from './dto/payment-gateway.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParamsDto } from './dto/params.dto';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { PaymentGatewayPermissionSet } from './payment-gateway.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { PaymentGateway, Prisma } from '@prisma/client';

const moduleName = "payment-gateway";

@ApiTags("payment-gateway")
@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentGatewayService: PaymentGatewayService) {}
  
  @CheckPermissions(PaymentGatewayPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @Post()
  async create(@Body() createPaymentGatewayDto: CreatePaymentGatewayDto,
  @Req() req: AuthenticatedRequest
  ) : Promise<ResponseSuccess | ResponseError> {
    try {
      createPaymentGatewayDto['addedById'] = req.user.userId;
      let data = await this.paymentGatewayService.create(createPaymentGatewayDto);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PaymentGatewayPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll() : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.paymentGatewayService.findAll();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PaymentGatewayPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto) : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.paymentGatewayService.findOne(params.id);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PaymentGatewayPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @Patch(':id')
  async update(@Param() params: ParamsDto, @Body() updatePaymentGatewayDto: UpdatePaymentGatewayDto,
  @Req() req: AuthenticatedRequest
  )  : Promise<ResponseSuccess | ResponseError> {
    try {
      updatePaymentGatewayDto['modifiedDate'] = new Date();
      updatePaymentGatewayDto['modifiedById'] = req.user.userId;
      let data = await this.paymentGatewayService.update(params.id, updatePaymentGatewayDto);
      return { message: "Record updated successfully", statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(PaymentGatewayPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto, 
  @Req() req: AuthenticatedRequest
  )  : Promise<ResponseSuccess | ResponseError>{
    try {
      let updateRecord : Prisma.PaymentGatewayUncheckedUpdateInput = {
        deletedById: req.user.userId,
        deletedDate: new Date()
      }
      let data = await this.paymentGatewayService.remove(params.id, updateRecord);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

}
