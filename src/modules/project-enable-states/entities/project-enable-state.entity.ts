import { ProjectState as __ProjectState } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber } from 'class-validator';

export class ProjectEnableState implements Partial<ProjectEnableState> {
  @ApiProperty()
  id: number;

  @ApiProperty()
  projectStateIds: number[];
  
  @ApiProperty()
  projectId: number;

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
}
