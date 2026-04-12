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
const listSelectLimited = {
    id: true,
    ticketNumber: true,
    title: true,
    type: true,
    status: true,
    priority: true,
    dueDate: true,
    assignedDate: true,
    assignedTo: true,
    picDevs: { select: { user: { select: { id: true, name: true } } } },
    _count: { select: { attachments: true } },
};
const listSelectFull = {
    ...listSelectLimited,
    severity: true,
    estimatedHours: true,
    actualHours: true,
};
const MAINTENANCE_STATUS_LABELS = {
    backlog: 'Backlog',
    in_progress: 'In Progress',
    awaiting_approval: 'Awaiting Approval',
    on_check: 'On Check',
    need_revision: 'Need Revision',
    completed: 'Completed',
    canceled: 'Canceled',
    on_hold: 'On Hold',
    reported: 'Reported',
    open: 'Open',
    resolved: 'Resolved',
    closed: 'Closed',
    rejected: 'Rejected',
};
function maintenanceStatusLabel(status) {
    return MAINTENANCE_STATUS_LABELS[status] ?? status;
}
let MaintenanceService = class MaintenanceService {
    prisma;
    activityLog;
    constructor(prisma, activityLog) {
        this.prisma = prisma;
        this.activityLog = activityLog;
    }
    isLimitedMaintenanceRole(role) {
        return (role === 'developer' || role === 'viewer' || role === 'client');
    }
    async allocateTicketNumber(tx, projectId) {
        const d = new Date();
        const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
        const prefix = `MNT-${ym}-`;
        const last = await tx.maintenance.findFirst({
            where: { projectId, ticketNumber: { startsWith: prefix } },
            orderBy: { ticketNumber: 'desc' },
            select: { ticketNumber: true },
        });
        let seq = 1;
        if (last?.ticketNumber) {
            const tail = last.ticketNumber.slice(prefix.length);
            const p = parseInt(tail, 10);
            if (!Number.isNaN(p))
                seq = p + 1;
        }
        if (seq > 9999) {
            throw new common_1.ForbiddenException('Ticket sequence overflow for this month');
        }
        return `${prefix}${String(seq).padStart(4, '0')}`;
    }
    redactDetailForRole(role, row) {
        if (!this.isLimitedMaintenanceRole(role))
            return row;
        return {
            ...row,
            severity: null,
            estimatedHours: null,
            actualHours: null,
            costEstimate: null,
            notes: null,
            resolutionNotes: null,
        };
    }
    buildMaintenanceListWhere(userId, role, q) {
        const parts = [{ projectId: q.projectId }];
        if (q.status)
            parts.push({ status: q.status });
        if (q.severity && !this.isLimitedMaintenanceRole(role)) {
            parts.push({ severity: q.severity });
        }
        if (q.assignedTo)
            parts.push({ assignedTo: q.assignedTo });
        if (role === 'developer') {
            parts.push({
                OR: [
                    { assignedTo: userId },
                    { picDevs: { some: { userId } } },
                ],
            });
        }
        return parts.length === 1 ? parts[0] : { AND: parts };
    }
    async assertDeveloperMaintenanceAccess(userId, role, maintenanceId) {
        if (role !== 'developer')
            return;
        const row = await this.prisma.maintenance.findFirst({
            where: {
                id: maintenanceId,
                OR: [
                    { assignedTo: userId },
                    { picDevs: { some: { userId } } },
                ],
            },
            select: { id: true },
        });
        if (!row)
            throw new common_1.ForbiddenException();
    }
    async list(userId, role, q) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, q.projectId);
        const page = Math.max(1, parseInt(q.page || '1', 10) || 1);
        const take = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
        const where = this.buildMaintenanceListWhere(userId, role, q);
        const select = this.isLimitedMaintenanceRole(role)
            ? listSelectLimited
            : listSelectFull;
        const [total, data] = await this.prisma.$transaction([
            this.prisma.maintenance.count({ where }),
            this.prisma.maintenance.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * take,
                take,
                select,
            }),
        ]);
        const shaped = data.map((row) => {
            if (this.isLimitedMaintenanceRole(role)) {
                return { ...row, severity: null };
            }
            return row;
        });
        return { data: shaped, meta: { total, page, take } };
    }
    async create(session, body) {
        if (session.role === 'viewer' ||
            session.role === 'client' ||
            session.role === 'developer') {
            throw new common_1.ForbiddenException();
        }
        const projectId = body.projectId;
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });
        if (!project)
            throw new common_1.NotFoundException();
        const picUserIds = body.picDevIds ?? [];
        return this.prisma.$transaction(async (tx) => {
            const ticketNumber = await this.allocateTicketNumber(tx, projectId);
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
                    assignedDate: body.assignedDate
                        ? new Date(body.assignedDate)
                        : undefined,
                    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                    assignedTo: body.assignedTo,
                    orderedBy: body.orderedBy,
                    picClient: body.picClient,
                    estimatedHours: body.estimatedHours,
                    costEstimate: body.costEstimate,
                    notes: body.notes,
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
                picDevs: {
                    include: { user: { select: { id: true, name: true, image: true } } },
                },
                assignee: { select: { id: true, name: true } },
                attachments: true,
                activityLogs: { orderBy: { at: 'desc' }, take: 50 },
            },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, m.projectId);
        await this.assertDeveloperMaintenanceAccess(userId, role, id);
        return this.redactDetailForRole(role, m);
    }
    async update(session, id, body) {
        const m = await this.prisma.maintenance.findUnique({
            where: { id },
            select: { projectId: true, title: true, status: true },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, m.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        await this.assertDeveloperMaintenanceAccess(session.id, session.role, id);
        const prevStatus = m.status;
        const canFinancial = session.role === 'admin' || session.role === 'pm';
        return this.prisma.$transaction(async (tx) => {
            if (Array.isArray(body.picDevIds)) {
                const ids = body.picDevIds;
                await tx.maintenancePicDev.deleteMany({ where: { maintenanceId: id } });
                if (ids.length) {
                    await tx.maintenancePicDev.createMany({
                        data: ids.map((userId) => ({ maintenanceId: id, userId })),
                    });
                }
            }
            const data = {
                title: body.title,
                description: body.description,
                type: body.type,
                severity: body.severity,
                priority: body.priority,
                status: body.status,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
                resolutionNotes: body.resolutionNotes,
                actualHours: body.actualHours,
                reportedBy: body.reportedBy,
                orderedBy: body.orderedBy,
                picClient: body.picClient,
                notes: body.notes,
            };
            if (body.assignedTo !== undefined) {
                const aid = body.assignedTo;
                data.assignee =
                    aid && aid !== ''
                        ? { connect: { id: aid } }
                        : { disconnect: true };
            }
            if (body.reportedDate) {
                data.reportedDate = new Date(body.reportedDate);
            }
            if (body.assignedDate !== undefined) {
                const ad = body.assignedDate;
                data.assignedDate =
                    ad && ad !== '' ? new Date(ad) : null;
            }
            if (canFinancial) {
                if (body.estimatedHours !== undefined) {
                    data.estimatedHours = body.estimatedHours;
                }
                if (body.costEstimate !== undefined) {
                    const c = body.costEstimate;
                    data.costEstimate =
                        c === null || c === ''
                            ? null
                            : (typeof c === 'number' ? c : parseFloat(String(c)));
                }
            }
            const updated = await tx.maintenance.update({
                where: { id },
                data,
                include: {
                    picDevs: {
                        include: {
                            user: { select: { id: true, name: true, image: true } },
                        },
                    },
                    assignee: { select: { id: true, name: true } },
                    attachments: true,
                },
            });
            const newStatus = body.status;
            if (newStatus &&
                newStatus !== prevStatus) {
                await tx.maintenanceActivityLog.create({
                    data: {
                        maintenanceId: id,
                        text: `Status changed from ${maintenanceStatusLabel(prevStatus)} to ${maintenanceStatusLabel(newStatus)}`,
                    },
                });
            }
            await this.activityLog.log(tx, {
                projectId: m.projectId,
                entityType: 'maintenance',
                entityId: id,
                entityName: updated.title,
                action: 'updated',
                actor: { id: session.id, name: session.name },
            });
            return this.redactDetailForRole(session.role, updated);
        });
    }
    async addAttachment(session, maintenanceId, body) {
        const m = await this.prisma.maintenance.findUnique({
            where: { id: maintenanceId },
            select: { projectId: true },
        });
        if (!m)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, m.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        await this.assertDeveloperMaintenanceAccess(session.id, session.role, maintenanceId);
        return this.prisma.maintenanceAttachment.create({
            data: {
                maintenanceId,
                url: body.url,
                name: body.name,
                mimeType: body.mimeType,
                size: body.size,
                uploadedBy: session.id,
            },
        });
    }
    async removeAttachment(session, maintenanceId, attachmentId) {
        const a = await this.prisma.maintenanceAttachment.findFirst({
            where: { id: attachmentId, maintenanceId },
            include: { maintenance: { select: { projectId: true } } },
        });
        if (!a)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, a.maintenance.projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        await this.assertDeveloperMaintenanceAccess(session.id, session.role, maintenanceId);
        await this.prisma.maintenanceAttachment.delete({ where: { id: attachmentId } });
        return { ok: true };
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
        let projectIds = [q.projectId];
        if (q.includeSubProjects === '1' || q.includeSubProjects === 'true') {
            const children = await this.prisma.project.findMany({
                where: { parentId: q.projectId },
                select: { id: true },
            });
            projectIds = [...projectIds, ...children.map((c) => c.id)];
        }
        const from = q.from ? new Date(`${q.from}T00:00:00.000Z`) : null;
        const to = q.to ? new Date(`${q.to}T23:59:59.999Z`) : null;
        const statusList = (q.statuses ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const search = q.search?.trim().toLowerCase() ?? '';
        const tickets = await this.prisma.maintenance.findMany({
            where: { projectId: { in: projectIds } },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                ticketNumber: true,
                title: true,
                status: true,
                type: true,
                severity: true,
                priority: true,
                assignedDate: true,
                dueDate: true,
                picClient: true,
                description: true,
                resolutionNotes: true,
                notes: true,
                projectId: true,
                project: { select: { name: true } },
            },
        });
        const filtered = tickets.filter((t) => {
            if (search) {
                const idM = t.id.toLowerCase().includes(search) ||
                    t.ticketNumber.toLowerCase().includes(search);
                const titleM = (t.title ?? '').toLowerCase().includes(search);
                if (!idM && !titleM)
                    return false;
            }
            if (t.assignedDate) {
                const d = t.assignedDate;
                if (from && d < from)
                    return false;
                if (to && d > to)
                    return false;
            }
            if (statusList.length > 0 && !statusList.includes(t.status)) {
                return false;
            }
            return true;
        });
        const picIds = [
            ...new Set(filtered.map((t) => t.picClient).filter((v) => Boolean(v))),
        ];
        const users = picIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: picIds } },
                select: { id: true, name: true },
            })
            : [];
        const userMap = new Map(users.map((u) => [u.id, u.name]));
        const PRIORITY_LABELS = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            critical: 'Critical',
        };
        const TYPE_LABELS = {
            bug: 'Bug',
            adjustment: 'Adjustment',
            enhancement: 'Enhancement',
            user_request: 'User Request',
            incident: 'Incident',
        };
        const SEV_LABELS = {
            major: 'Major',
            minor: 'Minor',
        };
        const rows = filtered.map((t) => {
            const picPemohon = t.picClient
                ? (userMap.get(t.picClient) ?? t.picClient)
                : '';
            const parts = [t.description, t.resolutionNotes, t.notes].filter((x) => Boolean(x && String(x).trim()));
            const detailPenjelasan = parts.join('\n---\n');
            return {
                id: t.id,
                ticketNumber: t.ticketNumber,
                title: t.title,
                projectId: t.projectId,
                projectName: t.project.name,
                picPemohon: picPemohon || '—',
                status: t.status,
                statusLabel: maintenanceStatusLabel(t.status),
                assignedDate: t.assignedDate,
                dueDate: t.dueDate,
                priority: t.priority,
                priorityLabel: PRIORITY_LABELS[t.priority] ?? t.priority,
                severity: t.severity,
                severityLabel: t.severity
                    ? (SEV_LABELS[t.severity] ?? t.severity)
                    : '',
                type: t.type,
                typeLabel: TYPE_LABELS[t.type] ?? t.type,
                detailPenjelasan,
            };
        });
        const filterDesc = statusList.length > 0
            ? `Status: ${statusList.map((s) => maintenanceStatusLabel(s)).join(', ')}`
            : 'All Statuses';
        const project = await this.prisma.project.findUnique({
            where: { id: q.projectId },
            select: { name: true },
        });
        return {
            rows,
            meta: {
                total: rows.length,
                dateFrom: q.from ?? '',
                dateTo: q.to ?? '',
                filterDesc,
                projectName: project?.name ?? '',
            },
        };
    }
    async exportCsv(userId, role, q) {
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, q.projectId);
        if (role !== 'admin' && role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        const limited = this.isLimitedMaintenanceRole(role);
        const where = { projectId: q.projectId };
        if (q.status)
            where.status = q.status;
        if (q.priority)
            where.priority = q.priority;
        if (q.type)
            where.type = q.type;
        if (q.severity && !limited)
            where.severity = q.severity;
        if (q.assignedTo)
            where.assignedTo = q.assignedTo;
        if (q.picDevUserId) {
            where.picDevs = { some: { userId: q.picDevUserId } };
        }
        const search = q.search?.trim();
        if (search) {
            where.AND = [
                {
                    OR: [
                        { title: { contains: search, mode: 'insensitive' } },
                        { ticketNumber: { contains: search, mode: 'insensitive' } },
                    ],
                },
            ];
        }
        const rows = await this.prisma.maintenance.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 10000,
            include: {
                assignee: { select: { name: true } },
                picDevs: { select: { user: { select: { name: true } } } },
            },
        });
        const esc = (v) => {
            const t = v == null ? '' : String(v);
            if (/[",\n\r]/.test(t))
                return `"${t.replace(/"/g, '""')}"`;
            return t;
        };
        const iso = (d) => (d ? d.toISOString() : '');
        const picNames = (r) => r.picDevs.map((p) => p.user.name).join('; ');
        let header;
        let lines;
        if (limited) {
            header = [
                'Ticket',
                'Title',
                'Type',
                'Status',
                'Priority',
                'Due',
                'Assignee',
                'PIC devs',
                'Created',
            ].join(',');
            lines = rows.map((r) => [
                r.ticketNumber,
                r.title,
                r.type,
                r.status,
                r.priority,
                iso(r.dueDate),
                r.assignee?.name ?? '',
                picNames(r),
                iso(r.createdAt),
            ]
                .map(esc)
                .join(','));
        }
        else {
            header = [
                'Ticket',
                'Title',
                'Type',
                'Severity',
                'Priority',
                'Status',
                'Due',
                'Assignee',
                'PIC devs',
                'Reported by',
                'Reported date',
                'Estimated hours',
                'Actual hours',
                'Cost estimate',
                'Description',
                'Notes',
                'Resolution notes',
                'Created',
                'Updated',
            ].join(',');
            lines = rows.map((r) => [
                r.ticketNumber,
                r.title,
                r.type,
                r.severity,
                r.priority,
                r.status,
                iso(r.dueDate),
                r.assignee?.name ?? '',
                picNames(r),
                r.reportedBy ?? '',
                iso(r.reportedDate),
                r.estimatedHours ?? '',
                r.actualHours ?? '',
                r.costEstimate != null ? String(r.costEstimate) : '',
                r.description ?? '',
                r.notes ?? '',
                r.resolutionNotes ?? '',
                iso(r.createdAt),
                iso(r.updatedAt),
            ]
                .map(esc)
                .join(','));
        }
        const csv = '\uFEFF' + [header, ...lines].join('\r\n');
        const filename = `maintenance-${q.projectId.slice(0, 8)}.csv`;
        return { csv, filename };
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_log_service_1.ActivityLogService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map