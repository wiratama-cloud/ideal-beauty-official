import { prisma } from '../prisma';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any> | any;
}

export async function recordAuditLog(data: AuditLogData) {
  try {
    const auditLogModel = (prisma as any).auditLog;
    if (!auditLogModel) {
      console.warn('Prisma AuditLog model is unavailable on client instance.');
      return null;
    }

    const auditLog = await auditLogModel.create({
      data: {
        userId: data.userId || 'admin',
        userEmail: data.userEmail || 'admin@idealbeauty.com',
        userName: data.userName || 'System Admin',
        action: data.action,
        entity: data.entity,
        entityId: data.entityId || 'N/A',
        details: data.details ? JSON.parse(JSON.stringify(data.details)) : {},
      },
    });
    return auditLog;
  } catch (error) {
    console.error('Failed to record audit log:', error);
    return null;
  }
}

export async function getAuditLogs(params?: {
  search?: string;
  entity?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, entity, limit = 100, offset = 0 } = params || {};

  const auditLogModel = (prisma as any).auditLog;
  if (!auditLogModel) {
    console.warn('Prisma AuditLog model is unavailable on client instance.');
    return { logs: [], total: 0 };
  }

  const whereClause: any = {};

  if (entity && entity !== 'ALL') {
    whereClause.entity = entity;
  }

  if (search) {
    whereClause.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entity: { contains: search, mode: 'insensitive' } },
      { entityId: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
      { userEmail: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    auditLogModel.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    auditLogModel.count({ where: whereClause }),
  ]);

  return { logs, total };
}
