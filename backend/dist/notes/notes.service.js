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
                shares: { include: { user: { select: { id: true, name: true } } } },
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
        const data = {};
        if (body.title !== undefined)
            data.title = body.title;
        if (body.content !== undefined)
            data.content = body.content;
        if (body.folderId !== undefined)
            data.folderId = body.folderId;
        if (body.pinned !== undefined)
            data.pinned = body.pinned;
        if (body.color !== undefined)
            data.color = body.color;
        if (body.tags !== undefined)
            data.tags = body.tags;
        if (Object.keys(data).length === 0) {
            return n;
        }
        const updated = await this.prisma.note.update({
            where: { id },
            data,
        });
        const actor = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, username: true },
        });
        const userName = actor?.name?.trim() ||
            actor?.username?.trim() ||
            actor?.email?.trim() ||
            userId;
        const clip = (s, max = 1500) => s.length <= max ? s : `${s.slice(0, max)}… [${s.length} karakter total]`;
        const changes = [];
        if (data.title !== undefined && n.title !== updated.title) {
            changes.push({
                field: 'title',
                label: 'Judul',
                before: n.title,
                after: updated.title,
            });
        }
        if (data.content !== undefined && n.content !== updated.content) {
            changes.push({
                field: 'content',
                label: 'Isi catatan',
                before: clip(n.content),
                after: clip(updated.content),
            });
        }
        if (data.folderId !== undefined && (n.folderId ?? null) !== (updated.folderId ?? null)) {
            changes.push({
                field: 'folderId',
                label: 'Folder',
                before: n.folderId ?? '(tanpa folder)',
                after: updated.folderId ?? '(tanpa folder)',
            });
        }
        if (data.pinned !== undefined && n.pinned !== updated.pinned) {
            changes.push({
                field: 'pinned',
                label: 'Sematan',
                before: n.pinned ? 'Disematkan' : 'Tidak disematkan',
                after: updated.pinned ? 'Disematkan' : 'Tidak disematkan',
            });
        }
        if (data.color !== undefined && (n.color ?? '') !== (updated.color ?? '')) {
            changes.push({
                field: 'color',
                label: 'Warna kartu',
                before: n.color ?? '(bawaan)',
                after: updated.color ?? '(bawaan)',
            });
        }
        if (data.tags !== undefined) {
            const prevT = JSON.stringify([...(n.tags ?? [])].sort());
            const nextT = JSON.stringify([...(updated.tags ?? [])].sort());
            if (prevT !== nextT) {
                changes.push({
                    field: 'tags',
                    label: 'Tag',
                    before: (n.tags ?? []).join(', ') || '(kosong)',
                    after: (updated.tags ?? []).join(', ') || '(kosong)',
                });
            }
        }
        if (changes.length > 0) {
            const detail = `Mengubah: ${changes.map((c) => c.label).join(', ')}`;
            await this.prisma.noteAudit.create({
                data: {
                    noteId: id,
                    userId,
                    userName,
                    action: 'note_updated',
                    detail,
                    diff: { changes },
                },
            });
        }
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