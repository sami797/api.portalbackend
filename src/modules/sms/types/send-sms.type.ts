import { SmsConfiguration } from "@prisma/client"
import { AuthenticatedUser } from "src/authentication/jwt-payload"

export type SMSData = {
    gateway?: SmsConfiguration;
    phone: string;
    phoneCode: string;
    message: string;
    smsType: 'T' | 'P';
    user?: AuthenticatedUser;
}