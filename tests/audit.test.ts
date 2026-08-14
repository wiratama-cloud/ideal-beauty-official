import { describe, it, expect } from 'vitest';
import { recordAuditLog, getAuditLogs } from '../src/lib/services/audit';

describe('Audit Log Service', () => {
  it('should create and retrieve audit log entries', async () => {
    const log = await recordAuditLog({
      action: 'TEST_AUDIT_ACTION',
      entity: 'TEST_ENTITY',
      entityId: 'test-123',
      details: { foo: 'bar', timestamp: Date.now() },
    });

    expect(log).not.toBeNull();
    expect(log?.action).toBe('TEST_AUDIT_ACTION');
    expect(log?.entity).toBe('TEST_ENTITY');
    expect(log?.entityId).toBe('test-123');

    const result = await getAuditLogs({
      search: 'TEST_AUDIT_ACTION',
      entity: 'TEST_ENTITY',
    });

    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.logs.some((l: any) => l.id === log?.id)).toBe(true);
  });
});
