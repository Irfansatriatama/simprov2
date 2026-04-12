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
exports.MeetingsController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const meetings_service_1 = require("./meetings.service");
let MeetingsController = class MeetingsController {
    meetings;
    constructor(meetings) {
        this.meetings = meetings;
    }
    list(session, from, to) {
        return this.meetings.list(session.user.id, session.user.role, from, to);
    }
    create(session, body) {
        return this.meetings.create({ id: session.user.id, name: session.user.name, role: session.user.role }, body);
    }
    addNotulensiAttachment(session, id, body) {
        return this.meetings.addNotulensiAttachment({ id: session.user.id, role: session.user.role }, id, body);
    }
    removeNotulensiAttachment(session, id, attachmentId) {
        return this.meetings.removeNotulensiAttachment({ id: session.user.id, role: session.user.role }, id, attachmentId);
    }
    get(session, id) {
        return this.meetings.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, body) {
        return this.meetings.update({
            id: session.user.id,
            name: session.user.name,
            role: session.user.role,
        }, id, body);
    }
    remove(session, id) {
        return this.meetings.remove({ id: session.user.id, role: session.user.role }, id);
    }
    notulensi(session, id, body) {
        return this.meetings.patchNotulensi({ id: session.user.id, role: session.user.role }, id, body);
    }
    addAgenda(session, id, body) {
        return this.meetings.addAgenda({ id: session.user.id, role: session.user.role }, id, body.text);
    }
    patchAgenda(session, id, itemId, body) {
        return this.meetings.patchAgenda({ id: session.user.id, role: session.user.role }, id, itemId, body);
    }
    deleteAgenda(session, id, itemId) {
        return this.meetings.deleteAgendaItem({ id: session.user.id, role: session.user.role }, id, itemId);
    }
    addAction(session, id, body) {
        return this.meetings.addActionItem({ id: session.user.id, role: session.user.role }, id, body);
    }
    patchAction(session, id, itemId, body) {
        return this.meetings.patchActionItem({ id: session.user.id, role: session.user.role }, id, itemId, body);
    }
    convert(session, id, itemId, body) {
        return this.meetings.convertActionToTask({ id: session.user.id, name: session.user.name, role: session.user.role }, id, itemId, body.projectId);
    }
};
exports.MeetingsController = MeetingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/notulensi/attachments'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "addNotulensiAttachment", null);
__decorate([
    (0, common_1.Delete)(':id/notulensi/attachments/:attachmentId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('attachmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "removeNotulensiAttachment", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/notulensi'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "notulensi", null);
__decorate([
    (0, common_1.Post)(':id/agenda'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "addAgenda", null);
__decorate([
    (0, common_1.Patch)(':id/agenda/:itemId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "patchAgenda", null);
__decorate([
    (0, common_1.Delete)(':id/agenda/:itemId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "deleteAgenda", null);
__decorate([
    (0, common_1.Post)(':id/action-items'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "addAction", null);
__decorate([
    (0, common_1.Patch)(':id/action-items/:itemId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "patchAction", null);
__decorate([
    (0, common_1.Post)(':id/action-items/:itemId/convert-to-task'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "convert", null);
exports.MeetingsController = MeetingsController = __decorate([
    (0, common_1.Controller)('meetings'),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService])
], MeetingsController);
//# sourceMappingURL=meetings.controller.js.map