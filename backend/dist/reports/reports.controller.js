"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    reports;
    constructor(reports) {
        this.reports = reports;
    }
    dashboard(session) {
        return this.reports.dashboard(session.user.id, session.user.role);
    }
    dashboardTaskDistribution(session, projectId) {
        return this.reports.dashboardTaskDistribution(session.user.id, session.user.role, projectId);
    }
    dashboardProgressOverview(session, projectId) {
        return this.reports.dashboardProgressOverview(session.user.id, session.user.role, projectId);
    }
    dashboardUpcomingDeadlines(session, projectId) {
        return this.reports.dashboardUpcomingDeadlines(session.user.id, session.user.role, projectId);
    }
    progress(session, projectId) {
        return this.reports.progress(session.user.id, session.user.role, projectId);
    }
    workload(session, projectId) {
        return this.reports.workload(session.user.id, session.user.role, projectId);
    }
    burndown(session, projectId, sprintId) {
        return this.reports.burndown(session.user.id, session.user.role, projectId, sprintId);
    }
    maint(session, projectId, from, to) {
        return this.reports.maintenanceSummary(session.user.id, session.user.role, projectId, from, to);
    }
    assets(session, projectId) {
        return this.reports.assetsReport(session.user.id, session.user.role, projectId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('dashboard/task-distribution'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "dashboardTaskDistribution", null);
__decorate([
    (0, common_1.Get)('dashboard/progress-overview'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "dashboardProgressOverview", null);
__decorate([
    (0, common_1.Get)('dashboard/upcoming-deadlines'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "dashboardUpcomingDeadlines", null);
__decorate([
    (0, common_1.Get)('progress'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "progress", null);
__decorate([
    (0, common_1.Get)('workload'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "workload", null);
__decorate([
    (0, common_1.Get)('burndown'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('sprintId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "burndown", null);
__decorate([
    (0, common_1.Get)('maintenance-summary'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "maint", null);
__decorate([
    (0, common_1.Get)('assets'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "assets", null);
exports.ReportsController = ReportsController = __decorate([
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map