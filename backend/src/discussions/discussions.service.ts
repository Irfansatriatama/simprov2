import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { assertProjectAccess } from '../lib/project-access';

@Injectable()
export class DiscussionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, role: string, projectId: string) {
    await assertProjectAccess(this.prisma, userId, role, projectId);
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

  async create(
    session: { id: string; role: string },
    body: { projectId: string; title: string; content: string; type?: string },
  ) {
    await assertProjectAccess(this.prisma, session.id, session.role, body.projectId);
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

  async getById(userId: string, role: string, id: string) {
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
    if (!d) throw new NotFoundException();
    await assertProjectAccess(this.prisma, userId, role, d.projectId);
    return d;
  }

  async update(
    session: { id: string; role: string },
    id: string,
    body: { title?: string; content?: string; type?: string },
  ) {
    const d = await this.prisma.discussion.findUnique({
      where: { id },
      select: { projectId: true, authorId: true },
    });
    if (!d) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, d.projectId);
    if (d.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.prisma.discussion.update({ where: { id }, data: body });
  }

  async remove(session: { id: string; role: string }, id: string) {
    const d = await this.prisma.discussion.findUnique({
      where: { id },
      select: { projectId: true, authorId: true },
    });
    if (!d) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, d.projectId);
    if (d.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.discussion.delete({ where: { id } });
    return { ok: true };
  }

  async addReply(session: { id: string; role: string }, id: string, content: string) {
    await this.getById(session.id, session.role, id);
    return this.prisma.discussionReply.create({
      data: { discussionId: id, authorId: session.id, content },
    });
  }

  async patchReply(
    session: { id: string; role: string },
    discussionId: string,
    replyId: string,
    content: string,
  ) {
    const r = await this.prisma.discussionReply.findUnique({
      where: { id: replyId },
      select: { discussionId: true, authorId: true },
    });
    if (!r || r.discussionId !== discussionId) throw new NotFoundException();
    await assertProjectAccess(
      this.prisma,
      session.id,
      session.role,
      (await this.prisma.discussion.findUnique({
        where: { id: discussionId },
        select: { projectId: true },
      }))!.projectId,
    );
    if (r.authorId !== session.id && session.role !== 'admin') {
      throw new ForbiddenException();
    }
    return this.prisma.discussionReply.update({
      where: { id: replyId },
      data: { content },
    });
  }

  async removeReply(
    session: { id: string; role: string },
    discussionId: string,
    replyId: string,
  ) {
    const d = await this.prisma.discussion.findUnique({
      where: { id: discussionId },
      select: { projectId: true },
    });
    if (!d) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, d.projectId);
    const r = await this.prisma.discussionReply.findUnique({
      where: { id: replyId },
      select: { discussionId: true, authorId: true },
    });
    if (!r || r.discussionId !== discussionId) throw new NotFoundException();
    if (r.authorId !== session.id && session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    await this.prisma.discussionReply.delete({ where: { id: replyId } });
    return { ok: true };
  }

  async pin(session: { id: string; role: string }, id: string) {
    const d = await this.prisma.discussion.findUnique({
      where: { id },
      select: { projectId: true, pinned: true },
    });
    if (!d) throw new NotFoundException();
    await assertProjectAccess(this.prisma, session.id, session.role, d.projectId);
    if (session.role !== 'admin' && session.role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.prisma.discussion.update({
      where: { id },
      data: { pinned: !d.pinned },
    });
  }
}
