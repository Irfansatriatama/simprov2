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

@Controller('note-folders')
export class NoteFoldersController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(@Session() session: UserSession<typeof auth>) {
    return this.notes.listFolders(session.user.id);
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: { name: string; color?: string },
  ) {
    return this.notes.createFolder(session.user.id, body.name, body.color);
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string },
  ) {
    return this.notes.updateFolder(session.user.id, id, body);
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.notes.removeFolder(session.user.id, id);
  }
}
