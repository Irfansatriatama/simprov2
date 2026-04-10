import { IsBoolean, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateChecklistDto {
  @IsString()
  @MinLength(1)
  text!: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateChecklistDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;
}
