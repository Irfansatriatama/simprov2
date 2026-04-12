import { ProjectRole } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class ProjectMemberAssignmentDto {
  @IsString()
  userId!: string;

  @IsEnum(ProjectRole)
  projectRole!: ProjectRole;
}
