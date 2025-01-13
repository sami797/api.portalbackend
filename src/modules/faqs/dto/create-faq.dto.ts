import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize, IsInt } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';

export class CreateFaqDto implements Prisma.FaqsUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    @IsInt()
    faqsCategoryId: number;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the faqs slug" })
    @SlugifyString()
    slug: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiProperty({ default: false, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    forAdminpanel?: boolean;

    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsNotEmpty()
    description: string;

}
