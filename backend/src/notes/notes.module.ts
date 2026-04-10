import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NoteFoldersController } from './note-folders.controller';
import { NotesService } from './notes.service';

@Module({
  controllers: [NotesController, NoteFoldersController],
  providers: [NotesService],
})
export class NotesModule {}
