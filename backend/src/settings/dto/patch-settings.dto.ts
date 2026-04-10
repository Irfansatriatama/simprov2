import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

class KeyValueDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

export class PatchSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValueDto)
  entries!: KeyValueDto[];
}
