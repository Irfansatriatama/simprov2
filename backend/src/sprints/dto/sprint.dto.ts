import { IsDateString, IsEnum, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @IsString()
  projectId!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateSprintDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(SprintStatus)
  status?: SprintStatus;

  @IsOptional()
  @IsString()
  retroNotes?: string;
}

export class CompleteSprintDto {
  @IsIn(['backlog', 'carry'])
  unfinishedTaskAction!: 'backlog' | 'carry';
}
