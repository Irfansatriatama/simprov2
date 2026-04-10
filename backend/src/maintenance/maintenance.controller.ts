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
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Get('report')
  report(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.maintenance.report(session.user.id, session.user.role as string, {
      projectId,
      from,
      to,
      status,
      type,
    });
  }

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
  ) {
    return this.maintenance.list(session.user.id, session.user.role as string, {
      projectId,
      status,
      severity,
      assignedTo,
      page,
      take,
    });
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: Record<string, unknown>,
  ) {
    return this.maintenance.create(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      body,
    );
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.maintenance.getById(
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
    return this.maintenance.update(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.maintenance.remove(
      { id: session.user.id, role: session.user.role as string },
      id,
    );
  }
}
