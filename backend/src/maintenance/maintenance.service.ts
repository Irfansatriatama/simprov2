import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { assertProjectAccess } from '../lib/project-access';
import { randomBytes } from 'crypto';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private ticketNo(code: string) {
    return `MT-${code}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  async list(
    userId: string,
    role: string,
    q: {
      projectId: string;
      status?: string;
      severity?: string;
      assignedTo?: string;
      page?: string;
      take?: string;
    },
  ) {
    await assertProjectAccess(this.prisma, userId, role, q.projectId);
    const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
    const where: Record<string, unknown> = { projectId: q.projectId };
    if (q.status) where.status = q.status;
    if (q.severity) where.severity = q.severity;
    if (q.assignedTo) where.assignedTo = q.assignedTo;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.maintenance.count({ where }),
      this.prisma.maintenance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          type: true,
          severity: true,
          status: true,
          priority: true,
          dueDate: true,
          assignedTo: true,
          picDevs: { select: { user: { select: { id: true, name: true } } } },
        },
      }),
    ]);
    return { data, meta: { total, page, take } };
  }

  async create(
    session: { id: string; name: string; role: string },
    body: Record<string, unknown>,
  ) {
    const projectId = body.projectId as string;
    await assertProjectAccess(this.prisma, session.id, session.role, projectId);
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { code: true },
    });
    if (!project) throw new NotFoundException();
    let ticketNumber = this.ticketNo(project.code);
    for (let i = 0; i < 5; i++) {
      const exists = await this.prisma.maintenance.findUnique({
        where: { ticketNumber },
        select: { id: true },
      });
      if (!exists) break;
      ticketNumber = this.ticketNo(project.code);
    }
    const picUserIds = (body.picDevIds as string[] | undefined) ?? [];
    return this.prisma.$transaction(async (tx) => {
      const m = await tx.maintenance.create({
        data: {
          projectId,
          ticketNumber,
          title: body.title as string,
          description: body.description as string | undefined,
          type: body.type as string,
          severity: (body.severity as string) ?? 'medium',
          priority: (body.priority as string) ?? 'medium',
          status: (body.status as string) ?? 'backlog',
          reportedBy: body.reportedBy as string | undefined,
          reportedDate: body.reportedDate
            ? new Date(body.reportedDate as string)
            : undefined,
          dueDate: body.dueDate ? new Date(body.dueDate as string) : undefined,
          assignedTo: body.assignedTo as string | undefined,
          picDevs: picUserIds.length
            ? { create: picUserIds.map((userId) => ({ userId })) }
            : undefined,
        },
      });
      await this.activityLog.log(tx, {
        projectId,
        entityType: 'maintenance',
        entityId: m.id,
        entityName: m.title,
        action: 'created',
        actor: { id: session.id, name: session.name },
      });
      return m;
    });
  }

  async getById(userId: string, role: string, id: string) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      include: {
        picDevs: { include: { user: { select: { id: true, name: true, image: true } } } },
        assignee: { select: { id: true, name: true } },
        attachments: true,
        activityLogs: { orderBy: { at: 'desc' }, take: 50 },
      },
    });
    if (!m) throw new NotFoundException();
    await assertProjectAccess(this.prisma, userId, role, m.projectId);
    return m;
  }

  async update(
    session: { id: string; name: string; role: string },
    id: string,
    body: Record<string, unknown>,
  ) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      select: { projectId: true, title: true },
    });
    if (!m) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, m.projectId);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    return this.prisma.maintenance.update({
      where: { id },
      data: {
        title: body.title as string | undefined,
        description: body.description as string | undefined,
        type: body.type as string | undefined,
        severity: body.severity as string | undefined,
        priority: body.priority as string | undefined,
        status: body.status as string | undefined,
        dueDate: body.dueDate ? new Date(body.dueDate as string) : undefined,
        assignedTo: body.assignedTo as string | undefined,
        resolutionNotes: body.resolutionNotes as string | undefined,
        actualHours: body.actualHours as number | undefined,
      },
    });
  }

  async remove(session: { id: string; role: string }, id: string) {
    const m = await this.prisma.maintenance.findUnique({
      where: { id },
      select: { projectId: true },
    });
    if (!m) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, m.projectId);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.maintenance.delete({ where: { id } });
    return { ok: true };
  }

  async report(
    userId: string,
    role: string,
    q: {
      projectId: string;
      from?: string;
      to?: string;
      status?: string;
      type?: string;
    },
  ) {
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    await assertProjectAccess(this.prisma, userId, role, q.projectId);
    const where: Record<string, unknown> = { projectId: q.projectId };
    if (q.status) where.status = q.status;
    if (q.type) where.type = q.type;
    if (q.from || q.to) {
      where.createdAt = {};
      if (q.from)
        (where.createdAt as Record<string, Date>).gte = new Date(q.from);
      if (q.to) (where.createdAt as Record<string, Date>).lte = new Date(q.to);
    }
    return this.prisma.maintenance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }
}
