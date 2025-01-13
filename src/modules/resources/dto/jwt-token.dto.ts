import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsJWT, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class JwtToken {
    @ApiPropertyOptional()
    @IsOptional({message: "Please provide the valid token"})
    @IsJWT({message: "Please provide the valid auth token"})
    authKey : string;

    @ApiPropertyOptional()
    @IsOptional()
    @ParseBoolean()
    download : boolean;
}