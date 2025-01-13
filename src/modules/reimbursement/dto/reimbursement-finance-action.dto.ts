import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNotEmpty, IsOptional } from "class-validator";
import { ReimbursementStatus } from "src/config/constants";

type AcceptedStatus = ReimbursementStatus.rejected |  ReimbursementStatus.paid_and_closed;
const AcceptedStatus = [ReimbursementStatus.rejected,  ReimbursementStatus.paid_and_closed];
export class ReimbursementFinanceAction {

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string;

    @ApiProperty({enum: AcceptedStatus})
    @IsNotEmpty({message: "Please choose receipt action, whether it is paid or rejected"})
    @IsIn(AcceptedStatus, {message: "Please choose whether the receipt is paid or rejected"})
    @Type(() => Number)
    status: AcceptedStatus
}