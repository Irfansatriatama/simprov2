import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertProjectAccess } from '../lib/project-access';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async progress(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    const byStatus = await this.prisma.task.groupBy({
      by: ['status'],
      where: { projectId },
      _count: { id: true },
    });
    return { byStatus };
  }

  async workload(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    const rows = await this.prisma.taskAssignee.groupBy({
      by: ['userId'],
      where: { task: { projectId } },
      _count: { taskId: true },
    });
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.userId) } },
      select: { id: true, name: true },
    });
    const umap = Object.fromEntries(users.map((u) => [u.id, u.name]));
    return rows.map((r) => ({
      userId: r.userId,
      name: umap[r.userId],
      tasks: r._count.taskId,
    }));
  }

  async burndown(userId: string, role: string, projectId: string, sprintId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    const tasks = await this.prisma.task.findMany({
      where: { projectId, sprintId },
      select: { id: true, status: true, storyPoints: true, updatedAt: true },
    });
    return { tasks };
  }

  async maintenanceSummary(
    userId: string,
    role: string,
    projectId: string,
    from?: string,
    to?: string,
  ) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    const where: Record<string, unknown> = { projectId };
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, Date>).lte = new Date(to);
    }
    const byStatus = await this.prisma.maintenance.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    return { byStatus };
  }

  async assetsReport(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
    return this.prisma.asset.findMany({
      where: { OR: [{ projectId }, { projectId: null }] },
    });
  }

  async dashboard(userId: string, role: string) {
    const projectFilter =
      role === 'admin'
        ? {}
        : { members: { some: { userId } } };
    const [projectCount, clientCount, userCount, taskOpen, tasksByPriority, recent] =
      await this.prisma.$transaction([
        this.prisma.project.count({ where: projectFilter }),
        this.prisma.client.count(),
        this.prisma.user.count({ where: { status: 'active' } }),
        this.prisma.task.count({
          where: {
            status: { notIn: ['done', 'completed'] },
            project: projectFilter,
          },
        }),
        this.prisma.task.groupBy({
          by: ['priority'],
          where: { project: projectFilter },
          _count: { id: true },
          orderBy: { priority: 'asc' },
        }),
        this.prisma.activityLog.findMany({
          where:
            role === 'admin'
              ? {}
              : { actorId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);
    const projectsByStatus = await this.prisma.project.groupBy({
      by: ['status'],
      where: projectFilter,
      _count: { id: true },
    });
    return {
      stats: {
        projects: projectCount,
        clients: clientCount,
        users: userCount,
        openTasks: taskOpen,
      },
      tasksByPriority,
      projectsByStatus,
      recentActivity: recent,
    };
  }
}
