import { IsNumber, Min } from 'class-validator';

export class LogTimeDto {
  @IsNumber()
  @Min(0)
  hours!: number;
}
