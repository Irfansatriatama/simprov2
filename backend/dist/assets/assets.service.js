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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssetsService = class AssetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.asset.findMany({
            orderBy: { name: 'asc' },
            include: {
                assignedUser: { select: { id: true, name: true } },
            },
        });
    }
    create(body) {
        return this.prisma.asset.create({
            data: {
                name: body.name,
                category: body.category,
                description: body.description,
                serialNumber: body.serialNumber,
                purchaseDate: body.purchaseDate
                    ? new Date(body.purchaseDate)
                    : undefined,
                purchasePrice: body.purchasePrice,
                vendor: body.vendor,
                assignedTo: body.assignedTo,
                projectId: body.projectId,
                status: body.status ?? 'available',
                warrantyExpiry: body.warrantyExpiry
                    ? new Date(body.warrantyExpiry)
                    : undefined,
                notes: body.notes,
                image: body.image,
            },
        });
    }
    get(id) {
        return this.prisma.asset.findUniqueOrThrow({
            where: { id },
            include: { assignedUser: { select: { id: true, name: true } } },
        });
    }
    update(id, body) {
        const data = { ...body };
        if (body.purchaseDate)
            data.purchaseDate = new Date(body.purchaseDate);
        if (body.warrantyExpiry)
            data.warrantyExpiry = new Date(body.warrantyExpiry);
        return this.prisma.asset.update({
            where: { id },
            data: data,
        });
    }
    async remove(id) {
        await this.prisma.asset.delete({ where: { id } });
        return { ok: true };
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map