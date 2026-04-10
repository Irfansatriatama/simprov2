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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  AddProjectMemberDto,
  UpdateProjectMemberDto,
} from './dto/project-member.dto';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Session() session: UserSession<typeof auth>) {
    return this.projects.list(session.user.id, session.user.role as string);
  }

  @Post()
  create(
    @Session() session: UserSession<typeof auth>,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(
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
    return this.projects.getById(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Patch(':id')
  patch(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(
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
    return this.projects.remove(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
    );
  }

  @Get(':id/members')
  members(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
  ) {
    return this.projects.listMembers(
      session.user.id,
      session.user.role as string,
      id,
    );
  }

  @Post(':id/members')
  addMember(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
  ) {
    return this.projects.addMember(
      {
        id: session.user.id,
        name: session.user.name,
        role: session.user.role as string,
      },
      id,
      dto,
    );
  }

  @Patch(':id/members/:userId')
  patchMember(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projects.updateMember(
      { id: session.user.id, role: session.user.role as string },
      id,
      userId,
      dto,
    );
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Session() session: UserSession<typeof auth>,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.projects.removeMember(
      { id: session.user.id, role: session.user.role as string },
      id,
      userId,
    );
  }
}
