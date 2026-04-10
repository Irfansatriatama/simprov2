import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { assertProjectAccess } from '../lib/project-access';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  AddProjectMemberDto,
  UpdateProjectMemberDto,
} from './dto/project-member.dto';

const cardSelect = {
  id: true,
  name: true,
  code: true,
  status: true,
  phase: true,
  priority: true,
  clientId: true,
  parentId: true,
  startDate: true,
  endDate: true,
  progress: true,
  coverColor: true,
  tags: true,
  createdAt: true,
} as const;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogService,
  ) {}

  private actor(session: { id: string; name: string }) {
    return { id: session.id, name: session.name };
  }

  async list(userId: string, role: string) {
    const where =
      role === 'admin'
        ? {}
        : {
            members: { some: { userId } },
          };
    return this.prisma.project.findMany({
      where,
      select: {
        ...cardSelect,
        client: { select: { id: true, companyName: true } },
        members: {
          take: 5,
          select: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    session: { id: string; name: string; role: string },
    dto: CreateProjectDto,
  ) {
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const exists = await this.prisma.project.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Project code already exists');
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          status: dto.status ?? 'active',
          phase: dto.phase,
          priority: dto.priority ?? 'medium',
          clientId: dto.clientId,
          parentId: dto.parentId,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
          budget: dto.budget,
          tags: dto.tags ?? [],
          coverColor: dto.coverColor,
          createdById: session.id,
          members: {
            create: {
              userId: session.id,
              projectRole: session.role === 'pm' ? 'PM' : 'DEVELOPER',
            },
          },
        },
        select: cardSelect,
      });
      await this.activityLog.log(tx, {
        projectId: p.id,
        entityType: 'project',
        entityId: p.id,
        entityName: p.name,
        action: 'created',
        actor: this.actor(session),
      });
      return p;
    });
  }

  async getById(userId: string, role: string, id: string) {
    await assertProjectAccess(this.prisma, userId, role, id);
    const p = await this.prisma.project.findUnique({
      where: { id },
      select: {
        ...cardSelect,
        description: true,
        actualEndDate: true,
        budget: true,
        actualCost: true,
        createdById: true,
        client: { select: { id: true, companyName: true, logo: true } },
        parent: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, name: true, image: true } },
      },
    });
    if (!p) throw new NotFoundException();
    return p;
  }

  async update(
    session: { id: string; name: string; role: string },
    id: string,
    dto: UpdateProjectDto,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, id);
    if (session.role === 'viewer' || session.role === 'client') {
      throw new ForbiddenException();
    }
    const prev = await this.prisma.project.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!prev) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code,
          description: dto.description,
          status: dto.status,
          phase: dto.phase,
          priority: dto.priority,
          clientId: dto.clientId,
          parentId: dto.parentId,
          startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate,
          endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate,
          budget: dto.budget,
          tags: dto.tags,
          coverColor: dto.coverColor,
        },
        select: { ...cardSelect, description: true },
      });
      await this.activityLog.log(tx, {
        projectId: id,
        entityType: 'project',
        entityId: id,
        entityName: p.name,
        action: 'updated',
        actor: this.actor(session),
        changes: dto as object,
      });
      return p;
    });
  }

  async remove(session: { id: string; name: string; role: string }, id: string) {
    await assertProjectAccess(this.prisma, session.id, session.role, id);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  async listMembers(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      select: {
        projectRole: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            role: true,
          },
        },
      },
    });
  }

  async addMember(
    session: { id: string; name: string; role: string },
    projectId: string,
    dto: AddProjectMemberDto,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, projectId);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        projectRole: dto.projectRole,
      },
      select: {
        projectRole: true,
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });
  }

  async updateMember(
    session: { id: string; role: string },
    projectId: string,
    userId: string,
    dto: UpdateProjectMemberDto,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, projectId);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { projectRole: dto.projectRole },
      select: {
        projectRole: true,
        user: { select: { id: true, name: true } },
      },
    });
  }

  async removeMember(
    session: { id: string; role: string },
    projectId: string,
    userId: string,
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, projectId);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return { ok: true };
  }
}
