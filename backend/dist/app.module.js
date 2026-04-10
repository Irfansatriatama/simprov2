"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const serve_static_1 = require("@nestjs/serve-static");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const path_1 = require("path");
const auth_1 = require("./auth/auth");
const prisma_module_1 = require("./prisma/prisma.module");
const common_module_1 = require("./common/common.module");
const health_module_1 = require("./health/health.module");
const users_module_1 = require("./users/users.module");
const projects_module_1 = require("./projects/projects.module");
const tasks_module_1 = require("./tasks/tasks.module");
const sprints_module_1 = require("./sprints/sprints.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const meetings_module_1 = require("./meetings/meetings.module");
const discussions_module_1 = require("./discussions/discussions.module");
const clients_module_1 = require("./clients/clients.module");
const assets_module_1 = require("./assets/assets.module");
const notifications_module_1 = require("./notifications/notifications.module");
const activity_log_module_1 = require("./activity-log/activity-log.module");
const notes_module_1 = require("./notes/notes.module");
const settings_module_1 = require("./settings/settings.module");
const reports_module_1 = require("./reports/reports.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            nestjs_better_auth_1.AuthModule.forRoot({
                auth: auth_1.auth,
                disableTrustedOriginsCors: true,
                bodyParser: {
                    json: { limit: '2mb' },
                    urlencoded: { limit: '2mb', extended: true },
                },
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: { index: false },
            }),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            health_module_1.HealthModule,
            users_module_1.UsersModule,
            projects_module_1.ProjectsModule,
            tasks_module_1.TasksModule,
            sprints_module_1.SprintsModule,
            maintenance_module_1.MaintenanceModule,
            meetings_module_1.MeetingsModule,
            discussions_module_1.DiscussionsModule,
            clients_module_1.ClientsModule,
            assets_module_1.AssetsModule,
            notifications_module_1.NotificationsModule,
            activity_log_module_1.ActivityLogModule,
            notes_module_1.NotesModule,
            settings_module_1.SettingsModule,
            reports_module_1.ReportsModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map