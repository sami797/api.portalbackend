import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { InvoiceStatus } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

type InvoiceStatusAcceptedType = InvoiceStatus.sent | InvoiceStatus.paid | InvoiceStatus.canceled
const InvoiceStatusAccepted = [InvoiceStatus.sent, InvoiceStatus.paid, InvoiceStatus.canceled];
export class InvoiceStatusDto {
    @ApiProperty({enum: InvoiceStatusAccepted})
    @IsNotEmpty({message: "Please choose a status"})
    @IsEnum(InvoiceStatusAccepted)
    status: InvoiceStatusAcceptedType

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    resumeProject: boolean
}