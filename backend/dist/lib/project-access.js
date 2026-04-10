"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertProjectAccess = assertProjectAccess;
exports.projectIdsForUser = projectIdsForUser;
const common_1 = require("@nestjs/common");
async function assertProjectAccess(prisma, userId, role, projectId) {
    if (role === 'admin')
        return;
    const m = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
        select: { projectId: true },
    });
    if (!m) {
        throw new common_1.ForbiddenException('Not a member of this project');
    }
}
function projectIdsForUser(role, userId) {
    if (role === 'admin') {
        return null;
    }
    return userId;
}
//# sourceMappingURL=project-access.js.map