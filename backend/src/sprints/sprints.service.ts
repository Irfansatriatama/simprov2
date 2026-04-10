import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SprintStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { assertProjectAccess } from '../lib/project-access';
import { CreateSprintDto, UpdateSprintDto, CompleteSprintDto } from './dto/sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async list(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    return this.prisma.sprint.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        goal: true,
        startDate: true,
        endDate: true,
        status: true,
        retroNotes: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    session: { id: string; name: string; role: string },
    dto: CreateSprintDto,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, dto.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      const s = await tx.sprint.create({
        data: {
          projectId: dto.projectId,
          name: dto.name,
          goal: dto.goal,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
      });
      await this.activityLog.log(tx, {
        projectId: dto.projectId,
        entityType: 'sprint',
        entityId: s.id,
        entityName: s.name,
        action: 'created',
        actor: { id: session.id, name: session.name },
      });
      return s;
    });
  }

  async getById(userId: string, role: string, id: string) {
    const s = await this.prisma.sprint.findUnique({
      where: { id },
      select: { id: true, projectId: true, name: true, goal: true, status: true },
    });
    if (!s) throw new NotFoundException();
    await assertProjectAccess(this.prisma, userId, role, s.projectId);
    return this.prisma.sprint.findUnique({
      where: { id },
      include: {
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            storyPoints: true,
          },
        },
      },
    });
  }

  async update(
    session: { id: string; name: string; role: string },
    id: string,
    dto: UpdateSprintDto,
  ) {
    const s = await this.prisma.sprint.findUnique({
      where: { id },
      select: { projectId: true, name: true },
    });
    if (!s) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, s.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.sprint.update({
      where: { id },
      data: {
        name: dto.name,
        goal: dto.goal,
        startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate,
        endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate,
        status: dto.status,
        retroNotes: dto.retroNotes,
      },
    });
  }

  async remove(session: { id: string; role: string }, id: string) {
    const s = await this.prisma.sprint.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!s) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, s.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { sprintId: id },
        data: { sprintId: null },
      });
      await tx.sprint.delete({ where: { id } });
    });
    return { ok: true };
  }

  async activate(session: { id: string; name: string; role: string }, id: string) {
    const s = await this.prisma.sprint.findUnique({
      where: { id },
      select: { projectId: true, name: true },
    });
    if (!s) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, s.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.sprint.updateMany({
        where: { projectId: s.projectId, status: SprintStatus.ACTIVE },
        data: { status: SprintStatus.PLANNING },
      });
      const active = await tx.sprint.update({
        where: { id },
        data: { status: SprintStatus.ACTIVE },
      });
      await this.activityLog.log(tx, {
        projectId: s.projectId,
        entityType: 'sprint',
        entityId: id,
        entityName: s.name,
        action: 'activated',
        actor: { id: session.id, name: session.name },
      });
      return active;
    });
  }

  async complete(
    session: { id: string; name: string; role: string },
    id: string,
    body: CompleteSprintDto,
  ) {
    const s = await this.prisma.sprint.findUnique({
      where: { id },
      select: { projectId: true, name: true },
    });
    if (!s) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, s.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.$transaction(async (tx) => {
      const unfinished = await tx.task.findMany({
        where: {
          sprintId: id,
          status: { notIn: ['done', 'completed'] },
        },
        select: { id: true },
      });
      if (body.unfinishedTaskAction === 'backlog') {
        await tx.task.updateMany({
          where: { id: { in: unfinished.map((t) => t.id) } },
          data: { sprintId: null },
        });
      }
      const done = await tx.sprint.update({
        where: { id },
        data: { status: SprintStatus.COMPLETED },
      });
      await this.activityLog.log(tx, {
        projectId: s.projectId,
        entityType: 'sprint',
        entityId: id,
        entityName: s.name,
        action: 'completed',
        actor: { id: session.id, name: session.name },
        metadata: { unfinishedTaskAction: body.unfinishedTaskAction },
      });
      return done;
    });
  }
}
