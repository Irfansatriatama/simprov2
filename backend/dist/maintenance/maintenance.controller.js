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
exports.MaintenanceController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const maintenance_service_1 = require("./maintenance.service");
let MaintenanceController = class MaintenanceController {
    maintenance;
    constructor(maintenance) {
        this.maintenance = maintenance;
    }
    report(session, projectId, from, to, status, type) {
        return this.maintenance.report(session.user.id, session.user.role, {
            projectId,
            from,
            to,
            status,
            type,
        });
    }
    list(session, projectId, status, severity, assignedTo, page, take) {
        return this.maintenance.list(session.user.id, session.user.role, {
            projectId,
            status,
            severity,
            assignedTo,
            page,
            take,
        });
    }
    create(session, body) {
        return this.maintenance.create({ id: session.user.id, name: session.user.name, role: session.user.role }, body);
    }
    get(session, id) {
        return this.maintenance.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, body) {
        return this.maintenance.update({ id: session.user.id, name: session.user.name, role: session.user.role }, id, body);
    }
    remove(session, id) {
        return this.maintenance.remove({ id: session.user.id, role: session.user.role }, id);
    }
};
exports.MaintenanceController = MaintenanceController;
__decorate([
    (0, common_1.Get)('report'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('from')),
    __param(3, (0, common_1.Query)('to')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "report", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('severity')),
    __param(4, (0, common_1.Query)('assignedTo')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('take')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MaintenanceController.prototype, "remove", null);
exports.MaintenanceController = MaintenanceController = __decorate([
    (0, common_1.Controller)('maintenance'),
    __metadata("design:paramtypes", [maintenance_service_1.MaintenanceService])
], MaintenanceController);
//# sourceMappingURL=maintenance.controller.js.map