import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import {  IsDate, IsInt, IsNotEmpty, IsOptional} from "class-validator";

export class CreateLeadDto implements Prisma.LeadsUncheckedCreateInput {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    enquiryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    representativeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    submissionById?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    message?: string;

    @Exclude()
    addedById?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dueDateForSubmissions?: Date;

    // @ApiProperty()
    // @IsNotEmpty({ message: "Please select which XERO Company to use to sync the data" })
    // xeroTenantId?: string = null;
}
