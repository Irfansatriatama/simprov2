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
const DONE_STATUSES = ['done', 'completed'];
const CANCEL_STATUSES = ['cancelled', 'canceled'];
function taskDistributionBucket(status) {
    const s = status.toLowerCase();
    if (s === 'done' || s === 'completed')
        return 'done';
    if (s === 'backlog')
        return 'backlog';
    if (s === 'todo')
        return 'todo';
    if (s === 'in_progress')
        return 'in_progress';
    if (s === 'in_review' || s === 'review' || s === 'testing')
        return 'in_review';
    return 'other';
}
function eachDayInclusive(start, end, maxDays = 90) {
    const out = [];
    const cur = new Date(start);
    cur.setUTCHours(0, 0, 0, 0);
    const lim = new Date(end);
    lim.setUTCHours(0, 0, 0, 0);
    while (cur <= lim && out.length < maxDays) {
        out.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
}
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async taskWhereForDashboardScope(userId, role, projectIdParam) {
        const all = !projectIdParam || projectIdParam === 'all';
        if (role === 'admin') {
            if (all)
                return {};
            await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectIdParam);
            return { projectId: projectIdParam };
        }
        const memberRows = await this.prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        });
        const memberIds = memberRows.map((r) => r.projectId);
        if (memberIds.length === 0) {
            return { projectId: '__no_access__' };
        }
        if (all) {
            return { projectId: { in: memberIds } };
        }
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectIdParam);
        return { projectId: projectIdParam };
    }
    async dashboardTaskDistribution(userId, role, projectIdParam) {
        const base = await this.taskWhereForDashboardScope(userId, role, projectIdParam);
        const rows = await this.prisma.task.groupBy({
            by: ['status'],
            where: base,
            _count: { id: true },
        });
        const buckets = {
            backlog: 0,
            todo: 0,
            in_progress: 0,
            in_review: 0,
            done: 0,
            other: 0,
        };
        for (const r of rows) {
            const b = taskDistributionBucket(r.status);
            buckets[b] += r._count.id;
        }
        const order = [
            { key: 'backlog', label: 'Backlog' },
            { key: 'todo', label: 'To Do' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'in_review', label: 'In Review' },
            { key: 'done', label: 'Done' },
        ];
        const list = order.map((o) => ({
            key: o.key,
            label: o.label,
            count: buckets[o.key],
        }));
        if (buckets.other > 0) {
            list.push({ key: 'other', label: 'Other', count: buckets.other });
        }
        const total = list.reduce((s, x) => s + x.count, 0);
        return { buckets: list, total };
    }
    async dashboardProgressOverview(userId, role, projectIdParam) {
        const base = await this.taskWhereForDashboardScope(userId, role, projectIdParam);
        const tasks = await this.prisma.task.findMany({
            where: base,
            select: { status: true, priority: true, dueDate: true },
        });
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let completed = 0;
        let inProgress = 0;
        let overdue = 0;
        const priMap = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };
        for (const t of tasks) {
            const s = t.status.toLowerCase();
            const isDone = s === 'done' || s === 'completed';
            const isCancel = s === 'cancelled' || s === 'canceled';
            if (isDone) {
                completed += 1;
                continue;
            }
            if (isCancel)
                continue;
            inProgress += 1;
            const p = (t.priority || 'medium').toLowerCase();
            if (p in priMap)
                priMap[p] += 1;
            else
                priMap.medium += 1;
            if (t.dueDate) {
                const d = new Date(t.dueDate);
                d.setHours(0, 0, 0, 0);
                if (d < today)
                    overdue += 1;
            }
        }
        const total = tasks.length;
        const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const byPriority = ['critical', 'high', 'medium', 'low'].map((priority) => ({
            priority,
            count: priMap[priority] ?? 0,
        }));
        return {
            total,
            completed,
            inProgress,
            overdue,
            completionPercent,
            byPriority,
        };
    }
    async dashboardUpcomingDeadlines(userId, role, projectIdParam) {
        const base = await this.taskWhereForDashboardScope(userId, role, projectIdParam);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tasks = await this.prisma.task.findMany({
            where: {
                ...base,
                dueDate: { not: null },
                status: { notIn: [...DONE_STATUSES, ...CANCEL_STATUSES] },
            },
            select: {
                id: true,
                title: true,
                dueDate: true,
                project: { select: { id: true, name: true } },
            },
            orderBy: { dueDate: 'asc' },
            take: 20,
        });
        const items = tasks.map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : null;
            let overdueDays = null;
            if (due) {
                due.setHours(0, 0, 0, 0);
                if (due < today) {
                    overdueDays = Math.ceil((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
                }
            }
            return {
                id: t.id,
                title: t.title,
                dueDate: t.dueDate,
                projectId: t.project.id,
                projectName: t.project.name,
                overdueDays,
            };
        });
        return { items };
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
        const sprint = await this.prisma.sprint.findFirst({
            where: { id: sprintId, projectId },
            select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                createdAt: true,
            },
        });
        if (!sprint)
            throw new common_1.NotFoundException();
        const tasks = await this.prisma.task.findMany({
            where: { projectId, sprintId },
            select: {
                id: true,
                status: true,
                storyPoints: true,
                completedAt: true,
                updatedAt: true,
            },
        });
        let start = sprint.startDate
            ? new Date(sprint.startDate)
            : new Date(sprint.createdAt);
        let end = sprint.endDate ? new Date(sprint.endDate) : new Date();
        if (start > end) {
            const t = start;
            start = end;
            end = t;
        }
        const days = eachDayInclusive(start, end);
        const numDays = Math.max(1, days.length);
        const points = (t) => t.storyPoints ?? 1;
        const totalPoints = tasks.reduce((s, t) => s + points(t), 0);
        function remainingOnDay(day) {
            const dayStr = day.toISOString().slice(0, 10);
            return tasks.reduce((sum, t) => {
                if (['done', 'completed'].includes(t.status)) {
                    const when = t.completedAt ?? t.updatedAt;
                    if (when && when.toISOString().slice(0, 10) <= dayStr) {
                        return sum;
                    }
                }
                return sum + points(t);
            }, 0);
        }
        const series = days.map((d, i) => ({
            date: d.toISOString().slice(0, 10),
            ideal: Math.round((totalPoints * (numDays - i - 1)) / numDays),
            remaining: remainingOnDay(d),
        }));
        return {
            sprint: {
                id: sprint.id,
                name: sprint.name,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
            },
            totalPoints,
            series,
        };
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
        const [byStatus, byType] = await this.prisma.$transaction([
            this.prisma.maintenance.groupBy({
                by: ['status'],
                where,
                _count: { id: true },
                orderBy: { status: 'asc' },
            }),
            this.prisma.maintenance.groupBy({
                by: ['type'],
                where,
                _count: { id: true },
                orderBy: { type: 'asc' },
            }),
        ]);
        return { byStatus, byType };
    }
    async assetsReport(userId, role, projectId) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        return this.prisma.asset.findMany({
            where: { OR: [{ projectId }, { projectId: null }] },
            select: {
                id: true,
                name: true,
                category: true,
                status: true,
                serialNumber: true,
                projectId: true,
                purchaseDate: true,
                purchasePrice: true,
                assignedTo: true,
                warrantyExpiry: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async dashboard(userId, role) {
        const projectFilter = role === 'admin'
            ? {}
            : { members: { some: { userId } } };
        const projectIds = role === 'admin'
            ? null
            : (await this.prisma.projectMember.findMany({
                where: { userId },
                select: { projectId: true },
            })).map((r) => r.projectId);
        const openTaskWhere = {
            status: { notIn: ['done', 'completed'] },
            project: projectFilter,
        };
        const [projectCount, clientCount, userCount, taskOpen, myTasks, accessibleProjects, recentProjects, assigneeRows,] = await this.prisma.$transaction([
            this.prisma.project.count({ where: projectFilter }),
            this.prisma.client.count(),
            this.prisma.user.count({ where: { status: 'active' } }),
            this.prisma.task.count({ where: openTaskWhere }),
            this.prisma.task.findMany({
                where: {
                    project: projectFilter,
                    status: { notIn: ['done', 'completed'] },
                    OR: [
                        { reporterId: userId },
                        { assignees: { some: { userId } } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    project: { select: { id: true, name: true } },
                },
                orderBy: { dueDate: 'asc' },
                take: 12,
            }),
            this.prisma.project.findMany({
                where: projectFilter,
                select: { id: true, name: true },
                orderBy: { name: 'asc' },
            }),
            this.prisma.project.findMany({
                where: projectFilter,
                select: {
                    id: true,
                    name: true,
                    status: true,
                    progress: true,
                    coverColor: true,
                },
                orderBy: { updatedAt: 'desc' },
                take: 8,
            }),
            this.prisma.taskAssignee.findMany({
                where: {
                    task: {
                        ...openTaskWhere,
                    },
                },
                select: { userId: true },
            }),
        ]);
        const wlCount = new Map();
        for (const row of assigneeRows) {
            wlCount.set(row.userId, (wlCount.get(row.userId) ?? 0) + 1);
        }
        const teamWorkloadRows = [...wlCount.entries()].map(([userId, n]) => ({
            userId,
            n,
        }));
        const wlIds = teamWorkloadRows.map((r) => r.userId);
        const wlUsers = wlIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: wlIds } },
                select: { id: true, name: true, image: true },
            })
            : [];
        const wlMap = Object.fromEntries(wlUsers.map((u) => [u.id, u]));
        const teamWorkload = teamWorkloadRows
            .map((r) => ({
            userId: r.userId,
            name: wlMap[r.userId]?.name ?? '—',
            image: wlMap[r.userId]?.image ?? null,
            taskCount: r.n,
        }))
            .sort((a, b) => b.taskCount - a.taskCount)
            .slice(0, 12);
        const logSelect = {
            id: true,
            action: true,
            entityName: true,
            actorName: true,
            projectId: true,
            createdAt: true,
        };
        let recent = [];
        if (role === 'admin' || role === 'pm') {
            if (role === 'admin') {
                recent = await this.prisma.activityLog.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                    select: logSelect,
                });
            }
            else if (projectIds && projectIds.length > 0) {
                recent = await this.prisma.activityLog.findMany({
                    where: { projectId: { in: projectIds } },
                    orderBy: { createdAt: 'desc' },
                    take: 12,
                    select: logSelect,
                });
            }
        }
        return {
            stats: {
                projects: projectCount,
                clients: clientCount,
                users: userCount,
                openTasks: taskOpen,
            },
            accessibleProjects,
            recentProjects,
            teamWorkload,
            recentActivity: recent,
            myTasks,
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map