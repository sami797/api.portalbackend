import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator"
import { ParseBoolean } from "src/helpers/class-transformer-custom-decorator"

export type ResponseSuccess  = {
  message : string | Array<object>
  statusCode : number
  data : any,
  meta ?: {
    page: number,
    perPage: number,
    pageCount: number,
    total: number
  }
}

export type PickByType<T, Value> = {
    [P in keyof T as T[P] extends Value | undefined ? P : never]: T[P]
  }

export type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] }

export type ResponseError = ResponseSuccess & { 
  error? : string
}

export class SEOData {
  @ApiProperty()
  @IsNotEmpty({message: "Please enter a meta title for a page"})
  @IsString()
  @Type(() => String)
  @MinLength(10, {message: "SEO title must be greater than 10 characters"})
  @MaxLength(100, {message: "SEO title must be not be greater than 100 characters"})
  seoTitle : string

  @ApiProperty()
  @IsNotEmpty({message: "Please enter a meta description for a page"})
  @IsString()
  @Type(() => String)
  @MinLength(10, {message: "SEO description must be greater than 10 characters"})
  @MaxLength(250, {message: "SEO title must not be greater than 250 characters"})
  seoDescription : string
}

export class ManualAction {
  @ApiProperty()
  @IsNotEmpty({message: "Please provide valid data"})
  @IsNumber()
  @Min(-5)
  @Max(5)
  @Type(() => Number)
  value: number


  @ApiPropertyOptional()
  @IsString()
  @Type(() => String)
  message : string

}

export class Pagination {
  @ApiProperty({default: 25, required: false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(500)
  @Min(1)
  perPage: number = 10;

  @ApiProperty({default: 1, required: false})
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}

export class ParamsDto{

  @ApiProperty()
  @IsNotEmpty({message: "Please provide the valid id"})
  @Type(() => Number)
  @IsInt()
  id: number;

}

export class FindBySlugDto{

  @ApiProperty()
  @IsNotEmpty({message: "Please provide the valid slug"})
  @IsString()
  slug: string;

}