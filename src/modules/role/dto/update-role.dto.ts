import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(OmitType(CreateRoleDto, ['copyRoleId'])) {

    @ApiProperty({ default: false, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isDeleted?: boolean

}
