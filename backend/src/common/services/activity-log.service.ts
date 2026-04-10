import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Actor = { id: string; name: string };

@Injectable()
export class ActivityLogService {
  async log(
    tx: Prisma.TransactionClient,
    input: {
      projectId?: string | null;
      entityType: string;
      entityId: string;
      entityName?: string | null;
      action: string;
      actor: Actor;
      changes?: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    await tx.activityLog.create({
      data: {
        projectId: input.projectId ?? undefined,
        entityType: input.entityType,
        entityId: input.entityId,
        entityName: input.entityName ?? undefined,
        action: input.action,
        actorId: input.actor.id,
        actorName: input.actor.name,
        changes: input.changes ?? undefined,
        metadata: input.metadata ?? undefined,
      },
    });
  }
}
