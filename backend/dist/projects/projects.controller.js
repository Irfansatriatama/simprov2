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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const projects_service_1 = require("./projects.service");
const create_project_dto_1 = require("./dto/create-project.dto");
const update_project_dto_1 = require("./dto/update-project.dto");
const project_member_dto_1 = require("./dto/project-member.dto");
let ProjectsController = class ProjectsController {
    projects;
    constructor(projects) {
        this.projects = projects;
    }
    list(session) {
        return this.projects.list(session.user.id, session.user.role);
    }
    create(session, dto) {
        return this.projects.create({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, dto);
    }
    get(session, id) {
        return this.projects.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, dto) {
        return this.projects.update({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, dto);
    }
    remove(session, id) {
        return this.projects.remove({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id);
    }
    members(session, id) {
        return this.projects.listMembers(session.user.id, session.user.role, id);
    }
    addMember(session, id, dto) {
        return this.projects.addMember({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, dto);
    }
    patchMember(session, id, userId, dto) {
        return this.projects.updateMember({ id: session.user.id, role: session.user.role }, id, userId, dto);
    }
    removeMember(session, id, userId) {
        return this.projects.removeMember({ id: session.user.id, role: session.user.role }, id, userId);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_project_dto_1.CreateProjectDto]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_project_dto_1.UpdateProjectDto]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "members", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, project_member_dto_1.AddProjectMemberDto]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:userId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, project_member_dto_1.UpdateProjectMemberDto]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "patchMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "removeMember", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, common_1.Controller)('projects'),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map