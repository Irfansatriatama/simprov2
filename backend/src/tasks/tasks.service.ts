import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { NotificationService } from '../common/services/notification.service';
import { assertProjectAccess } from '../lib/project-access';
import { recalcProjectProgress } from '../lib/project-progress';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { TaskCommentDto } from './dto/comment.dto';
import { CreateChecklistDto, UpdateChecklistDto } from './dto/checklist.dto';
import { LogTimeDto } from './dto/log-time.dto';
import { CreateDependencyDto } from './dto/dependency.dto';

const taskListSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  type: true,
  storyPoints: true,
  dueDate: true,
  startDate: true,
  sprintId: true,
  parentTaskId: true,
  timeLogged: true,
  createdAt: true, // Gantt fallback range when dates missing
  assignees: {
    select: { user: { select: { id: true, name: true, image: true } } },
  },
} as const;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
    private readonly notifications: NotificationService,
  ) {}

  private actor(s: { id: string; name: string }) {
    return { id: s.id, name: s.name };
  }

  async list(
    userId: string,
    role: string,
    q: {
      projectId: string;
      sprintId?: string;
      status?: string;
      priority?: string;
      assigneeId?: string;
      search?: string;
      page?: string;
      take?: string;
    },
  ) {
    await assertProjectAccess(this.prisma, userId, role, q.projectId);
    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
    const where: Record<string, unknown> = { projectId: q.projectId };
    if (q.sprintId) where.sprintId = q.sprintId;
    if (q.status) where.status = q.status;
    if (q.priority) where.priority = q.priority;
    if (q.assigneeId) {
      where.assignees = { some: { userId: q.assigneeId } };
    }
    if (q.search) {
      where.title = { contains: q.search, mode: 'insensitive' };
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        select: taskListSelect,
        orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
        skip: (page - 1) * take,
        take,
      }),
    ]);
    return {
      data: rows,
      meta: { total, page, take, pages: Math.ceil(total / take) || 1 },
    };
  }

  async create(
    session: { id: string; name: string; role: string },
    dto: CreateTaskDto,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, dto.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          projectId: dto.projectId,
          title: dto.title,
          description: dto.description,
          type: dto.type ?? 'task',
          status: dto.status ?? 'todo',
          priority: dto.priority ?? 'medium',
          reporterId: session.id,
          sprintId: dto.sprintId,
          epicId: dto.epicId,
          parentTaskId: dto.parentTaskId,
          storyPoints: dto.storyPoints,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          tags: dto.tags ?? [],
          assignees: dto.assigneeIds?.length
            ? {
                create: dto.assigneeIds.map((uid) => ({ userId: uid })),
              }
            : undefined,
        },
        select: { id: true, title: true, projectId: true, status: true },
      });
      await this.activityLog.log(tx, {
        projectId: t.projectId,
        entityType: 'task',
        entityId: t.id,
        entityName: t.title,
        action: 'created',
        actor: this.actor(session),
      });
      const memberIds = await tx.projectMember.findMany({
        where: { projectId: t.projectId, userId: { not: session.id } },
        select: { userId: true },
      });
      await this.notifications.createMany(
        tx,
        memberIds.map((m) => ({
          userId: m.userId,
          actorId: session.id,
          actorName: session.name,
          entityType: 'task',
          entityId: t.id,
          entityName: t.title,
          action: 'created',
          message: `${session.name} created task "${t.title}"`,
          projectId: t.projectId,
        })),
      );
      await recalcProjectProgress(this.prisma, t.projectId);
      return t;
    });
  }

  async getById(userId: string, role: string, id: string) {
    const t = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        type: true,
        status: true,
        priority: true,
        reporterId: true,
        sprintId: true,
        epicId: true,
        parentTaskId: true,
        storyPoints: true,
        startDate: true,
        dueDate: true,
        completedAt: true,
        tags: true,
        timeLogged: true,
        createdAt: true,
        assignees: {
          select: { user: { select: { id: true, name: true, image: true } } },
        },
        attachments: true,
        checklists: { orderBy: { order: 'asc' } },
        dependsOn: {
          select: { id: true, dependsOnId: true, type: true },
        },
      },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, userId, role, t.projectId);
    return t;
  }

  async update(
    session: { id: string; name: string; role: string },
    id: string,
    dto: UpdateTaskDto,
  ) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      select: { projectId: true, title: true, status: true },
    });
    if (!existing) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, existing.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      if (dto.assigneeIds) {
        await tx.taskAssignee.deleteMany({ where: { taskId: id } });
        if (dto.assigneeIds.length) {
          await tx.taskAssignee.createMany({
            data: dto.assigneeIds.map((userId) => ({ taskId: id, userId })),
          });
        }
      }
      const t = await tx.task.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          type: dto.type,
          status: dto.status,
          priority: dto.priority,
          ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId } : {}),
          epicId: dto.epicId,
          parentTaskId: dto.parentTaskId,
          storyPoints: dto.storyPoints,
          startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate,
          tags: dto.tags,
          completedAt:
            dto.status === 'done' || dto.status === 'completed'
              ? new Date()
              : dto.status
                ? null
                : undefined,
        },
        select: { id: true, title: true, projectId: true, status: true },
      });
      await this.activityLog.log(tx, {
        projectId: t.projectId,
        entityType: 'task',
        entityId: t.id,
        entityName: t.title,
        action: 'updated',
        actor: this.actor(session),
        changes: dto as object,
      });
      await recalcProjectProgress(this.prisma, t.projectId);
      return t;
    });
  }

  async remove(session: { id: string; name: string; role: string }, id: string) {
    const existing = await this.prisma.task.findUnique({
      where: { id },
      select: { projectId: true, title: true },
    });
    if (!existing) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, existing.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id } });
      await this.activityLog.log(tx, {
        projectId: existing.projectId,
        entityType: 'task',
        entityId: id,
        entityName: existing.title,
        action: 'deleted',
        actor: this.actor(session),
      });
    });
    await recalcProjectProgress(this.prisma, existing.projectId);
    return { ok: true };
  }

  async bulkUpdate(
    session: { id: string; name: string; role: string },
    body: BulkUpdateDto,
  ) {
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const first = await this.prisma.task.findFirst({
      where: { id: { in: body.ids } },
      select: { projectId: true },
    });
    if (!first) throw new BadRequestException('No tasks');
    await assertProjectAccess(this.prisma, session.id, session.role, first.projectId);
    const sameProject = await this.prisma.task.count({
      where: {
        id: { in: body.ids },
        projectId: { not: first.projectId },
      },
    });
    if (sameProject) throw new BadRequestException('Tasks must share project');
    if (body.action === 'delete') {
      await this.prisma.task.deleteMany({ where: { id: { in: body.ids } } });
      await recalcProjectProgress(this.prisma, first.projectId);
      return { ok: true, deleted: body.ids.length };
    }
    await this.prisma.task.updateMany({
      where: { id: { in: body.ids } },
      data: {
        status: body.status,
        priority: body.priority,
        sprintId: body.sprintId === null ? null : body.sprintId,
      },
    });
    await recalcProjectProgress(this.prisma, first.projectId);
    return { ok: true, updated: body.ids.length };
  }

  async exportCsv(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    const rows = await this.prisma.task.findMany({
      where: { projectId },
      select: {
        title: true,
        status: true,
        priority: true,
        type: true,
        storyPoints: true,
        dueDate: true,
        timeLogged: true,
      },
      orderBy: { title: 'asc' },
    });
    const header = [
      'Title',
      'Status',
      'Priority',
      'Type',
      'Points',
      'Due',
      'Hours',
    ];
    const lines = [
      header.join(','),
      ...rows.map((r) =>
        [
          `"${(r.title || '').replace(/"/g, '""')}"`,
          r.status,
          r.priority,
          r.type,
          r.storyPoints ?? '',
          r.dueDate ? r.dueDate.toISOString() : '',
          r.timeLogged ?? '',
        ].join(','),
      ),
    ];
    return lines.join('\n');
  }

  async addComment(
    session: { id: string; name: string; role: string },
    taskId: string,
    dto: TaskCommentDto,
  ) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, t.projectId);
    return this.prisma.taskComment.create({
      data: { taskId, authorId: session.id, content: dto.content },
      select: { id: true, content: true, createdAt: true, authorId: true },
    });
  }

  listComments(userId: string, role: string, taskId: string) {
    return this.prisma.task
      .findUnique({
        where: { id: taskId },
        select: { projectId: true, comments: { orderBy: { createdAt: 'asc' } } },
      })
      .then(async (t) => {
        if (!t) throw new NotFoundException();
        await assertProjectAccess(this.prisma, userId, role, t.projectId);
        return t.comments;
      });
  }

  async updateComment(
    session: { id: string; role: string },
    taskId: string,
    commentId: string,
    dto: TaskCommentDto,
  ) {
    const c = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      select: { taskId: true, authorId: true, task: { select: { projectId: true } } },
    });
    if (!c || c.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, c.task.projectId);
    if (c.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.prisma.taskComment.update({
      where: { id: commentId },
      data: { content: dto.content },
    });
  }

  async removeComment(
    session: { id: string; role: string },
    taskId: string,
    commentId: string,
  ) {
    const c = await this.prisma.taskComment.findUnique({
      where: { id: commentId },
      select: { taskId: true, authorId: true, task: { select: { projectId: true } } },
    });
    if (!c || c.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, c.task.projectId);
    if (c.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.taskComment.delete({ where: { id: commentId } });
    return { ok: true };
  }

  async addChecklist(
    session: { id: string; role: string },
    taskId: string,
    dto: CreateChecklistDto,
  ) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, t.projectId);
    return this.prisma.taskChecklist.create({
      data: {
        taskId,
        text: dto.text,
        order: dto.order ?? 0,
      },
    });
  }

  async updateChecklist(
    session: { id: string; role: string },
    taskId: string,
    checklistId: string,
    dto: UpdateChecklistDto,
  ) {
    const row = await this.prisma.taskChecklist.findUnique({
      where: { id: checklistId },
      select: { taskId: true, task: { select: { projectId: true } } },
    });
    if (!row || row.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, row.task.projectId);
    return this.prisma.taskChecklist.update({
      where: { id: checklistId },
      data: dto,
    });
  }

  async removeChecklist(
    session: { id: string; role: string },
    taskId: string,
    checklistId: string,
  ) {
    const row = await this.prisma.taskChecklist.findUnique({
      where: { id: checklistId },
      select: { taskId: true, task: { select: { projectId: true } } },
    });
    if (!row || row.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, row.task.projectId);
    await this.prisma.taskChecklist.delete({ where: { id: checklistId } });
    return { ok: true };
  }

  async logTime(
    session: { id: string; role: string },
    taskId: string,
    dto: LogTimeDto,
  ) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true, timeLogged: true },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, t.projectId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: { timeLogged: (t.timeLogged ?? 0) + dto.hours },
      select: { id: true, timeLogged: true },
    });
  }

  async addAttachment(
    session: { id: string; role: string },
    taskId: string,
    body: { url: string; name: string; mimeType?: string; size?: number },
  ) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, t.projectId);
    return this.prisma.taskAttachment.create({
      data: {
        taskId,
        url: body.url,
        name: body.name,
        mimeType: body.mimeType,
        size: body.size,
      },
    });
  }

  async removeAttachment(
    session: { id: string; role: string },
    taskId: string,
    attachmentId: string,
  ) {
    const a = await this.prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      select: { taskId: true, task: { select: { projectId: true } } },
    });
    if (!a || a.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, a.task.projectId);
    await this.prisma.taskAttachment.delete({ where: { id: attachmentId } });
    return { ok: true };
  }

  async addDependency(
    session: { id: string; role: string },
    taskId: string,
    dto: CreateDependencyDto,
  ) {
    const t = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!t) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, t.projectId);
    const dep = await this.prisma.task.findUnique({
      where: { id: dto.dependsOnId },
      select: { projectId: true },
    });
    if (!dep || dep.projectId !== t.projectId) {
      throw new BadRequestException('Dependency must be same project');
    }
    return this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnId: dto.dependsOnId,
        type: dto.type ?? 'blocks',
      },
    });
  }

  async removeDependency(
    session: { id: string; role: string },
    taskId: string,
    depId: string,
  ) {
    const d = await this.prisma.taskDependency.findUnique({
      where: { id: depId },
      select: { taskId: true, task: { select: { projectId: true } } },
    });
    if (!d || d.taskId !== taskId) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, d.task.projectId);
    await this.prisma.taskDependency.delete({ where: { id: depId } });
    return { ok: true };
  }
}
