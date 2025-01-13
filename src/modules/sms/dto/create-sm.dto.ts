import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, SMSType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, Max, Min} from 'class-validator';
import { KnownSMSGateways } from 'src/config/constants';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';

export class CreateSmDto implements Prisma.SmsConfigurationCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the title"})
    title: string;

    @ApiProperty({enum: KnownSMSGateways})
    @IsNotEmpty({message: "Please provide the slug"})
    @IsEnum(KnownSMSGateways)
    slug: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the country"})
    @Type(() => Number)
    @IsInt()
    countryId: number;

    @ApiPropertyOptional({default: 9})
    @IsOptional()
    @Min(1)
    @Max(99)
    @Type(() => Number)
    @IsInt()
    priority?: number;


    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => String)
    gateway?: string;


    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => String)
    appId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => String)
    appPassword?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => String)
    senderId?: string;

    @ApiPropertyOptional({enum: SMSType})
    @IsOptional()
    @IsEnum(SMSType)
    senderIdType?: SMSType;

    @ApiProperty({default: true, required : false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiProperty({default: false, required : false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    test?: boolean;

}
