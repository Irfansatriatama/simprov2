import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function assertProjectAccess(
  prisma: PrismaService,
  userId: string,
  role: string,
  projectId: string,
) {
  if (role === 'admin') return;
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { projectId: true },
  });
  if (!m) {
    throw new ForbiddenException('Not a member of this project');
  }
}

export function projectIdsForUser(role: string, userId: string) {
  if (role === 'admin') {
    return null as null;
  }
  return userId;
}
