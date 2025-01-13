import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { DashboardElement } from "../entities/dashboard-element.entity";
import { ProjectPermissionSet } from "src/modules/project/project.permissions";
import { TaskPermissionSet } from "src/modules/task/task.permissions";
import { UserPermissionSet } from "src/modules/user/user.permissions";
import { QuotationPermissionSet } from "src/modules/quotation/quotation.permissions";
import { InvoicePermissionSet } from "src/modules/invoice/invoice.permissions";
import { EnquiryPermissionSet } from "src/modules/enquiry/enquiry.permissions";
import { LeadsPermissionSet } from "src/modules/leads/leads.permissions";
import { ReimbursementPermissionSet } from "src/modules/reimbursement/reimbursement.permissions";
import { PermitPermissionSet } from "src/modules/permits/permits.permissions";
import { TransactionPermissionSet } from "src/modules/transactions/transactions.permissions";

export class DashboardElementResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: DashboardElement
}

export class DashboardElementResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: DashboardElement
}

export enum DashboardElementSlugs {
"delayed_projects" = "delayed_projects",
"active_projects" = "active_projects",
"all_tasks" = "all_tasks",
"pending_project_as_support_engineer" = "pending_project_as_support_engineer",
"pending_project_as_project_incharge" = "pending_project_as_project_incharge",
"new_project" = "new_project",
"ready_for_submission" = "ready_for_submission",
"approved_projects" = "approved_projects",
"close_out_projects" = "close_out_projects",
"active_employees" = "active_employees",
"on_hold_projects" = "on_hold_projects",
"closed_projects" = "closed_projects",
"notification" = "notification",
"active_quotations" = "active_quotations",
"pending_invoices" = "pending_invoices",
"active_enquiries" = "active_enquiries",
"active_leads" = "active_leads",
"active_reimbursement" = "active_reimbursement",
"active_leave_request" = "active_leave_request",
"active_cash_advance_request" = "active_cash_advance_request",
"permits_expiring" = "permits_expiring",
"government_fees_to_collect" = "government_fees_to_collect"
}

export type DashboardElementSlugTypes  = keyof typeof DashboardElementSlugs;
export type DashboardElementsPermissionSet = {
    [key in DashboardElementSlugTypes]: 
    ProjectPermissionSet.READ | 
    UserPermissionSet.READ |
    QuotationPermissionSet.READ |
    InvoicePermissionSet.READ |
    EnquiryPermissionSet.READ |
    LeadsPermissionSet.READ |
    PermitPermissionSet.READ |
    TransactionPermissionSet.READ |
    null;
};

export const DashboardElementsSet: DashboardElementsPermissionSet = Object.freeze({
    "delayed_projects" : ProjectPermissionSet.READ,
    "active_projects": ProjectPermissionSet.READ,
    "all_tasks": null,
    "pending_project_as_support_engineer": ProjectPermissionSet.READ,
    "pending_project_as_project_incharge" : ProjectPermissionSet.READ,
    "new_project": ProjectPermissionSet.READ,
    "ready_for_submission": ProjectPermissionSet.READ,
    "approved_projects" : ProjectPermissionSet.READ,
    "close_out_projects": ProjectPermissionSet.READ,
    "active_employees" : UserPermissionSet.READ,
    "ready_for_submission_projects" : ProjectPermissionSet.READ,
    "on_hold_projects" : ProjectPermissionSet.READ,
    "closed_projects" : ProjectPermissionSet.READ,
    "notification" : null,
    "active_quotations" : QuotationPermissionSet.READ,
    "pending_invoices" : InvoicePermissionSet.READ,
    "active_enquiries" : EnquiryPermissionSet.READ,
    "active_leads" : LeadsPermissionSet.READ,
    "permits_expiring": PermitPermissionSet.READ,
    "government_fees_to_collect" : TransactionPermissionSet.READ,
    "active_reimbursement" : null,
    "active_leave_request" : null,
    "active_cash_advance_request" : null
})