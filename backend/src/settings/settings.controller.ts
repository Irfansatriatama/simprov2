import { Body, Controller, ForbiddenException, Get, Patch } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { auth } from '../auth/auth';
import { SettingsService } from './settings.service';
import { PatchSettingsDto } from './dto/patch-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@Session() session: UserSession<typeof auth>) {
    const role = session.user.role as string;
    if (role !== 'admin' && role !== 'pm') {
      throw new ForbiddenException();
    }
    return this.settings.getAll();
  }

  @Patch()
  patch(
    @Session() session: UserSession<typeof auth>,
    @Body() body: PatchSettingsDto,
  ) {
    return this.settings.patch(session.user.role as string, body.entries);
  }
}
