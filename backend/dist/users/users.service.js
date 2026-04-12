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
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const auth_1 = require("../auth/auth");
const crypto_1 = require("better-auth/crypto");
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
    updatedAt: true,
    bio: true,
    linkedin: true,
    github: true,
    timezone: true,
    lastLogin: true,
    clientId: true,
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
    assertAdminOrPm(role) {
        if (role !== 'admin' && role !== 'pm')
            throw new common_1.ForbiddenException();
    }
    async syncClientUserToProjects(userId, clientId) {
        if (!clientId)
            return;
        const u = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (u?.role !== 'client')
            return;
        const projects = await this.prisma.project.findMany({
            where: { clientId },
            select: { id: true },
        });
        if (projects.length === 0)
            return;
        const existing = new Set((await this.prisma.projectMember.findMany({
            where: { userId },
            select: { projectId: true },
        })).map((r) => r.projectId));
        const rows = projects
            .filter((p) => !existing.has(p.id))
            .map((p) => ({
            projectId: p.id,
            userId,
            projectRole: client_1.ProjectRole.CLIENT,
        }));
        if (rows.length === 0)
            return;
        await this.prisma.projectMember.createMany({
            data: rows,
            skipDuplicates: true,
        });
    }
    async list(actorRole) {
        this.assertAdminOrPm(actorRole);
        return this.prisma.user.findMany({
            select: userSelect,
            orderBy: { name: 'asc' },
        });
    }
    async listByClientId(actorRole, clientId) {
        this.assertAdminOrPm(actorRole);
        const cl = await this.prisma.client.findUnique({
            where: { id: clientId },
            select: { id: true },
        });
        if (!cl)
            throw new common_1.NotFoundException('Client not found');
        return this.prisma.user.findMany({
            where: { clientId },
            select: userSelect,
            orderBy: { name: 'asc' },
        });
    }
    async create(actorRole, dto) {
        this.assertAdmin(actorRole);
        let companyForAuth = dto.company;
        let linkedClientId;
        if (dto.role === 'client') {
            if (!dto.clientId?.trim()) {
                throw new common_1.BadRequestException('Client company is required for users with the client role');
            }
            const cl = await this.prisma.client.findUnique({
                where: { id: dto.clientId },
                select: { companyName: true },
            });
            if (!cl)
                throw new common_1.BadRequestException('Client company not found');
            companyForAuth = cl.companyName;
            linkedClientId = dto.clientId;
        }
        await auth_1.auth.api.signUpEmail({
            body: {
                email: dto.email,
                name: dto.name,
                password: dto.password,
                username: dto.username,
                role: dto.role,
                status: dto.status ?? 'active',
                phoneNumber: dto.phoneNumber,
                company: companyForAuth,
                clientId: linkedClientId,
                department: dto.department,
                position: dto.position,
                bio: dto.bio,
                linkedin: dto.linkedin,
                github: dto.github,
                timezone: dto.timezone ?? 'Asia/Jakarta',
            },
        });
        const u = await this.prisma.user.findFirst({
            where: { username: dto.username },
        });
        if (!u)
            throw new common_1.NotFoundException('User not found after create');
        await this.prisma.user.update({
            where: { id: u.id },
            data: {
                department: dto.department,
                position: dto.position,
                bio: dto.bio,
                linkedin: dto.linkedin,
                github: dto.github,
                timezone: dto.timezone ?? 'Asia/Jakarta',
                ...(dto.status ? { status: dto.status } : {}),
                ...(linkedClientId
                    ? { clientId: linkedClientId, company: companyForAuth }
                    : {}),
            },
        });
        const created = await this.prisma.user.findFirstOrThrow({
            where: { id: u.id },
            select: userSelect,
        });
        if (linkedClientId) {
            await this.syncClientUserToProjects(created.id, linkedClientId);
        }
        return created;
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
        if (dto.status !== undefined && actorRole !== 'admin') {
            delete dto.status;
        }
        if (dto.clientId !== undefined && actorRole !== 'admin') {
            delete dto.clientId;
        }
        const existing = await this.prisma.user.findUnique({
            where: { id },
            select: { role: true, clientId: true },
        });
        if (!existing)
            throw new common_1.NotFoundException();
        const nextRole = actorRole === 'admin' && dto.role !== undefined
            ? dto.role
            : existing.role;
        let resolvedClientId = undefined;
        let resolvedCompany = undefined;
        if (nextRole === 'client') {
            const cid = dto.clientId !== undefined && dto.clientId !== ''
                ? dto.clientId
                : existing.clientId ?? '';
            if (!cid) {
                throw new common_1.BadRequestException('Client company is required for users with the client role');
            }
            const cl = await this.prisma.client.findUnique({
                where: { id: cid },
                select: { companyName: true },
            });
            if (!cl)
                throw new common_1.BadRequestException('Client company not found');
            resolvedClientId = cid;
            resolvedCompany = cl.companyName;
        }
        else if (actorRole === 'admin' &&
            dto.role !== undefined &&
            dto.role !== 'client') {
            resolvedClientId = null;
        }
        const u = await this.prisma.user.update({
            where: { id },
            data: {
                email: dto.email,
                name: dto.name,
                phoneNumber: dto.phoneNumber,
                company: resolvedCompany !== undefined
                    ? resolvedCompany
                    : dto.company !== undefined
                        ? dto.company
                        : undefined,
                department: dto.department,
                position: dto.position,
                bio: dto.bio,
                linkedin: dto.linkedin,
                github: dto.github,
                timezone: dto.timezone,
                ...(dto.image !== undefined
                    ? { image: dto.image && dto.image.length > 0 ? dto.image : null }
                    : {}),
                ...(resolvedClientId !== undefined ? { clientId: resolvedClientId } : {}),
                ...(actorRole === 'admin' && dto.role !== undefined
                    ? { role: dto.role }
                    : {}),
                ...(actorRole === 'admin' && dto.status !== undefined
                    ? { status: dto.status }
                    : {}),
            },
            select: userSelect,
        });
        if (u.clientId) {
            await this.syncClientUserToProjects(u.id, u.clientId);
        }
        return u;
    }
    async setPassword(actorRole, actorId, userId, password) {
        if (actorRole !== 'admin' && actorId !== userId) {
            throw new common_1.ForbiddenException();
        }
        const hashed = await (0, crypto_1.hashPassword)(password);
        const acc = await this.prisma.account.findFirst({
            where: { userId, providerId: 'credential' },
        });
        if (!acc)
            throw new common_1.NotFoundException('Credential account not found');
        await this.prisma.account.update({
            where: { id: acc.id },
            data: { password: hashed },
        });
        return { ok: true };
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