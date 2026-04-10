import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async listFolders(userId: string) {
    return this.prisma.noteFolder.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(userId: string, name: string, color?: string) {
    return this.prisma.noteFolder.create({
      data: { userId, name, color },
    });
  }

  async updateFolder(userId: string, id: string, body: { name?: string; color?: string }) {
    const f = await this.prisma.noteFolder.findFirst({
      where: { id, userId },
    });
    if (!f) throw new NotFoundException();
    return this.prisma.noteFolder.update({ where: { id }, data: body });
  }

  async removeFolder(userId: string, id: string) {
    const f = await this.prisma.noteFolder.findFirst({
      where: { id, userId },
    });
    if (!f) throw new NotFoundException();
    await this.prisma.note.updateMany({
      where: { ownerId: userId, folderId: id },
      data: { folderId: null },
    });
    await this.prisma.noteFolder.delete({ where: { id } });
    return { ok: true };
  }

  async listNotes(userId: string) {
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

  async createNote(
    userId: string,
    body: { title: string; content?: string; folderId?: string; color?: string; tags?: string[] },
  ) {
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

  async getNote(userId: string, id: string) {
    const n = await this.prisma.note.findUnique({
      where: { id },
      include: {
        shares: true,
        owner: { select: { id: true, name: true } },
      },
    });
    if (!n) throw new NotFoundException();
    const can =
      n.ownerId === userId ||
      n.shares.some((s) => s.userId === userId);
    if (!can) throw new ForbiddenException();
    return n;
  }

  async updateNote(userId: string, id: string, body: Record<string, unknown>) {
    const n = await this.prisma.note.findUnique({
      where: { id },
      include: { shares: true },
    });
    if (!n) throw new NotFoundException();
    const share = n.shares.find((s) => s.userId === userId);
    const canEdit = n.ownerId === userId || share?.permission === 'EDIT';
    if (!canEdit) throw new ForbiddenException();
    const prev = { title: n.title, content: n.content };
    const updated = await this.prisma.note.update({
      where: { id },
      data: {
        title: body.title as string | undefined,
        content: body.content as string | undefined,
        folderId: body.folderId as string | null | undefined,
        pinned: body.pinned as boolean | undefined,
        color: body.color as string | undefined,
        tags: body.tags as string[] | undefined,
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

  async removeNote(userId: string, id: string) {
    const n = await this.prisma.note.findUnique({ where: { id } });
    if (!n || n.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.note.delete({ where: { id } });
    return { ok: true };
  }

  async share(userId: string, noteId: string, targetUserId: string, permission: 'VIEW' | 'EDIT') {
    const n = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!n || n.ownerId !== userId) throw new ForbiddenException();
    return this.prisma.noteShare.upsert({
      where: { noteId_userId: { noteId, userId: targetUserId } },
      create: { noteId, userId: targetUserId, permission },
      update: { permission },
    });
  }

  async unshare(userId: string, noteId: string, targetUserId: string) {
    const n = await this.prisma.note.findUnique({ where: { id: noteId } });
    if (!n || n.ownerId !== userId) throw new ForbiddenException();
    await this.prisma.noteShare.delete({
      where: { noteId_userId: { noteId, userId: targetUserId } },
    });
    return { ok: true };
  }

  async audit(userId: string, noteId: string) {
    await this.getNote(userId, noteId);
    return this.prisma.noteAudit.findMany({
      where: { noteId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
