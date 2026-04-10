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
exports.NotesController = void 0;
const common_1 = require("@nestjs/common");
const nestjs_better_auth_1 = require("@thallesp/nestjs-better-auth");
const notes_service_1 = require("./notes.service");
let NotesController = class NotesController {
    notes;
    constructor(notes) {
        this.notes = notes;
    }
    list(session) {
        return this.notes.listNotes(session.user.id);
    }
    create(session, body) {
        return this.notes.createNote(session.user.id, body);
    }
    audit(session, id) {
        return this.notes.audit(session.user.id, id);
    }
    get(session, id) {
        return this.notes.getNote(session.user.id, id);
    }
    patch(session, id, body) {
        return this.notes.updateNote(session.user.id, id, body);
    }
    remove(session, id) {
        return this.notes.removeNote(session.user.id, id);
    }
    share(session, id, body) {
        return this.notes.share(session.user.id, id, body.userId, body.permission);
    }
    unshare(session, id, userId) {
        return this.notes.unshare(session.user.id, id, userId);
    }
};
exports.NotesController = NotesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/audit'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "audit", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "patch", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "share", null);
__decorate([
    (0, common_1.Delete)(':id/share/:userId'),
    __param(0, (0, nestjs_better_auth_1.Session)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], NotesController.prototype, "unshare", null);
exports.NotesController = NotesController = __decorate([
    (0, common_1.Controller)('notes'),
    __metadata("design:paramtypes", [notes_service_1.NotesService])
], NotesController);
//# sourceMappingURL=notes.controller.js.map