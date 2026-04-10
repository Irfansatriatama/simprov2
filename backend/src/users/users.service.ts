import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

const userSelect = {
  id: true,
  name: true,
  email: true,
  username: true,
  role: true,
  status: true,
  image: true,
  phoneNumber: true,
  company: true,
  department: true,
  position: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(role: string) {
    if (role !== 'admin') throw new ForbiddenException();
  }

  async list(actorRole: string) {
    this.assertAdmin(actorRole);
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(actorRole: string, dto: CreateUserDto) {
    this.assertAdmin(actorRole);
    await auth.api.signUpEmail({
      body: {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        username: dto.username,
        role: dto.role,
        status: 'active',
        phoneNumber: dto.phoneNumber,
        company: dto.company,
      },
    });
    const u = await this.prisma.user.findFirst({
      where: { username: dto.username },
      select: userSelect,
    });
    if (!u) throw new NotFoundException('User not found after create');
    return u;
  }

  async getById(actorRole: string, actorId: string, id: string) {
    if (actorRole !== 'admin' && actorId !== id) {
      throw new ForbiddenException();
    }
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { ...userSelect, bio: true, linkedin: true, github: true, timezone: true },
    });
    if (!u) throw new NotFoundException();
    return u;
  }

  async update(actorRole: string, actorId: string, id: string, dto: UpdateUserDto) {
    if (actorRole !== 'admin' && actorId !== id) {
      throw new ForbiddenException();
    }
    if (dto.role && actorRole !== 'admin') {
      delete (dto as { role?: string }).role;
    }
    const u = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        company: dto.company,
        department: dto.department,
        position: dto.position,
        bio: dto.bio,
        linkedin: dto.linkedin,
        github: dto.github,
        timezone: dto.timezone,
        image: dto.image,
        role: dto.role,
      },
      select: userSelect,
    });
    return u;
  }

  async updateStatus(actorRole: string, id: string, body: UpdateStatusDto) {
    this.assertAdmin(actorRole);
    return this.prisma.user.update({
      where: { id },
      data: { status: body.status },
      select: userSelect,
    });
  }

  async remove(actorRole: string, id: string) {
    this.assertAdmin(actorRole);
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
