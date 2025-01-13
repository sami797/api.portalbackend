import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModulesVisibility, Prisma } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, Min} from 'class-validator';
import { ParseBoolean, ParseJson } from 'src/helpers/class-transformer-custom-decorator';

export class CreatePermissionDto implements Prisma.PermissionsCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the permission name"})
    name: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the action name"})
    action: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the module id"})
    @Type(() => Number)
    @IsInt()
    moduleId: number

    @ApiProperty()
    @IsOptional()
    @ParseJson()
    condition?: Prisma.InputJsonObject;

    @ApiProperty()
    @IsOptional()
    url?: string;

    @ApiProperty({ required: false})
    @IsOptional()
    description?: string;

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

    @ApiPropertyOptional({enum: ModulesVisibility, default: ModulesVisibility.organization})
    @IsOptional()
    @IsEnum(ModulesVisibility)
    visibility?: ModulesVisibility;

    @ApiProperty()
    @IsNotEmpty()
    Module: Prisma.ModulesCreateNestedOneWithoutPermissionsInput; 
    
}
