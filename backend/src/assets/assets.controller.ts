import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list() {
    return this.assets.list();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.assets.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.assets.get(id);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.assets.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assets.remove(id);
  }
}
