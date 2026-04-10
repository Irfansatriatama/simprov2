import { IsEnum, IsString } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddProjectMemberDto {
  @IsString()
  userId!: string;

  @IsEnum(ProjectRole)
  projectRole!: ProjectRole;
}

export class UpdateProjectMemberDto {
  @IsEnum(ProjectRole)
  projectRole!: ProjectRole;
}
