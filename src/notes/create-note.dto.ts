import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  notes: string;

  @IsNotEmpty()
  userId: number;
}
