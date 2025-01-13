import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDate, IsEnum, IsInt, IsNotEmpty, IsOptional } from "class-validator";
import { ClientType } from "src/config/constants";

export class AutoCreateLeadFromEnquiryDto implements Prisma.LeadsUncheckedCreateInput {
    @ApiProperty({enum: ClientType})
    @IsNotEmpty()
    @IsEnum(ClientType)
    clientType: typeof ClientType[keyof typeof ClientType];;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide project type ID"})
    @Type(() => Number)
    projectTypeId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide submission by company"})
    @Type(() => Number)
    @IsInt()
    submissionById?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientId: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide enquiry ID"})
    @Type(() => Number)
    enquiryId: number;

    @ApiPropertyOptional()
    @IsOptional()
    message: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    assignedToId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dueDateForSubmissions?: Date

    // @ApiProperty()
    // @IsNotEmpty({ message: "Please select which XERO Company to use to sync the data" })
    // xeroTenantId?: string = null;
}