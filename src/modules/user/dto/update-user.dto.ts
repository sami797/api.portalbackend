import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ParseBoolean } from 'src/helpers/class-transformer-custom-decorator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    

    // @ApiProperty({readOnly: true})
    // @IsOptional()
    // @Exclude()
    // password?: string;

    @ApiProperty({default: true, required: false})
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isDeleted?: boolean
}
