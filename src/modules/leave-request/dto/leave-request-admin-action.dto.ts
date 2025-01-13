import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { LeaveRequestStatus } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";


export class LeaveRequestAdminAction {

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    isPaid: boolean

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string

    @ApiProperty({enum: [LeaveRequestStatus.approved,LeaveRequestStatus.rejected,LeaveRequestStatus.request_modification]})
    @IsNotEmpty({message: "Please choose receipt action, whether it is approved or rejected"})
    @IsIn([LeaveRequestStatus.approved,LeaveRequestStatus.rejected,LeaveRequestStatus.request_modification], {message: "Please choose whether to approve or reject this request"})
    @Type(() => Number)
    status: LeaveRequestStatus.approved | LeaveRequestStatus.rejected | LeaveRequestStatus.request_modification
}