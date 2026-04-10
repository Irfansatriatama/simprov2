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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotesService = class NotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listFolders(userId) {
        return this.prisma.noteFolder.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });
    }
    async createFolder(userId, name, color) {
        return this.prisma.noteFolder.create({
            data: { userId, name, color },
        });
    }
    async updateFolder(userId, id, body) {
        const f = await this.prisma.noteFolder.findFirst({
            where: { id, userId },
        });
        if (!f)
            throw new common_1.NotFoundException();
        return this.prisma.noteFolder.update({ where: { id }, data: body });
    }
    async removeFolder(userId, id) {
        const f = await this.prisma.noteFolder.findFirst({
            where: { id, userId },
        });
        if (!f)
            throw new common_1.NotFoundException();
        await this.prisma.note.updateMany({
            where: { ownerId: userId, folderId: id },
            data: { folderId: null },
        });
        await this.prisma.noteFolder.delete({ where: { id } });
        return { ok: true };
    }
    async listNotes(userId) {
        const shared = await this.prisma.noteShare.findMany({
            where: { userId },
            select: { noteId: true },
        });
        const ids = shared.map((s) => s.noteId);
        return this.prisma.note.findMany({
            where: {
                OR: [{ ownerId: userId }, { id: { in: ids } }],
            },
            orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
            include: {
                shares: { include: { user: { select: { id: true, name: true } } } },
            },
        });
    }
    async createNote(userId, body) {
        return this.prisma.note.create({
            data: {
                ownerId: userId,
                title: body.title,
                content: body.content ?? '',
                folderId: body.folderId,
                color: body.color,
                tags: body.tags ?? [],
            },
        });
    }
    async getNote(userId, id) {
        const n = await this.prisma.note.findUnique({
            where: { id },
            include: {
                shares: true,
                owner: { select: { id: true, name: true } },
            },
        });
        if (!n)
            throw new common_1.NotFoundException();
        const can = n.ownerId === userId ||
            n.shares.some((s) => s.userId === userId);
        if (!can)
            throw new common_1.ForbiddenException();
        return n;
    }
    async updateNote(userId, id, body) {
        const n = await this.prisma.note.findUnique({
            where: { id },
            include: { shares: true },
        });
        if (!n)
            throw new common_1.NotFoundException();
        const share = n.shares.find((s) => s.userId === userId);
        const canEdit = n.ownerId === userId || share?.permission === 'EDIT';
        if (!canEdit)
            throw new common_1.ForbiddenException();
        const prev = { title: n.title, content: n.content };
        const updated = await this.prisma.note.update({
            where: { id },
            data: {
                title: body.title,
                content: body.content,
                folderId: body.folderId,
                pinned: body.pinned,
                color: body.color,
                tags: body.tags,
            },
        });
        await this.prisma.noteAudit.create({
            data: {
                noteId: id,
                userId,
                userName: 'user',
                action: 'update',
                diff: { prev, next: { title: updated.title, content: updated.content } },
            },
        });
        return updated;
    }
    async removeNote(userId, id) {
        const n = await this.prisma.note.findUnique({ where: { id } });
        if (!n || n.ownerId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.note.delete({ where: { id } });
        return { ok: true };
    }
    async share(userId, noteId, targetUserId, permission) {
        const n = await this.prisma.note.findUnique({ where: { id: noteId } });
        if (!n || n.ownerId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.noteShare.upsert({
            where: { noteId_userId: { noteId, userId: targetUserId } },
            create: { noteId, userId: targetUserId, permission },
            update: { permission },
        });
    }
    async unshare(userId, noteId, targetUserId) {
        const n = await this.prisma.note.findUnique({ where: { id: noteId } });
        if (!n || n.ownerId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.noteShare.delete({
            where: { noteId_userId: { noteId, userId: targetUserId } },
        });
        return { ok: true };
    }
    async audit(userId, noteId) {
        await this.getNote(userId, noteId);
        return this.prisma.noteAudit.findMany({
            where: { noteId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map