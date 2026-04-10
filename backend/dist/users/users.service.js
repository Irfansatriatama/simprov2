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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth/auth");
const userSelect = {
    id: true,
    name: true,
    email: true,
    username: true,
    role: true,
    status: true,
    image: true,
    phoneNumber: true,
    company: true,
    department: true,
    position: true,
    createdAt: true,
};
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    assertAdmin(role) {
        if (role !== 'admin')
            throw new common_1.ForbiddenException();
    }
    async list(actorRole) {
        this.assertAdmin(actorRole);
        return this.prisma.user.findMany({
            select: userSelect,
            orderBy: { name: 'asc' },
        });
    }
    async create(actorRole, dto) {
        this.assertAdmin(actorRole);
        await auth_1.auth.api.signUpEmail({
            body: {
                email: dto.email,
                name: dto.name,
                password: dto.password,
                username: dto.username,
                role: dto.role,
                status: 'active',
                phoneNumber: dto.phoneNumber,
                company: dto.company,
            },
        });
        const u = await this.prisma.user.findFirst({
            where: { username: dto.username },
            select: userSelect,
        });
        if (!u)
            throw new common_1.NotFoundException('User not found after create');
        return u;
    }
    async getById(actorRole, actorId, id) {
        if (actorRole !== 'admin' && actorId !== id) {
            throw new common_1.ForbiddenException();
        }
        const u = await this.prisma.user.findUnique({
            where: { id },
            select: { ...userSelect, bio: true, linkedin: true, github: true, timezone: true },
        });
        if (!u)
            throw new common_1.NotFoundException();
        return u;
    }
    async update(actorRole, actorId, id, dto) {
        if (actorRole !== 'admin' && actorId !== id) {
            throw new common_1.ForbiddenException();
        }
        if (dto.role && actorRole !== 'admin') {
            delete dto.role;
        }
        const u = await this.prisma.user.update({
            where: { id },
            data: {
                email: dto.email,
                name: dto.name,
                phoneNumber: dto.phoneNumber,
                company: dto.company,
                department: dto.department,
                position: dto.position,
                bio: dto.bio,
                linkedin: dto.linkedin,
                github: dto.github,
                timezone: dto.timezone,
                image: dto.image,
                role: dto.role,
            },
            select: userSelect,
        });
        return u;
    }
    async updateStatus(actorRole, id, body) {
        this.assertAdmin(actorRole);
        return this.prisma.user.update({
            where: { id },
            data: { status: body.status },
            select: userSelect,
        });
    }
    async remove(actorRole, id) {
        this.assertAdmin(actorRole);
        await this.prisma.user.delete({ where: { id } });
        return { ok: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map