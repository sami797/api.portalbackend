import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ClientType } from 'src/config/constants';

export class CreateClientDto implements Prisma.ClientUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the email" })
    @IsEmail()
    email: string;

    @ApiProperty({type: Number})
    @IsOptional({ message: "Please provide the phone" })
    phone: string;

    @ApiPropertyOptional()
    @IsOptional()
    whatsapp?: string;

    @ApiProperty({type: Number})
    @IsOptional({ message: "Please provide the phone code" })
    phoneCode: string;

    @ApiProperty({enum: ClientType})
    @IsNotEmpty({ message: "Please provide the phone code" })
    @IsEnum(ClientType)
    @Type(() => Number)
    type: typeof ClientType[keyof typeof ClientType];;;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    companyId: number;

    @ApiPropertyOptional()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    taxRegistrationNumber?: string;
}
