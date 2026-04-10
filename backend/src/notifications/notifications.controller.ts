import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.notifications.list(session.user.id, page, take);
  }

  @Get('unread-count')
  async unread(@Session() session: UserSession<typeof auth>) {
    const count = await this.notifications.unreadCount(session.user.id);
    return { count };
  }

  @Patch('read-all')
  readAll(@Session() session: UserSession<typeof auth>) {
    return this.notifications.markAllRead(session.user.id);
  }

  @Patch(':id/read')
  readOne(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.notifications.markRead(session.user.id, id);
  }
}
