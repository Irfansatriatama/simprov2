import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../common/services/activity-log.service';
import { assertProjectAccess } from '../lib/project-access';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  AddProjectMemberDto,
  UpdateProjectMemberDto,
} from './dto/project-member.dto';
import { ProjectMemberAssignmentDto } from './dto/project-member-assignment.dto';

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
  coverImageUrl: true,
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

  /** Maps PATCH body date fields to Prisma: undefined = skip, null = clear, Date = set. */
  private coalescePatchDate(
    v: string | null | undefined,
  ): Date | null | undefined {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const t = String(v).trim();
    if (!t) return null;
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private defaultCreatorProjectRole(sessionRole: string): ProjectRole {
    return sessionRole === 'pm' ? ProjectRole.PM : ProjectRole.DEVELOPER;
  }

  /** Users linked to this client org (role client) join the project as CLIENT without manual invite. */
  private async syncClientOrgUsersToProject(
    tx: Prisma.TransactionClient,
    projectId: string,
    clientId: string | null,
  ) {
    if (!clientId) return;
    const users = await tx.user.findMany({
      where: { clientId, role: 'client' },
      select: { id: true },
    });
    if (users.length === 0) return;
    const existing = new Set(
      (
        await tx.projectMember.findMany({
          where: { projectId },
          select: { userId: true },
        })
      ).map((m) => m.userId),
    );
    const rows = users
      .filter((u) => !existing.has(u.id))
      .map((u) => ({
        projectId,
        userId: u.id,
        projectRole: ProjectRole.CLIENT,
      }));
    if (rows.length === 0) return;
    await tx.projectMember.createMany({ data: rows, skipDuplicates: true });
  }

  private buildMemberCreates(
    session: { id: string; role: string },
    assignments: ProjectMemberAssignmentDto[] | undefined,
  ): { userId: string; projectRole: ProjectRole }[] {
    const roleMap = new Map<string, ProjectRole>();
    for (const m of assignments ?? []) {
      roleMap.set(m.userId, m.projectRole);
    }
    if (!roleMap.has(session.id)) {
      roleMap.set(session.id, this.defaultCreatorProjectRole(session.role));
    }
    return [...roleMap.entries()].map(([userId, projectRole]) => ({
      userId,
      projectRole,
    }));
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
        description: true,
        budget: true,
        client: { select: { id: true, companyName: true, logo: true } },
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
    if (
      session.role === 'viewer' ||
      session.role === 'client' ||
      session.role === 'developer'
    ) {
      throw new ForbiddenException();
    }
    const exists = await this.prisma.project.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Project code already exists');
    return this.prisma.$transaction(async (tx) => {
      const memberCreates = this.buildMemberCreates(session, dto.members);
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
          actualEndDate: dto.actualEndDate
            ? new Date(dto.actualEndDate)
            : undefined,
          budget: dto.budget,
          actualCost: dto.actualCost,
          tags: dto.tags ?? [],
          coverColor: dto.coverColor,
          coverImageUrl: dto.coverImageUrl?.trim() || undefined,
          createdById: session.id,
          members: {
            create: memberCreates,
          },
        },
        select: cardSelect,
      });
      await this.syncClientOrgUsersToProject(tx, p.id, p.clientId ?? null);
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
        members: {
          take: 64,
          select: {
            projectRole: true,
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException();
    const [taskDone, taskTotal, maintenanceOpen] = await Promise.all([
      this.prisma.task.count({
        where: {
          projectId: id,
          OR: [{ status: 'done' }, { status: 'completed' }],
        },
      }),
      this.prisma.task.count({ where: { projectId: id } }),
      this.prisma.maintenance.count({
        where: {
          projectId: id,
          status: { notIn: ['completed', 'canceled'] },
        },
      }),
    ]);
    return { ...p, taskDone, taskTotal, maintenanceOpen };
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
          startDate: this.coalescePatchDate(dto.startDate),
          endDate: this.coalescePatchDate(dto.endDate),
          actualEndDate: this.coalescePatchDate(dto.actualEndDate),
          budget: dto.budget,
          actualCost: dto.actualCost,
          tags: dto.tags,
          coverColor: dto.coverColor,
          coverImageUrl:
            dto.coverImageUrl === undefined
              ? undefined
              : dto.coverImageUrl?.trim() || null,
        },
        select: { ...cardSelect, description: true },
      });
      if (dto.members !== undefined) {
        await tx.projectMember.deleteMany({ where: { projectId: id } });
        const rows = this.buildMemberCreates(session, dto.members);
        await tx.projectMember.createMany({
          data: rows.map((m) => ({
            projectId: id,
            userId: m.userId,
            projectRole: m.projectRole,
          })),
        });
      }
      await this.syncClientOrgUsersToProject(tx, id, p.clientId ?? null);
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
