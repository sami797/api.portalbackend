import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional} from 'class-validator';

export class UserLoginDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the valid email"})
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the password"})
    password: string;

    @IsOptional()
    safeModeKey?: string;
}
