import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma.service'; // Ensure this path is correct

@Module({
  controllers: [NotesController],
  providers: [NotesService, PrismaService],
})
export class NotesModule {}
