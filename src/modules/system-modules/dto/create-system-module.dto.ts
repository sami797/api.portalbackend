import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModulesVisibility, Prisma } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, Min} from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';

export class CreateSystemModuleDto implements Prisma.ModulesCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the module name"})
    name: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the module slug id"})
    @SlugifyString()
    slug: string

    @ApiPropertyOptional()
    @IsOptional()
    url?: string

    @ApiProperty({ required: false})
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({enum: ModulesVisibility, default: ModulesVisibility.system})
    @IsOptional()
    @IsEnum(ModulesVisibility)
    visibility?: ModulesVisibility;

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    icon?: string;

    @ApiPropertyOptional({default: 99})
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    order?: number;

    @ApiProperty({default: true})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isMenuItem?: boolean;

}
