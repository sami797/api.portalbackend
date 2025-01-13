import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, Validate } from 'class-validator';
import { ValidateName } from 'src/helpers/class-validator-custom-decorators';

export class UpdateMeDto {
    
    @ApiProperty()
    @IsOptional()
    @IsString()
    @Validate(ValidateName, {message: "First name cannot contain special characters"})
    @MinLength(4, {message:"Too short first name, First name must have at least 4 characters"})
    @MaxLength(20, {message:"Too long last name, First name cannot be more than 20 characters"})
    firstName: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    @Validate(ValidateName, {message: "Last name cannot contain special characters"})
    @MinLength(1, {message:"Too short last name, Last name must have at least 1 characters"})
    @MaxLength(20, {message:"Too long last name, Last name cannot be more than 20 characters"})
    lastName: string;

    @ApiProperty({required: false, type: "file"})
    @IsOptional()
    @Exclude()
    profile?: string;
}
