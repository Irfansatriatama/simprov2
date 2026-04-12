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
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_log_service_1 = require("../common/services/activity-log.service");
const project_access_1 = require("../lib/project-access");
let MeetingsService = class MeetingsService {
    prisma;
    activityLog;
    constructor(prisma, activityLog) {
        this.prisma = prisma;
        this.activityLog = activityLog;
    }
    meetingWhere(userId, role) {
        if (role === 'admin' || role === 'pm')
            return {};
        return {
            OR: [
                { createdById: userId },
                { attendees: { some: { userId } } },
            ],
        };
    }
    async list(userId, role, from, to) {
        const where = this.meetingWhere(userId, role);
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = new Date(from);
            if (to)
                where.date.lte = new Date(to);
        }
        return this.prisma.meeting.findMany({
            where,
            orderBy: { date: 'asc' },
            select: {
                id: true,
                title: true,
                type: true,
                date: true,
                startTime: true,
                endTime: true,
                status: true,
                location: true,
                projects: { select: { project: { select: { id: true, name: true } } } },
                attendees: {
                    take: 8,
                    select: {
                        user: { select: { id: true, name: true, image: true } },
                    },
                },
                agendaItems: { select: { done: true } },
            },
        });
    }
    async create(session, body) {
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.$transaction(async (tx) => {
            const m = await tx.meeting.create({
                data: {
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    date: new Date(body.date),
                    startTime: body.startTime,
                    endTime: body.endTime,
                    location: body.location,
                    status: body.status ?? 'scheduled',
                    createdById: session.id,
                    projects: body.projectIds?.length
                        ? {
                            create: body.projectIds.map((projectId) => ({ projectId })),
                        }
                        : undefined,
                    attendees: body.attendeeIds?.length
                        ? {
                            create: body.attendeeIds.map((userId) => ({ userId })),
                        }
                        : undefined,
                },
            });
            await this.activityLog.log(tx, {
                entityType: 'meeting',
                entityId: m.id,
                entityName: m.title,
                action: 'created',
                actor: { id: session.id, name: session.name },
            });
            return m;
        });
    }
    async getById(userId, role, id) {
        const m = await this.prisma.meeting.findFirst({
            where: { id, ...this.meetingWhere(userId, role) },
            include: {
                projects: { include: { project: true } },
                attendees: { include: { user: { select: { id: true, name: true, image: true } } } },
                agendaItems: { orderBy: { order: 'asc' } },
                actionItems: { orderBy: { id: 'asc' } },
                createdBy: { select: { id: true, name: true } },
                notulensiAttachments: true,
            },
        });
        if (!m)
            throw new common_1.NotFoundException();
        return m;
    }
    async update(session, id, body) {
        await this.getById(session.id, session.role, id);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const projectIds = body.projectIds;
        const attendeeIds = body.attendeeIds;
        return this.prisma.$transaction(async (tx) => {
            if (projectIds !== undefined) {
                await tx.meetingProject.deleteMany({ where: { meetingId: id } });
                if (projectIds.length > 0) {
                    await tx.meetingProject.createMany({
                        data: projectIds.map((projectId) => ({ meetingId: id, projectId })),
                    });
                }
            }
            if (attendeeIds !== undefined) {
                await tx.meetingAttendee.deleteMany({ where: { meetingId: id } });
                if (attendeeIds.length > 0) {
                    await tx.meetingAttendee.createMany({
                        data: attendeeIds.map((userId) => ({ meetingId: id, userId })),
                    });
                }
            }
            return tx.meeting.update({
                where: { id },
                data: {
                    title: body.title,
                    description: body.description,
                    type: body.type,
                    date: body.date ? new Date(body.date) : undefined,
                    startTime: body.startTime,
                    endTime: body.endTime,
                    location: body.location,
                    status: body.status,
                },
            });
        });
    }
    async remove(session, id) {
        await this.getById(session.id, session.role, id);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.meeting.delete({ where: { id } });
        return { ok: true };
    }
    async patchNotulensi(session, id, body) {
        await this.getById(session.id, session.role, id);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.meeting.update({
            where: { id },
            data: {
                notulensiContent: body.content,
                notulensiCreatedBy: session.id,
                notulensiUpdatedAt: new Date(),
            },
        });
    }
    async addNotulensiAttachment(session, meetingId, body) {
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.meetingNotulensiAttachment.create({
            data: {
                meetingId,
                url: body.url,
                name: body.name,
                mimeType: body.mimeType,
                size: body.size,
                uploadedBy: session.id,
            },
        });
    }
    async removeNotulensiAttachment(session, meetingId, attachmentId) {
        const row = await this.prisma.meetingNotulensiAttachment.findFirst({
            where: { id: attachmentId, meetingId },
        });
        if (!row)
            throw new common_1.NotFoundException();
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.meetingNotulensiAttachment.delete({
            where: { id: attachmentId },
        });
        return { ok: true };
    }
    async addAgenda(session, id, text) {
        await this.getById(session.id, session.role, id);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const max = await this.prisma.meetingAgendaItem.aggregate({
            where: { meetingId: id },
            _max: { order: true },
        });
        return this.prisma.meetingAgendaItem.create({
            data: { meetingId: id, text, order: (max._max.order ?? 0) + 1 },
        });
    }
    async patchAgenda(session, meetingId, itemId, body) {
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const item = await this.prisma.meetingAgendaItem.findFirst({
            where: { id: itemId, meetingId },
        });
        if (!item)
            throw new common_1.NotFoundException();
        return this.prisma.meetingAgendaItem.update({
            where: { id: itemId },
            data: body,
        });
    }
    async deleteAgendaItem(session, meetingId, itemId) {
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const item = await this.prisma.meetingAgendaItem.findFirst({
            where: { id: itemId, meetingId },
        });
        if (!item)
            throw new common_1.NotFoundException();
        await this.prisma.meetingAgendaItem.delete({ where: { id: itemId } });
        return { ok: true };
    }
    async addActionItem(session, meetingId, body) {
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.meetingActionItem.create({
            data: {
                meetingId,
                title: body.title,
                assigneeId: body.assigneeId,
                dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            },
        });
    }
    async patchActionItem(session, meetingId, itemId, body) {
        await this.getById(session.id, session.role, meetingId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        const row = await this.prisma.meetingActionItem.findFirst({
            where: { id: itemId, meetingId },
        });
        if (!row)
            throw new common_1.NotFoundException();
        const assigneeRaw = body.assigneeId;
        const assigneeId = assigneeRaw === undefined
            ? undefined
            : assigneeRaw;
        const dueRaw = body.dueDate;
        const dueDate = dueRaw === undefined
            ? undefined
            : dueRaw === null || dueRaw === ''
                ? null
                : new Date(dueRaw);
        return this.prisma.meetingActionItem.update({
            where: { id: itemId },
            data: {
                title: body.title,
                assigneeId,
                dueDate,
                done: body.done,
            },
        });
    }
    async convertActionToTask(session, meetingId, itemId, projectId) {
        await this.getById(session.id, session.role, meetingId);
        const item = await this.prisma.meetingActionItem.findFirst({
            where: { id: itemId, meetingId },
        });
        if (!item)
            throw new common_1.NotFoundException();
        const link = await this.prisma.meetingProject.findFirst({
            where: { meetingId, projectId },
        });
        if (!link)
            throw new common_1.BadRequestException('Project not linked to meeting');
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, projectId);
        if (session.role === 'viewer' || session.role === 'client') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.$transaction(async (tx) => {
            const task = await tx.task.create({
                data: {
                    projectId,
                    title: item.title,
                    reporterId: session.id,
                    status: 'todo',
                },
            });
            await tx.meetingActionItem.update({
                where: { id: itemId },
                data: { taskId: task.id },
            });
            return task;
        });
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_log_service_1.ActivityLogService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map