import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SetPasswordDto } from './dto/set-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Session() session: UserSession<typeof auth>) {
    return this.users.list(session.user.role as string);
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() dto: CreateUserDto,
  ) {
    return this.users.create(session.user.role as string, dto);
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.users.getById(
      session.user.role as string,
      session.user.id,
      id,
    );
  }

  @Patch(':id/status')
  patchStatus(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    return this.users.updateStatus(session.user.role as string, id, body);
  }

  @Patch(':id/password')
  setPassword(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: SetPasswordDto,
  ) {
    return this.users.setPassword(
      session.user.role as string,
      session.user.id,
      id,
      body.password,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(
      session.user.role as string,
      session.user.id,
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.users.remove(session.user.role as string, id);
  }
}
