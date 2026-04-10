import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { NotesService } from './notes.service';

@Controller('notes')
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Session() session: UserSession<typeof auth>) {
    return this.notes.listNotes(session.user.id);
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: { title: string; content?: string; folderId?: string; color?: string; tags?: string[] },
  ) {
    return this.notes.createNote(session.user.id, body);
  }

  @Get(':id/audit')
  audit(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.notes.audit(session.user.id, id);
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.notes.getNote(session.user.id, id);
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.notes.updateNote(session.user.id, id, body);
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.notes.removeNote(session.user.id, id);
  }

  @Post(':id/share')
  share(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { userId: string; permission: 'VIEW' | 'EDIT' },
  ) {
    return this.notes.share(session.user.id, id, body.userId, body.permission);
  }

  @Delete(':id/share/:userId')
  unshare(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.notes.unshare(session.user.id, id, userId);
  }
}
