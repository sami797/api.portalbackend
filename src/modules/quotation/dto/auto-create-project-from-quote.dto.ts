import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AutoCreateProjectDto implements Prisma.ProjectUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide valid project title" })
    title: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide quote number" })
    @Type(() => Number)
    quoteId?: number;

    @ApiProperty()
    @IsOptional({ message: "Please provide submission by ID" })
    @Type(() => Number)
    submissionById?: number;

    @ApiProperty()
    @IsOptional({ message: "Please provide project type ID" })
    @Type(() => Number)
    projectTypeId?: number;
    
    @ApiPropertyOptional()
    @IsOptional()
    instructions?: string; 

    @ApiPropertyOptional()
    @IsOptional({ message: "Please provide valid project start date" })
    @IsDate()
    @Type(() => Date)
    startDate?: Date;
    
    @ApiPropertyOptional()
    @IsOptional({ message: "Please provide valid project end date" })
    @IsDate()
    @Type(() => Date)
    endDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    xeroReference?: string;

    // Required properties from ProjectUncheckedCreateInput
    @ApiProperty()
    @IsNotEmpty({ message: "Project ID is required" })
    @IsString()  // Ensuring it is a string type
    projectId: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Contact ID is required" })
    @IsString()  // Ensuring it is a string type
    contactId: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Currency code is required" })
    @IsString()  // Ensuring it is a string type
    currencyCode: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Status is required" })
    @IsString()  // Ensuring it is a string type
    status: string;
}
