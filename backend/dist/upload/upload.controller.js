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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const allowedExt = /\.(jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|zip)$/i;
function uploadDir() {
    return process.env.UPLOAD_DIR || (0, path_1.join)(process.cwd(), 'uploads');
}
let UploadController = class UploadController {
    upload(file, category) {
        const cat = category || 'attachments';
        return {
            url: `/uploads/${cat}/${file.filename}`,
            name: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
    remove(body) {
        if (!body.url?.startsWith('/uploads/')) {
            return { ok: false };
        }
        const rel = body.url.replace('/uploads/', '');
        const full = (0, path_1.join)(uploadDir(), rel);
        if ((0, fs_1.existsSync)(full))
            (0, fs_1.unlinkSync)(full);
        return { ok: true };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const cat = req.query['category'] || 'attachments';
                const dest = (0, path_1.join)(uploadDir(), cat);
                if (!(0, fs_1.existsSync)(dest)) {
                    (0, fs_1.mkdirSync)(dest, { recursive: true });
                }
                cb(null, dest);
            },
            filename: (_req, file, cb) => {
                cb(null, `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            const ok = allowedExt.test((0, path_1.extname)(file.originalname).toLowerCase());
            cb(ok ? null : new Error('File type not allowed'), ok);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "upload", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "remove", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload')
], UploadController);
//# sourceMappingURL=upload.controller.js.map