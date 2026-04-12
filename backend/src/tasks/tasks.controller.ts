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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { TaskCommentDto } from './dto/comment.dto';
import { CreateChecklistDto, UpdateChecklistDto } from './dto/checklist.dto';
import { LogTimeDto } from './dto/log-time.dto';
import { CreateDependencyDto } from './dto/dependency.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get('export/csv')
  async exportCsv(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Res() res: Response,
  ) {
    const csv = await this.tasks.exportCsv(
      session.user.id,
      session.user.role as string,
      projectId,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tasks-export.csv"',
    );
    res.send('\uFEFF' + csv);
  }

  @Post('bulk-update')
  bulk(
    @Session() session: UserSession<typeof auth>,
    @Body() body: BulkUpdateDto,
  ) {
    return this.tasks.bulkUpdate(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      body,
    );
  }

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('sprintId') sprintId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
    @Query('forGantt') forGantt?: string,
  ) {
    return this.tasks.list(session.user.id, session.user.role as string, {
      projectId,
      sprintId,
      status,
      priority,
      assigneeId,
      search,
      page,
      take,
      cursor,
      sortBy,
      sortDir,
      forGantt,
    });
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      dto,
    );
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.tasks.getById(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.tasks.remove(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
    );
  }

  @Post(':id/comments')
  addComment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: TaskCommentDto,
  ) {
    return this.tasks.addComment(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
      dto,
    );
  }

  @Get(':id/comments')
  getComments(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.tasks.listComments(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id/comments/:commentId')
  patchComment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Body() dto: TaskCommentDto,
  ) {
    return this.tasks.updateComment(
      { id: session.user.id, role: session.user.role as string },
      id,
      commentId,
      dto,
    );
  }

  @Delete(':id/comments/:commentId')
  delComment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    return this.tasks.removeComment(
      { id: session.user.id, role: session.user.role as string },
      id,
      commentId,
    );
  }

  @Post(':id/checklists')
  addCheck(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.tasks.addChecklist(
      { id: session.user.id, role: session.user.role as string },
      id,
      dto,
    );
  }

  @Patch(':id/checklists/:checklistId')
  patchCheck(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('checklistId') checklistId: string,
    @Body() dto: UpdateChecklistDto,
  ) {
    return this.tasks.updateChecklist(
      { id: session.user.id, role: session.user.role as string },
      id,
      checklistId,
      dto,
    );
  }

  @Delete(':id/checklists/:checklistId')
  delCheck(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('checklistId') checklistId: string,
  ) {
    return this.tasks.removeChecklist(
      { id: session.user.id, role: session.user.role as string },
      id,
      checklistId,
    );
  }

  @Post(':id/log-time')
  logTime(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: LogTimeDto,
  ) {
    return this.tasks.logTime(
      { id: session.user.id, role: session.user.role as string },
      id,
      dto,
    );
  }

  @Post(':id/attachments')
  addAtt(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body()
    body: { url: string; name: string; mimeType?: string; size?: number },
  ) {
    return this.tasks.addAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  delAtt(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.tasks.removeAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      attachmentId,
    );
  }

  @Post(':id/dependencies')
  addDep(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: CreateDependencyDto,
  ) {
    return this.tasks.addDependency(
      { id: session.user.id, role: session.user.role as string },
      id,
      dto,
    );
  }

  @Delete(':id/dependencies/:dependencyId')
  delDep(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('dependencyId') dependencyId: string,
  ) {
    return this.tasks.removeDependency(
      { id: session.user.id, role: session.user.role as string },
      id,
      dependencyId,
    );
  }
}
