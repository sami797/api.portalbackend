import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty} from 'class-validator';

export class RefreshTokenDto {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the refresh token"})
    refreshToken: string;

}
