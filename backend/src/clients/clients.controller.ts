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
import { UsersService } from '../users/users.service';
import { ClientsService } from './clients.service';

function assertPmOrAdmin(role: string) {
  if (role !== 'admin' && role !== 'pm') {
    throw new ForbiddenException();
  }
}

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clients: ClientsService,
    private readonly users: UsersService,
  ) {}

  @Get()
  list(@Session() _session: UserSession<typeof auth>) {
    return this.clients.list();
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() body: Record<string, unknown>,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.clients.create(body);
  }

  @Get(':id/portal-users')
  listPortalUsers(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.users.listByClientId(session.user.role as string, id);
  }

  @Get(':id')
  get(@Session() _session: UserSession<typeof auth>, @Param('id') id: string) {
    return this.clients.get(id);
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.clients.update(id, body);
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    assertPmOrAdmin(session.user.role as string);
    return this.clients.remove(id);
  }
}
