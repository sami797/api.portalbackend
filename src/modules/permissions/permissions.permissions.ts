import { CountryPermissionSet } from "../country/country.permissions";
import { RolePermissionSet } from "../role/role.permissions";
import { SystemModulesPermissionSet } from "../system-modules/system-modules.permissions";
import { UserPermissionSet } from "../user/user.permissions";
import { OrganizationPermissionSet } from "../organization/organization.permissions";
import { SMSPermissionSet } from "../sms/sms.permissions";
import { BlogsPermissionSet } from "../blogs/blogs-permissions";
import { PaymentGatewayPermissionSet } from "../payment-gateway/payment-gateway.permissions";
import { SavedSearchesPermissionSet } from "../saved-searches/saved-searches.permissions";
import { StaticPageSEOPermissionSet } from "../static-page-seo/static-page-seo.permissions";
import { SitePagesPermissionSet } from "../site-pages/site-pages.permissions";
import { SitePagesSectionPermissionSet } from "../site-pages-section/site-pages-section.permissions";
import { SitePagesContentPermissionSet } from "../site-pages-content/site-pages-content.permissions";
import { TransactionPermissionSet } from "../transactions/transactions.permissions";
import { AlertsTypePermissionSet } from "../alerts-type/alerts-type.permissions";
import { BlogsCategoryPermissionSet } from "../blogs-category/blogs-category.permissions";
import { FaqsCategoryPermissionSet } from "../faqs-category/faqs-category.permissions";
import { FaqsPermissionSet } from "../faqs/faqs.permissions";
import { LeadsPermissionSet } from "../leads/leads.permissions";
import { ProjectPermissionSet } from "../project/project.permissions";
import { TaskPermissionSet } from "../task/task.permissions";
import { AuthoritiesPermissionSet } from "../authorities/authorities.permissions";
import { ProjectStatePermissionSet } from "../project-state/project-state.permissions";
import { ProjectTypePermissionSet } from "../project-type/project-type.permissions";
import { DepartmentPermissionSet } from "../department/department.permissions";
import { DairyPermissionSet } from "../diary/diary.permissions";
import { ProjectComponentPermissionSet } from "../project-components/project-component.permissions";
import { EnquiryPermissionSet } from "../enquiry/enquiry.permissions";
import { ReimbursementPermissionSet } from "../reimbursement/reimbursement.permissions";
import { LeaveRequestPermissionSet } from "../leave-request/leave-request.permissions";
import { CashAdvancePermissionSet } from "../cash-advance/cash-advance.permissions";
import { QuotationPermissionSet } from "../quotation/quotation.permissions";
import { InvoicePermissionSet } from "../invoice/invoice.permissions";
import { ClientPermissionSet } from "../client/client.permissions";
import { CompanyAssetPermissionSet } from "../company-asset/company-asset.permissions";
import { BiometricsPermissionSet } from "../biometrics/biometrics.permissions";
import { BiometricsJobPermissionSet } from "../biometrics-job/biometrics-job.permissions";
import { BulkUploadFormatPermissionSet } from "../bulk-upload-format/bulk-upload-format.permissions";
import { FeedbackPermissionSet } from "../feedback/feedback.permissions";
import { SystemLogsPermissionSet } from "../system-logs/system-logs.permissions";
import { CarReservationRequestPermissionSet } from "../car-reservation/car-reservation-request.permissions";
import { AttendancePermissionSet } from "../attendance/attendance.permissions";
import { MailPermissionSet } from "../../mail/mail.permissions";
import { NotificationPermissionSet } from "../notification/notification.permissions";
import { DashboardElementPermissionSet } from "../dashboard-elements/dashboard-elements.permissions";
import { PermitPermissionSet } from "../permits/permits.permissions";
import { LeaveTypePermissionSet } from "../leave-type/leave-type.permissions";
import { PayrollPermissionSet } from "../payroll/payroll.permissions";
import { PayrollCyclePermissionSet } from "../payroll-cycle/payroll-cycle.permissions";
import { XeroAccountingPermissionSet } from "../xero-accounting/xero-accounting.pwemissions";
import { AccountPermissionSet } from "../account/account.permissions";
import { ProductPermissionSet } from "../product/product.permissions";
import { TaxRatePermissionSet } from "../tax-rate/tax-rate.permissions";
import { BrandingThemePermissionSet } from "../branding-theme/branding-theme.permissions";
import { WorkingHourPermissionSet } from "../working-hours/working-hours.permissions";

export enum PermissionsPermissionSet {
    "CREATE" = "createPermissions",
    "UPDATE" = "updatePermissions",
    "DELETE" = "deletePermissions",
    "READ" = "readPermissions",
    "GRANT" = "grantPrivilegesToRole",
    "REVOKE" = "revokePrivilegesFromRole",
    "READ_ROLE_PERMISSIONS" = "readRolePermissions",
    "VIEW_PERMISSIONS_LIST" = "viewPermissonsList"
}

export const permissionSets = {
    "role": RolePermissionSet,
    "user": UserPermissionSet,
    "country": CountryPermissionSet,
    "systemModules": SystemModulesPermissionSet,
    "organization": OrganizationPermissionSet,
    "permissions": PermissionsPermissionSet,
    "sms": SMSPermissionSet,
    "blogs": BlogsPermissionSet,
    "paymentGateway": PaymentGatewayPermissionSet,
    "savedSearches": SavedSearchesPermissionSet,
    "staticPageSeo": StaticPageSEOPermissionSet,
    "sitePages": SitePagesPermissionSet,
    "sitePagesSection": SitePagesSectionPermissionSet,
    "sitePagesContent": SitePagesContentPermissionSet,
    "transaction": TransactionPermissionSet,
    "alertsType": AlertsTypePermissionSet,
    "blogsCategory": BlogsCategoryPermissionSet,
    "faqsCategory": FaqsCategoryPermissionSet,
    "faqs": FaqsPermissionSet,
    "leads": LeadsPermissionSet,
    "enquiry": EnquiryPermissionSet,
    "project" : ProjectPermissionSet,
    "task" : TaskPermissionSet,
    "authority" : AuthoritiesPermissionSet,
    "department" : DepartmentPermissionSet,
    "projectState" : ProjectStatePermissionSet,
    "projectType" : ProjectTypePermissionSet,
    "diary" : DairyPermissionSet,
    "projectComponent" : ProjectComponentPermissionSet,
    "reimbursement" : ReimbursementPermissionSet,
    "leaveRequest" : LeaveRequestPermissionSet,
    "cashAdvanceRequest" : CashAdvancePermissionSet,
    "quotation": QuotationPermissionSet,
    "invoice" : InvoicePermissionSet,
    "client" : ClientPermissionSet,
    "companyAsset": CompanyAssetPermissionSet,
    "biometrics": BiometricsPermissionSet,
    "biometricsBulkUpload": BiometricsJobPermissionSet,
    "bulkUploadFormat": BulkUploadFormatPermissionSet,
    "feedback" : FeedbackPermissionSet,
    "systemLogs" : SystemLogsPermissionSet,
    "carReservation": CarReservationRequestPermissionSet,
    "attendance": AttendancePermissionSet,
    "email": MailPermissionSet,
    "announcement": NotificationPermissionSet,
    "dashboardElement" : DashboardElementPermissionSet,
    "permit": PermitPermissionSet,
    "leave-type": LeaveTypePermissionSet,
    "payroll": PayrollPermissionSet,
    "payrollCycle": PayrollCyclePermissionSet,
    "xeroAccounting": XeroAccountingPermissionSet,
    "account" : AccountPermissionSet,
    "product": ProductPermissionSet,
    "taxRate" : TaxRatePermissionSet,
    "brandingTheme" : BrandingThemePermissionSet,
    "workingHour" : WorkingHourPermissionSet
}