import { Body, Controller, Get, HttpException, Post, Req, Headers, RawBodyRequest, Patch, HttpStatus, UseGuards } from '@nestjs/common';
import { XeroAccountingService } from './xero-accounting.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseError, ResponseSuccess } from 'src/common-types/common-types';
import { AuthenticatedRequest } from 'src/authentication/authenticated-request';
import { Public } from 'src/authentication/public-metadata';
import e, { Request } from "express";
import { XeroQuoteFiltersDto } from './dto/xero-quote-filters.dto';
import { CheckPermissions } from 'src/authorization/authorization-decorator';
import { QuotationPermissionSet } from '../quotation/quotation.permissions';
import { Quotation } from '@prisma/client';
import { XeroAccountingPermissionSet } from './xero-accounting.pwemissions';
import { AccountPermissionSet } from '../account/account.permissions';
import { ProductPermissionSet } from '../product/product.permissions';
import { TaxRatePermissionSet } from '../tax-rate/tax-rate.permissions';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';

const moduleName = "xero-accounting";
@Controller('xero')
export class XeroAccountingController {
  constructor(private readonly xeroAccountingService: XeroAccountingService) { }
  @Get('projects/sync')
  async syncProjects(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
      try {
          // This method will already save projects to the database internally
          const data = await this.xeroAccountingService.getProjects(); 
          
          return {
              message: `Projects fetched and saved successfully`,
              statusCode: 200,
              data: data,
          };
      } catch (err) {
          throw new HttpException(err.message, err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  
  @Get('projects')
  async getProjects(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
      try {
          const data = await this.xeroAccountingService.getProjects();
          return {
              message: `Projects fetched successfully`,
              statusCode: 200,
              data: data,
          };
      } catch (err) {
          throw new HttpException(err.message, err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
      }
  }
  
  
  @Get('quotations/sync')
  async syncQuotations(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      // This method will already save quotations to the database internally
      const data = await this.xeroAccountingService.getQuotations();

      return {
        message: `Quotations fetched and saved successfully`,
        statusCode: 200,
        data: data,
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('quotations')
  async getQuotations(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      const data = await this.xeroAccountingService.getQuotations();
      return {
        message: `Quotations fetched successfully`,
        statusCode: 200,
        data: data,
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }



  

  @CheckPermissions(XeroAccountingPermissionSet.LOGIN)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Get('getConsentUrl')
  async findAll(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.getAccessToken();
      return {
        message: `${moduleName} fetched Successfully`, statusCode: 200, data: {
          consentUrl: data
        }
      };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(XeroAccountingPermissionSet.LOGIN)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Post('authenticate')
  async authenticate(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.authenticate(req.body.callbackUrl);
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(XeroAccountingPermissionSet.LOGOUT)
  @ApiOperation({ summary: `Logout from XERO` })
  @Post('logout')
  async logout(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.logoutFromXero();
      return { message: `Logged out from xero successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Post('checkLoginStatus')
  async checkLoginStatus(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.checkLoginStatus();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }
  
  @Get("getTenants")
  async getTenants() : Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.getTanants()
      return { message: `Tenants fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    } 
  }

  @CheckPermissions(XeroAccountingPermissionSet.DISCONNECT)
  @ApiOperation({ summary: `Disconnect from Xero organization` })
  @Post('disconnect')
  async disconnectOrganization(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
      try {
          const data = await this.xeroAccountingService.disconnectOrganization(req.body.organizationId);
          return {
              message: `Disconnected from organization successfully`,
              statusCode: 200,
              data: data
          };
      } catch (err) {
          throw new HttpException(err.message, err.statusCode);
      }
  }
  @CheckPermissions(AccountPermissionSet.CREATE)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Patch('syncAccounts')
  async syncAccounts(): Promise<ResponseSuccess | ResponseError> {
    try {
      console.log("I am syncing data");
      let data = await this.xeroAccountingService.syncAllTenantsAccounts();
      return { message: `Accounts Synced Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException({ message: err?.message, statusCode: (err.statusCode) ? err?.statusCode : 400, data: err?.data }, err.statusCode);
    }
  }
  @Public()
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Post('webhook')
  async webhooks(@Req() req: RawBodyRequest<Request>, @Headers('x-xero-signature') signature: string) {
    try {
      let data = req.body;
      let isSame = this.xeroAccountingService.validateWebhook(signature, data);
      if (isSame) {
        this.xeroAccountingService.handleWebhook(JSON.parse(data));
        return true
      } else {
        throw { message: `Signature not matched`, statusCode: 401 };
      }
    } catch (err) {
      console.log("Webhook Error while validating request", err.message)
      throw new HttpException(err.message, err.statusCode);
    }
  }

  @CheckPermissions(QuotationPermissionSet.CREATE)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Post('getQuotes')
  async getQuotes(@Req() req: AuthenticatedRequest, @Body() xeroQuoteFiltersDto: XeroQuoteFiltersDto): Promise<ResponseSuccess | ResponseError> {
    try {
      let xeroQuoteResponse = await this.xeroAccountingService.getQuotes(xeroQuoteFiltersDto);
      let data: Quotation;
      if (xeroQuoteResponse && xeroQuoteResponse.body && xeroQuoteResponse.body?.quotes && xeroQuoteResponse.body?.quotes.length > 0) {
        data = await this.xeroAccountingService.prepareQuotationFromXeroQuote(xeroQuoteResponse.body?.quotes, xeroQuoteFiltersDto);
        return { message: `Quotes fetched Successfully`, statusCode: 200, data: data };
      } else {
        throw { message: `No Quote Data Found`, statusCode: 404, data: null };
      }
    } catch (err) {
      throw new HttpException({ message: err?.message, statusCode: (err.statusCode) ? err?.statusCode : 400, data: err?.data }, err.statusCode);
    }
  }
  @CheckPermissions(ProductPermissionSet.CREATE)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Patch('syncProducts')
  async syncProducts(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.syncAllTenantsProducts();
      return { message: `Products Sysnced Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException({ message: err?.message, statusCode: (err.statusCode) ? err?.statusCode : 400, data: err?.data }, err.statusCode);
    }
  }

  @CheckPermissions(TaxRatePermissionSet.CREATE)
  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Patch('syncTaxRates')
  async syncTaxRates(): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.syncAllTenantsTaxRates();
      return { message: `Tax Rates Synced Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException({ message: err?.message, statusCode: (err.statusCode) ? err?.statusCode : 400, data: err?.data }, err.statusCode);
    }
  }
  

  @ApiOperation({ summary: `Fetch all ${moduleName} in the system` })
  @Post('getBrandingThemes')
  async getBrandingThemes(@Req() req: AuthenticatedRequest): Promise<ResponseSuccess | ResponseError> {
    try {
      let data = await this.xeroAccountingService.getBrandingThemes();
      return { message: `${moduleName} fetched Successfully`, statusCode: 200, data: data };
    } catch (err) {
      throw new HttpException(err.message, err.statusCode);
    }
  }


}
