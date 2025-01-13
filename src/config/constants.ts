export const SUPER_ADMIN = "SUPER-ADMIN";
export const SYSTEM_USERS = "SYSTEM-USERS";
export const TEST_EMAIL = "yogen@yallahproperty.ae";
export const TEST_PHONE = "509826068";
//YALLAH-USERS role will have an access to multi country data

export const defaultYallahEmail = "yogen@yallahproperty.ae";
export const REDIS_DB_NAME = "LIVE_DAT-Portal-Redis-DB";
export const defaultYallahAlternateEmail = "yogen.pokhrel@datconsultancy.com";
export const ImagesThresholdForBlogs = 15; // maximum number of images that can be uploaded per blog
export const VAT_RATE = 5;

export const HOSTS = {
    serverDomain: "http://localhost:5556",
    activeFrontendDomains: [
        "https://portal.datconsultancy.com"
    ],
    defaultFrontendDomain: "https://portal.datconsultancy.com",
    defaultAdminDomain: "https://portal.datconsultancy.com",
    country: {
        AE: "https://portal.datconsultancy.com",
        IN: "https://portal.datconsultancy.com"
    }
}

export enum USER_SIGNUP_SOURCE_TYPES {
    "google" = "google",
    "apple" = "apple",
    "email" = "email",
    "phone" = "phone",
    "organization" = "organization",
    "yallahAdmins" = "yallahAdmins",
    "organization_bulk_upload" = "organization_bulk_upload"
}

export enum DataFilterType {
    "equals" = "equals",
    "like" = "like",
    "greaterThan" = "gt",
    "greaterThanEquals" = "gte",
    "not" = "not",
    "in" = "in",
    "notIn" = "notIn"
}

export enum OrganizationStatus {
    "active" = 1,
    "suspended" = 2,
    "pending verification" = 3,
    "waiting for documents" = 4
}

export enum FileStatus {
    "Waiting for verification" = 1,
    "Additional documents required" = 2,
    "Rejected" = 3,
    "Verified" = 4
}

export enum UserStatus {
    "active" = 1,
    "suspended" = 2
}

export enum BlogsCategory {
    "Blog" = 1,
    "News" = 2
}

export enum BlogsStatus {
    "Not Published, Verification Required" = 1,
    "Modification Required" = 2,
    "Requested for Verification" = 3,
    "Verified & Published" = 4
}


export enum BlogsCategoryStatus {
    "Not Published, Verification Required" = 1,
    "Modification Required" = 2,
    "Requested for Verification" = 3,
    "Verified & Published" = 4
}

export enum LeadsStatus {
    "new" = 1,
    "in_progress" = 2,
    "unqualified" = 3,
    "confirmed" = 4,
    "canceled" = 5,
    "invalid_request" = 6,
    "spam" = 7,
}

export enum ClientType {
    company = 1,
    individual = 2
}

export enum QuotationStatus {
    "created" = 1,
    "submitted" = 2,
    "confirmed" = 3,
    "rejected" = 4,
    "revised" = 5,
    "invoiced" = 6,
    "draft" =0,
}

export enum EnquirySource {
    "manual" = "manual",
    "whatsapp" = "whatsapp",
    "dubaiapprovals.com" = "dubaiapprovals.com",
    "abudhabiapprovals.com" = "abudhabiapprovals.com",
    "datconsultancy.com" = "datconsultancy.com",
    "luxedesign.ae" = "luxedesign.ae",
    "phone" = "phone",
    "email" = "email",
    "facebook" = "facebook",
    "tiktok" = "tiktok",
    "instagram" = "instagram",
    "facebook_reels" = "facebook_reels",
    "linkedIn" = "linkedIn",
    "twitter" = "twitter",
    "other" = "other"
}

export enum PagesStatus {
    "Not Published, Verification Required" = 1,
    "Modification Required" = 2,
    "Requested for Verification" = 3,
    "Verified & Published" = 4
}

export enum CountryStatus {
    "active" = 1,
    "InActive" = 2
}


type SystemLogsDynamicAction = string & { forCompiler?: string };
export type SystemLogsActionType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "LOGIN" | SystemLogsDynamicAction;

export const ejsTemplateDefaults = {
    frontendDomain: "https://portal.datconsultancy.com/",
    facebookUrl: "https://www.facebook.com/DATengineeringConsultancy",
    linkedInUrl: "https://www.linkedin.com/company/dat-architects-engineers/",
    instagramUrl: "https://www.instagram.com/dat.architects/",
    unsubscribeUrl: "",
    emailTitle: "",
    hideFooter: false,
    notificationPreferences: "https://portal.datconsultancy.com/profile?tab=manage_notifications",
    companyAddress: "Opus Tower By Omniyat, Office B803 Business Bay, Dubai"
}

//these credentials are used to repair the system in case of deadlock
export const safeModeUser = "info@theproranker.com";
export const safeModeBackupKeys = [
    "!4Kp#7Lw9$2S&8R*5",
    "@2Fg%8Xy6^Qz1Vc3O*",
    "9T!h6Bf4Ae7Gj1Pq5R",
    "3p$l7w*2zQ9h6aF4xE",
    "5m#Nc1v3x4oP7Lr2S@W",
]

export enum SubscriptionsType {
    "news_and_blogs" = "news_and_blogs"
}

export enum PropertyNotificationType {
    "new_alerts" = "new_alerts",
    "expired" = "expired",
    "insufficient_credits_to_recharge" = "insufficient_credits_to_recharge"
}

export enum AuthTokenStatus {
    active = 1,
    expired = 2,
    used = 3
}

export enum AlertsTypeSlug {
    "properties" = "properties",
    "propertyDocuments" = "propertyDocuments",
    "emailLeads" = "emailLeads"
}

export enum KnownSMSGateways {
    "SMS-ALA" = "SMS-ALA",
    "SMS-ALA-TEST" = "SMS-ALA-TEST",
    "SMS-COUNTRY" = "SMS-COUNTRY",
    "SMS-COUNTRY-TEST" = "SMS-COUNTRY-TEST"
}

export const TransactionStatus = Object.freeze({
    sent_to_client: 1,
    pending_payment: 2,
    paid: 3,
    canceled: 4
})

export const TransactionRecordType = Object.freeze({
    government_fees: 1,
    invoice_transaction: 2
})

export const ProjectRole = Object.freeze({
    projectIncharge: 1,
    supportEngineers: 2
})

export const TaskStatus = Object.freeze({
    toDo: 1,
    inProgress: 2,
    done: 3
})

export const Priority = Object.freeze({
    high: 1,
    medium: 2,
    normal: 3
})

export const TaskType = Object.freeze({
    normal : 1,
    techSupport: 2
})

export enum OrganizationType {
    own = 1,
    branch = 2,
    partner = 3
}

export enum UserType {
    employee = 1,
    client = 2
}

export enum EnquiryStatus {
    "New" = 1,
    "Qualified" = 2,
    "Unqualified" = 3,
    "Spam" = 4,
}

export enum ReimbursementStatus {
    "submitted" = 1,
    "approved" = 2,
    "rejected" = 3,
    "partially_approved" = 4,
    "paid_and_closed" = 5,
    "withdrawn" = 6
}

export enum CashAdvanceRequestStatus {
    "submitted" = 1,
    "approved" = 2,
    "rejected" = 3,
    "partially_approved" = 4,
    "paid_and_closed" = 5,
    "withdrawn" = 6,
}

export enum LeaveRequestStatus {
    "new" = 1,
    "submitted" = 2,
    "request_modification" = 3,
    "in_progress" = 4,
    "approved" = 5,
    "rejected" = 6,
    "withdrawn" = 7,
}

export enum CarReservationRequestStatus {
    "submitted" = 1,
    "in_progress" = 2,
    "approved" = 3,
    "rejected" = 4,
    "withdrawn" = 5,
}

export enum ActionStatus {
    "New / No Action Yet" = 1,
    "Approved" = 2,
    "Rejected" = 3,
    "Partially Approved" = 4
}

export enum Departments {
    "hr" = "hr",
    "finance" = "finance",
    "softwareEngineering" = "softwareEngineering",
    "techSupport" = "tech-support",
    "manager" = "manager"
}

export const GenericEmailDomains = Object.freeze([
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "icloud.com",
    "aol.com",
    "protonmail.com",
    "zoho.com",
    "gmx.com",
    "mail.com",
    "yandex.com",
    "tutanota.com",
    "fastmail.com",
    "hushmail.com",
    "mailinator.com",
    "guerrillamail.com",
    "emirates.net.ae",
    "etisalat.ae",
    "du.ae"
])

export enum LeaveType {
    "annual-leave" = "annual-leave",
    "sick-leave" =  "sick-leave",
    "maternity-parental-leave" = "maternity-parental-leave",
    "short-leave" = "short-leave",
    "unpaid-leave" = "unpaid-leave",
    "bereavement-leave" = "bereavement-leave",
    "others" = "others"
}

export enum WeekDays  {
    "sunday" = 0,
    "monday" = 1,
    "tuesday" = 2,
    "wednesday" = 3,
    "thursday" = 4,
    "friday" = 5,
    "saturday" = 6,
}

export enum QuotationType {
    "auto" = 1,
    "manual" = 2
}

export enum InvoiceType {
    "auto" = 1,
    "manual" = 2
};

export enum BiometricsEntryType {
    "auto" = 1,
    "manual" = 2,
    "bulk" = 3,
    "force" = 4
}

export enum AttendanceEntryType {
    "auto" = 1,
    "manual" = 2
}

export enum AttendanceStatus {
    complete = 1,
    incomplete = 2,
    late = 3,
    absent = 4,
    off = 5
}

export enum SupervisionPaymentSchedule {
    "Monthly - Month End" = 1,
    "Monthly - Month start" = 2,
    "Quaterly" = 3,
    "Biannually" = 4,
    "Annually" = 5
}

export enum CompanyAssetType {
    "other" = 1,
    "computer" = 2,
    "sim_card" = 3,
    "mobile" = 4,
    "car" = 5
}

/** 
 * This status will be chosen when milestone is just created
 - "not_completed" = 1
 * 
 * When the milestone is completed and invoice is created for the same
 - "invoice_generated" = 2
 * 
 * When the generated invoice is sent to the client
 - "invoice_sent" = 3
 * 
 * When the invoice is marked as paid
 - "invoice_paid" = 4,
 * 
 * When the invoice is canceled or not paid
 - "invoice_canceled" = 5
 */
export enum MilestoneStatus {
    /** This status will be chosen when milestone is just created */
    "not_completed" = 1,
    /** This status will be chosen when milestone is completed */
    "completed" = 2,
    /** When the invoice is created for the milestone */
    "invoice_generated" = 3,
    /** When the generated invoice is sent to the client */
    "invoice_sent" = 4,
    /** When the invoice is marked as paid */
    "invoice_paid" = 5,
    /** When the invoice is canceled or not paid */
    "invoice_canceled" = 6
}

export enum InvoiceStatus {
    "generated" = 1,
    "sent" = 2,
    "paid" = 3,
    "canceled" = 4
}
export enum BiometricsJobStatus {
    "new" = 1,
    "processing" = 2,
    "completed" = 3,
    "failed" = 4,
    "rollback" = 5,
    "force_stopped"
}

export const ResourcesLocation = Object.freeze({
    "biometrics-bulk-upload": "biometrics-bulk-upload",
    "car-reservation-request": "car-reservation-request",
    "cash-advance": "cash-advance",
    "invoice": "invoice",
    "leave-request": "leave-request",
    "organization": "organization",
    "projects": "projects",
    "quotation": "quotation",
    "reimbursements": "reimbursements",
    "task": "task",
    "user": "user",
    "enquiry": "enquiry",
    "transaction" : "transaction",
    "permits" : "permits",
    "payroll" : "payroll",
    "selfie" : "selfie"
})

/** These are only known project status, other status are dynamic and comes from Project State Module */
export enum KnownProjectStatus {
    "new" = "new",
    "completed" = "completed",
    "canceled" = "canceled",
    "ready_for_submission" = "ready_for_submission",
    "approved" = "approved"
}

export enum FeedbackType {
    "website" = 1,
    "project" = 2,
    "page" = 3
}

export enum FeedbackRatingRange {
    "Smooth Sailing" = 5,
    "User-Friendly" = 4,
    "Neutral Ground" = 3,
    "Bumpy Ride" = 2,
    "Frustrating" = 1
}

export const OrganizationPolicy = Object.freeze({
    trialPeriod: 30,
    areHolidaysPaidInTrialPeriod: false,
    attendanceGraceTime : 0.083, //in hours
    lateGraceTime: 0.5 // in hours
})

export enum PermitFinanceStatus {
    pending_payment = 1,
    paid = 2,
    canceled = 3
}

export enum PermitClientStatus {
    to_be_sent = 1,
    sent = 2,
}
