import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsUrl } from "class-validator";
import { ParseBoolean, SlugifyString } from "src/helpers/class-transformer-custom-decorator";

export class CreatePaymentGatewayDto implements Prisma.PaymentGatewayUncheckedCreateInput{
    @ApiProperty()
    @IsNotEmpty({message: "Please enter a title"})
    title: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a slug"})
    @SlugifyString(true)
    slug: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the gateway URL"})
    @IsUrl()
    gatewayURL?: string;

    @ApiProperty()
    @IsOptional({message: "Please provide the gateway public key"})
    gatewayPublicKey?: string;

    @ApiProperty()
    @IsOptional({message: "Please provide the gateway private key"})
    gatewayPrivateKey: string;

    @ApiPropertyOptional({default: true})
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional({default: false})
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    test?: boolean;

    @ApiPropertyOptional({default: false})
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    isDefault?: boolean;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide a country"})
    countryId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    storeId?: string;


}
