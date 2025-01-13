import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Exclude, Transform, Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, ValidateIf, ValidateNested } from "class-validator";
import { QuotationType, SupervisionPaymentSchedule } from "src/config/constants";
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator";
import { TypeFromEnumValues } from "src/helpers/common";

export class QuotationMilestone implements Prisma.QuotationMilestoneUncheckedCreateInput {

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    productId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    accountId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    taxRateId: number;

    @ApiProperty()
    @IsOptional()
    // @IsNotEmpty({message: "Please provide milestone percentage"})
    @Type(() => Number)
    @IsNumber()
    amount?: number;

    @ApiProperty()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    quantity?: number = 1;

    @ApiProperty()
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    requirePayment?: boolean;

    @ApiProperty()
    @IsOptional()
    // @IsNotEmpty({message: "Please provide milestone title"})
    @Transform(data => data.value.trim()) 
    title?: string;
}


export class CreateQuotationDto implements Prisma.QuotationUncheckedCreateInput {
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    leadId: number;
    // @ApiPropertyOptional()
    // @IsOptional()
    // @Type(() => Number)
    // @IsInt()
    //  Id: number;


    @ApiPropertyOptional()
    @IsOptional()
    // @IsNotEmpty({message: "Please provide quote number"})
    quoteNumber: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    clientId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    brandingThemeId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    revisedQuotationReferenceId: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    submissionById?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    issueDate?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiryDate?: Date;

    @ApiProperty()
    @IsOptional()
    @ParseBoolean()
    @IsBoolean()
    hasSupervision?: boolean;

    @ApiProperty()
    @ValidateIf((obj : CreateQuotationDto) => obj.hasSupervision === true)
    @IsOptional()
    // @IsNotEmpty({message: "Please provide supervision monthly charge"})
    @Type(() => Number)
    @IsNumber()
    supervisionMonthlyCharge?: number;

    @ApiPropertyOptional({enum: SupervisionPaymentSchedule })
    @ValidateIf((obj : CreateQuotationDto) => obj.hasSupervision === true)
    @IsOptional()
    // @IsNotEmpty({message: "Please provide supervision payment schedule"})
    @Type(() => Number)
    @IsEnum(SupervisionPaymentSchedule)
    supervisionPaymentSchedule?: TypeFromEnumValues<typeof SupervisionPaymentSchedule>;

    @ApiProperty()
    @IsOptional()
    @Transform(({ value }) => {
      if (Array.isArray(value)) {
        return value.map(item => item.toString().trim()).join(', ');
      } else if (typeof value === 'string') {
        return value.trim();
      }
      return '';
    }, { toClassOnly: true })
    scopeOfWork?: string;
  

    @ApiProperty()
    @IsOptional()
    // @IsNotEmpty({message: "Please provide payment terms"})
    paymentTerms?: string;

    @ApiPropertyOptional()
    // @IsOptional({message: "Please provide if there are any notes"})
    note?: string;

    @ApiPropertyOptional({type: "file"})
    @IsOptional()
    @Exclude()
    file?: string;

    @ApiProperty({enum: QuotationType})
    @IsOptional()
    // @IsNotEmpty({message: "Please provide valid data"})
    @Type(() => Number)
    @IsEnum(QuotationType)
    type?: TypeFromEnumValues<typeof QuotationType>;


    @ApiProperty({ isArray: true, type: QuotationMilestone })
    @IsOptional()
    // @IsNotEmpty({ message: "Please provide the receipts information" })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => QuotationMilestone)
    milestone: Array<QuotationMilestone>;
}
