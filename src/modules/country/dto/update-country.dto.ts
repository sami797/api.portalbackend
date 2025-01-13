import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCountryDto } from './create-country.dto';
import {ParseBoolean} from "src/helpers/class-transformer-custom-decorator";

export class UpdateCountryDto extends PartialType(CreateCountryDto) {

    @ApiProperty({ default: false, required: false })
    @IsBoolean()
    @IsOptional()
    @ParseBoolean()
    isDeleted?: boolean

}
