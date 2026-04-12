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
exports.DiscussionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const project_access_1 = require("../lib/project-access");
function assertDiscussionRole(role) {
    if (!['admin', 'pm', 'developer', 'viewer', 'client'].includes(role)) {
        throw new common_1.ForbiddenException('Discussion is not available for this role.');
    }
}
let DiscussionsService = class DiscussionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, role, projectId, expanded = false) {
        assertDiscussionRole(role);
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, projectId);
        if (expanded) {
            return this.prisma.discussion.findMany({
                where: { projectId },
                orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
                include: {
                    author: { select: { id: true, name: true, image: true } },
                    replies: {
                        orderBy: { createdAt: 'asc' },
                        include: { author: { select: { id: true, name: true, image: true } } },
                    },
                    attachments: true,
                },
            });
        }
        return this.prisma.discussion.findMany({
            where: { projectId },
            orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
            select: {
                id: true,
                title: true,
                type: true,
                pinned: true,
                createdAt: true,
                author: { select: { id: true, name: true, image: true } },
                _count: { select: { replies: true } },
            },
        });
    }
    async create(session, body) {
        assertDiscussionRole(session.role);
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, body.projectId);
        return this.prisma.discussion.create({
            data: {
                projectId: body.projectId,
                title: body.title,
                content: body.content,
                type: body.type ?? 'general',
                authorId: session.id,
            },
        });
    }
    async getById(userId, role, id) {
        assertDiscussionRole(role);
        const d = await this.prisma.discussion.findUnique({
            where: { id },
            include: {
                author: { select: { id: true, name: true, image: true } },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: { author: { select: { id: true, name: true, image: true } } },
                },
                attachments: true,
            },
        });
        if (!d)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, d.projectId);
        return d;
    }
    async update(session, id, body) {
        assertDiscussionRole(session.role);
        const d = await this.prisma.discussion.findUnique({
            where: { id },
            select: { projectId: true, authorId: true },
        });
        if (!d)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, d.projectId);
        if (d.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.discussion.update({ where: { id }, data: body });
    }
    async remove(session, id) {
        assertDiscussionRole(session.role);
        const d = await this.prisma.discussion.findUnique({
            where: { id },
            select: { projectId: true, authorId: true },
        });
        if (!d)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, d.projectId);
        if (d.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.discussion.delete({ where: { id } });
        return { ok: true };
    }
    async addReply(session, id, content) {
        assertDiscussionRole(session.role);
        await this.getById(session.id, session.role, id);
        return this.prisma.discussionReply.create({
            data: { discussionId: id, authorId: session.id, content },
        });
    }
    async patchReply(session, discussionId, replyId, content) {
        assertDiscussionRole(session.role);
        const r = await this.prisma.discussionReply.findUnique({
            where: { id: replyId },
            select: { discussionId: true, authorId: true },
        });
        if (!r || r.discussionId !== discussionId)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, (await this.prisma.discussion.findUnique({
            where: { id: discussionId },
            select: { projectId: true },
        })).projectId);
        if (r.authorId !== session.id && session.role !== 'admin') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.discussionReply.update({
            where: { id: replyId },
            data: { content },
        });
    }
    async removeReply(session, discussionId, replyId) {
        assertDiscussionRole(session.role);
        const d = await this.prisma.discussion.findUnique({
            where: { id: discussionId },
            select: { projectId: true },
        });
        if (!d)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, d.projectId);
        const r = await this.prisma.discussionReply.findUnique({
            where: { id: replyId },
            select: { discussionId: true, authorId: true },
        });
        if (!r || r.discussionId !== discussionId)
            throw new common_1.NotFoundException();
        if (r.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.discussionReply.delete({ where: { id: replyId } });
        return { ok: true };
    }
    async pin(session, id) {
        assertDiscussionRole(session.role);
        const d = await this.prisma.discussion.findUnique({
            where: { id },
            select: { projectId: true, pinned: true },
        });
        if (!d)
            throw new common_1.NotFoundException();
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, d.projectId);
        if (session.role !== 'admin' && session.role !== 'pm') {
            throw new common_1.ForbiddenException();
        }
        return this.prisma.discussion.update({
            where: { id },
            data: { pinned: !d.pinned },
        });
    }
    async addAttachment(session, discussionId, body) {
        assertDiscussionRole(session.role);
        await this.getById(session.id, session.role, discussionId);
        return this.prisma.discussionAttachment.create({
            data: {
                discussionId,
                url: body.url,
                name: body.name,
                mimeType: body.mimeType,
                size: body.size,
            },
        });
    }
    async removeAttachment(session, discussionId, attachmentId) {
        assertDiscussionRole(session.role);
        const att = await this.prisma.discussionAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                discussion: { select: { projectId: true, authorId: true } },
            },
        });
        if (!att || att.discussionId !== discussionId) {
            throw new common_1.NotFoundException();
        }
        await (0, project_access_1.assertProjectAccess)(this.prisma, session.id, session.role, att.discussion.projectId);
        const can = att.discussion.authorId === session.id ||
            session.role === 'admin' ||
            session.role === 'pm';
        if (!can) {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.discussionAttachment.delete({
            where: { id: attachmentId },
        });
        return { ok: true };
    }
};
exports.DiscussionsService = DiscussionsService;
exports.DiscussionsService = DiscussionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiscussionsService);
//# sourceMappingURL=discussions.service.js.map