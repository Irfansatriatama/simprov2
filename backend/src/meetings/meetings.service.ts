import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { assertProjectAccess } from '../lib/project-access';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private meetingWhere(userId: string, role: string) {
    if (role === 'admin' || role === 'pm') return {};
    return {
      OR: [
        { createdById: userId },
        { attendees: { some: { userId } } },
      ],
    };
  }

  async list(userId: string, role: string, from?: string, to?: string) {
    const where: Record<string, unknown> = this.meetingWhere(userId, role);
    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, Date>).gte = new Date(from);
      if (to) (where.date as Record<string, Date>).lte = new Date(to);
    }
    return this.prisma.meeting.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        type: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        location: true,
        projects: { select: { project: { select: { id: true, name: true } } } },
        attendees: {
          take: 8,
          select: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        agendaItems: { select: { done: true } },
      },
    });
  }

  async create(
    session: { id: string; name: string; role: string },
    body: {
      title: string;
      description?: string;
      type: string;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      status?: string;
      projectIds?: string[];
      attendeeIds?: string[];
    },
  ) {
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      const m = await tx.meeting.create({
        data: {
          title: body.title,
          description: body.description,
          type: body.type,
          date: new Date(body.date),
          startTime: body.startTime,
          endTime: body.endTime,
          location: body.location,
          status: body.status ?? 'scheduled',
          createdById: session.id,
          projects: body.projectIds?.length
            ? {
                create: body.projectIds.map((projectId) => ({ projectId })),
              }
            : undefined,
          attendees: body.attendeeIds?.length
            ? {
                create: body.attendeeIds.map((userId) => ({ userId })),
              }
            : undefined,
        },
      });
      await this.activityLog.log(tx, {
        entityType: 'meeting',
        entityId: m.id,
        entityName: m.title,
        action: 'created',
        actor: { id: session.id, name: session.name },
      });
      return m;
    });
  }

  async getById(userId: string, role: string, id: string) {
    const m = await this.prisma.meeting.findFirst({
      where: { id, ...this.meetingWhere(userId, role) },
      include: {
        projects: { include: { project: true } },
        attendees: { include: { user: { select: { id: true, name: true, image: true } } } },
        agendaItems: { orderBy: { order: 'asc' } },
        actionItems: { orderBy: { id: 'asc' } },
        createdBy: { select: { id: true, name: true } },
        notulensiAttachments: true,
      },
    });
    if (!m) throw new NotFoundException();
    return m;
  }

  async update(
    session: { id: string; name: string; role: string },
    id: string,
    body: Record<string, unknown>,
  ) {
    await this.getById(session.id, session.role, id);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const projectIds = body.projectIds as string[] | undefined;
    const attendeeIds = body.attendeeIds as string[] | undefined;
    return this.prisma.$transaction(async (tx) => {
      if (projectIds !== undefined) {
        await tx.meetingProject.deleteMany({ where: { meetingId: id } });
        if (projectIds.length > 0) {
          await tx.meetingProject.createMany({
            data: projectIds.map((projectId) => ({ meetingId: id, projectId })),
          });
        }
      }
      if (attendeeIds !== undefined) {
        await tx.meetingAttendee.deleteMany({ where: { meetingId: id } });
        if (attendeeIds.length > 0) {
          await tx.meetingAttendee.createMany({
            data: attendeeIds.map((userId) => ({ meetingId: id, userId })),
          });
        }
      }
      return tx.meeting.update({
        where: { id },
        data: {
          title: body.title as string | undefined,
          description: body.description as string | undefined,
          type: body.type as string | undefined,
          date: body.date ? new Date(body.date as string) : undefined,
          startTime: body.startTime as string | undefined,
          endTime: body.endTime as string | undefined,
          location: body.location as string | undefined,
          status: body.status as string | undefined,
        },
      });
    });
  }

  async remove(session: { id: string; role: string }, id: string) {
    await this.getById(session.id, session.role, id);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.meeting.delete({ where: { id } });
    return { ok: true };
  }

  async patchNotulensi(
    session: { id: string; role: string },
    id: string,
    body: { content: string },
  ) {
    await this.getById(session.id, session.role, id);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.meeting.update({
      where: { id },
      data: {
        notulensiContent: body.content,
        notulensiCreatedBy: session.id,
        notulensiUpdatedAt: new Date(),
      },
    });
  }

  async addNotulensiAttachment(
    session: { id: string; role: string },
    meetingId: string,
    body: { url: string; name: string; mimeType?: string; size?: number },
  ) {
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.meetingNotulensiAttachment.create({
      data: {
        meetingId,
        url: body.url,
        name: body.name,
        mimeType: body.mimeType,
        size: body.size,
        uploadedBy: session.id,
      },
    });
  }

  async removeNotulensiAttachment(
    session: { id: string; role: string },
    meetingId: string,
    attachmentId: string,
  ) {
    const row = await this.prisma.meetingNotulensiAttachment.findFirst({
      where: { id: attachmentId, meetingId },
    });
    if (!row) throw new NotFoundException();
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    await this.prisma.meetingNotulensiAttachment.delete({
      where: { id: attachmentId },
    });
    return { ok: true };
  }

  async addAgenda(session: { id: string; role: string }, id: string, text: string) {
    await this.getById(session.id, session.role, id);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const max = await this.prisma.meetingAgendaItem.aggregate({
      where: { meetingId: id },
      _max: { order: true },
    });
    return this.prisma.meetingAgendaItem.create({
      data: { meetingId: id, text, order: (max._max.order ?? 0) + 1 },
    });
  }

  async patchAgenda(
    session: { id: string; role: string },
    meetingId: string,
    itemId: string,
    body: { text?: string; done?: boolean; order?: number },
  ) {
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const item = await this.prisma.meetingAgendaItem.findFirst({
      where: { id: itemId, meetingId },
    });
    if (!item) throw new NotFoundException();
    return this.prisma.meetingAgendaItem.update({
      where: { id: itemId },
      data: body,
    });
  }

  async deleteAgendaItem(
    session: { id: string; role: string },
    meetingId: string,
    itemId: string,
  ) {
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const item = await this.prisma.meetingAgendaItem.findFirst({
      where: { id: itemId, meetingId },
    });
    if (!item) throw new NotFoundException();
    await this.prisma.meetingAgendaItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  async addActionItem(
    session: { id: string; role: string },
    meetingId: string,
    body: { title: string; assigneeId?: string; dueDate?: string },
  ) {
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.meetingActionItem.create({
      data: {
        meetingId,
        title: body.title,
        assigneeId: body.assigneeId,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      },
    });
  }

  async patchActionItem(
    session: { id: string; role: string },
    meetingId: string,
    itemId: string,
    body: Record<string, unknown>,
  ) {
    await this.getById(session.id, session.role, meetingId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const row = await this.prisma.meetingActionItem.findFirst({
      where: { id: itemId, meetingId },
    });
    if (!row) throw new NotFoundException();
    const assigneeRaw = body.assigneeId;
    const assigneeId =
      assigneeRaw === undefined
        ? undefined
        : (assigneeRaw as string | null);
    const dueRaw = body.dueDate;
    const dueDate =
      dueRaw === undefined
        ? undefined
        : dueRaw === null || dueRaw === ''
          ? null
          : new Date(dueRaw as string);
    return this.prisma.meetingActionItem.update({
      where: { id: itemId },
      data: {
        title: body.title as string | undefined,
        assigneeId,
        dueDate,
        done: body.done as boolean | undefined,
      },
    });
  }

  async convertActionToTask(
    session: { id: string; name: string; role: string },
    meetingId: string,
    itemId: string,
    projectId: string,
  ) {
    await this.getById(session.id, session.role, meetingId);
    const item = await this.prisma.meetingActionItem.findFirst({
      where: { id: itemId, meetingId },
    });
    if (!item) throw new NotFoundException();
    const link = await this.prisma.meetingProject.findFirst({
      where: { meetingId, projectId },
    });
    if (!link) throw new BadRequestException('Project not linked to meeting');
    await assertProjectAccess(this.prisma, session.id, session.role, projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId,
          title: item.title,
          reporterId: session.id,
          status: 'todo',
        },
      });
      await tx.meetingActionItem.update({
        where: { id: itemId },
        data: { taskId: task.id },
      });
      return task;
    });
  }
}
