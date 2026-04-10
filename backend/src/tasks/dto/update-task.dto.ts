import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, ValidateIf, IsString } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

/** `sprintId: null` clears sprint assignment (sprint planning drag back to backlog). */
export class UpdateTaskDto extends PartialType(
  OmitType(CreateTaskDto, ['projectId', 'sprintId'] as const),
) {
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  sprintId?: string | null;
}
