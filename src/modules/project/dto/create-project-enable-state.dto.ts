// import { ApiProperty } from '@nestjs/swagger';
// import { IsArray, ArrayNotEmpty,IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';
// import { ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

// export class CreateProjectEnableStateDto {
//   @ApiProperty({ type: Number })
//   @IsNumber()
//   pId: number;

//   @ApiProperty({ type: Number })
//   @IsNumber()
//   pstateId: number;

//   @ApiProperty({ type: Boolean })
//   @IsBoolean()
//   isPublished: boolean;

//   @ApiProperty({ type: Boolean })
//   @IsBoolean()
//   isDeleted: boolean;

//   @ApiProperty()
//   @IsNumber()
//   projectId: number;

//   @ApiProperty({ type: "array" })
//   @IsNotEmpty({message: "Please provide the state id(s)"})
//   @ParseCustomNumberArray()
//   projectStateIds: number | Array<number>; 
// }

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsNotEmpty, IsBoolean, IsNumber } from 'class-validator';
import { ParseCustomNumberArray } from 'src/helpers/class-transformer-custom-decorator';

export class CreateProjectEnableStateDto {

  // @ApiProperty({ type: [Number] })
  // @IsArray()
  // @ArrayNotEmpty()
  // @IsNumber({}, { each: true })
  // projectStateIds: number[];

  @ApiProperty({ type: "array" })
  @IsNotEmpty({message: "Please provide the state id(s)"})
  @ParseCustomNumberArray()
  projectStateIds: number | Array<number>; 
}


