import { Injectable, Logger } from "@nestjs/common";
import { Client, Invoice, Project, Quotation } from "@prisma/client";
import { PrismaService } from "src/prisma.service";
import { XeroAccountingService } from "../xero-accounting.service";
import { OrganizationDefaultAttributes } from "src/modules/organization/dto/organization.dto";
import { ClientDefaultAttributes } from "src/modules/client/dto/client.dto";
import { LeadsDefaultAttributes } from "src/modules/leads/dto/leads.dto";

@Injectable()
export class XeroProcessorService {

    private readonly logger = new Logger(XeroProcessorService.name);
    constructor(private readonly prisma: PrismaService, private readonly xeroAccountingService: XeroAccountingService){}

    async syncClient(client: Client, xeroTenantId: string){
        await this.xeroAccountingService.upsertContact(client, xeroTenantId);
    }

    async syncInvoice(invoice: Invoice){
        let invoiceData = await this.prisma.invoice.findUnique({
            where:{
                id: invoice.id
            },
            include:{
                Client:{
                    select: ClientDefaultAttributes
                },
                Project:{
                    select:{
                        id: true,
                        title: true,
                        slug: true,
                        xeroReference: true,
                        SubmissionBy:{
                            select: OrganizationDefaultAttributes
                        },
                        Lead:{
                            select: LeadsDefaultAttributes
                        }
                    }
                }
            }
        })
        await this.xeroAccountingService.upsertInvoice(invoiceData);
    }

    async syncQuotation(quotation: Quotation){
        let quotationData = await this.prisma.quotation.findUnique({
            where:{
                id: quotation.id
            },
            include:{
                Lead:{
                    select:{
                        id: true,
                        Client: {
                            select: ClientDefaultAttributes
                        },
                        SubmissionBy:{
                            select: OrganizationDefaultAttributes
                        }
                    }
                }
            }
        })
        await this.xeroAccountingService.upsertQuotation(quotationData);
    }

    async updateQuotationStatus(quotation: Quotation){
        await this.xeroAccountingService.updateQuotationStatus(quotation);
    }

    async updateInvoiceStatus(invoice: Invoice){
        await this.xeroAccountingService.updateInvoiceStatus(invoice);
    }

    async syncProject(project: Project){
        await this.xeroAccountingService.upsertProject(project);
    }
}