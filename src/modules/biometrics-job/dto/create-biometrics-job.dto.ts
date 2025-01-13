import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateBiometricsJobDto implements Partial<Prisma.BiometricsJobUncheckedCreateInput> {
    @ApiProperty()
    @IsNotEmpty({message: "Please give a title"})
    title?: string;

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    file?: string;

    @ApiProperty()
    @IsNotEmpty()
    @Type(() => Number)
    uploadFormatId?: number;
}
