import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, Req, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { ParamsDto } from './dto/params.dto';
import { TransactionResponseObject, TransactionResponseArray, getDynamicUploadPath } from './dto/transactions.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { TransactionPermissionSet } from './transactions.permissions';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { TransactionPaginationDto } from './dto/transaction-pagination.dto';
import { TransactionSortingDto } from './dto/transaction-sorting.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { extractRelativePathFromFullPath, getMulterOptions, removeUploadedFiles } from 'src/helpers/file-upload.utils';
import { uploadFile } from 'src/helpers/file-management';
import { AssignTransactionDto } from './dto/assign-transaction.dto';
import { SystemLogger } from '../system-logs/system-logger.service';
const multerOptionsProtected = getMulterOptions({ destination: getDynamicUploadPath(), fileTypes: 'images_and_pdf', limit: 10000000 });
const moduleName = "transactions";

@ApiTags("transactions")
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService, private readonly systemLogger: SystemLogger) { }

  @CheckPermissions(TransactionPermissionSet.CREATE)
  @ApiOperation({ summary: `Add a new ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TransactionResponseObject, isArray: false, description: `Returns the new ${moduleName} record on success` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt', multerOptionsProtected))
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto,
    @UploadedFile() receipt: Express.Multer.File,
    @Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      if (receipt) {
        createTransactionDto.receipt = extractRelativePathFromFullPath(receipt.path);
      }
      let data = await this.transactionsService.create(createTransactionDto, req.user);
      await uploadFile(receipt);
      return { message: `${moduleName} created successfully`, statusCode: 200, data: data };
    } catch (err) {
      removeUploadedFiles(receipt);
      throw new HttpException(err.message, err.statusCode);
    }
  }


  @CheckPermissions(TransactionPermissionSet.READ)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @ApiResponse({ status: 200, type: TransactionResponseArray, isArray: false, description: `Return a list of ${moduleName} available` })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filters: TransactionFiltersDto,
    @Query() pagination: TransactionPaginationDto,
    @Query() sorting: TransactionSortingDto,
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let filtersApplied = this.transactionsService.applyFilters(filters);
      let dt = this.transactionsService.findAll(pagination, sorting, filtersApplied);
      let tCount = this.transactionsService.countTotalRecord(filtersApplied);
      const [data, totalCount] = await Promise.all([dt, tCount]);
      let pageCount = Math.floor(totalCount / pagination.perPage) + ((totalCount % pagination.perPage) === 0 ? 0 : 1);
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: data,
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

  @CheckPermissions(TransactionPermissionSet.READ)
  @ApiOperation({ summary: `Fetch ${moduleName}  by id` })
  @ApiResponse({ status: 200, type: TransactionResponseObject, isArray: false, description: `Returns the ${moduleName} object if found on the system` })
  @Get(':id')
  async findOne(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.transactionsService.findOne(params.id);
      return { message: `${moduleName}  fetched Successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TransactionPermissionSet.UPDATE)
  @ApiOperation({ summary: `Assign Transaction to a User` })
  @ApiResponse({ status: 200, type: TransactionResponseObject, isArray: false, description: `Assign Transaction to a User` })
  @Patch('assignTransaction/:id')
  async assignTransaction(@Param() params: ParamsDto,
    @Body() assignTransactionDto: AssignTransactionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.transactionsService.assignTransaction(params.id, assignTransactionDto, req.user);
      this.systemLogger.logData({
        tableName: "Transactions",
        field: 'id',
        value: params.id,
        actionType: 'ASSIGN_TRANSACTION',
        valueType: "number",
        user: req.user.userId,
        data: assignTransactionDto,
        endPoint: req.originalUrl,
        controllerName: this.constructor.name,
        message: "Transaction Assigned"
      })
      return { data: data, statusCode: 200, message: "Transaction Assigned Successfully" }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TransactionPermissionSet.UPDATE)
  @ApiOperation({ summary: `Update ${moduleName} `, description: `Only the ${moduleName} white listed fields are considered, other fields are striped out by default` })
  @ApiResponse({ status: 200, type: TransactionResponseObject, isArray: false, description: `Returns the updated ${moduleName} object if found on the system` })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt', multerOptionsProtected))
  @Patch(':id')
  async update(@Param() params: ParamsDto,
    @UploadedFile() receipt: Express.Multer.File,
    @Body() updateTransactionDto: UpdateTransactionDto): Promise<ResponseSuccess | ResponseError> {
    try {
      if (receipt) {
        updateTransactionDto.receipt = extractRelativePathFromFullPath(receipt.path);
      }
      let data = await this.transactionsService.update(params.id, updateTransactionDto);
      await uploadFile(receipt);
      return { message: `${moduleName}  updated successfully`, statusCode: 200, data: data }
    } catch (err) {
      removeUploadedFiles(receipt);
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(TransactionPermissionSet.DELETE)
  @ApiOperation({ summary: `Delete ${moduleName}` })
  @ApiResponse({ status: 200, type: TransactionResponseObject, isArray: false, description: `Returns the deleted ${moduleName} object if found on the system` })
  @Delete(':id')
  async remove(@Param() params: ParamsDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.transactionsService.remove(params.id);
      return { message: `${moduleName} deleted successfully`, statusCode: 200, data: data }
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
}
