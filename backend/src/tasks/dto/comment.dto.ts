import { IsString, MinLength } from 'class-validator';

export class TaskCommentDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
