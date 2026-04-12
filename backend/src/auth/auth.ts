import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware } from 'better-auth/api';
import { username } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

const LAST_LOGIN_PATHS = new Set([
  '/sign-in/email',
  '/sign-in/username',
  '/sign-up/email',
]);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || frontendUrl,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [frontendUrl],
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
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
      } catch (e) {
        ctx.context.logger?.error?.('Failed to update lastLogin', e);
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 50 }),
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

export type Auth = typeof auth;
