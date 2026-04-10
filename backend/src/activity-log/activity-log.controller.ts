import { Controller, Get, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { ActivityLogReadService } from './activity-log.service';

@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly log: ActivityLogReadService) {}

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId?: string,
    @Query('entityType') entityType?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.log.list(session.user.id, session.user.role as string, {
      projectId,
      entityType,
      page,
      take,
    });
  }
}
