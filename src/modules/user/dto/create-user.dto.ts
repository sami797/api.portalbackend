import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { Exclude, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDate, IsEmail, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, ValidateNested} from 'class-validator';
import { UserStatus } from 'src/config/constants';
import { ParseBoolean, ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class CreateUserDto implements Prisma.UserUncheckedCreateInput {

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the first name"})
    firstName: string;

    @ApiPropertyOptional()
    @IsOptional()
    designation: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the last name"})
    lastName: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide the email"})
    @IsEmail()
    email: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide phone code"})
    phoneCode: string;

    @ApiProperty()
    @IsNotEmpty({message: "Please provide your contact number"})
    phone: string;


    @ApiPropertyOptional()
    @IsOptional()
    whatsapp: string;

    @ApiPropertyOptional()
    @IsOptional({message: "Please choose a organization"})
    @Type(() => Number)
    @IsInt()
    organizationId: number;

    @ApiPropertyOptional()
    @IsOptional({message: "Please choose which all organization can user access"})
    @Type(() => Number)
    @IsArray()
    dataAccessRestrictedTo: number[];

    @ApiPropertyOptional()
    @IsOptional({message: "Please choose a department"})
    @Type(() => Number)
    @IsInt()
    departmentId: number;
    
    @ApiProperty()
    @IsNotEmpty({message: "Please provide the password"})
    password: string;

    @ApiPropertyOptional()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    preferences?: string;

    @ApiPropertyOptional({ type: "file"})
    @IsOptional()
    @Exclude()
    profile?: string;

    @ApiPropertyOptional({default: true })
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    isPublished?: boolean;

    @ApiPropertyOptional({default: false })
    @IsOptional()
    @IsBoolean()
    @ParseBoolean()
    enableRemoteCheckin?: boolean;

    @ApiPropertyOptional({enum: UserStatus})
    @IsOptional()
    @Type(() => Number)
    @IsEnum(UserStatus)
    status?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    managerId?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    remainingAnnualLeaves?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    dateOfJoining: Date

    @ApiPropertyOptional()
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    lastWorkingDate: Date
}
