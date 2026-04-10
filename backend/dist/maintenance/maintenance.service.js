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
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_log_service_1 = require("../common/services/activity-log.service");
const project_access_1 = require("../lib/project-access");
const crypto_1 = require("crypto");
let MaintenanceService = class MaintenanceService {
    prisma;
    activityLog;
    constructor(prisma, activityLog) {
        this.prisma = prisma;
        this.activityLog = activityLog;
    }
    ticketNo(code) {
        return `MT-${code}-${(0, crypto_1.randomBytes)(3).toString('hex').toUpperCase()}`;
    }
    async list(userId, role, q) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, q.projectId);
        const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
        const take = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
        const where = { projectId: q.projectId };
        if (q.status)
            where.status = q.status;
        if (q.severity)
            where.severity = q.severity;
        if (q.assignedTo)
            where.assignedTo = q.assignedTo;
        const [total, data] = await this.prisma.$transaction([
            this.prisma.maintenance.count({ where }),
            this.prisma.maintenance.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
                select: {
                    id: true,
                    ticketNumber: true,
                    title: true,
                    type: true,
                    severity: true,
                    status: true,
                    priority: true,
                    dueDate: true,
                    assignedTo: true,
                    picDevs: { select: { user: { select: { id: true, name: true } } } },
                },
            }),
        ]);
        return { data, meta: { total, page, take } };
    }
    async create(session, body) {
        const projectId = body.projectId;
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { code: true },
        });
        if (!project)
            throw new common_1.NotFoundException();
        let ticketNumber = this.ticketNo(project.code);
        for (let i = 0; i < 5; i++) {
            const exists = await this.prisma.maintenance.findUnique({
                where: { ticketNumber },
                select: { id: true },
            });
            if (!exists)
                break;
            ticketNumber = this.ticketNo(project.code);
        }
        const picUserIds = body.picDevIds ?? [];
        return this.prisma.$transaction(async (tx) => {
            const m = await tx.maintenance.create({
                data: {
                    projectId,
                    ticketNumber,
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    severity: body.severity ?? 'medium',
                    priority: body.priority ?? 'medium',
                    status: body.status ?? 'backlog',
                    reportedBy: body.reportedBy,
                    reportedDate: body.reportedDate
                        ? new Date(body.reportedDate)
                        : undefined,
                    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                    assignedTo: body.assignedTo,
                    picDevs: picUserIds.length
                        ? { create: picUserIds.map((userId) => ({ userId })) }
                        : undefined,
                },
            });
            await this.activityLog.log(tx, {
                projectId,
                entityType: 'maintenance',
                entityId: m.id,
                entityName: m.title,
                action: 'created',
                actor: { id: session.id, name: session.name },
            });
            return m;
        });
    }
    async getById(userId, role, id) {
        const m = await this.prisma.maintenance.findUnique({
            where: { id },
            include: {
                picDevs: { include: { user: { select: { id: true, name: true, image: true } } } },
                assignee: { select: { id: true, name: true } },
                attachments: true,
                activityLogs: { orderBy: { at: 'desc' }, take: 50 },
            },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, m.projectId);
        return m;
    }
    async update(session, id, body) {
        const m = await this.prisma.maintenance.findUnique({
            where: { id },
            select: { projectId: true, title: true },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, m.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.maintenance.update({
            where: { id },
            data: {
                title: body.title,
                description: body.description,
                type: body.type,
                severity: body.severity,
                priority: body.priority,
                status: body.status,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                assignedTo: body.assignedTo,
                resolutionNotes: body.resolutionNotes,
                actualHours: body.actualHours,
            },
        });
    }
    async remove(session, id) {
        const m = await this.prisma.maintenance.findUnique({
            where: { id },
            select: { projectId: true },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, m.projectId);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.maintenance.delete({ where: { id } });
        return { ok: true };
    }
    async report(userId, role, q) {
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, q.projectId);
        const where = { projectId: q.projectId };
        if (q.status)
            where.status = q.status;
        if (q.type)
            where.type = q.type;
        if (q.from || q.to) {
            where.createdAt = {};
            if (q.from)
                where.createdAt.gte = new Date(q.from);
            if (q.to)
                where.createdAt.lte = new Date(q.to);
        }
        return this.prisma.maintenance.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_log_service_1.ActivityLogService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map