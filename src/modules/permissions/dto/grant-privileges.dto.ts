import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, Min} from 'class-validator';
import { ParseCustomNumberArray, ParseJson } from 'src/helpers/class-transformer-custom-decorator';

export class GrantPrivilegesDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the role id"})
    @IsInt()
    @Min(1)
    roleId: number;

    @ApiProperty({type: "number", isArray: true})
    @IsNotEmpty({message: "Please provide the permission ids"})
    @IsArray()
    @ArrayMinSize(1)
    @Type(() => Number)
    permissionIds: Array<number>;
}
