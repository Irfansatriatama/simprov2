import { PrismaService } from '../prisma/prisma.service';

export async function recalcProjectProgress(
  prisma: PrismaService,
  projectId: string,
) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: { status: true },
  });
  if (!tasks.length) {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
    return;
  }
  const done = tasks.filter(
    (t) => t.status === 'done' || t.status === 'completed',
  ).length;
  const progress = Math.round((done / tasks.length) * 10000) / 100;
  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}
