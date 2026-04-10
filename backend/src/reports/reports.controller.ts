import { Controller, Get, Query } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard(@Session() session: UserSession<typeof auth>) {
    return this.reports.dashboard(
      session.user.id,
      session.user.role as string,
    );
  }

  @Get('progress')
  progress(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
  ) {
    return this.reports.progress(
      session.user.id,
      session.user.role as string,
      projectId,
    );
  }

  @Get('workload')
  workload(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
  ) {
    return this.reports.workload(
      session.user.id,
      session.user.role as string,
      projectId,
    );
  }

  @Get('burndown')
  burndown(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('sprintId') sprintId: string,
  ) {
    return this.reports.burndown(
      session.user.id,
      session.user.role as string,
      projectId,
      sprintId,
    );
  }

  @Get('maintenance-summary')
  maint(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reports.maintenanceSummary(
      session.user.id,
      session.user.role as string,
      projectId,
      from,
      to,
    );
  }

  @Get('assets')
  assets(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
  ) {
    return this.reports.assetsReport(
      session.user.id,
      session.user.role as string,
      projectId,
    );
  }
}
