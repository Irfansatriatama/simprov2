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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const project_access_1 = require("../lib/project-access");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async progress(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        const byStatus = await this.prisma.task.groupBy({
            by: ['status'],
            where: { projectId },
            _count: { id: true },
        });
        return { byStatus };
    }
    async workload(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        const rows = await this.prisma.taskAssignee.groupBy({
            by: ['userId'],
            where: { task: { projectId } },
            _count: { taskId: true },
        });
        const users = await this.prisma.user.findMany({
            where: { id: { in: rows.map((r) => r.userId) } },
            select: { id: true, name: true },
        });
        const umap = Object.fromEntries(users.map((u) => [u.id, u.name]));
        return rows.map((r) => ({
            userId: r.userId,
            name: umap[r.userId],
            tasks: r._count.taskId,
        }));
    }
    async burndown(userId, role, projectId, sprintId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        const tasks = await this.prisma.task.findMany({
            where: { projectId, sprintId },
            select: { id: true, status: true, storyPoints: true, updatedAt: true },
        });
        return { tasks };
    }
    async maintenanceSummary(userId, role, projectId, from, to) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        const where = { projectId };
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        const byStatus = await this.prisma.maintenance.groupBy({
            by: ['status'],
            where,
            _count: { id: true },
        });
        return { byStatus };
    }
    async assetsReport(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        return this.prisma.asset.findMany({
            where: { OR: [{ projectId }, { projectId: null }] },
        });
    }
    async dashboard(userId, role) {
        const projectFilter = role === 'admin'
            ? {}
            : { members: { some: { userId } } };
        const [projectCount, clientCount, userCount, taskOpen, tasksByPriority, recent] = await this.prisma.$transaction([
            this.prisma.project.count({ where: projectFilter }),
            this.prisma.client.count(),
            this.prisma.user.count({ where: { status: 'active' } }),
            this.prisma.task.count({
                where: {
                    status: { notIn: ['done', 'completed'] },
                    project: projectFilter,
                },
            }),
            this.prisma.task.groupBy({
                by: ['priority'],
                where: { project: projectFilter },
                _count: { id: true },
                orderBy: { priority: 'asc' },
            }),
            this.prisma.activityLog.findMany({
                where: role === 'admin'
                    ? {}
                    : { actorId: userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        const projectsByStatus = await this.prisma.project.groupBy({
            by: ['status'],
            where: projectFilter,
            _count: { id: true },
        });
        return {
            stats: {
                projects: projectCount,
                clients: clientCount,
                users: userCount,
                openTasks: taskOpen,
            },
            tasksByPriority,
            projectsByStatus,
            recentActivity: recent,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map