export const XeroEnventCategory = {
    "CONTACT" : "CONTACT",
    "INVOICE" : "INVOICE",
    "QUOTATION" : "QUOTATION"
}

export const XeroEnventTpe = {
    "UPDATE" : "UPDATE",
    "CREATE" : "CREATE",
    "DELETE" : "DELETE"
}

export type WehbookEventType = {
        resourceUrl?: string,
        resourceId: string,
        tenantId: string,
        tenantType?: 'ORGANISATION',
        eventCategory: keyof typeof XeroEnventCategory,
        eventType: keyof typeof XeroEnventTpe,
        eventDateUtc?: Date
}


export type WebhookEventPayload = {
    events: WehbookEventType[],
    firstEventSequence: number,
    lastEventSequence: number,
    entropy: string
}