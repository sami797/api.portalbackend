export enum UserMetaKeys {
    "dateOfBirth" = "dateOfBirth",
    "nationality" = "nationality",
    "religion" = "religion",
    "maritalStatus" = "maritalStatus",
    "gender" = "gender",
    "personalNumber" = "personalNumber",
    "personalEmail" = "personalEmail",
    "currentProfession" = "currentProfession",
    "passportNumber" = "passportNumber",
    "passportExpiryDate" = "passportExpiryDate",
    "emergencyContactName" = "emergencyContactName",
    "emergencyContactRelationship" = "emergencyContactRelationship",
    "emergencyContactAddress" = "emergencyContactAddress",
    "emergencyContactNumber" = "emergencyContactNumber",
    "labourCardNumber" = "labourCardNumber"
}

export class UserUpdatedEvent {
    userId: number
}

export enum UserDocumentsTypes {
    "emiratesId" = "emiratesId",
    "passport" = "passport",
    "visa" = "visa",
    "education_certificate" = "education_certificate",
    "offer_letter" = "offer_letter",
    "resume" = "resume",
    "other" = "other"
}