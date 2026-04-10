import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<string, string> = {
  system_name: 'SIMPRO',
  currency: 'IDR',
  currency_symbol: 'Rp',
  timezone: 'Asia/Jakarta',
  date_format: 'DD/MM/YYYY',
  hourly_rate: '0',
  tax_rate: '11',
};

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.setting.findMany();
    const map = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  }

  async patch(actorRole: string, pairs: { key: string; value: string }[]) {
    if (actorRole !== 'admin') throw new ForbiddenException();
    for (const { key, value } of pairs) {
      await this.prisma.setting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }
    return this.getAll();
  }
}
