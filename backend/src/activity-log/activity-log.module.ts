import { Module } from '@nestjs/common';
import { ActivityLogController } from './activity-log.controller';
import { ActivityLogReadService } from './activity-log.service';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogReadService],
})
export class ActivityLogModule {}
