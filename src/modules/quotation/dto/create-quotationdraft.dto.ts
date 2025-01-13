import { IsOptional, IsString, IsInt } from 'class-validator';

export class CreateQuotationnDto {
  @IsOptional()
  @IsInt()
  leadId?: number;

  @IsOptional()
  @IsInt()
  brandingThemeId?: number;

  @IsOptional()
  @IsInt()
  submissionById?: number; // Ensure this matches the schema

  @IsOptional()
  @IsString()
  scopeOfWork?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  // Add other fields as needed
}
