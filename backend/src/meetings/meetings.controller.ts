import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { MeetingsService } from './meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.meetings.list(
      session.user.id,
      session.user.role as string,
      from,
      to,
    );
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body()
    body: {
      title: string;
      description?: string;
      type: string;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      projectIds?: string[];
      attendeeIds?: string[];
    },
  ) {
    return this.meetings.create(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      body,
    );
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.meetings.getById(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.meetings.update(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.meetings.remove(
      { id: session.user.id, role: session.user.role as string },
      id,
    );
  }

  @Patch(':id/notulensi')
  notulensi(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.meetings.patchNotulensi(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Post(':id/agenda')
  addAgenda(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { text: string },
  ) {
    return this.meetings.addAgenda(
      { id: session.user.id, role: session.user.role as string },
      id,
      body.text,
    );
  }

  @Patch(':id/agenda/:itemId')
  patchAgenda(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { text?: string; done?: boolean; order?: number },
  ) {
    return this.meetings.patchAgenda(
      { id: session.user.id, role: session.user.role as string },
      id,
      itemId,
      body,
    );
  }

  @Post(':id/action-items')
  addAction(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { title: string; assigneeId?: string; dueDate?: string },
  ) {
    return this.meetings.addActionItem(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Patch(':id/action-items/:itemId')
  patchAction(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.meetings.patchActionItem(
      { id: session.user.id, role: session.user.role as string },
      id,
      itemId,
      body,
    );
  }

  @Post(':id/action-items/:itemId/convert-to-task')
  convert(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { projectId: string },
  ) {
    return this.meetings.convertActionToTask(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      id,
      itemId,
      body.projectId,
    );
  }
}
