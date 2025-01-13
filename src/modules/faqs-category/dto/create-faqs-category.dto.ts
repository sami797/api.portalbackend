import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { ValidateNested, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsArray, ArrayMinSize } from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';

export class CreateFaqsCategoryDto implements Prisma.FaqsCategoryUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsOptional()
    description: string;

    @ApiProperty()
    @IsNotEmpty({ message: "Please provide the faqs category slug" })
    @SlugifyString()
    slug: string;

    @ApiProperty({ default: true, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    parentId?: number;

    @ApiProperty({ default: false, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    forAdminpanel?: boolean;

}
