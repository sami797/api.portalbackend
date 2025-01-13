import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreateNoteDto } from './create-note.dto';
import { UpdateNoteDto } from './update-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  // Fetch all notes for a user
  async findAll(userId: number) {
    try {
      return await this.prisma.note.findMany({
        where: { userId },
      });
    } catch (error) {
      console.error('Error fetching all notes:', error);
      throw new BadRequestException('Failed to fetch notes');
    }
  }

  // Fetch a specific note for a user
  async findOne(id: number, userId: number) {
    try {
      const note = await this.prisma.note.findFirst({
        where: { id, userId },
      });
      if (!note) {
        throw new NotFoundException('Note not found');
      }
      return note;
    } catch (error) {
      console.error('Error fetching note:', error);
      throw new BadRequestException('Failed to fetch note');
    }
  }

  // Create a new note
  async create(createNoteDto: CreateNoteDto) {
    try {
      return await this.prisma.note.create({
        data: {
          notes: createNoteDto.notes,
          userId: createNoteDto.userId,
        },
      });
    } catch (error) {
      console.error('Error creating note:', error);
      throw new BadRequestException('Failed to create note');
    }
  }

  // Update an existing note
  async update(id: number, updateNoteDto: UpdateNoteDto, userId: number) {
    try {
      return await this.prisma.note.update({
        where: { id },
        data: {
          ...updateNoteDto,
          userId, // Ensure userId is included
        },
      });
    } catch (error) {
      console.error('Error updating note:', error);
      throw new BadRequestException('Failed to update note');
    }
  }

  // Delete a note
  async remove(id: number, userId: number) {
    try {
      const result = await this.prisma.note.deleteMany({
        where: { id, userId },
      });
      if (result.count === 0) {
        throw new NotFoundException('Note not found or already deleted');
      }
      return result;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw new BadRequestException('Failed to delete note');
    }
  }
}
