import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { CashAdvanceRequestStatus } from "src/config/constants";



const AcceptedStatus = [CashAdvanceRequestStatus.approved, CashAdvanceRequestStatus.rejected, CashAdvanceRequestStatus.partially_approved ];
type AcceptedStatusType = CashAdvanceRequestStatus.approved | CashAdvanceRequestStatus.rejected | CashAdvanceRequestStatus.partially_approved;

export class CashAdvanceHrAction {

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string

    @ApiProperty({enum: AcceptedStatus})
    @IsNotEmpty({message: "Please choose receipt action, whether it is approved or rejected"})
    @IsEnum(AcceptedStatus)
    @Type(() => Number)
    status: AcceptedStatusType

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a valid amount in AED"})
    @Type(() => Number)
    approvedAmount?: number;
}