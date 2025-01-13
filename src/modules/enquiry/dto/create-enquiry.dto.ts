import { ApiProduces, ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Enquiry, Leads } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, Max, MaxLength } from "class-validator";
import { EnquirySource } from "src/config/constants";

export class CreateEnquiryDto implements Partial<Enquiry> {
    @ApiProperty()
    @IsNotEmpty({message: "Please enter your name"})
    name: string;

    @ApiProperty({description: "From which page the request is coming from. For the analysis"})
    @IsNotEmpty({message: "Please enter slug"})
    slug: string; //to know from which page the request is coming from

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({enum: EnquirySource})
    @IsNotEmpty({message: "Please provide a source"})
    @IsEnum(EnquirySource)
    source: keyof typeof EnquirySource

    @ApiPropertyOptional()
    @IsOptional()
    @MaxLength(4)
    phoneCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    projectTypeId?: number

    @ApiPropertyOptional()
    @IsOptional()
    @MaxLength(20)
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @MaxLength(1500)
    message?: string;
}
