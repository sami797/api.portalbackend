import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize, IsEmail } from 'class-validator';
import { OrganizationType } from 'src/config/constants';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';

export class CreateOrganizationDto implements Prisma.OrganizationUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNotEmpty({message: "-*-*nization code, this is used as a prefix to Invoices and Quotations"})
    organizationCode?: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the email" })
    @IsEmail()
    email: string;

    @ApiProperty({type: Number})
    @IsNotEmpty({ message: "Please provide the phone" })
    phone: string;

    @ApiPropertyOptional()
    @IsOptional()
    whatsapp?: string;


    @ApiPropertyOptional()
    @IsOptional()
    taxRegistrationNumber?: string;

    @ApiProperty({type: Number})
    @IsNotEmpty({ message: "Please provide the phone code" })
    phoneCode: string;

    @ApiProperty({enum: OrganizationType})
    @IsNotEmpty({ message: "Please provide the phone code" })
    @IsEnum(OrganizationType)
    @Type(() => Number)
    type: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    parentId: number;

    @ApiPropertyOptional()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    locationMap?: string;

    @ApiPropertyOptional({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    logo?: string;

    @ApiPropertyOptional({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    digitalStamp?: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;
    
    @ApiPropertyOptional()
    @IsOptional()
    bankAccountNumber?: string;
    
    @ApiPropertyOptional()
    @IsOptional()
    bankIBAN?: string;
    
    @ApiPropertyOptional()
    @IsOptional()
    bankName?: string;
    
    @ApiPropertyOptional()
    @IsOptional()
    bankSwiftCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    bankAccountHolderName?: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose working hour"})
    @Type(() => Number)
    workingHoursId?: number;
}
