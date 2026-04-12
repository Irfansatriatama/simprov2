import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { DiscussionsService } from './discussions.service';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussions: DiscussionsService) {}

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
    @Query('expanded') expanded?: string,
  ) {
    const exp =
      expanded === '1' ||
      expanded === 'true' ||
      expanded === 'yes';
    return this.discussions.list(
      session.user.id,
      session.user.role as string,
      projectId,
      exp,
    );
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: { projectId: string; title: string; content: string; type?: string },
  ) {
    return this.discussions.create(
      { id: session.user.id, role: session.user.role as string },
      body,
    );
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.discussions.getById(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; type?: string },
  ) {
    return this.discussions.update(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.discussions.remove(
      { id: session.user.id, role: session.user.role as string },
      id,
    );
  }

  @Post(':id/replies')
  reply(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.discussions.addReply(
      { id: session.user.id, role: session.user.role as string },
      id,
      body.content,
    );
  }

  @Patch(':id/replies/:replyId')
  patchReply(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('replyId') replyId: string,
    @Body() body: { content: string },
  ) {
    return this.discussions.patchReply(
      { id: session.user.id, role: session.user.role as string },
      id,
      replyId,
      body.content,
    );
  }

  @Delete(':id/replies/:replyId')
  delReply(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('replyId') replyId: string,
  ) {
    return this.discussions.removeReply(
      { id: session.user.id, role: session.user.role as string },
      id,
      replyId,
    );
  }

  @Patch(':id/pin')
  pin(@Session() session: UserSession<typeof auth>, @Param('id') id: string) {
    return this.discussions.pin(
      { id: session.user.id, role: session.user.role as string },
      id,
    );
  }

  @Post(':id/attachments')
  addAttachment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body()
    body: { url: string; name: string; mimeType?: string; size?: number },
  ) {
    return this.discussions.addAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      body,
    );
  }

  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.discussions.removeAttachment(
      { id: session.user.id, role: session.user.role as string },
      id,
      attachmentId,
    );
  }
}
