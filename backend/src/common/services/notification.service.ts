import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type NotificationRow = {
  userId: string;
  actorId?: string | null;
  actorName?: string | null;
  actorAvatar?: string | null;
  entityType: string;
  entityId: string;
  entityName?: string | null;
  action: string;
  message: string;
  projectId?: string | null;
  projectName?: string | null;
};

@Injectable()
export class NotificationService {
  async createMany(tx: Prisma.TransactionClient, rows: NotificationRow[]) {
    if (!rows.length) return;
    await tx.notification.createMany({
      data: rows.map((r) => ({
        userId: r.userId,
        actorId: r.actorId ?? undefined,
        actorName: r.actorName ?? undefined,
        actorAvatar: r.actorAvatar ?? undefined,
        entityType: r.entityType,
        entityId: r.entityId,
        entityName: r.entityName ?? undefined,
        action: r.action,
        message: r.message,
        projectId: r.projectId ?? undefined,
        projectName: r.projectName ?? undefined,
      })),
    });
  }
}
