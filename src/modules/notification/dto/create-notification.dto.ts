import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType, Prisma } from "@prisma/client";
import { Exclude, Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsUrl, ValidateIf } from "class-validator";
import { ParseCustomNumberArray } from "src/helpers/class-transformer-custom-decorator";

export class CreateNotificationDto implements Prisma.NotificationCreateInput {

    @ApiPropertyOptional()
    @IsOptional()
    slug?: string; // for particular page
    
    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    file?: string;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please provide a message"})
    message?: string;
    
    @ApiPropertyOptional()
    @IsOptional()
    @IsUrl()
    link?: string;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please provide notification type"})
    @IsEnum(NotificationType)
    type?: NotificationType;
    
    @ValidateIf((obj : CreateNotificationDto) => obj.type === 'user')
    @ApiProperty({isArray: true})
    @IsArray()
    @IsNotEmpty({message: "Please provide User Id"})
    @ParseCustomNumberArray()
    userIds?: number[];

    @ValidateIf((obj : CreateNotificationDto) => obj.type === 'department')
    @ApiProperty()
    @IsNotEmpty({message: "Please provide department ID"})
    @Type(() => Number)
    departmentId?: number;
}
