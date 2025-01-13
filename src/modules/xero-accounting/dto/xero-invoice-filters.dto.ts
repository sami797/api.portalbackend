export class XeroInvoiceFiltersDto {
    ifModifiedSince?: Date;
    where?: string;
    order?: string;
    iDs?: Array<string>;
    invoiceNumbers?: Array<string>;
    contactIDs?: Array<string>;
    statuses?: Array<string>;
    page?: number;
    includeArchived?: boolean;
    createdByMyApp?: boolean;
    unitdp?: number;
    summaryOnly?: boolean
}