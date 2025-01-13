import { SystemLogsActionType } from "src/config/constants";

export const TableNames = {
"Currency" : "Currency",
"AreaUnit" : "AreaUnit",
"Language" : "Language",
"Country" : "Country",
"Location" : "Location",
"Location_T" : "Location_T",
"Role" : "Role",
"Organization" : "Organization",
"Organization_T" : "Organization_T",
"OrganizationLiscenses" : "OrganizationLiscenses",
"User" : "User",
"UserRole" : "UserRole",
"UserMeta" : "UserMeta",
"AuthTokens" : "AuthTokens",
"Modules" : "Modules",
"Permissions" : "Permissions",
"RolePermissions" : "RolePermissions",
"PropertyCategory" : "PropertyCategory",
"PropertyCategory_T" : "PropertyCategory_T",
"PropertyType" : "PropertyType",
"PropertyType_T" : "PropertyType_T",
"PropertyCategoryPropertyTypeRelation" : "PropertyCategoryPropertyTypeRelation",
"PropertyPriceType" : "PropertyPriceType",
"PropertyPriceType_T" : "PropertyPriceType_T",
"Amenity" : "Amenity",
"Amenity_T" : "Amenity_T",
"PropertyTypeAmenityRelation" : "PropertyTypeAmenityRelation",
"PropertyCategoryTypePriceRelation" : "PropertyCategoryTypePriceRelation",
"Property" : "Property",
"Property_T" : "Property_T",
"PropertyLocation" : "PropertyLocation",
"PropertyAmenityRelation" : "PropertyAmenityRelation",
"FileManagement" : "FileManagement",
"SmsConfiguration" : "SmsConfiguration",
"SmsLogs" : "SmsLogs",
"Package" : "Package",
"Package_T" : "Package_T",
"Promotion" : "Promotion",
"Promotion_T" : "Promotion_T",
"PackagePromotions" : "PackagePromotions",
"CreditsRate" : "CreditsRate",
"PaymentGateway" : "PaymentGateway",
"Transactions" : "Transactions",
"CreditsTransactions" : "CreditsTransactions",
"OrganizationCreditsLimitPolicy" : "OrganizationCreditsLimitPolicy",
"OtpCodes" : "OtpCodes",
"emailLookupsLog" : "emailLookupsLog",
"PropertyScoring" : "PropertyScoring",
"Blogs" : "Blogs",
"BlogImages" : "BlogImages",
"BlogsCategory": "BlogsCategory",
"BlogsCategory_T": "BlogsCategory_T",
"Blogs_T" : "Blogs_T",
"Pages" : "Pages",
"Pages_T" : "Pages_T",
"StaticPageSEO" : "StaticPageSEO",
"SystemLogs" : "SystemLogs",
"Leads" : "Leads",
"Enquiry": "Enquiry"
}

export const FieldValueType = {
    number : 'number',
    string : 'string',
    json : 'json'
}

export type SystemLogsType = {
    tableName: keyof typeof TableNames;
    field: string;
    value: string | number | object;
    valueType: keyof typeof FieldValueType;
    actionType: SystemLogsActionType;
    message?: string;
    data?: object | Array<object>;
    countryId?: number;
    user: number;
    endPoint?: string;
    controllerName?: string;
    organizationId?: number;
}