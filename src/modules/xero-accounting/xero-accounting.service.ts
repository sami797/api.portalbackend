import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Phone, TokenSet, XeroAccessToken, XeroClient, XeroIdToken, Contact, Contacts, Invoice as Xero_Invoice, LineItem, Invoices, Quote, Quotes, QuoteStatusCodes, CurrencyCode, TaxType, Account, TaxRate, Item } from 'xero-node';
import { RedisService } from '../redis/redis.service';
import * as crypto from "crypto";
import { XeroClientFiltersDto } from './dto/xero-client-filters.dto';
import { XeroInvoiceFiltersDto } from './dto/xero-invoice-filters.dto';
import { XeroQuoteFiltersDto } from './dto/xero-quote-filters.dto';
import { Client, Invoice as PrismaInvoice, Prisma, Quotation, Project, Invoice, Product, Leads, Organization } from '@prisma/client';
import { WebhookEventPayload, WehbookEventType, XeroEnventCategory } from './dto/xero-accounting';
import { addDaysToDate, convertDate, slugify } from 'src/helpers/common';
import { InvoiceStatus, InvoiceType, QuotationStatus, QuotationType, TransactionRecordType, TransactionStatus, VAT_RATE } from 'src/config/constants';
import { ProjectCreateOrUpdate } from 'xero-node/dist/gen/model/projects/projectCreateOrUpdate';
import { NotificationEventDto } from '../notification/dto/notification.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getDynamicUploadPath } from '../quotation/dto/quotation.dto';
import { getDynamicUploadPath as getDynamicInvoiceUploadPath } from '../invoice/dto/invoice.dto';
import { uploadFromBuffer } from 'src/helpers/file-management';
import * as BluebirdPromise from 'bluebird';
import { TaxRate as TaxRateModel } from '@prisma/client';
import { Account as AccountModel } from '@prisma/client';
import { OrganizationDefaultAttributes } from '../organization/dto/organization.dto';
import { LeadsDefaultAttributes } from '../leads/dto/leads.dto';
import { ApiGatewayTimeoutResponse } from '@nestjs/swagger';
import { Cron, CronExpression } from '@nestjs/schedule'; 
interface XeroProject {
    projectId: string;  // Required
    name: string;       // Required
    deadlineUtc?: string; // Optional
    minutesLogged: number; // Required
    contactId?: string; // Optional
    startDate?: string; // Optional: Start date (ISO string)
    endDate?: string;   // Optional: End date (ISO string)
    depositAmount?: number; // Optional
    estimateAmount?: number; // Optional
    totalInvoiced?: number; // Optional
    status?: string; // Optional
    projectEstimate?: number;
    // Add other required fields based on the error message
    totalTaskAmount?: number; // Example
    totalExpenseAmount?: number; // Example
    minutesToBeInvoiced?: number; // Example
    currencyCode: string | CurrencyCode;
    leadId?: string;
    // Add any additional properties expected by your application logic
}
interface XeroQuotation {
    xeroReference: string | null; // Xero Quotation ID
    quoteNumber: string; // Quotation Number
    subTotal: number; // Subtotal
    total: number; // Total Amount
    vatAmount: number; // VAT Amount
    expiryDate: Date | null; // Expiry Date
    issueDate: Date | null; // Issue Date
    status: number; // Quotation Status
    brandingThemeId: string; // Branding Theme ID
    paymentTerms: string; // Payment Terms
    scopeOfWork: string; // Scope of Work
    note: string; // Additional Notes
}

export declare class Amount {
    // Assuming these fields exist; adjust as necessary
    currency: string;
    value: number; // This should be your amount
}

@Injectable()
export class XeroAccountingService {
    private readonly logger = new Logger(this.constructor.name);
    private readonly client_id: string = (process.env.ENVIRONMENT === "production") ? process.env.XERO_CLIENT_ID_LIVE : process.env.XERO_CLIENT_ID;
    private readonly client_secret: string = (process.env.ENVIRONMENT === "production") ? process.env.XERO_CLIENT_SECRET_LIVE : process.env.XERO_CLIENT_SECRET;
    private redirectUrl: string = (process.env.ENVIRONMENT === "production") ? process.env.XERO_REDIRECT_URL_LIVE : process.env.XERO_REDIRECT_URL;
    private accessToken: string;
    private readonly XERO_WEBHOOK_KEY = (process.env.ENVIRONMENT === "production") ? process.env.XERO_WEBHOOK_KEY_LIVE : process.env.XERO_WEBHOOK_KEY;
   
    private readonly scopes = "offline_access openid profile email accounting.transactions accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read";
    // private readonly scopes = "offline_access openid profile email accounting.transactions accounting.budgets.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees"
    // bankfeeds
    // finance.accountingactivity.read finance.bankstatementsplus.read finance.cashvalidation.read finance.statements.read

    private xero: XeroClient;
    allProcessed: { resourceId: string, type: keyof typeof XeroEnventCategory }[] = []

    constructor(private readonly prisma: PrismaService,
        private readonly redisService: RedisService,
        private readonly eventEmitter: EventEmitter2
    ) {
        const xero = new XeroClient({
            clientId: this.client_id,
            clientSecret: this.client_secret,
            redirectUris: [this.redirectUrl],
            scopes: this.scopes.split(" "),
            httpTimeout: 15000,
        });

        this.xero = xero;
    }

    private async saveRefreshToken(refreshToken: string) {
        await this.redisService.set(`refreshToken`, refreshToken);
    }

    private getDefaultTenantId(){
        let tenants = this.xero.tenants;
        let tenantId : string = null;
        if(tenants && tenants.length > 0){
            tenantId = tenants[0].tenantId;
        }
        return tenantId;
    }

    private async deleteRefreshToken() {
        await this.redisService.del(`refreshToken`);
    }

    private async getRefreshToken(): Promise<string | null> {
        return await this.redisService.get(`refreshToken`);
    }

    async logoutFromXero() {
        await this.deleteRefreshToken();
        this.accessToken = null;
        return true;
    }

    async getTanants() {
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }
        return this.xero.tenants;
    }

    private async validateAccessToken() {
        if (!this.accessToken) {
            return await this.refreshXeroToken()
        } else {
            try {
                // let org = await this.prisma.organization.findFirst({where: {xeroTenantId: {not: null}}});
                let tenants = this.xero.tenants;
                let tenantId : string = null;
                if(tenants && tenants.length > 0){
                    tenantId = tenants[0].tenantId;
                }
                await this.xero.accountingApi.getBrandingThemes(tenantId);
                return true
            } catch (err) {
                if (err?.statusCode === 401 || err?.response?.statusCode === 401) {
                    return await this.refreshXeroToken()
                }
                const error = JSON.stringify(err.response?.body, null, 2)
                console.log(`Status Code: ${err.response.statusCode} => ${error}`);
                return false;
            }
        }
    }

    private async refreshXeroToken() {
        let refreshToken = await this.getRefreshToken();
        if (refreshToken) {
            const newTokenSet = await this.xero.refreshWithRefreshToken(this.client_id, this.client_secret, refreshToken);
            this.saveRefreshToken(newTokenSet.refresh_token);
            this.accessToken = newTokenSet.access_token;
            await this.xero.updateTenants();
            return true;
        } else {
            return false;
        }
    }

    async getAccessToken() {
        const consentUrl: string = await this.xero.buildConsentUrl();
        return consentUrl
    }

    validateWebhook(webhookKey: string, webhookData: any) {
        let computedSignature = crypto.createHmac('sha256', this.XERO_WEBHOOK_KEY).update(webhookData.toString()).digest('base64');
        return computedSignature === webhookKey
    }

    async authenticate(url: string) {
        if (!url) {
            throw {
                message: "No Callback url provided",
                statusCode: 400
            }
        }
        const tokenSet: TokenSet = await this.xero.apiCallback(url);
        if (tokenSet) {
            this.saveRefreshToken(tokenSet.refresh_token);
            this.accessToken = tokenSet.access_token;
            await this.xero.updateTenants();
            return "Authentication successful";
        } else {
            return "Something went wrong";
        }

        
    }
 



    public async getQuotations(page = 1, pageSize = 100, dateFrom?: Date, dateTo?: Date): Promise<XeroQuotation[]> {
        const statusMapping: { [key: string]: number } = {
          "DRAFT": 1,
          "SUBMITTED": 2,
          "ACCEPTED": 3,
          "DECLINED": 4,
        };
    
        const valid = await this.validateAccessToken();
        if (!valid) {
          this.logger.error("Invalid Access Token");
          throw new Error("Unable to access Xero: Invalid Access Token");
        }
    
        const tenantId = this.getDefaultTenantId();
        if (!tenantId) {
          this.logger.error("No tenant ID found");
          throw new Error("No tenant ID found");
        }
    
        try {
          // Ensure dateFrom and dateTo are valid Date objects
          const queryParams: any = {
            page: page,
            pageSize: pageSize,
            // Check if dateFrom and dateTo are provided and valid
            ...(dateFrom && dateFrom instanceof Date && !isNaN(dateFrom.getTime()) ? { dateFrom: dateFrom.toISOString() } : {}),
            ...(dateTo && dateTo instanceof Date && !isNaN(dateTo.getTime()) ? { dateTo: dateTo.toISOString() } : {}),
          };
    
          // Ensure getQuotes method is being called correctly
          const response = await this.xero.accountingApi.getQuotes(tenantId, queryParams);
    
          this.logger.log("Successfully retrieved quotations from Xero");
    
          if (response.body && response.body.quotes) {
            const quotations: XeroQuotation[] = response.body.quotes.map(item => ({
              xeroReference: item.quoteID,
              quoteNumber: item.quoteNumber,
              subTotal: item.subTotal,
              total: item.total,
              vatAmount: item.totalTax,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              issueDate: item.date ? new Date(item.date) : null,
              status: statusMapping[item.status] || 1,
              brandingThemeId: item.brandingThemeID ? String(item.brandingThemeID) : null,
              paymentTerms: item.terms,
              scopeOfWork: item.title,
              note: item.summary,
            }));
    
            await this.saveQuotationsToDatabase(quotations);
            return quotations;
          } else {
            this.logger.warn("No quotations found in Xero response.");
            return [];
          }
        } catch (error) {
          this.logger.error(`Error retrieving quotations from Xero: ${error.message}`, error.stack);
          throw new Error(`Failed to retrieve quotations: ${error.message}`);
        }
      }

    
    async saveQuotationsToDatabase(quotations: XeroQuotation[]) {
        // Iterate over each quotation to save or update in the database
        await Promise.all(quotations.map(async (quotation) => {
            try {
                // Check if the quotation already exists in the database
                const existingQuotation = await this.prisma.quotation.findUnique({
                    where: { xeroReference: quotation.xeroReference },
                });
    
                const quotationData: Prisma.QuotationUncheckedCreateInput = {
                    xeroReference: quotation.xeroReference,
                    quoteNumber: quotation.quoteNumber,
                    subTotal: quotation.subTotal,
                    total: quotation.total,
                    vatAmount: quotation.vatAmount,
                    expiryDate: quotation.expiryDate,
                    issueDate: quotation.issueDate,
                    status: Number(quotation.status), // Save status as a number in the database
                    brandingThemeId: quotation.brandingThemeId ? Number(quotation.brandingThemeId) : null, // Convert to number if exists
                    paymentTerms: quotation.paymentTerms,
                    scopeOfWork: quotation.scopeOfWork,
                    note: quotation.note,
                    modifiedDate: new Date(), // Track modification date
                    addedDate: existingQuotation ? existingQuotation.addedDate : new Date(), // Retain the original added date if exists
                };
    
                // Update existing quotation if it exists, otherwise create a new one
                if (existingQuotation) {
                    await this.prisma.quotation.update({
                        where: { xeroReference: quotation.xeroReference },
                        data: quotationData,
                    });
                    this.logger.log(`Quotation ${quotation.xeroReference} updated successfully.`);
                } else {
                    await this.prisma.quotation.create({
                        data: quotationData,
                    });
                    this.logger.log(`Quotation ${quotation.xeroReference} created successfully.`);
                }
            } catch (error) {
                this.logger.error(`Error saving quotation: ${quotation.xeroReference} - ${error.message}`, error.stack);
                throw new Error(`Failed to save quotation ${quotation.xeroReference}: ${error.message}`);
            }
        }));
    }
    
    
    
    async getProjects() {
        // Step 1: Validate the access token
        const valid = await this.validateAccessToken();
        if (!valid) {
            this.logger.error("Invalid Access Token");
            throw new Error("Unable to access Xero: Invalid Access Token");
        }
    
        // Step 2: Get the default tenant ID
        const tenantId = this.getDefaultTenantId();
        if (!tenantId) {
            this.logger.error("No tenant ID found");
            throw new Error("No tenant ID found");
        }
    
        try {
            // Step 3: Make the API call to get projects from Xero
            const response = await this.xero.projectApi.getProjects(tenantId);
            this.logger.log("Successfully retrieved projects from Xero");
    
            // Map the projects, handling potential undefined fields
            const projects: XeroProject[] = response.body.items.map(item => ({
                projectId: item.projectId, // Xero Project ID
                name: item.name, // Xero Project Name
                deadlineUtc: item.deadlineUtc ? item.deadlineUtc.toISOString() : null, // Xero Deadline
                minutesLogged: item.minutesLogged, // Xero Minutes Logged
                // Removed contactId, assuming you don't need it anymore
                projectEstimate: item.estimate ? item.estimate.value : 0, // Project Estimate
                currencyCode: item.currencyCode as unknown as string, // Currency Code
            }));
    
            // Step 4: Save the projects to the database (update or create based on existence)
            await this.saveProjectsToDatabase(projects);
    
            return response.body; // Return the response based on the actual structure
        } catch (error) {
            this.logger.error(`Error retrieving projects from Xero: ${error.message}`, error.stack);
            throw new Error(`Failed to retrieve projects: ${error.message}`);
        }
    }
    
    async saveProjectsToDatabase(projects: XeroProject[]) {
        await Promise.all(projects.map(async (project) => {
            try {
                // Check if the project already exists in the database by its `slug` (Xero Project ID)
                const existingProject = await this.prisma.project.findUnique({
                    where: { slug: project.projectId }, // Using `slug` to find an existing project
                });
    
                // Prepare the data for creating or updating the project
                const projectData: Prisma.ProjectUncheckedCreateInput = {
                    title: project.name, // Project Name
                    slug: project.projectId, // Xero Project ID as the slug
                    startDate: project.deadlineUtc ? new Date(project.deadlineUtc) : null, // Start Date (if available)
                    endDate: project.deadlineUtc ? new Date(project.deadlineUtc) : null, // End Date (if available)
                    priority: project.minutesLogged > 0 ? 1 : 3, // Priority based on minutes logged
                    referenceNumber: project.projectId, // Xero Project ID as Reference Number
                     
                    modifiedDate: new Date(), // Current Date as modified date
                    projectEstimate: project.projectEstimate, // Project Estimate
                    isExtended: false, // Default value for isExtended
                    reasonOfExtension: null, // Default value for extension reason
                    projectStateId: 1, // Default project state (active or in-progress)
                    isDeleted: false, // Default not deleted
                    isClosed: false, // Default not closed
                    instructions: null, // No instructions by default
                    projectFilesLink: null, // No file link by default
                    comment: null, // No comment by default
                    onHold: false, // Default not on hold
                    xeroReference: null, // No Xero reference by default
                    xeroTenantId: null,
                 leadId: project.leadId ? Number(project.leadId) : undefined,
                     // No Xero Tenant ID by default
                };
    
                if (existingProject) {
                    // If the project exists, update the project
                    await this.prisma.project.update({
                        where: { slug: project.projectId }, // Use `slug` (Xero Project ID) to identify the existing project
                        data: projectData, // Update with the new data
                    });
                    this.logger.log(`Project ${project.projectId} updated successfully.`);
                } else {
                    // If the project doesn't exist, create a new project
                    await this.prisma.project.create({
                        data: projectData, // Insert the new project
                    });
                    this.logger.log(`Project ${project.projectId} created successfully.`);
                }
    
            } catch (error) {
                this.logger.error(`Error saving project: ${project.projectId} - ${error.message}`, error.stack);
                throw new Error(`Failed to save project ${project.projectId}: ${error.message}`);
            }
        }));
    }
    
    
    
    
    async disconnectOrganization(organizationId: any) {
        // Step 1: Validate the access token
        const valid = await this.validateAccessToken();
        if (!valid) {
            this.logger.error("Invalid Access Token");
            throw new Error("Unable to access Xero: Invalid Access Token");
        }
    
        // Step 2: Get the default tenant ID
        const tenantId = this.getDefaultTenantId();
        if (!tenantId) {
            this.logger.error("No tenant ID found");
            throw new Error("No tenant ID found");
        }
    
        // Step 3: Optionally, perform any cleanup in your database
        // For example, you might want to delete organization data from your database
        await this.prisma.organization.deleteMany({
            where: {
                id: organizationId,
            },
        });
    
        // Step 4: Clear the refresh token
        await this.deleteRefreshToken();
    
        // Step 5: Log out from Xero
        this.accessToken = null;
    
        this.logger.log(`Successfully disconnected organization with ID: ${organizationId}`);
        return {
            message: "Successfully disconnected from Xero",
        };
    }
    
    
    resetProcessedData(resourceId: string, type: keyof typeof XeroEnventCategory) {
        setTimeout(() => {
            this.allProcessed = this.allProcessed.filter((processedItems) => processedItems.resourceId !== resourceId && processedItems.type !== type);
        }, 8000)
    }

    async updateInvoiceStatus(invoice: Invoice) {
        this.logger.log(`Updating Invoice Status in XERO, QuotationId: ${invoice?.id}`)
        let recordData = await this.prisma.invoice.findUniqueOrThrow({
            where: { id: invoice.id },
            include: {
                QuotationMilestone: true,
                Project: {
                    select:{
                        Lead:{
                            select: LeadsDefaultAttributes
                        },
                        SubmissionBy: {
                            select: OrganizationDefaultAttributes
                        }
                    }
                }
            }
        })

        let XERO__TENANT__ID = (recordData.xeroTenantId) ? recordData.xeroTenantId : recordData?.Project?.Lead?.xeroTenantId; 
        if(!XERO__TENANT__ID){
            return;
        }

        if (!recordData.xeroReference) {
            return this.upsertInvoice(recordData);
        }

        let clientData = await this.prisma.client.findFirst({
            where:{
                id: recordData.clientId
            },
            include:{
                ClientXeroConnection:{
                    where:{
                        xeroTenantId: XERO__TENANT__ID
                    }
                }
            }
        })

        let contactRef = (clientData.ClientXeroConnection && clientData.ClientXeroConnection.length > 0) ? clientData.ClientXeroConnection[0].xeroReference : undefined;        
        if (!contactRef) {
            let newContact = await this.upsertContact(clientData, XERO__TENANT__ID);
            if (!newContact && !newContact.body?.contacts) {
                this.logger.error("Couldnot create contact in XERO");
                throw {
                    message: "Couldnot create contact",
                    statusCode: 400
                }
            } else {
                contactRef = newContact.body.contacts[0].contactID
            }
        }

        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        const eachInvoice: Xero_Invoice = {
            invoiceID: recordData.xeroReference,
            invoiceNumber: recordData.invoiceNumber,
            status: this.matchLocalInvoiceStatusToXero(invoice.status),
            date: convertDate(new Date()),
            contact: {
                contactID: contactRef
            }
        }

        const invoiceAllData: Invoices = {
            invoices: [eachInvoice]
        };
        try {
            await this.xero.accountingApi.updateInvoice(XERO__TENANT__ID, recordData.xeroReference, invoiceAllData);
        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            console.log(`Status Code: ${err.response.statusCode} => ${error}`);
        }
    }

    async updateQuotationStatus(quotation: Quotation) {
        this.logger.log(`Updating Quote Status in XERO, QuotationId: ${quotation?.id}`)
        let recordData = await this.prisma.quotation.findUniqueOrThrow({
            where: { id: quotation.id },
            include: {
                Lead: {
                    include: {
                        SubmissionBy: {
                            select: OrganizationDefaultAttributes
                        },
                        ProjectType: {
                            select: {
                                id: true,
                                title: true,
                            }
                        }
                    }
                },
                QuotationMilestone: true,
                Project: {
                    select: {
                        id: true,
                        referenceNumber: true,
                        title: true
                    }
                }
            }
        })

        let XERO__TENANT__ID = (recordData.xeroTenantId) ? recordData.xeroTenantId : recordData?.Lead?.xeroTenantId; 
        if(!XERO__TENANT__ID){
            return;
        }

        if (!recordData.xeroReference) {
            return this.upsertQuotation(recordData);
        }

        let clientData = await this.prisma.client.findFirst({
            where:{
                id: recordData.Lead.clientId
            },
            include:{
                ClientXeroConnection:{
                    where:{
                        xeroTenantId: XERO__TENANT__ID
                    }
                }
            }
        })

        let contactRef = (clientData.ClientXeroConnection && clientData.ClientXeroConnection.length > 0) ? clientData.ClientXeroConnection[0].xeroReference : undefined;        
        if (!contactRef) {
            let newContact = await this.upsertContact(clientData, XERO__TENANT__ID);
            if (!newContact && !newContact.body?.contacts) {
                this.logger.error("Couldnot create contact in XERO");
                throw {
                    message: "Couldnot create contact",
                    statusCode: 400
                }
            } else {
                contactRef = newContact.body.contacts[0].contactID
            }
        }

        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        const quote: Quote = {
            quoteID: recordData.xeroReference,
            quoteNumber: recordData.quoteNumber,
            status: this.matchLocalQuoteStatusToXero(quotation.status),
            title: recordData.Lead?.ProjectType ? recordData.Lead?.ProjectType.title : undefined,
            summary: recordData.Project ? recordData.Project.title : undefined,
            date: convertDate(new Date()),
            contact: {
                contactID: contactRef
            }
        }

        const quotes: Quotes = {
            quotes: [quote]
        };
        try {
            await this.xero.accountingApi.updateQuote(XERO__TENANT__ID, recordData.xeroReference, quotes);
        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            console.log(`Status Code: ${err.response.statusCode} => ${error}`);
        }
    }

    async upsertProject(project: Project) {
        this.logger.log(`Upsert Project to XERO, ProjectID: ${project?.id}`);
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let recordData = await this.prisma.project.findUniqueOrThrow({
            where: {
                id: project.id
            },
            include: {
                Lead:{
                    select: LeadsDefaultAttributes
                },
                SubmissionBy:{
                    select: OrganizationDefaultAttributes
                },
                Quotation: {
                    where: {
                        status: QuotationStatus.confirmed
                    }
                }
            }
        })

        let XERO__TENANT__ID = (recordData.xeroTenantId) ? recordData.xeroTenantId : recordData?.Lead?.xeroTenantId; 
        if(!XERO__TENANT__ID){
            return;
        }

        let contactData = await this.prisma.client.findFirst({
            where:{
                id: recordData.clientId
            },
            include:{
                ClientXeroConnection:{
                    where:{
                        xeroTenantId: XERO__TENANT__ID
                    }
                }
            }
        })

        let contactRef = (contactData?.ClientXeroConnection && contactData?.ClientXeroConnection.length > 0) ? contactData?.ClientXeroConnection[0].xeroReference : undefined;
        if (!contactRef) {
            let newContact = await this.upsertContact(contactData, XERO__TENANT__ID);
            if (!newContact && !newContact.body?.contacts) {
                this.logger.error("Couldnot create contact in XERO");
                throw {
                    message: "Couldnot create contact",
                    statusCode: 400
                }
            } else {
                contactRef = newContact.body.contacts[0]?.contactID
            }
        }

        let projectData: ProjectCreateOrUpdate = {
            contactId: contactRef,
            name: recordData.referenceNumber + " | " + recordData.title,
            deadlineUtc: recordData.endDate,
            estimateAmount: recordData.projectEstimate
        }

        try {
            if (recordData.xeroReference) {
                await this.xero.projectApi.updateProject(XERO__TENANT__ID, recordData.xeroReference, projectData);
            } else {
                const response = await this.xero.projectApi.createProject(XERO__TENANT__ID, projectData);
                if (response && response.body) {
                    await this.prisma.project.update({
                        where: {
                            id: recordData.id
                        },
                        data: {
                            xeroReference: response.body.projectId,
                            xeroTenantId: XERO__TENANT__ID
                        }
                    })
                }
            }
        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            this.logger.log(`Some error while creting project in XERO, Status Code: ${err.response.statusCode} => ${error}`);
        }
    }

    async upsertQuotation(quotation: Quotation & {Lead: Partial<Leads> & {SubmissionBy: Partial<Organization>}}) {
        this.logger.log(`Upsert Quotation to XERO, QuotationID: ${quotation?.id}`);

        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let XERO__TENANT__ID = (quotation.xeroTenantId) ? quotation.xeroTenantId : quotation?.Lead?.xeroTenantId; 
        if(!XERO__TENANT__ID){
            return;
        }

        this.logger.log("Updating Quotation to XERO");
        let existingXeroQuotation: Quote;
        if (quotation.xeroReference) {
            try {
                let response = await this.xero.accountingApi.getQuote(XERO__TENANT__ID, quotation.xeroReference);
                if (response.body?.quotes && response.body.quotes.length > 0) {
                    existingXeroQuotation = response.body.quotes[0];
                }
            } catch (err) {
                const error = JSON.stringify(err.response.body, null, 2)
                this.logger.log(`Some error while creting project in XERO, Status Code: ${err.response.statusCode} => ${error}`);
            }
        }

        let recordData = await this.prisma.quotation.findUniqueOrThrow({
            where: { id: quotation.id },
            include: {
                Lead: {
                    include: {
                        Client: {
                            include:{
                                ClientXeroConnection:{
                                    where:{
                                        xeroTenantId: XERO__TENANT__ID
                                    }
                                }
                            }
                        },
                        ProjectType: true,
                    }
                },
                QuotationMilestone: {
                    include: {
                        Account: {
                            select: {
                                xeroReference: true,
                                id: true,
                                accountCode: true,
                                title: true
                            }
                        },
                        TaxRate: {
                            select: {
                                id: true,
                                taxType: true,
                                title: true
                            }
                        },
                        Product: {
                            select: {
                                xeroReference: true,
                                id: true,
                                title: true,
                                productCode: true
                            }
                        }
                    },
                    orderBy:{
                        id: 'asc'
                    }
                },
                Project: {
                    select: {
                        title: true,
                        id: true,
                        referenceNumber: true
                    }
                }
            }
        })

        const dateValue = (quotation.issueDate) ? quotation.issueDate : quotation.addedDate;
        const expiryDate = quotation.expiryDate;

        let contactRef = (recordData?.Lead?.Client.ClientXeroConnection && recordData?.Lead?.Client.ClientXeroConnection.length > 0) ? recordData?.Lead?.Client.ClientXeroConnection[0].xeroReference : undefined;
        let contactXeroTenantId = (recordData?.Lead?.Client.ClientXeroConnection && recordData?.Lead?.Client.ClientXeroConnection.length > 0) ? recordData?.Lead?.Client.ClientXeroConnection[0].xeroTenantId : undefined;;
        
        if (!contactRef || contactXeroTenantId !== XERO__TENANT__ID) {
            let newContact = await this.upsertContact(recordData.Lead.Client, XERO__TENANT__ID);
            if (!newContact && !newContact.body?.contacts) {
                this.logger.error("Couldnot create contact in XERO");
                throw {
                    message: "Couldnot create contact",
                    statusCode: 400
                }
            } else {
                contactRef = newContact.body.contacts[0].contactID
            }
        }
        
        const contact: Contact = {
            contactID: contactRef
        };

        const lineItems = [];
        let taxTypes = [];
        recordData.QuotationMilestone.forEach((ele) =>{
            if(ele.TaxRate){
                taxTypes.push(ele.TaxRate.title);
            }
        })

        let allTaxRateData = await this.prisma.taxRate.findMany({
            where:{
                title:{
                    in: taxTypes,
                    mode: 'insensitive'
                },
                xeroTenantId: XERO__TENANT__ID
            }
        })


        recordData.QuotationMilestone.forEach((ele) => {

            let lineTaxType : string = null;
            if(ele.TaxRate && ele.TaxRate?.title){
               let t = allTaxRateData.find((dt) => dt.title?.toLowerCase() === ele.TaxRate?.title?.toLowerCase())
               if(t) lineTaxType = t.taxType;
            }

            const lineItem: LineItem = {
                lineItemID: ele.xeroReference,
                description: ele.title,
                quantity: ele.quantity,
                unitAmount: ele.amount,
                taxAmount: ele.taxAmount,
                taxType: (lineTaxType) ? lineTaxType : undefined,
                accountCode: (ele.Account) ? ele.Account.accountCode : undefined,
                accountID: (ele.Account) ? ele.Account.xeroReference : undefined,
                // itemCode: (ele.Product) ? ele.Product.productCode : undefined,
                lineAmount: (ele.quantity * ele.amount)
            };
            lineItems.push(lineItem)
        })

        let xeroReference = recordData.xeroReference
        if (xeroReference) {
            try {
                let quoteData = await this.xero.accountingApi.getQuote(XERO__TENANT__ID, xeroReference);
                if (!quoteData && !quoteData.body?.quotes) {
                    xeroReference = null
                } else {
                    let __quote = quoteData.body?.quotes[0];
                    if (__quote.status === QuoteStatusCodes.DELETED) {
                        xeroReference = null
                    }
                }
            } catch (err) {
                this.logger.error("Some error while fetching quote from XERO")
            }
        }

        let newStatus = this.matchLocalQuoteStatusToXero(recordData.status);
        if (existingXeroQuotation && existingXeroQuotation?.status === newStatus) {
            newStatus = null
        }
        const quote: Quote = {
            contact: contact,
            date: convertDate(dateValue, 'yy-mm-dd'),
            expiryDate: convertDate(expiryDate, 'yy-mm-dd'),
            lineItems: lineItems,
            quoteNumber: recordData.quoteNumber,
            status: (newStatus) ? newStatus : undefined,
            terms: recordData.paymentTerms,
            title: (recordData.Lead?.ProjectType) ? recordData.Lead?.ProjectType?.title : undefined,
            summary: recordData.scopeOfWork ? recordData.scopeOfWork : undefined,
            currencyCode: CurrencyCode.AED,
            quoteID: (xeroReference) ? xeroReference : undefined,
            subTotal: recordData.subTotal,
            total: recordData.total,
            totalTax: recordData.vatAmount
        };

        const quotes: Quotes = {
            quotes: [quote]
        };

        this.logger.log("Upsert Quotation in XERO");
        const response = await this.xero.accountingApi.updateOrCreateQuotes(XERO__TENANT__ID, quotes);
        if (response.body && response.body.quotes && response.body.quotes.length > 0) {
            let xeroQuote = response.body.quotes[0];
            this.allProcessed.push({
                resourceId: xeroQuote.quoteID,
                type: 'QUOTATION'
            });
            this.resetProcessedData(xeroQuote.quoteID, 'QUOTATION');
            if (!recordData.xeroReference) {
                await this.prisma.quotation.update({
                    where: {
                        id: recordData.id
                    },
                    data: {
                        xeroReference: xeroQuote.quoteID,
                        xeroTenantId: XERO__TENANT__ID
                    }
                })
            }

            let allPromises = [];
            recordData.QuotationMilestone.forEach((ele) => {
                if (!ele.xeroReference) {
                    let lineItem = xeroQuote.lineItems.find((itemData) => itemData.description === ele.title);
                    if (lineItem) {
                        allPromises.push(this.prisma.quotationMilestone.update({ where: { id: ele.id }, data: { xeroReference: lineItem.lineItemID } }))
                    }
                }
            })
            await Promise.all(allPromises);
        }
        return response;
    }

    async upsertInvoice(invoice: PrismaInvoice & {Project: Partial<Project> & {Lead: Partial<Leads>}}) {
        this.logger.log(`Upsert Invoice to XERO, InvoiceID: ${invoice?.id}`);
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let XERO__TENANT__ID = (invoice.xeroTenantId) ? invoice.xeroTenantId : invoice?.Project.Lead?.xeroTenantId; 
        if(!XERO__TENANT__ID){
            return;
        }

        let existingXeroInvoice: Xero_Invoice;
        if (invoice.xeroReference) {
            try {
                let response = await this.xero.accountingApi.getInvoice(XERO__TENANT__ID, invoice.xeroReference);
                if (response.body?.invoices && response.body.invoices.length > 0) {
                    existingXeroInvoice = response.body.invoices[0];
                }

            } catch (err) {
                const error = JSON.stringify(err.response.body, null, 2)
                this.logger.log(`Some error while creting project in XERO, Status Code: ${err.response.statusCode} => ${error}`);
            }
        }

        let recordData = await this.prisma.invoice.findUniqueOrThrow({
            where: { id: invoice.id },
            include: {
                Client: {
                    include:{
                        ClientXeroConnection:{
                            where:{
                                xeroTenantId: XERO__TENANT__ID
                            }
                        }
                    }
                },
                InvoiceItems: {
                    include: {
                        Account: {
                            select: {
                                xeroReference: true,
                                id: true,
                                accountCode: true,
                                title: true
                            }
                        },
                        TaxRate: {
                            select: {
                                id: true,
                                taxType: true,
                                title: true
                            }
                        },
                        Product: {
                            select: {
                                xeroReference: true,
                                id: true,
                                title: true,
                                productCode: true
                            }
                        }
                    }
                },
                Quotation: true
            }
        })
        const dateValue = (invoice.issueDate) ? invoice.issueDate : invoice.addedDate
        const dueDateValue = invoice.expiryDate ? invoice.expiryDate : addDaysToDate(invoice.addedDate, 30);
        let contactRef = (recordData?.Client.ClientXeroConnection && recordData?.Client.ClientXeroConnection.length > 0) ? recordData?.Client.ClientXeroConnection[0].xeroReference : undefined;
        let contactXeroTenantId = (recordData?.Client.ClientXeroConnection && recordData?.Client.ClientXeroConnection.length > 0) ? recordData?.Client.ClientXeroConnection[0].xeroTenantId : undefined;;
        if (!contactRef || contactXeroTenantId !== XERO__TENANT__ID) {
            let newContact = await this.upsertContact(recordData.Client, XERO__TENANT__ID);
            if (!newContact && !newContact.body?.contacts) {
                this.logger.error("Couldnot create contact in XERO");
                throw {
                    message: "Couldnot create contact",
                    statusCode: 400
                }
            } else {
                contactRef = newContact.body.contacts[0].contactID
            }
        }
        const contact: Contact = {
            contactID: contactRef
        };

        const lineItems = [];
        let taxTypes = [];
        recordData.InvoiceItems.forEach((ele) =>{
            if(ele.TaxRate){
                taxTypes.push(ele.TaxRate.title);
            }
        })

        let allTaxRateData = await this.prisma.taxRate.findMany({
            where:{
                title:{
                    in: taxTypes,
                    mode: 'insensitive'
                },
                xeroTenantId: XERO__TENANT__ID
            }
        })

        recordData.InvoiceItems.forEach((ele) => {

            let lineTaxType : string = null;
            if(ele.TaxRate && ele.TaxRate?.title){
               let t = allTaxRateData.find((dt) => dt.title?.toLowerCase() === ele.TaxRate?.title?.toLowerCase())
               if(t) lineTaxType = t.taxType;
            }

            const lineItem: LineItem = {
                lineItemID: ele.xeroReference,
                description: ele.title,
                quantity: ele.quantity,
                unitAmount: ele.amount,
                lineAmount: (ele.quantity * ele.amount),
                taxAmount: ele.taxAmount,
                taxType: lineTaxType ? lineTaxType : undefined,
                accountCode: (ele.Account) ? ele.Account.accountCode : undefined,
                accountID: (ele.Account) ? ele.Account.xeroReference : undefined,
                // itemCode: (ele.Product) ? ele.Product.productCode : undefined,
            };
            lineItems.push(lineItem)
        })

        let newStatus = this.matchLocalInvoiceStatusToXero(recordData.status);
        if (existingXeroInvoice && existingXeroInvoice.status === newStatus) {
            newStatus = null;
        }
        const invoiceData: Xero_Invoice = {
            type: Xero_Invoice.TypeEnum.ACCREC,
            contact: contact,
            date: convertDate(dateValue, 'yy-mm-dd'),
            dueDate: convertDate(dueDateValue, 'yy-mm-dd'),
            lineItems: lineItems,
            currencyCode: CurrencyCode.AED,
            invoiceNumber: recordData.invoiceNumber,
            reference: recordData.Quotation.quoteNumber,
            status: (newStatus) ? newStatus : undefined,
            invoiceID: (recordData.xeroReference) ? recordData.xeroReference : undefined,
            subTotal: recordData.subTotal,
            total: recordData.total,
            totalTax: recordData.vatAmount
        };

        const invoices: Invoices = {
            invoices: [invoiceData]
        };

        this.logger.log("Upsert Invoice in XERO");
        const response = await this.xero.accountingApi.updateOrCreateInvoices(XERO__TENANT__ID, invoices);
        if (response.body && response.body.invoices && response.body.invoices.length > 0) {
            let xeroInvoice = response.body.invoices[0];
            this.allProcessed.push({
                resourceId: xeroInvoice.invoiceID,
                type: 'INVOICE'
            });
            this.resetProcessedData(xeroInvoice.invoiceID, 'INVOICE');
            if (!recordData.xeroReference) {
                await this.prisma.invoice.update({
                    where: {
                        id: recordData.id
                    },
                    data: {
                        xeroReference: xeroInvoice.invoiceID,
                        xeroTenantId: XERO__TENANT__ID
                    }
                })
            }

            let allPromises = [];
            recordData.InvoiceItems.forEach((ele) => {
                if (!ele.xeroReference) {
                    let lineItem = xeroInvoice.lineItems.find((itemData) => itemData.description === ele.title);
                    if (lineItem) {
                        allPromises.push(this.prisma.invoiceItem.update({ where: { id: ele.id }, data: { xeroReference: lineItem.lineItemID } }))
                    }
                }
            })
            await Promise.all(allPromises);
        }
        return response;
    }

    matchLocalQuoteStatusToXero(status: number): QuoteStatusCodes {
        switch (status) {
            case QuotationStatus.rejected: return QuoteStatusCodes.DECLINED;
            case QuotationStatus.created: return QuoteStatusCodes.DRAFT;
            case QuotationStatus.confirmed: return QuoteStatusCodes.ACCEPTED;
            case QuotationStatus.submitted: return QuoteStatusCodes.SENT;
            case QuotationStatus.revised: return QuoteStatusCodes.DECLINED;
            case QuotationStatus.invoiced: return QuoteStatusCodes.INVOICED;
            default: return QuoteStatusCodes.DRAFT;
        }
    }

    matchXeroQuoteStatusToLocalQuoteStatus(status: number): QuotationStatus {
        switch (status) {
            case QuoteStatusCodes.DECLINED: return QuotationStatus.rejected;
            case QuoteStatusCodes.DRAFT: return QuotationStatus.created;
            case QuoteStatusCodes.ACCEPTED: return QuotationStatus.confirmed;
            case QuoteStatusCodes.SENT: return QuotationStatus.submitted;
            case QuoteStatusCodes.DECLINED: return QuotationStatus.revised;
            case QuoteStatusCodes.INVOICED: return QuotationStatus.invoiced;
            default: return QuotationStatus.created;
        }
    }

    matchLocalInvoiceStatusToXero(status: number): Xero_Invoice.StatusEnum {
        switch (status) {
            case InvoiceStatus.canceled: return Xero_Invoice.StatusEnum.VOIDED;
            case InvoiceStatus.generated: return Xero_Invoice.StatusEnum.DRAFT;
            case InvoiceStatus.sent: return Xero_Invoice.StatusEnum.SUBMITTED;
            case InvoiceStatus.paid: return Xero_Invoice.StatusEnum.AUTHORISED;
            default: return Xero_Invoice.StatusEnum.DRAFT;
        }
    }

    matchXeroInvoiceStatusToLocalInvoiceStatus(status: Xero_Invoice.StatusEnum): InvoiceStatus {
        switch (status) {
            case Xero_Invoice.StatusEnum.VOIDED: return InvoiceStatus.canceled;
            case Xero_Invoice.StatusEnum.DRAFT: return InvoiceStatus.generated;
            case Xero_Invoice.StatusEnum.SUBMITTED: return InvoiceStatus.sent;
            case Xero_Invoice.StatusEnum.AUTHORISED: return InvoiceStatus.sent;
            case Xero_Invoice.StatusEnum.PAID: return InvoiceStatus.paid;
            case Xero_Invoice.StatusEnum.DELETED: return InvoiceStatus.canceled;
            default: return InvoiceStatus.generated;
        }
    }

    async upsertContact(client: Client, xeroTenantId: string) {
        this.logger.log(`Upsert Client to XERO Contact, ClientID: ${client?.id}`);
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let XERO__TENANT__ID = xeroTenantId ? xeroTenantId : null 
        if(!XERO__TENANT__ID){
            return;
        }

        let clientReference: string = null;
        let existingReference:  string = null;
        let xeroAllReference = await this.prisma.clientXeroConnection.findFirst({
            where:{
                xeroTenantId: XERO__TENANT__ID,
                clientId: client.id
            }
        })

        if(xeroAllReference){
            clientReference = xeroAllReference.xeroReference;
            existingReference = xeroAllReference.xeroReference;
        }

        const phones = [];
        if (client.phone) {
            const phone: Phone = {
                phoneNumber: client.phone,
                phoneCountryCode: client.phoneCode,
                phoneType: Phone.PhoneTypeEnum.MOBILE
            };
            phones.push(phone);
        }

        if (!clientReference && client.email) {
            try {
                let response = await this.xero.accountingApi.getContacts(XERO__TENANT__ID, null, `emailAddress="${client.email}"`);
                if (response.body && response.body.contacts && response.body.contacts.length > 0) {
                    clientReference = response.body.contacts[0].contactID;
                }
            } catch (err) {
                this.logger.error("Some error while finding contact", err.message)
            }
        }

        const contact: Contact = {
            name: client.name,
            emailAddress: client.email,
            contactID: (clientReference) ? clientReference: undefined,
            phones: phones,
            contactStatus: (client.isDeleted) ? Contact.ContactStatusEnum.ARCHIVED : Contact.ContactStatusEnum.ACTIVE
        };

        const contacts: Contacts = {
            contacts: [contact]
        };

        let xeroNewClient = await this.xero.accountingApi.updateOrCreateContacts(XERO__TENANT__ID, contacts);
        if (xeroNewClient && xeroNewClient.body?.contacts?.length > 0) {
            let xeroContactData: Contact = xeroNewClient.body?.contacts[0];
            if (xeroContactData) {
                this.allProcessed.push({
                    resourceId: xeroContactData.contactID,
                    type: 'CONTACT'
                });
                if(existingReference !== xeroContactData.contactID){
                    await this.prisma.clientXeroConnection.upsert({
                        where:{
                            xeroTenantId_clientId_xeroReference:{
                                xeroTenantId: XERO__TENANT__ID,
                                xeroReference: xeroContactData.contactID,
                                clientId: client.id
                            }
                        },
                        create:{
                            xeroTenantId: XERO__TENANT__ID,
                            xeroReference: xeroContactData.contactID,
                            clientId: client.id
                        },
                        update: {}
                    })
                }
                this.resetProcessedData(xeroContactData.contactID, 'CONTACT');
            }
        }
        return xeroNewClient;
    }

    async getBrandingThemes() {
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }
        let tenantId = this.getDefaultTenantId();
        return this.xero.accountingApi.getBrandingThemes(tenantId);
    }

    async getQuotes(filters: XeroQuoteFiltersDto = {}) {
        await this.validateAccessToken();
        return this.xero.accountingApi.getQuotes(filters.tenantId, null, null, null, null, null, null, null, null, null, filters.quoteNumber);
    }

    async prepareQuotationFromXeroQuote(quotes: Quote[], filters: XeroQuoteFiltersDto) {
        this.logger.log(`Preparing Quotation From Xero Quote ${filters.quoteNumber}`);
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        this.logger.log("Syncing Quotation Data From Xero")
        let quotationData: Prisma.QuotationUncheckedCreateInput;
        let activeRecord = quotes.find((ele) => ele.status !== QuoteStatusCodes.DELETED);
        if (!activeRecord) {
            throw {
                message: "Couldnot find Invoice from XERO",
                statusCode: 404
            }
        }

        let existingQuotation = await this.prisma.quotation.findFirst({
            where: {
                quoteNumber: filters.quoteNumber,
                isDeleted: false
            },
            include: {
                Lead: true,
                QuotationMilestone: true
            },
            orderBy: {
                id: 'desc'
            }
        })

        if (existingQuotation) {
            if (existingQuotation.xeroReference && existingQuotation.xeroReference !== activeRecord.quoteID) {
                if (filters.force !== true) {
                    throw {
                        message: "This quotation already exists in the system and has a different XERO reference. This may lead to data corruption if done forcefully",
                        statusCode: 400,
                        data: {
                            isDuplicate: true
                        }
                    }
                }
            }
        }

        let clientData = await this.prisma.client.findFirst({
            where: {
                OR: [
                    { 
                        ClientXeroConnection:{
                            some:{
                                xeroReference: activeRecord.contact.contactID, 
                                xeroTenantId: filters.tenantId
                            }
                        }
                     }
                ]
            }
        })

        if (!clientData) {
            clientData = await this.syncLocalContact({ resourceId: activeRecord.contact.contactID, eventCategory: 'CONTACT', eventType: 'UPDATE', tenantId: filters.tenantId })
        }

        let leadData = existingQuotation?.Lead;
        if (!leadData) {
            leadData = await this.prisma.leads.create({
                data: {
                    clientId: clientData.id,
                    message: "Auto Created from XERO Application",
                    xeroTenantId: filters.tenantId
                }
            })
        }

        // console.log(activeRecord);
        let quoteFile: string | null = null;
        try {
            let quoteAttatchment = await this.xero.accountingApi.getQuoteAsPdf(filters.tenantId, activeRecord.quoteID,
                {
                    headers: {
                        "Accept": "application/pdf"
                    }
                });
            if (quoteAttatchment.body) {
                let filename = "Quotation-" + slugify(clientData.name) + "-" + Date.now() + "__" + existingQuotation?.id + ".pdf";
                let fileLocation = getDynamicUploadPath() + "/";
                quoteFile = fileLocation + filename;
                await uploadFromBuffer(quoteAttatchment.body, quoteFile)
            }
        } catch (err) {
            this.logger.error("Some error while getting quote attachment", err.message);
        }

        quotationData = {
            xeroReference: activeRecord.quoteID,
            xeroTenantId: filters.tenantId,
            quoteNumber: activeRecord.quoteNumber,
            leadId: leadData.id,
            status: this.matchXeroQuoteStatusToLocalQuoteStatus(activeRecord.status),
            scopeOfWork: activeRecord.summary,
            paymentTerms: activeRecord.terms,
            addedDate: new Date(),
            expiryDate: (activeRecord.expiryDate) ? new Date(activeRecord.expiryDate) : undefined,
            issueDate: (activeRecord.date) ? new Date(activeRecord.date) : undefined,
            subTotal: activeRecord.subTotal,
            total: activeRecord.total,
            vatAmount: activeRecord.totalTax,
            isDeleted: false,
            type: QuotationType.manual,
            file: (quoteFile) ? quoteFile : undefined
        }

        let newQuotationData: Quotation;
        if (existingQuotation) {
            newQuotationData = await this.prisma.quotation.update({
                where: {
                    id: existingQuotation.id
                },
                data: quotationData
            })
        } else {
            newQuotationData = await this.prisma.quotation.upsert({
                where: {
                    xeroReference: activeRecord.quoteID
                },
                create: quotationData,
                update: quotationData
            })
        }

        if (newQuotationData) {
            let exitingQuoteMilestones = (existingQuotation?.QuotationMilestone) ? existingQuotation.QuotationMilestone : [];
            let quoteMilestones: Prisma.QuotationMilestoneUncheckedCreateInput[] = [];
            let toDeleteIds: number[] = [];
            let allAccounts = [];
            let allTaxRates = [];

            activeRecord.lineItems.forEach((ele) => {
                if (ele.accountCode) { allAccounts.push(ele.accountCode) }
                if (ele.taxType) { allTaxRates.push(ele.taxType) }
            })

            let accountDt = this.prisma.account.findMany({
                where: {
                    accountCode: {
                        in: allAccounts
                    }
                }
            })

            let taxRatesDt = this.prisma.taxRate.findMany({
                where: {
                    taxType: {
                        in: allTaxRates
                    }
                }
            })

            const [accountData, taxRatesData] = await Promise.all([accountDt, taxRatesDt]);
            for (let i = 0; i < activeRecord?.lineItems?.length; i++) {
                let ele = activeRecord?.lineItems[i];
                let prevMilestone = exitingQuoteMilestones.find((dt) => dt.xeroReference === ele.lineItemID);
                let lineAccount: AccountModel;
                let lineTaxRate: TaxRateModel;

                if (ele.accountCode && ele.accountID) {
                    lineAccount = accountData.find((dt) => dt.accountCode === ele.accountCode);
                    if (!lineAccount) {
                        try {
                            let xeroAccountData = await this.xero.accountingApi.getAccount(filters.tenantId, ele.accountID);
                            if (xeroAccountData.body?.accounts) {
                                lineAccount = await this.syncEachAccount(xeroAccountData.body.accounts[0], filters.tenantId)
                            }
                        } catch (err) {
                            const error = JSON.stringify(err.response?.body, null, 2)
                            this.logger.error(`Error while saving new account. Status Code: ${err.response?.statusCode} => ${error}`);
                        }
                    }
                }

                if (ele.taxType) {
                    lineTaxRate = taxRatesData.find((dt) => dt.taxType === ele.taxType);
                    if (!lineTaxRate) {
                        try {
                            let xeroItemData = await this.xero.accountingApi.getTaxRates(filters.tenantId, `taxType="${ele.taxType}"`);
                            if (xeroItemData.body?.taxRates) {
                                lineTaxRate = await this.syncEachTaxRate(xeroItemData.body.taxRates[0], filters.tenantId);
                            }
                        } catch (err) {
                            const error = JSON.stringify(err.response?.body, null, 2)
                            this.logger.error(`Error while saving new tax rate. Status Code: ${err.response?.statusCode} => ${error}`);
                        }
                    }
                }

                quoteMilestones.push({
                    id: prevMilestone ? prevMilestone.id : undefined,
                    xeroReference: ele.lineItemID,
                    title: ele.description,
                    quantity: ele.quantity,
                    taxAmount: ele.taxAmount,
                    amount: ele.unitAmount,
                    requirePayment: true,
                    status: prevMilestone ? prevMilestone.status : undefined,
                    quotationId: newQuotationData.id,
                    accountId: lineAccount ? lineAccount.id : undefined,
                    taxRateId: lineTaxRate ? lineTaxRate.id : undefined
                })
            }

            exitingQuoteMilestones.forEach((ele) => {
                let item = quoteMilestones.find((dt) => dt.id === ele.id);
                if (!item) {
                    toDeleteIds.push(ele.id);
                }
            })

            let allPromises = [];
            if (toDeleteIds.length > 0) {
                await this.prisma.quotationMilestone.deleteMany({
                    where: { id: { in: toDeleteIds } }
                })
            }

            quoteMilestones.forEach((ele) => {
                if (ele.id) {
                    allPromises.push(this.prisma.quotationMilestone.update({
                        where: {
                            id: ele.id
                        },
                        data: ele
                    }))
                } else {
                    allPromises.push(this.prisma.quotationMilestone.upsert({
                        where: {
                            xeroReference: ele.xeroReference
                        },
                        create: ele,
                        update: ele
                    }))
                }
            })
            await Promise.all(allPromises);
            // if (!existingQuotation?.file || existingQuotation?.status === QuotationStatus.created) {
            //     newQuotationData = await this.quotationService.generateQuotationPdf(newQuotationData.id);
            // }
        }
        return newQuotationData;
    }

    async prepareInvoiceFromXeroInvoice(invoices: Xero_Invoice[], tenantId: string) {
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        this.logger.log("Syncing Invoice Data From Xero")
        let invoiceData: Prisma.InvoiceUncheckedCreateInput;
        let activeRecord = invoices.find((ele) => ele.status !== Xero_Invoice.StatusEnum.DELETED);
        if (!activeRecord) {
            throw {
                message: "Couldnot find Invoice from XERO",
                statusCode: 404
            }
        }

        let existingInvoice = await this.prisma.invoice.findFirst({
            where: {
                OR: [
                    { xeroReference: activeRecord.invoiceID },
                    {
                        invoiceNumber: activeRecord.invoiceNumber,
                        Client: { 
                            ClientXeroConnection:{
                                some:{
                                    xeroReference: activeRecord.contact?.contactID, 
                                    xeroTenantId: tenantId
                                }
                            }
                         }
                    }
                ]
            },
            include: {
                Client: true,
                InvoiceItems: true,
                _count:{
                    select:{
                        Transactions:{
                            where:{
                                recordType: TransactionRecordType.government_fees,
                                isDeleted: false,
                                status:{
                                    not: {
                                        in: [TransactionStatus.paid, TransactionStatus.canceled]
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        })

        let clientData = await this.prisma.client.findFirst({
            where: { ClientXeroConnection:{
                some:{
                    xeroReference: activeRecord.contact.contactID, 
                    xeroTenantId: tenantId
                }
            } }
        })

        if (!clientData) {
            clientData = await this.syncLocalContact({ resourceId: activeRecord.contact.contactID, eventCategory: 'CONTACT', eventType: 'UPDATE', tenantId: tenantId })
        }

        let quoteId: number;
        let projectId: number;
        if (activeRecord.reference) {
            let quoteData = await this.prisma.quotation.findFirst({
                where: {
                    quoteNumber: activeRecord.reference,
                    Lead: {
                        Client: {
                            ClientXeroConnection:{
                                some:{
                                    xeroReference: activeRecord.contact?.contactID
                                }
                            }
                        }
                    }
                }
            }).catch(err => {
                this.logger.error("Some error while extracting reference number");
            })

            if (quoteData) {
                quoteId = quoteData.id;
                projectId = quoteData.projectId
            }
        }

        let invoiceFile: string | null = null;
        if (!existingInvoice || !existingInvoice.file) {
            try {
                let invoiceAttatchment = await this.xero.accountingApi.getInvoiceAsPdf(tenantId, activeRecord.invoiceID,
                    {
                        headers: {
                            "Accept": "application/pdf"
                        }
                    });
                if (invoiceAttatchment.body) {
                    let filename = "Invoice-" + slugify(clientData.name) + "-" + Date.now() + "__" + existingInvoice?.id + ".pdf";
                    let fileLocation = getDynamicInvoiceUploadPath() + "/";
                    invoiceFile = fileLocation + filename;
                    await uploadFromBuffer(invoiceAttatchment.body, invoiceFile)
                }
            } catch (err) {
                this.logger.error("Some error while getting quote attachment", err.message);
            }
        }

        invoiceData = {
            xeroReference: activeRecord.invoiceID,
            xeroTenantId: tenantId,
            invoiceNumber: activeRecord.invoiceNumber,
            status: this.matchXeroInvoiceStatusToLocalInvoiceStatus(activeRecord.status),
            addedDate: new Date(),
            issueDate: (activeRecord.date) ? new Date(activeRecord.date) : undefined,
            expiryDate: (activeRecord.dueDate) ? new Date(activeRecord.dueDate) : undefined,
            subTotal: activeRecord.subTotal,
            total: activeRecord.total,
            vatAmount: activeRecord.totalTax,
            type: InvoiceType.manual,
            clientId: clientData.id,
            quotationId: (quoteId) ? quoteId : undefined,
            projectId: (projectId) ? projectId : undefined,
            file: (invoiceFile) ? invoiceFile : undefined
        }

        let newInvoiceData: PrismaInvoice & { Project: Partial<Project> };
        if (existingInvoice) {
            newInvoiceData = await this.prisma.invoice.update({
                where: {
                    id: existingInvoice.id
                },
                data: invoiceData,
                include: {
                    Project: {
                        select: {
                            id: true,
                            onHold: true,
                            comment: true
                        }
                    }
                }
            })
        } else {
            newInvoiceData = await this.prisma.invoice.create({
                data: invoiceData,
                include: {
                    Project: {
                        select: {
                            id: true,
                            onHold: true,
                            comment: true
                        }
                    }
                }
            })
        }

        if (newInvoiceData) {
            let exitingInvoiceItems = (existingInvoice?.InvoiceItems) ? existingInvoice.InvoiceItems : [];
            let invoiceItems: Prisma.InvoiceItemUncheckedCreateInput[] = [];
            let toDeleteIds: number[] = [];
            let allAccounts = [];
            let allProducts = [];
            let allTaxRates = [];

            activeRecord.lineItems.forEach((ele) => {
                if (ele.accountCode) { allAccounts.push(ele.accountCode) }
                if (ele.itemCode) { allProducts.push(ele.itemCode) }
                if (ele.taxType) { allTaxRates.push(ele.taxType) }
            })

            let accountDt = this.prisma.account.findMany({
                where: {
                    accountCode: {
                        in: allAccounts
                    }
                }
            })
            let productsDt = this.prisma.product.findMany({
                where: {
                    productCode: {
                        in: allProducts
                    }
                }
            })

            let taxRatesDt = this.prisma.taxRate.findMany({
                where: {
                    taxType: {
                        in: allTaxRates
                    }
                }
            })

            const [accountData, productsData, taxRatesData] = await Promise.all([accountDt, productsDt, taxRatesDt]);
            // activeRecord?.lineItems.forEach((ele) => {
            for (let i = 0; i < activeRecord?.lineItems?.length; i++) {
                let ele = activeRecord?.lineItems[i];
                let prevInvoice = exitingInvoiceItems.find((dt) => dt.xeroReference === ele.lineItemID);

                let lineAccount: AccountModel;
                let lineProduct: Product;
                let lineTaxRate: TaxRateModel;

                if (ele.accountCode && ele.accountID) {
                    lineAccount = accountData.find((dt) => dt.accountCode === ele.accountCode);
                    if (!lineAccount) {
                        try {
                            let xeroAccountData = await this.xero.accountingApi.getAccount(tenantId, ele.accountID);
                            if (xeroAccountData.body?.accounts) {
                                lineAccount = await this.syncEachAccount(xeroAccountData.body.accounts[0], tenantId)
                            }
                        } catch (err) {
                            const error = JSON.stringify(err.response?.body, null, 2)
                            this.logger.error(`Error while saving new account. Status Code: ${err.response?.statusCode} => ${error}`);
                        }
                    }
                }

                if (ele.itemCode) {
                    lineProduct = productsData.find((dt) => dt.productCode === ele.itemCode);
                    if (!lineProduct && ele.item?.itemID) {
                        try {
                            let xeroItemData = await this.xero.accountingApi.getItem(tenantId, ele.item.itemID);
                            if (xeroItemData.body?.items) {
                                lineProduct = await this.syncEachProduct(xeroItemData.body.items[0])
                            }
                        } catch (err) {
                            const error = JSON.stringify(err.response?.body, null, 2)
                            this.logger.error(`Error while saving new product. Status Code: ${err.response?.statusCode} => ${error}`);
                        }
                    }
                }

                if (ele.taxType) {
                    lineTaxRate = taxRatesData.find((dt) => dt.taxType === ele.taxType);
                    if (!lineTaxRate) {
                        try {
                            let xeroItemData = await this.xero.accountingApi.getTaxRates(tenantId, `taxType="${ele.taxType}"`);
                            if (xeroItemData.body?.taxRates) {
                                lineTaxRate = await this.syncEachTaxRate(xeroItemData.body.taxRates[0], tenantId);
                            }
                        } catch (err) {
                            const error = JSON.stringify(err.response?.body, null, 2)
                            this.logger.error(`Error while saving new tax rate. Status Code: ${err.response?.statusCode} => ${error}`);
                        }
                    }
                }

                invoiceItems.push({
                    id: prevInvoice ? prevInvoice.id : undefined,
                    xeroReference: ele.lineItemID,
                    title: ele.description,
                    quantity: ele.quantity,
                    amount: ele.unitAmount,
                    invoiceId: newInvoiceData.id,
                    taxAmount: ele.taxAmount,
                    accountId: lineAccount ? lineAccount.id : undefined,
                    productId: lineProduct ? lineProduct.id : undefined,
                    taxRateId: lineTaxRate ? lineTaxRate.id : undefined
                })
            }

            let transactions: Prisma.TransactionsUncheckedCreateInput[] = [];
            activeRecord?.payments.forEach((ele) => {
                transactions.push({
                    xeroReference: ele.paymentID,
                    title: "Synced from Xero",
                    transactionDate: new Date(ele.date),
                    amount: ele.amount,
                    status: TransactionStatus.paid,
                    transactionReference: ele.reference,
                    invoiceId: newInvoiceData.id,
                    projectId: newInvoiceData.projectId,
                    recordType: TransactionRecordType.invoice_transaction
                })
            })

            exitingInvoiceItems.forEach((ele) => {
                let item = invoiceItems.find((dt) => dt.id === ele.id);
                if (!item) {
                    toDeleteIds.push(ele.id);
                }
            })

            let allPromises = [];
            if (toDeleteIds.length > 0) {
                await this.prisma.invoiceItem.deleteMany({
                    where: { id: { in: toDeleteIds } }
                })
            }

            invoiceItems.forEach((ele) => {
                if (ele.id) {
                    allPromises.push(this.prisma.invoiceItem.update({
                        where: {
                            id: ele.id
                        },
                        data: ele
                    }))
                } else {
                    allPromises.push(this.prisma.invoiceItem.upsert({
                        where: {
                            xeroReference: ele.xeroReference
                        },
                        create: ele,
                        update: ele
                    }))
                }
            })

            transactions.forEach((ele) => {
                allPromises.push(this.prisma.transactions.upsert({
                    where: {
                        xeroReference: ele.xeroReference
                    },
                    create: ele,
                    update: ele
                }))
            })

            await Promise.all(allPromises);

            if (newInvoiceData && newInvoiceData.Project && newInvoiceData.Project.onHold && newInvoiceData.status === InvoiceStatus.paid && existingInvoice?.status !== InvoiceStatus.paid) {
                const prjData = await this.prisma.project.update({
                    where: {
                        id: newInvoiceData.Project.id
                    },
                    data: {
                        onHold: false,
                        comment: "Payment verified from XERO and Project Auto Resumed"
                    }
                })
                let emitterData = new NotificationEventDto({ recordId: prjData.id, moduleName: 'projectResumeNotification' });
                this.eventEmitter.emit('notification.send', emitterData);
            }

            //update all government fees attatched
            if (existingInvoice && existingInvoice._count?.Transactions > 0 && (newInvoiceData.status === InvoiceStatus.paid || newInvoiceData.status === InvoiceStatus.canceled)) {

                let transactionStatus: number;
                if(newInvoiceData.status === InvoiceStatus.paid){
                    transactionStatus = TransactionStatus.paid
                }else if(newInvoiceData.status === InvoiceStatus.canceled){
                    transactionStatus = TransactionStatus.canceled
                }

                await this.prisma.transactions.updateMany({
                    where: {
                        isDeleted: false,
                        recordType: TransactionRecordType.government_fees,
                        invoiceId: newInvoiceData.id,
                        status: {
                            not: {
                                in: [TransactionStatus.paid, TransactionStatus.canceled]
                            }
                        }
                    },
                    data: {
                        status: transactionStatus
                    }
                })
            }
        }

        return newInvoiceData;
    }

    async handleWebhook(payload: WebhookEventPayload) {
        console.log("Webhook call", payload);
        let allEvents = payload.events;
        let allPromises = [];
        let allProcessed: { resourceId: string, type: keyof typeof XeroEnventCategory }[] = [...this.allProcessed];
        if (Array.isArray(allEvents)) {
            allEvents.forEach((ele) => {
                let isProcessed = allProcessed.find((processedItems) => processedItems.resourceId === ele.resourceId && processedItems.type === ele.eventCategory);
                if (isProcessed) return;
                allProcessed.push({
                    resourceId: ele.resourceId,
                    type: ele.eventCategory
                })
                if (ele.eventCategory === 'CONTACT') {
                    allPromises.push(this.syncLocalContact(ele));
                } else if (ele.eventCategory === 'INVOICE') {
                    allPromises.push(this.syncLocalInvoice(ele));
                } else {
                    this.logger.error("No such webhook event registered, found", ele.eventCategory);
                }
            })
        }

        await Promise.all(allPromises);
    }

    async syncLocalContact(event: WehbookEventType) {
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let contactData = await this.xero.accountingApi.getContact(event.tenantId, event.resourceId);
        let contact: Contact = contactData.body.contacts[0];
        let status: Contact.ContactStatusEnum = contact.contactStatus;
        if (!contact) {
            this.logger.error(`Couldnot find contact on xero with id ${event.resourceId}`)
            return;
        }
        let phone: Phone = contact.phones.find((ele) => ele.phoneType = Phone.PhoneTypeEnum.MOBILE)
        let recordToUpsert: Prisma.ClientUncheckedCreateInput = {
            name: contact.name,
            email: contact.emailAddress,
            phone: (phone && phone.phoneNumber) ? phone.phoneNumber : undefined,
            phoneCode: (phone && phone.phoneNumber) ? phone.phoneCountryCode : undefined,
            isDeleted: (status === Contact.ContactStatusEnum.ACTIVE) ? false : undefined
        };

        try {
            let localClient = await this.prisma.client.findFirst({
                where: {
                    ClientXeroConnection:{
                        some: {
                            xeroReference: event.resourceId
                        }
                    }
                }
            });

            if (localClient) {
                let clientDt = await this.prisma.client.update({
                    where: {
                        id: localClient.id
                    },
                    data: recordToUpsert
                })

                await this.prisma.clientXeroConnection.upsert({
                    where:{
                        xeroTenantId_clientId_xeroReference:{
                            xeroTenantId: event.tenantId,
                            clientId: clientDt.id,
                            xeroReference: event.resourceId
                        }
                    },
                    create:{
                        xeroTenantId: event.tenantId,
                        clientId: clientDt.id,
                        xeroReference: event.resourceId
                    },
                    update: {}
                })

                return clientDt;

            } else {
                if (recordToUpsert.email) {
                    let clientDt = await this.prisma.client.upsert({
                        where: {
                            email:recordToUpsert.email,
                        },
                        create: recordToUpsert,
                        update: recordToUpsert
                    })

                    await this.prisma.clientXeroConnection.upsert({
                        where:{
                            xeroTenantId_clientId_xeroReference:{
                                xeroTenantId: event.tenantId,
                                clientId: clientDt.id,
                                xeroReference: event.resourceId
                            }
                        },
                        create:{
                            xeroTenantId: event.tenantId,
                            clientId: clientDt.id,
                            xeroReference: event.resourceId
                        },
                        update: {}
                    })

                    return clientDt;

                } else {
                    return await this.prisma.client.create({
                        data: {
                            ...recordToUpsert,
                            ClientXeroConnection:{
                                create:{
                                    xeroTenantId: event.tenantId,
                                    xeroReference: event.resourceId
                                }
                            }
                        }
                    })
                }
            }
        } catch (err) {
            this.logger.error("Some error while syncing client with xero", err.message);
        }
    }

    async syncLocalInvoice(event: WehbookEventType) {
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }
        
        let invoiceData = await this.xero.accountingApi.getInvoice(event.tenantId, event.resourceId);
        let invoices = invoiceData.body.invoices;
        let allPromises = [];
        try {
            invoices?.forEach((invoice) => {
                if (invoice.status === Xero_Invoice.StatusEnum.DRAFT) return;
                allPromises.push(this.prepareInvoiceFromXeroInvoice([invoice], event.tenantId));
            })
            await Promise.all(allPromises);
        } catch (err) {
            this.logger.error("Some error while adding invoice from xero", err.message)
        }
    }

    async checkLoginStatus() {
        let ref = await this.getRefreshToken();
        if (ref) return true;
        return false;
    }

    async syncAllTenantsAccounts(){
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let allTenants = this.xero.tenants as {tenantId: string, tenantName: string}[];
        allTenants.forEach(async (ele) =>{
            if(!ele.tenantName.includes("Demo")){
            await this.syncAccounts(ele.tenantId);
            }
        })
    }

    async syncAccounts(tenantId: string) {

        try {
            let allAccounts = await this.xero.accountingApi.getAccounts(tenantId, null, 'Status=="ACTIVE"');
            if (!allAccounts.body || !allAccounts.body.accounts) {
                return {
                    message: "No data to sync",
                    statusCode: 200
                }
            }
            const MAX_CONCURRENT_OPERATIONS = 10;
            this.logger.log(`Found ${allAccounts.body?.accounts?.length} accounts to sync`);
            await BluebirdPromise.map(allAccounts.body.accounts, async (account: Account) => {
                try {
                    await this.syncEachAccount(account, tenantId)
                } catch (err) {
                    this.logger.error("Some error while syncing each account", err.message)
                }
            }, { concurrency: MAX_CONCURRENT_OPERATIONS });
        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            this.logger.error(`Status Code: ${err.response.statusCode} => ${error}`);
            throw {
                message: "Some error while syncing accounts",
                statusCode: 400
            }
        }
    }

    async syncAllTenantsProducts(){
        
        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let allTenants = this.xero.tenants as {tenantId: string, tenantName: string}[];
        allTenants.forEach(async (ele) =>{
            if(!ele.tenantName.includes("Demo")){
                await this.syncProducts(ele.tenantId);
            }
        })
    }

    async syncProducts(tenantId: string) {

        try {
            let allAccounts = await this.xero.accountingApi.getItems(tenantId);
            if (!allAccounts.body || !allAccounts.body.items) {
                return {
                    message: "No product data to sync",
                    statusCode: 200
                }
            }

            const MAX_CONCURRENT_OPERATIONS = 10;
            this.logger.log(`Found ${allAccounts.body?.items?.length} products to sync`);
            await BluebirdPromise.map(allAccounts.body.items, async (item: Item) => {
                try {
                    await this.syncEachProduct(item)
                } catch (err) {
                    this.logger.error("Some error while syncing each product", err.message)
                }
            }, { concurrency: MAX_CONCURRENT_OPERATIONS });

        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            this.logger.error(`Status Code: ${err.response.statusCode} => ${error}`);
            throw {
                message: "Some error while syncing product",
                statusCode: 400
            }
        }
    }

    async syncAllTenantsTaxRates(){

        let valid = await this.validateAccessToken();
        if (!valid) { this.logger.log("Invalid Access Token"); return }

        let allTenants = this.xero.tenants as {tenantId: string, tenantName: string}[];
        allTenants.forEach(async (ele) =>{
            if(!ele.tenantName.includes("Demo")){
            await this.syncTaxRates(ele.tenantId);
            }
        })

    }

    async syncTaxRates(tenantId: string) {
        
        try {
            let allAccounts = await this.xero.accountingApi.getTaxRates(tenantId, 'Status=="ACTIVE"');
            if (!allAccounts.body || !allAccounts.body.taxRates) {
                return {
                    message: "No tax rate data to sync",
                    statusCode: 200
                }
            }

            const MAX_CONCURRENT_OPERATIONS = 10;
            this.logger.log(`Found ${allAccounts.body?.taxRates?.length} tax rates to sync`);
            await BluebirdPromise.map(allAccounts.body.taxRates, async (taxRate: TaxRate) => {
                try {
                    await this.syncEachTaxRate(taxRate, tenantId)
                } catch (err) {
                    this.logger.error("Some error while syncing each tax rate", err.message)
                }
            }, { concurrency: MAX_CONCURRENT_OPERATIONS });

        } catch (err) {
            const error = JSON.stringify(err.response.body, null, 2)
            this.logger.error(`Status Code: ${err.response.statusCode} => ${error}`);
            throw {
                message: "Some error while syncing tax rates",
                statusCode: 400
            }
        }
    }

    async syncEachAccount(account: Account, tenantId: string) {
        return this.prisma.account.upsert({
            where: {
                xeroReference: account.accountID
            },
            update: {
                title: account.name,
                accountCode: account.code,
                xeroType: String(account.type),
                description: account.description,
                bankAccountNumber: account.bankAccountNumber,
                xeroTenantId: tenantId
            },
            create: {
                xeroReference: account.accountID,
                title: account.name,
                accountCode: account.code,
                xeroType: String(account.type),
                description: account.description,
                bankAccountNumber: account.bankAccountNumber,
                showInExpenseClaims: (account.showInExpenseClaims) ? account.showInExpenseClaims : undefined,
                xeroTenantId: tenantId
            }
        })
    }

    async syncEachTaxRate(taxRate: TaxRate, tenantId: string) {
        return this.prisma.taxRate.upsert({
            where: {
                title_taxType_xeroTenantId: {
                    title: taxRate.name,
                    taxType: taxRate.taxType,
                    xeroTenantId: tenantId
                }
            },
            update: {
                title: taxRate.name,
                taxType: taxRate.taxType,
                xeroTenantId: tenantId
            },
            create: {
                title: taxRate.name,
                rate: taxRate.effectiveRate,
                taxType: taxRate.taxType,
                xeroTenantId: tenantId
            }
        })
    }


    async syncEachProduct(item: Item) {
        let taxRate: TaxRateModel
        if (item.salesDetails?.taxType) {
            taxRate = await this.prisma.taxRate.findFirst({
                where: {
                    taxType: item.salesDetails?.taxType
                }
            })
        }

        let account: AccountModel;
        if (item.salesDetails?.accountCode) {
            account = await this.prisma.account.findFirst({
                where: {
                    accountCode: item.salesDetails?.accountCode
                }
            })
        }

        return this.prisma.product.upsert({
            where: {
                xeroReference: item.itemID
            },
            update: {
                productCode: item.code,
                title: item.name,
                description: item.description,
                quantity: item.quantityOnHand,
                unitPrice: item.totalCostPool,
                accountId: account.id,
                taxRateId: taxRate.id
            },
            create: {
                xeroReference: item.itemID,
                productCode: item.code,
                title: item.name,
                description: item.description,
                quantity: item.quantityOnHand,
                unitPrice: item.totalCostPool,
                accountId: account.id,
                taxRateId: taxRate.id
            }
        })
    }

}
