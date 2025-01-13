import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, IsBoolean } from "class-validator";
import { Priority } from "src/config/constants";

export class CreateProjectDto implements Prisma.ProjectUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid project title" })
    title: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid client ID" })
    @Type(() => Number)
    clientId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    clientRepresentativeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    projectInchargeId?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    supportEngineersId?: number[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsArray()
    @Type(() => Number)
    clients?: number[];

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid project type" })
    @Type(() => Number)
    projectTypeId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    quoteNumber?: string;

    @ApiPropertyOptional()
    @IsOptional()
    projectFilesLink?: string;

    @ApiPropertyOptional()
    @IsOptional()
    xeroReference?: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid project start date" })
    @IsDateString()
    startDate?: string | Date;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid project end date" })
    @IsDateString()
    endDate?: string | Date;

    @ApiPropertyOptional({ enum: Priority })
    @IsOptional()
    @Type(() => Number)
    priority?: number;

    @ApiPropertyOptional()
    @IsOptional()
    instructions?: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide submission by" })
    @Type(() => Number)
    submissionById?: number;

    @ApiPropertyOptional()
    @IsOptional()
    addedById?: number;  // Ensure it's included if required for Prisma schema

    @ApiPropertyOptional()
    @IsOptional()
    referenceNumber?: string;

    // Ensure that projectId is required and of type string
    @ApiProperty()
    @IsNotEmpty()
    @IsString()  // Ensuring projectId is a string
    projectId: string;

    // Ensure that contactId is required and of type string
    @ApiProperty()
    @IsNotEmpty()
    @IsString()  // Ensuring contactId is a string
    contactId: string;

    // Ensure that status is required and of type string
    @ApiProperty()
    @IsNotEmpty()
    @IsString()  // Ensuring status is a string
    status: string;

    // Adding missing fields from ProjectUncheckedCreateInput

    @ApiProperty()
    @IsNotEmpty({ message: "Currency code is required" })
    @IsString()  // Ensure currencyCode is a string
    currencyCode: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()  // Ensuring isExtended is a boolean
    isExtended?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()  // Ensuring reasonOfExtension is a string
    reasonOfExtension?: string;

    @ApiPropertyOptional()
    @IsOptional()
    projectStateId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()  // Ensuring isDeleted is a boolean
    isDeleted?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()  // Ensuring isClosed is a boolean
    isClosed?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    addedDate?: Date | string;

    @ApiPropertyOptional()
    @IsOptional()
    modifiedDate?: Date | string | null;

    @ApiPropertyOptional()
    @IsOptional()
    deletedDate?: Date | string | null;

    @ApiPropertyOptional()
    @IsOptional()
    leadId?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    comment?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    onHold?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    projectHoldById?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    xeroTenantId?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    projectEstimate?: number;

    @ApiPropertyOptional()
    @IsOptional()
    depositAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    estimateAmount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    totalInvoiced?: number;

    @ApiPropertyOptional()
    @IsOptional()
    minutesLogged?: number;

}
