import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth';
import { hashPassword } from 'better-auth/crypto';
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
  updatedAt: true,
  bio: true,
  linkedin: true,
  github: true,
  timezone: true,
  lastLogin: true,
  clientId: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(role: string) {
    if (role !== 'admin') throw new ForbiddenException();
  }

  private assertAdminOrPm(role: string) {
    if (role !== 'admin' && role !== 'pm') throw new ForbiddenException();
  }

  /** Add user to every project tied to the same Client org (projectRole CLIENT). */
  private async syncClientUserToProjects(
    userId: string,
    clientId: string | null,
  ) {
    if (!clientId) return;
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (u?.role !== 'client') return;
    const projects = await this.prisma.project.findMany({
      where: { clientId },
      select: { id: true },
    });
    if (projects.length === 0) return;
    const existing = new Set(
      (
        await this.prisma.projectMember.findMany({
          where: { userId },
          select: { projectId: true },
        })
      ).map((r) => r.projectId),
    );
    const rows = projects
      .filter((p) => !existing.has(p.id))
      .map((p) => ({
        projectId: p.id,
        userId,
        projectRole: ProjectRole.CLIENT,
      }));
    if (rows.length === 0) return;
    await this.prisma.projectMember.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }

  async list(actorRole: string) {
    this.assertAdminOrPm(actorRole);
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { name: 'asc' },
    });
  }

  /** Portal users linked to a client company (`User.clientId`). Admin & PM only. */
  async listByClientId(actorRole: string, clientId: string) {
    this.assertAdminOrPm(actorRole);
    const cl = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true },
    });
    if (!cl) throw new NotFoundException('Client not found');
    return this.prisma.user.findMany({
      where: { clientId },
      select: userSelect,
      orderBy: { name: 'asc' },
    });
  }

  async create(actorRole: string, dto: CreateUserDto) {
    this.assertAdmin(actorRole);
    let companyForAuth = dto.company;
    let linkedClientId: string | undefined;
    if (dto.role === 'client') {
      if (!dto.clientId?.trim()) {
        throw new BadRequestException(
          'Client company is required for users with the client role',
        );
      }
      const cl = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
        select: { companyName: true },
      });
      if (!cl) throw new BadRequestException('Client company not found');
      companyForAuth = cl.companyName;
      linkedClientId = dto.clientId;
    }
    await auth.api.signUpEmail({
      body: {
        email: dto.email,
        name: dto.name,
        password: dto.password,
        username: dto.username,
        role: dto.role,
        status: (dto.status as 'active' | 'inactive' | 'invited') ?? 'active',
        phoneNumber: dto.phoneNumber,
        company: companyForAuth,
        clientId: linkedClientId,
        department: dto.department,
        position: dto.position,
        bio: dto.bio,
        linkedin: dto.linkedin,
        github: dto.github,
        timezone: dto.timezone ?? 'Asia/Jakarta',
      },
    });
    const u = await this.prisma.user.findFirst({
      where: { username: dto.username },
    });
    if (!u) throw new NotFoundException('User not found after create');
    await this.prisma.user.update({
      where: { id: u.id },
      data: {
        department: dto.department,
        position: dto.position,
        bio: dto.bio,
        linkedin: dto.linkedin,
        github: dto.github,
        timezone: dto.timezone ?? 'Asia/Jakarta',
        ...(dto.status ? { status: dto.status } : {}),
        ...(linkedClientId
          ? { clientId: linkedClientId, company: companyForAuth }
          : {}),
      },
    });
    const created = await this.prisma.user.findFirstOrThrow({
      where: { id: u.id },
      select: userSelect,
    });
    if (linkedClientId) {
      await this.syncClientUserToProjects(created.id, linkedClientId);
    }
    return created;
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
    if (dto.status !== undefined && actorRole !== 'admin') {
      delete (dto as { status?: string }).status;
    }
    if (dto.clientId !== undefined && actorRole !== 'admin') {
      delete (dto as { clientId?: string }).clientId;
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true, clientId: true },
    });
    if (!existing) throw new NotFoundException();

    const nextRole =
      actorRole === 'admin' && dto.role !== undefined
        ? dto.role
        : existing.role;

    let resolvedClientId: string | null | undefined = undefined;
    let resolvedCompany: string | null | undefined = undefined;

    if (nextRole === 'client') {
      const cid =
        dto.clientId !== undefined && dto.clientId !== ''
          ? dto.clientId
          : existing.clientId ?? '';
      if (!cid) {
        throw new BadRequestException(
          'Client company is required for users with the client role',
        );
      }
      const cl = await this.prisma.client.findUnique({
        where: { id: cid },
        select: { companyName: true },
      });
      if (!cl) throw new BadRequestException('Client company not found');
      resolvedClientId = cid;
      resolvedCompany = cl.companyName;
    } else if (
      actorRole === 'admin' &&
      dto.role !== undefined &&
      dto.role !== 'client'
    ) {
      resolvedClientId = null;
    }

    const u = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        company:
          resolvedCompany !== undefined
            ? resolvedCompany
            : dto.company !== undefined
              ? dto.company
              : undefined,
        department: dto.department,
        position: dto.position,
        bio: dto.bio,
        linkedin: dto.linkedin,
        github: dto.github,
        timezone: dto.timezone,
        ...(dto.image !== undefined
          ? { image: dto.image && dto.image.length > 0 ? dto.image : null }
          : {}),
        ...(resolvedClientId !== undefined ? { clientId: resolvedClientId } : {}),
        ...(actorRole === 'admin' && dto.role !== undefined
          ? { role: dto.role }
          : {}),
        ...(actorRole === 'admin' && dto.status !== undefined
          ? { status: dto.status }
          : {}),
      },
      select: userSelect,
    });
    if (u.clientId) {
      await this.syncClientUserToProjects(u.id, u.clientId);
    }
    return u;
  }

  async setPassword(
    actorRole: string,
    actorId: string,
    userId: string,
    password: string,
  ) {
    if (actorRole !== 'admin' && actorId !== userId) {
      throw new ForbiddenException();
    }
    const hashed = await hashPassword(password);
    const acc = await this.prisma.account.findFirst({
      where: { userId, providerId: 'credential' },
    });
    if (!acc) throw new NotFoundException('Credential account not found');
    await this.prisma.account.update({
      where: { id: acc.id },
      data: { password: hashed },
    });
    return { ok: true };
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
