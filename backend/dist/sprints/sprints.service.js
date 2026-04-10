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
exports.SprintsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_log_service_1 = require("../common/services/activity-log.service");
const project_access_1 = require("../lib/project-access");
let SprintsService = class SprintsService {
    prisma;
    activityLog;
    constructor(prisma, activityLog) {
        this.prisma = prisma;
        this.activityLog = activityLog;
    }
    async list(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        return this.prisma.sprint.findMany({
            where: { projectId },
            select: {
                id: true,
                name: true,
                goal: true,
                startDate: true,
                endDate: true,
                status: true,
                retroNotes: true,
                createdAt: true,
                _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(session, dto) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, dto.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.$transaction(async (tx) => {
            const s = await tx.sprint.create({
                data: {
                    projectId: dto.projectId,
                    name: dto.name,
                    goal: dto.goal,
                    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                },
            });
            await this.activityLog.log(tx, {
                projectId: dto.projectId,
                entityType: 'sprint',
                entityId: s.id,
                entityName: s.name,
                action: 'created',
                actor: { id: session.id, name: session.name },
            });
            return s;
        });
    }
    async getById(userId, role, id) {
        const s = await this.prisma.sprint.findUnique({
            where: { id },
            select: { id: true, projectId: true, name: true, goal: true, status: true },
        });
        if (!s)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, s.projectId);
        return this.prisma.sprint.findUnique({
            where: { id },
            include: {
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        storyPoints: true,
                    },
                },
            },
        });
    }
    async update(session, id, dto) {
        const s = await this.prisma.sprint.findUnique({
            where: { id },
            select: { projectId: true, name: true },
        });
        if (!s)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, s.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.sprint.update({
            where: { id },
            data: {
                name: dto.name,
                goal: dto.goal,
                startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate,
                endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate,
                status: dto.status,
                retroNotes: dto.retroNotes,
            },
        });
    }
    async remove(session, id) {
        const s = await this.prisma.sprint.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!s)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, s.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.task.updateMany({
                where: { sprintId: id },
                data: { sprintId: null },
            });
            await tx.sprint.delete({ where: { id } });
        });
        return { ok: true };
    }
    async activate(session, id) {
        const s = await this.prisma.sprint.findUnique({
            where: { id },
            select: { projectId: true, name: true },
        });
        if (!s)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, s.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.sprint.updateMany({
                where: { projectId: s.projectId, status: client_1.SprintStatus.ACTIVE },
                data: { status: client_1.SprintStatus.PLANNING },
            });
            const active = await tx.sprint.update({
                where: { id },
                data: { status: client_1.SprintStatus.ACTIVE },
            });
            await this.activityLog.log(tx, {
                projectId: s.projectId,
                entityType: 'sprint',
                entityId: id,
                entityName: s.name,
                action: 'activated',
                actor: { id: session.id, name: session.name },
            });
            return active;
        });
    }
    async complete(session, id, body) {
        const s = await this.prisma.sprint.findUnique({
            where: { id },
            select: { projectId: true, name: true },
        });
        if (!s)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, s.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.$transaction(async (tx) => {
            const unfinished = await tx.task.findMany({
                where: {
                    sprintId: id,
                    status: { notIn: ['done', 'completed'] },
                },
                select: { id: true },
            });
            if (body.unfinishedTaskAction === 'backlog') {
                await tx.task.updateMany({
                    where: { id: { in: unfinished.map((t) => t.id) } },
                    data: { sprintId: null },
                });
            }
            const done = await tx.sprint.update({
                where: { id },
                data: { status: client_1.SprintStatus.COMPLETED },
            });
            await this.activityLog.log(tx, {
                projectId: s.projectId,
                entityType: 'sprint',
                entityId: id,
                entityName: s.name,
                action: 'completed',
                actor: { id: session.id, name: session.name },
                metadata: { unfinishedTaskAction: body.unfinishedTaskAction },
            });
            return done;
        });
    }
};
exports.SprintsService = SprintsService;
exports.SprintsService = SprintsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_log_service_1.ActivityLogService])
], SprintsService);
//# sourceMappingURL=sprints.service.js.map