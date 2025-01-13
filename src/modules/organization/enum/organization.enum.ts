export enum OrganizationDocumentsTypes {
    "Emirates ID / password" = "emirates_id_or_password",
    "Trade Liscense" = "trade_liscense",
    "Supporting documents" = "supporting_documents",
    "other" = "other"
}


export const OrganizationScoringStandards = {
    "phone": "phone",
    "email" : "email",
    "description" : "description" ,
    "officeRegistrationNumber": "officeRegistrationNumber"
}

export const OrganizationScoringPoints = {
    "email" : 10,
    "phone": 10,
    "description" : 10,
    "officeRegistrationNumber": 10
}

export const OrganizationStandardsForScoring = {
    "description" : 300, // characters
}

export const RequiredDocumentsChecklist = ["trade_liscense"]