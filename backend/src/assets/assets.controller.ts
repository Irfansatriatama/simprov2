import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { AssetsService } from './assets.service';

function assertPmOrAdmin(role: string) {
  if (role !== 'admin' && role !== 'pm') {
    throw new ForbiddenException();
  }
}

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(@Session() _session: UserSession<typeof auth>) {
    return this.assets.list();
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: Record<string, unknown>,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.assets.create(body);
  }

  @Get(':id')
  get(@Session() _session: UserSession<typeof auth>, @Param('id') id: string) {
    return this.assets.get(id);
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.assets.update(id, body);
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.assets.remove(id);
  }
}
