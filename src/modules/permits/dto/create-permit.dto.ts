import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsEnum, IsNotEmpty, IsOptional } from "class-validator";
import { PermitClientStatus, PermitFinanceStatus } from "src/config/constants";
import { TypeFromEnumValues } from "src/helpers/common";

export class CreatePermitDto implements Prisma.PermitUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please mention what is this receipt about"})
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    remarks?: string;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please choose project"})
    @Type(() => Number)
    projectId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose authority"})
    @Type(() => Number)
    authorityId?: number;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose permit expiry date"})
    @Type(() => Date)
    expiryDate?: Date;

    @ApiProperty()
    @IsNotEmpty({message: "Please choose permit approval date"})
    @Type(() => Date)
    approvedDate?: Date;


    @ApiPropertyOptional({enum: PermitFinanceStatus})
    @IsOptional()
    @IsEnum(PermitFinanceStatus)
    @Type(() => Number)
    financeStatus: TypeFromEnumValues<typeof PermitFinanceStatus>

    @ApiPropertyOptional({enum: PermitClientStatus})
    @IsOptional()
    @IsEnum(PermitClientStatus)
    @Type(() => Number)
    clientStatus: TypeFromEnumValues<typeof PermitClientStatus>;

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    files: Array<Express.Multer.File>
}
