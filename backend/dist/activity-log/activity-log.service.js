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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogReadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const project_access_1 = require("../lib/project-access");
let ActivityLogReadService = class ActivityLogReadService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId, role, q) {
        if (q.projectId) {
            await (0, project_access_1.assertProjectAccess)(this.prisma, userId, role, q.projectId);
            if (role === 'viewer' || role === 'client') {
                throw new common_1.ForbiddenException();
            }
        }
        else if (role !== 'admin' && role !== 'pm') {
            throw new common_1.ForbiddenException('projectId required');
        }
        const p = Math.max(1, parseInt(q.page || '1', 10) || 1);
        const t = Math.min(100, Math.max(1, parseInt(q.take || '50', 10) || 50));
        const where = {};
        if (q.projectId)
            where.projectId = q.projectId;
        if (q.entityType)
            where.entityType = q.entityType;
        if (q.entityId)
            where.entityId = q.entityId;
        const [total, data] = await this.prisma.$transaction([
            this.prisma.activityLog.count({ where }),
            this.prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (p - 1) * t,
                take: t,
            }),
        ]);
        return { data, meta: { total, page: p, take: t } };
    }
};
exports.ActivityLogReadService = ActivityLogReadService;
exports.ActivityLogReadService = ActivityLogReadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityLogReadService);
//# sourceMappingURL=activity-log.service.js.map