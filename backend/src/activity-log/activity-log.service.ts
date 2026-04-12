import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertProjectAccess } from '../lib/project-access';

@Injectable()
export class ActivityLogReadService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    userId: string,
    role: string,
    q: {
      projectId?: string;
      entityType?: string;
      entityId?: string;
      page?: string;
      take?: string;
    },
  ) {
    if (q.projectId) {
      await assertProjectAccess(this.prisma, userId, role, q.projectId);
      if (role === 'viewer' || role === 'client') {
        throw new ForbiddenException();
      }
    } else if (role !== 'admin' && role !== 'pm') {
      throw new ForbiddenException('projectId required');
    }
    const p = Math.max(1, parseInt(q.page || '1', 10) || 1);
    const t = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
    const where: Record<string, unknown> = {};
    if (q.projectId) where.projectId = q.projectId;
    if (q.entityType) where.entityType = q.entityType;
    if (q.entityId) where.entityId = q.entityId;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.activityLog.count({ where }),
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * t,
        take: t,
      }),
    ]);
    return { data, meta: { total, page: p, take: t } };
  }
}
