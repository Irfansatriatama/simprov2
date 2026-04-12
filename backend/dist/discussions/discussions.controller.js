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
exports.DiscussionsController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const discussions_service_1 = require("./discussions.service");
let DiscussionsController = class DiscussionsController {
    discussions;
    constructor(discussions) {
        this.discussions = discussions;
    }
    list(session, projectId, expanded) {
        const exp = expanded === '1' ||
            expanded === 'true' ||
            expanded === 'yes';
        return this.discussions.list(session.user.id, session.user.role, projectId, exp);
    }
    create(session, body) {
        return this.discussions.create({ id: session.user.id, role: session.user.role }, body);
    }
    get(session, id) {
        return this.discussions.getById(session.user.id, session.user.role, id);
    }
    patch(session, id, body) {
        return this.discussions.update({ id: session.user.id, role: session.user.role }, id, body);
    }
    remove(session, id) {
        return this.discussions.remove({ id: session.user.id, role: session.user.role }, id);
    }
    reply(session, id, body) {
        return this.discussions.addReply({ id: session.user.id, role: session.user.role }, id, body.content);
    }
    patchReply(session, id, replyId, body) {
        return this.discussions.patchReply({ id: session.user.id, role: session.user.role }, id, replyId, body.content);
    }
    delReply(session, id, replyId) {
        return this.discussions.removeReply({ id: session.user.id, role: session.user.role }, id, replyId);
    }
    pin(session, id) {
        return this.discussions.pin({ id: session.user.id, role: session.user.role }, id);
    }
    addAttachment(session, id, body) {
        return this.discussions.addAttachment({ id: session.user.id, role: session.user.role }, id, body);
    }
    removeAttachment(session, id, attachmentId) {
        return this.discussions.removeAttachment({ id: session.user.id, role: session.user.role }, id, attachmentId);
    }
};
exports.DiscussionsController = DiscussionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('expanded')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "reply", null);
__decorate([
    (0, common_1.Patch)(':id/replies/:replyId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('replyId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "patchReply", null);
__decorate([
    (0, common_1.Delete)(':id/replies/:replyId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('replyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "delReply", null);
__decorate([
    (0, common_1.Patch)(':id/pin'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "pin", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "addAttachment", null);
__decorate([
    (0, common_1.Delete)(':id/attachments/:attachmentId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('attachmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DiscussionsController.prototype, "removeAttachment", null);
exports.DiscussionsController = DiscussionsController = __decorate([
    (0, common_1.Controller)('discussions'),
    __metadata("design:paramtypes", [discussions_service_1.DiscussionsService])
], DiscussionsController);
//# sourceMappingURL=discussions.controller.js.map