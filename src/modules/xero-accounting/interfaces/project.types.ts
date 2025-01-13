export interface Project {
    projectId: string; // Make this required to match XeroProject
    slug: string;
    title: string;
    submissionById?: number;
    clientId?: number;
    projectTypeId?: number;
    instructions?: string;
    projectFilesLink?: string;
    priority: number;
    startDate?: Date;
    endDate?: Date;
    isExtended: boolean;
    reasonOfExtension?: string;
    projectStateId?: number;
    isDeleted: boolean;
    isClosed: boolean;
    addedById?: number;
    modifiedById?: number;
    deletedById?: number;
    addedDate: Date;
    modifiedDate?: Date;
    deletedDate?: Date;
    leadId?: number;
    comment?: string;
    onHold: boolean;
    referenceNumber?: string;
    projectHoldById?: number;
    xeroReference?: string;
    projectEstimate: number;
    xeroTenantId?: string;

    // Required properties to align with XeroProject
    contactId: string; // Make this required
    currencyCode: string; // Make this required
    minutesLogged: number; // Make this required
    totalTaskAmount: Amount[]; // Assuming this is required
    totalExpenseAmount: Amount[]; // Assuming this is required
    estimateAmount: Amount; // Assuming this is required
    minutesToBeInvoiced: number; // Make this required
    status: string; // Make this required
}


export interface Projects {
    projects: Project[];
}

export interface XeroProjectsResponse {
    body: Projects;
}
export interface Amount {
    value: number;         // The numerical value of the amount
    currencyCode: string;  // The currency code (e.g., 'USD', 'EUR', etc.)
}