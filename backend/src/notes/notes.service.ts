import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        shares: { include: { user: { select: { id: true, name: true } } } },
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

    const data: Prisma.NoteUpdateInput = {};
    if (body.title !== undefined) data.title = body.title as string;
    if (body.content !== undefined) data.content = body.content as string;
    if (body.folderId !== undefined) data.folderId = body.folderId as string | null;
    if (body.pinned !== undefined) data.pinned = body.pinned as boolean;
    if (body.color !== undefined) data.color = body.color as string | null;
    if (body.tags !== undefined) data.tags = body.tags as string[];

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
    const userName =
      actor?.name?.trim() ||
      actor?.username?.trim() ||
      actor?.email?.trim() ||
      userId;

    const clip = (s: string, max = 1500) =>
      s.length <= max ? s : `${s.slice(0, max)}… [${s.length} karakter total]`;

    type ChangeRow = {
      field: string;
      label: string;
      before: string;
      after: string;
    };
    const changes: ChangeRow[] = [];

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
          diff: { changes } as object,
        },
      });
    }

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
