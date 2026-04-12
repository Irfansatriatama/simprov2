import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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
    @Query('statuses') statuses?: string,
    @Query('includeSubProjects') includeSubProjects?: string,
    @Query('search') search?: string,
  ) {
    return this.maintenance.report(session.user.id, session.user.role as string, {
      projectId,
      from,
      to,
      statuses,
      includeSubProjects,
      search,
    });
  }

  @Get('export')
  async exportCsv(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Res({ passthrough: true }) res: Response,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('priority') priority?: string,
    @Query('type') type?: string,
    @Query('picDevUserId') picDevUserId?: string,
    @Query('q') q?: string,
  ) {
    const { csv, filename } = await this.maintenance.exportCsv(
      session.user.id,
      session.user.role as string,
      {
        projectId,
        status,
        severity,
        assignedTo,
        priority,
        type,
        picDevUserId,
        search: q,
      },
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
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

  @Post(':id/attachments')
  addAttachment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body()
    body: { url: string; name: string; mimeType?: string; size?: number },
  ) {
    return this.maintenance.addAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.maintenance.removeAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      attachmentId,
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
