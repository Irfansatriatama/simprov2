import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list() {
    return this.clients.list();
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.clients.create(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.clients.get(id);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.clients.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clients.remove(id);
  }
}
