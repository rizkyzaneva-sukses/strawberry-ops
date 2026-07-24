import { prisma } from './prisma'

export function logAudit(
  userId: number,
  action: string,
  entity: string,
  entityId: number,
  details?: string
) {
  prisma.auditLog
    .create({
      data: { userId, action, entity, entityId, details: details || null },
    })
    .catch((err) => console.error('Audit log error:', err))
}
