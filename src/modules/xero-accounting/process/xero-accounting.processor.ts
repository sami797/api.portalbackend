import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { XeroProcessorService } from './xero-accounting.processor.service';
import { PrismaService } from 'src/prisma.service';
import { Client, Invoice, Project, Quotation } from '@prisma/client';
import { XeroProcessNames } from './xero.process.config';

@Processor('xero')
export class XeroProcessor {
    private readonly logger = new Logger(this.constructor.name);
    constructor(private readonly xeroProcessorService: XeroProcessorService, private readonly prisma: PrismaService) { }

    @Process(XeroProcessNames.syncClient)
    async syncClient(job: Job<{ data: Client & {xeroTenantId: string} }>) {
        let clientData = job.data?.data;
        try{
            await this.xeroProcessorService.syncClient(clientData, clientData?.xeroTenantId);
        }catch(err){
            this.logger.error("Some error while syncing client data", err);
        }
    }

    @Process(XeroProcessNames.syncInvoice)
    async syncInvoice(job: Job<{ data: Invoice }>) {
        let invoiceData = job.data?.data;
        try{
            await this.xeroProcessorService.syncInvoice(invoiceData);
        }catch(err){
            this.logger.error("Some error while syncing invoice data", err);
        }
    }

    @Process(XeroProcessNames.syncQuotation)
    async syncQuotation(job: Job<{ data: Quotation }>) {
        let quotationData = job.data?.data;
        try{
            await this.xeroProcessorService.syncQuotation(quotationData);
        }catch(err){
            this.logger.error("Some error while syncing quotation data", err);
        }
    }

    @Process(XeroProcessNames.updateQuotationStatus)
    async updateQuotationStatus(job: Job<{ data: Quotation }>) {
        let quotationData = job.data?.data;
        try{
            await this.xeroProcessorService.updateQuotationStatus(quotationData);
        }catch(err){
            this.logger.error("Some error while updating quotation status", err);
        }
    }

    @Process(XeroProcessNames.updateInvoiceStatus)
    async updateInvoiceStatus(job: Job<{ data: Invoice }>) {
        let invoiceData = job.data?.data;
        try{
            await this.xeroProcessorService.updateInvoiceStatus(invoiceData);
        }catch(err){
            this.logger.error("Some error while updating invoice status", err);
        }
    }

    @Process(XeroProcessNames.syncProject)
    async syncProject(job: Job<{ data: Project }>) {
        let projectData = job.data?.data;
        try{
            await this.xeroProcessorService.syncProject(projectData);
        }catch(err){
            this.logger.error("Some error while updating project", err);
        }
    }


    @Process()
    globalHandler(job: Job) {
        this.logger.error('No listners were provided, fall back to default', job.data);
    }
}