import { IsOptional, IsString } from 'class-validator';

export class CreateDependencyDto {
  @IsString()
  dependsOnId!: string;

  @IsOptional()
  @IsString()
  type?: string;
}
