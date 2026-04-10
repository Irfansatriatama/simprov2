import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class BulkUpdateDto {
  @IsArray()
  @IsString({ each: true })
  ids!: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  sprintId?: string | null;

  @IsOptional()
  @IsIn(['delete'])
  action?: 'delete';
}
