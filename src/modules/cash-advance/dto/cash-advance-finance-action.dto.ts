import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { CashAdvanceRequestStatus } from "src/config/constants";

const AcceptedStatus = [CashAdvanceRequestStatus.rejected, CashAdvanceRequestStatus.paid_and_closed];
type AcceptedStatusType = CashAdvanceRequestStatus.rejected | CashAdvanceRequestStatus.paid_and_closed;
export class CashAdvanceFinanceAction {

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string;
    
    @ApiProperty()
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    numberOfInstallments: number;

    @ApiProperty({enum: AcceptedStatus})
    @IsNotEmpty({message: "Please choose receipt action, whether it is paid or rejected"})
    @IsEnum(AcceptedStatus)
    @Type(() => Number)
    status: AcceptedStatusType
}