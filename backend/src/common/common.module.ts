import { Global, Module } from '@nestjs/common';
import { ActivityLogService } from './services/activity-log.service';
import { NotificationService } from './services/notification.service';

@Global()
@Module({
  providers: [ActivityLogService, NotificationService],
  exports: [ActivityLogService, NotificationService],
})
export class CommonModule {}
