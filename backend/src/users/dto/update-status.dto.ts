import { IsIn, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['active', 'inactive', 'invited'])
  status!: string;
}
