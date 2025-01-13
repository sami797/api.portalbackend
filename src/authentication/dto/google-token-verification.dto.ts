import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class GoogleTokenVerificationDto {
    
    @ApiProperty()
    @IsNotEmpty()
    token: string;
}
