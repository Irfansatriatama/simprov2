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
exports.ActivityLogController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const activity_log_service_1 = require("./activity-log.service");
let ActivityLogController = class ActivityLogController {
    log;
    constructor(log) {
        this.log = log;
    }
    list(session, projectId, entityType, page, take) {
        return this.log.list(session.user.id, session.user.role, {
            projectId,
            entityType,
            page,
            take,
        });
    }
};
exports.ActivityLogController = ActivityLogController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('entityType')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ActivityLogController.prototype, "list", null);
exports.ActivityLogController = ActivityLogController = __decorate([
    (0, common_1.Controller)('activity-log'),
    __metadata("design:paramtypes", [activity_log_service_1.ActivityLogReadService])
], ActivityLogController);
//# sourceMappingURL=activity-log.controller.js.map