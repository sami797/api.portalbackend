// src/modules/project-enable-states/dto/create-project-enable-state.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class CreateProjectEnableStateDto {
  @ApiProperty({ type: Number })
  @IsNumber()
  pId: number;

  @ApiProperty({ type: Number })
  @IsNumber()
  pstateId: number;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isDeleted: boolean;

  @ApiProperty()
    projectId: number;
}
