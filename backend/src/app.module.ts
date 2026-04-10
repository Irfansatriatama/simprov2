import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { join } from 'path';
import { auth } from './auth/auth';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { SprintsModule } from './sprints/sprints.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { MeetingsModule } from './meetings/meetings.module';
import { DiscussionsModule } from './discussions/discussions.module';
import { ClientsModule } from './clients/clients.module';
import { AssetsModule } from './assets/assets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { NotesModule } from './notes/notes.module';
import { SettingsModule } from './settings/settings.module';
import { ReportsModule } from './reports/reports.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRoot({
      auth,
      disableTrustedOriginsCors: true,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    CommonModule,
    HealthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    MaintenanceModule,
    MeetingsModule,
    DiscussionsModule,
    ClientsModule,
    AssetsModule,
    NotificationsModule,
    ActivityLogModule,
    NotesModule,
    SettingsModule,
    ReportsModule,
    UploadModule,
  ],
})
export class AppModule {}
