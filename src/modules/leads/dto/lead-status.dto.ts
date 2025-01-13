import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { LeadsStatus } from "src/config/constants";

const AllowedStatus = [LeadsStatus.canceled, LeadsStatus.invalid_request, LeadsStatus.spam, LeadsStatus.unqualified];
type AllowedStatusType = LeadsStatus.canceled | LeadsStatus.invalid_request | LeadsStatus.spam | LeadsStatus.unqualified;

export class LeadsStatusDto {
    @ApiProperty({enum: AllowedStatus})
    @IsNotEmpty({message: "Please choose a status"})
    @IsEnum(AllowedStatus)
    status: AllowedStatusType;
}