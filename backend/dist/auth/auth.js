"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const prisma_1 = require("better-auth/adapters/prisma");
const api_1 = require("better-auth/api");
const plugins_1 = require("better-auth/plugins");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const LAST_LOGIN_PATHS = new Set([
    '/sign-in/email',
    '/sign-in/username',
    '/sign-up/email',
]);
exports.auth = (0, better_auth_1.betterAuth)({
    baseURL: process.env.BETTER_AUTH_URL || frontendUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [frontendUrl],
    database: (0, prisma_1.prismaAdapter)(prisma, { provider: 'postgresql' }),
    hooks: {
        after: (0, api_1.createAuthMiddleware)(async (ctx) => {
            if (!LAST_LOGIN_PATHS.has(ctx.path)) {
                return;
            }
            const userId = ctx.context.newSession?.user?.id;
            if (!userId) {
                return;
            }
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { lastLogin: new Date() },
                });
            }
            catch (e) {
                ctx.context.logger?.error?.('Failed to update lastLogin', e);
            }
        }),
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    plugins: [
        (0, plugins_1.username)({ minUsernameLength: 3, maxUsernameLength: 50 }),
    ],
    user: {
        additionalFields: {
            role: { type: 'string', defaultValue: 'developer' },
            status: { type: 'string', defaultValue: 'active' },
            phoneNumber: { type: 'string', required: false },
            company: { type: 'string', required: false },
            clientId: { type: 'string', required: false },
            department: { type: 'string', required: false },
            position: { type: 'string', required: false },
            bio: { type: 'string', required: false },
            linkedin: { type: 'string', required: false },
            github: { type: 'string', required: false },
            timezone: { type: 'string', defaultValue: 'Asia/Jakarta' },
            lastLogin: { type: 'date', required: false },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
});
//# sourceMappingURL=auth.js.map