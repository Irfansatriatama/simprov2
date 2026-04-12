"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_log_service_1 = require("../common/services/activity-log.service");
const project_access_1 = require("../lib/project-access");
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
};
let ProjectsService = class ProjectsService {
    prisma;
    activityLog;
    constructor(prisma, activityLog) {
        this.prisma = prisma;
        this.activityLog = activityLog;
    }
    actor(session) {
        return { id: session.id, name: session.name };
    }
    coalescePatchDate(v) {
        if (v === undefined)
            return undefined;
        if (v === null)
            return null;
        const t = String(v).trim();
        if (!t)
            return null;
        const d = new Date(t);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    defaultCreatorProjectRole(sessionRole) {
        return sessionRole === 'pm' ? client_1.ProjectRole.PM : client_1.ProjectRole.DEVELOPER;
    }
    async syncClientOrgUsersToProject(tx, projectId, clientId) {
        if (!clientId)
            return;
        const users = await tx.user.findMany({
            where: { clientId, role: 'client' },
            select: { id: true },
        });
        if (users.length === 0)
            return;
        const existing = new Set((await tx.projectMember.findMany({
            where: { projectId },
            select: { userId: true },
        })).map((m) => m.userId));
        const rows = users
            .filter((u) => !existing.has(u.id))
            .map((u) => ({
            projectId,
            userId: u.id,
            projectRole: client_1.ProjectRole.CLIENT,
        }));
        if (rows.length === 0)
            return;
        await tx.projectMember.createMany({ data: rows, skipDuplicates: true });
    }
    buildMemberCreates(session, assignments) {
        const roleMap = new Map();
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
    async list(userId, role) {
        const where = role === 'admin'
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
    async create(session, dto) {
        if (session.role === 'viewer' ||
            session.role === 'client' ||
            session.role === 'developer') {
            throw new common_1.ForbiddenException();
        }
        const exists = await this.prisma.project.findUnique({
            where: { code: dto.code },
            select: { id: true },
        });
        if (exists)
            throw new common_1.ConflictException('Project code already exists');
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
    async getById(userId, role, id) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, id);
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
        if (!p)
            throw new common_1.NotFoundException();
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
    async update(session, id, dto) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, id);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const prev = await this.prisma.project.findUnique({
            where: { id },
            select: { name: true },
        });
        if (!prev)
            throw new common_1.NotFoundException();
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
                    coverImageUrl: dto.coverImageUrl === undefined
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
                changes: dto,
            });
            return p;
        });
    }
    async remove(session, id) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, id);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.project.delete({ where: { id } });
        return { ok: true };
    }
    async listMembers(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
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
    async addMember(session, projectId, dto) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
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
    async updateMember(session, projectId, userId, dto) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
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
    async removeMember(session, projectId, userId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.projectMember.delete({
            where: { projectId_userId: { projectId, userId } },
        });
        return { ok: true };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_log_service_1.ActivityLogService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map