import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.asset.findMany({
      orderBy: { name: 'asc' },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.asset.create({
      data: {
        name: body.name as string,
        category: body.category as string | undefined,
        description: body.description as string | undefined,
        serialNumber: body.serialNumber as string | undefined,
        purchaseDate: body.purchaseDate
          ? new Date(body.purchaseDate as string)
          : undefined,
        purchasePrice: body.purchasePrice as number | undefined,
        vendor: body.vendor as string | undefined,
        assignedTo: body.assignedTo as string | undefined,
        projectId: body.projectId as string | undefined,
        status: (body.status as string) ?? 'available',
        warrantyExpiry: body.warrantyExpiry
          ? new Date(body.warrantyExpiry as string)
          : undefined,
        notes: body.notes as string | undefined,
        image: body.image as string | undefined,
      },
    });
  }

  get(id: string) {
    return this.prisma.asset.findUniqueOrThrow({
      where: { id },
      include: { assignedUser: { select: { id: true, name: true } } },
    });
  }

  update(id: string, body: Record<string, unknown>) {
    const data: Record<string, unknown> = { ...body };
    if (body.purchaseDate)
      data.purchaseDate = new Date(body.purchaseDate as string);
    if (body.warrantyExpiry)
      data.warrantyExpiry = new Date(body.warrantyExpiry as string);
    return this.prisma.asset.update({
      where: { id },
      data: data as object,
    });
  }

  async remove(id: string) {
    await this.prisma.asset.delete({ where: { id } });
    return { ok: true };
  }
}
