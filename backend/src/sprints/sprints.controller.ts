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
import { SprintsService } from './sprints.service';
import { CreateSprintDto, UpdateSprintDto, CompleteSprintDto } from './dto/sprint.dto';

@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprints: SprintsService) {}

  @Get()
  list(
    @Session() session: UserSession<typeof auth>,
    @Query('projectId') projectId: string,
  ) {
    return this.sprints.list(
      session.user.id,
      session.user.role as string,
      projectId,
    );
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprints.create(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      dto,
    );
  }

  @Get(':id')
  get(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.sprints.getById(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprints.update(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
      dto,
    );
  }

  @Delete(':id')
  remove(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.sprints.remove(
      { id: session.user.id, role: session.user.role as string },
      id,
    );
  }

  @Post(':id/activate')
  activate(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.sprints.activate(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      id,
    );
  }

  @Post(':id/complete')
  complete(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() body: CompleteSprintDto,
  ) {
    return this.sprints.complete(
      { id: session.user.id, name: session.user.name, role: session.user.role as string },
      id,
      body,
    );
  }
}
