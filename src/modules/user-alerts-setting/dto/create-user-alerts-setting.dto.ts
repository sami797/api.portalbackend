import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional } from "class-validator";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";

export class CreateUserAlertsSettingDto implements Prisma.UserAlertsSettingUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please choose"})
    @Type(() => Number)
    alertsTypeId?: number;

    @ApiPropertyOptional({default: true})
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    desktop?: boolean;

    @ApiPropertyOptional({default: false})
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    mobile?: boolean;

    @ApiPropertyOptional({default: true})
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    email?: boolean;

    @ApiPropertyOptional({default: true})
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    app?: boolean;


}
