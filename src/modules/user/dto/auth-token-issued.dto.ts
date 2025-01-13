import { ApiPropertyOptional } from "@nestjs/swagger";
import { AuthTokens, TokenTypes } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsOptional } from "class-validator";

export class UserAuthTokensIssuedDto implements Partial<AuthTokens> {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    userId: number

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    organizationId: number

    @ApiPropertyOptional()
    @IsOptional()
    userAgent?: string

    @ApiPropertyOptional()
    @IsOptional()
    userIP?: string

    @ApiPropertyOptional()
    @IsOptional()
    tokenType?: TokenTypes;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    toDate?: string;


}