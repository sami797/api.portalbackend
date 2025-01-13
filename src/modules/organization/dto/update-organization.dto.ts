import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNotIn, IsOptional } from 'class-validator';
import { OrganizationStatus } from 'src/config/constants';
import { CreateOrganizationDto } from './create-organization.dto';

export class UpdateOrganizationDto extends PartialType(CreateOrganizationDto) {

    @ApiPropertyOptional()
    @IsOptional()
    @IsIn([3,4])
    @Type(() => Number)
    status: number
}
