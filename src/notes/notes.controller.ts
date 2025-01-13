import { Controller, Get, Post, Put, Delete, Param, Body, Request, BadRequestException, UseGuards } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Note } from '@prisma/client';
import { CreateNoteDto } from './create-note.dto';
import { UpdateNoteDto } from './update-note.dto';
import { JwtAuthGuard } from 'src/authentication/guards/jwt-auth.guard';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  async findAll(@Request() req): Promise<Note[]> {
    const userId = req.user?.userId; // Adjust based on the user object structure
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Note> {
    const userId = req.user?.userId; // Adjust based on the user object structure
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notesService.findOne(Number(id), userId);
  }

  @Post()
  async create(@Body() createNoteDto: CreateNoteDto) {
    try {
      return await this.notesService.create(createNoteDto);
    } catch (error) {
      throw new BadRequestException('Failed to create note');
    }
  }
  

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto, @Request() req): Promise<Note> {
    const userId = req.user?.userId; // Adjust based on the user object structure
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notesService.update(Number(id), updateNoteDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<{ count: number }> {
    const userId = req.user?.userId; // Adjust based on the user object structure
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    const result = await this.notesService.remove(Number(id), userId);
    return { count: result.count };
  }
}
