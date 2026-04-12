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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const tasks_service_1 = require("./tasks.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const bulk_update_dto_1 = require("./dto/bulk-update.dto");
const comment_dto_1 = require("./dto/comment.dto");
const checklist_dto_1 = require("./dto/checklist.dto");
const log_time_dto_1 = require("./dto/log-time.dto");
const dependency_dto_1 = require("./dto/dependency.dto");
let TasksController = class TasksController {
    tasks;
    constructor(tasks) {
        this.tasks = tasks;
    }
    async exportCsv(session, projectId, res) {
        const csv = await this.tasks.exportCsv(session.user.id, session.user.role, projectId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
        res.send('\uFEFF' + csv);
    }
    bulk(session, body) {
        return this.tasks.bulkUpdate({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, body);
    }
    list(session, projectId, sprintId, status, priority, assigneeId, search, page, take, cursor, sortBy, sortDir, forGantt) {
        return this.tasks.list(session.user.id, session.user.role, {
            projectId,
            sprintId,
            status,
            priority,
            assigneeId,
            search,
            page,
            take,
            cursor,
            sortBy,
            sortDir,
            forGantt,
        });
    }
    create(session, dto) {
        return this.tasks.create({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, dto);
    }
    get(session, id) {
        return this.tasks.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, dto) {
        return this.tasks.update({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, dto);
    }
    remove(session, id) {
        return this.tasks.remove({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id);
    }
    addComment(session, id, dto) {
        return this.tasks.addComment({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, dto);
    }
    getComments(session, id) {
        return this.tasks.listComments(session.user.id, session.user.role, id);
    }
    patchComment(session, id, commentId, dto) {
        return this.tasks.updateComment({ id: session.user.id, role: session.user.role }, id, commentId, dto);
    }
    delComment(session, id, commentId) {
        return this.tasks.removeComment({ id: session.user.id, role: session.user.role }, id, commentId);
    }
    addCheck(session, id, dto) {
        return this.tasks.addChecklist({ id: session.user.id, role: session.user.role }, id, dto);
    }
    patchCheck(session, id, checklistId, dto) {
        return this.tasks.updateChecklist({ id: session.user.id, role: session.user.role }, id, checklistId, dto);
    }
    delCheck(session, id, checklistId) {
        return this.tasks.removeChecklist({ id: session.user.id, role: session.user.role }, id, checklistId);
    }
    logTime(session, id, dto) {
        return this.tasks.logTime({ id: session.user.id, role: session.user.role }, id, dto);
    }
    addAtt(session, id, body) {
        return this.tasks.addAttachment({ id: session.user.id, role: session.user.role }, id, body);
    }
    delAtt(session, id, attachmentId) {
        return this.tasks.removeAttachment({ id: session.user.id, role: session.user.role }, id, attachmentId);
    }
    addDep(session, id, dto) {
        return this.tasks.addDependency({ id: session.user.id, role: session.user.role }, id, dto);
    }
    delDep(session, id, dependencyId) {
        return this.tasks.removeDependency({ id: session.user.id, role: session.user.role }, id, dependencyId);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)('export/csv'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "exportCsv", null);
__decorate([
    (0, common_1.Post)('bulk-update'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bulk_update_dto_1.BulkUpdateDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "bulk", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('sprintId')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('priority')),
    __param(5, (0, common_1.Query)('assigneeId')),
    __param(6, (0, common_1.Query)('search')),
    __param(7, (0, common_1.Query)('page')),
    __param(8, (0, common_1.Query)('take')),
    __param(9, (0, common_1.Query)('cursor')),
    __param(10, (0, common_1.Query)('sortBy')),
    __param(11, (0, common_1.Query)('sortDir')),
    __param(12, (0, common_1.Query)('forGantt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, comment_dto_1.TaskCommentDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "addComment", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getComments", null);
__decorate([
    (0, common_1.Patch)(':id/comments/:commentId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('commentId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, comment_dto_1.TaskCommentDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "patchComment", null);
__decorate([
    (0, common_1.Delete)(':id/comments/:commentId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('commentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "delComment", null);
__decorate([
    (0, common_1.Post)(':id/checklists'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, checklist_dto_1.CreateChecklistDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "addCheck", null);
__decorate([
    (0, common_1.Patch)(':id/checklists/:checklistId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('checklistId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, checklist_dto_1.UpdateChecklistDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "patchCheck", null);
__decorate([
    (0, common_1.Delete)(':id/checklists/:checklistId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('checklistId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "delCheck", null);
__decorate([
    (0, common_1.Post)(':id/log-time'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, log_time_dto_1.LogTimeDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "logTime", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "addAtt", null);
__decorate([
    (0, common_1.Delete)(':id/attachments/:attachmentId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('attachmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "delAtt", null);
__decorate([
    (0, common_1.Post)(':id/dependencies'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dependency_dto_1.CreateDependencyDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "addDep", null);
__decorate([
    (0, common_1.Delete)(':id/dependencies/:dependencyId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('dependencyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "delDep", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map