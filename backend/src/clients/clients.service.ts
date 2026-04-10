import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.client.findMany({
      orderBy: { companyName: 'asc' },
    });
  }

  create(body: Record<string, unknown>) {
    return this.prisma.client.create({
      data: {
        companyName: body.companyName as string,
        industry: body.industry as string | undefined,
        contactPerson: body.contactPerson as string | undefined,
        contactEmail: body.contactEmail as string | undefined,
        contactPhone: body.contactPhone as string | undefined,
        address: body.address as string | undefined,
        website: body.website as string | undefined,
        notes: body.notes as string | undefined,
        status: (body.status as string) ?? 'active',
      },
    });
  }

  get(id: string) {
    return this.prisma.client.findUniqueOrThrow({ where: { id } });
  }

  update(id: string, body: Record<string, unknown>) {
    return this.prisma.client.update({
      where: { id },
      data: body as object,
    });
  }

  async remove(id: string) {
    await this.prisma.client.delete({ where: { id } });
    return { ok: true };
  }
}
