import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ResponseSuccess } from "src/common-types/common-types";
import { Notification } from "../entities/notification.entity";
import { Job } from "bull";

export class NotificationResponseObject implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty()
    data: Notification
}

export class NotificationResponseArray implements ResponseSuccess {
    @ApiProperty()
    message: string;
    @ApiProperty()
    statusCode: number;
    @ApiProperty({isArray: true})
    data: Notification
}

export enum NotificationType {
    quotationApproved = "quotationApproved",
    milestoneCompleted = "milestoneCompleted",
    enquiryConfirmed = "enquiryConfirmed",
    reimbursement = "reimbursement",
    invoice = "invoice",
    projectMembersAddition = "projectMembersAddition",
    projectHoldNotification = "projectHoldNotification",
    projectResumeNotification = "projectResumeNotification",
    newProject = "newProject",
    dailyNotification = "dailyNotification"
}
export class NotificationEventDto {
    recordId: number;
    moduleName: keyof typeof NotificationType;
    additionalData?: any;

    constructor(data:{recordId: number, moduleName: keyof typeof NotificationType, additionalData?: any}){
        this.moduleName = data.moduleName;
        this.recordId = data.recordId;
        this.additionalData = data.additionalData
    }
}

export const notificationFileUploadPath = 'public/notification';