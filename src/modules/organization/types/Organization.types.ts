export enum OrganizationMetaKeys {
    /** Service areas can be a array of location ids, the results should be fetched and mapped while viewing on the front-end */
    serviceAreas = "serviceAreas",
    /** contains the type of propertyIds */
    propertyTypes= "propertyTypes",
    /** Office Registration Number given to each RERA-registered real estate company in Dubai */
    officeRegistrationNumber =  "officeRegistrationNumber"
}

export class OrganizationUpdatedEvent {
    organizationId: number
}