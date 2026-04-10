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
exports.SprintsController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const sprints_service_1 = require("./sprints.service");
const sprint_dto_1 = require("./dto/sprint.dto");
let SprintsController = class SprintsController {
    sprints;
    constructor(sprints) {
        this.sprints = sprints;
    }
    list(session, projectId) {
        return this.sprints.list(session.user.id, session.user.role, projectId);
    }
    create(session, dto) {
        return this.sprints.create({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, dto);
    }
    get(session, id) {
        return this.sprints.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, dto) {
        return this.sprints.update({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, dto);
    }
    remove(session, id) {
        return this.sprints.remove({ id: session.user.id, role: session.user.role }, id);
    }
    activate(session, id) {
        return this.sprints.activate({ id: session.user.id, name: session.user.name, role: session.user.role }, id);
    }
    complete(session, id, body) {
        return this.sprints.complete({ id: session.user.id, name: session.user.name, role: session.user.role }, id, body);
    }
};
exports.SprintsController = SprintsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sprint_dto_1.CreateSprintDto]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, sprint_dto_1.UpdateSprintDto]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/activate'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, sprint_dto_1.CompleteSprintDto]),
    __metadata("design:returntype", void 0)
], SprintsController.prototype, "complete", null);
exports.SprintsController = SprintsController = __decorate([
    (0, common_1.Controller)('sprints'),
    __metadata("design:paramtypes", [sprints_service_1.SprintsService])
], SprintsController);
//# sourceMappingURL=sprints.controller.js.map