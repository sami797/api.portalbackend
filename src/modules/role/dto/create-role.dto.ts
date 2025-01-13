import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional} from 'class-validator';
import { ParseBoolean, SlugifyString } from 'src/helpers/class-transformer-custom-decorator';


export class CreateRoleDto implements Prisma.RoleUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the language name"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the language code"})
    @SlugifyString(true)
    slug: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    level?: number;

    @ApiProperty({required: false})
    @IsOptional()
    description?: string;


    @ApiProperty({default: true, required : false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    organizationId?: number;

    @ApiPropertyOptional({description: "If provided new role will copy all the permissions from the role provided"})
    @IsOptional()
    @Type(() => Number)
    copyRoleId ?: number //copies all the permissions of the role to the new role

}
