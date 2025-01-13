export class XeroClientFiltersDto {
    ifModifiedSince?: Date = null;
    where?: string = null;
    order?: string = null;
    iDs?: string[] = null;
    page?: number = null;
    includeArchived?: boolean = null;
    summaryOnly?: boolean = null;
    searchTerm?: string = null;
}