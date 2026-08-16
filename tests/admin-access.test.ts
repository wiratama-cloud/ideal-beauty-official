import { describe, it, expect, beforeEach } from 'vitest';
import {
  getPrimaryAdminEmail,
  isPrimaryAdminEmail,
  isEmailAdmin,
  getAdminAccessList,
  addAdminAccess,
  removeAdminAccess,
  requireAdminAccess,
} from '../src/lib/services/access';
import {
  getAdminAccessListAction,
  addAdminAccessAction,
  removeAdminAccessAction,
} from '../src/app/actions/admin';
import { prisma } from '../src/lib/prisma';

describe('Admin Access Control & Authorization Services', () => {
  const primaryEmail = getPrimaryAdminEmail();

  beforeEach(async () => {
    // Ensure clean test environment for non-primary entries
    await prisma.adminAccess.deleteMany({
      where: {
        email: { not: primaryEmail },
      },
    });
  });

  describe('Service Functions', () => {
    it('should identify primary admin email accurately', () => {
      expect(getPrimaryAdminEmail()).toBeTruthy();
      expect(isPrimaryAdminEmail(primaryEmail)).toBe(true);
      expect(isPrimaryAdminEmail('regular.user@example.com')).toBe(false);
    });

    it('should verify admin access status via isEmailAdmin', async () => {
      const isPrimaryAdmin = await isEmailAdmin(primaryEmail);
      expect(isPrimaryAdmin).toBe(true);

      const isNonAdmin = await isEmailAdmin('random.stranger@example.com');
      expect(isNonAdmin).toBe(false);

      // Add new admin
      await addAdminAccess('team.member@idealbeautyofficial.com', 'TEST');
      const isNewAdmin = await isEmailAdmin('team.member@idealbeautyofficial.com');
      expect(isNewAdmin).toBe(true);
    });

    it('should retrieve admin access list with primary admin flagged', async () => {
      const list = await getAdminAccessList();
      expect(list.length).toBeGreaterThanOrEqual(1);

      const primaryEntry = list.find((item) => item.email.toLowerCase() === primaryEmail.toLowerCase());
      expect(primaryEntry).toBeDefined();
      expect(primaryEntry?.isPrimary).toBe(true);
    });

    it('should prevent revoking access for primary admin', async () => {
      await expect(removeAdminAccess(primaryEmail)).rejects.toThrow(
        'Cannot revoke access for the primary system administrator'
      );
    });

    it('should enforce requireAdminAccess verification', async () => {
      const admin = await requireAdminAccess();
      expect(admin).toBeDefined();
      expect(admin.email).toBeTruthy();
    });
  });

  describe('Server Actions', () => {
    it('should add new admin access via action and revalidate', async () => {
      const testEmail = `new.admin.${Date.now()}@idealbeautyofficial.com`;
      const result = await addAdminAccessAction(testEmail);

      expect(result).toBeDefined();
      expect(result.email.toLowerCase()).toBe(testEmail.toLowerCase());
      expect(result.isPrimary).toBe(false);

      const list = await getAdminAccessListAction();
      const added = list.find((item) => item.email.toLowerCase() === testEmail.toLowerCase());
      expect(added).toBeDefined();
    });

    it('should revoke non-primary admin access via action', async () => {
      const tempEmail = `temp.admin.${Date.now()}@idealbeautyofficial.com`;
      const added = await addAdminAccessAction(tempEmail);

      const revokeResult = await removeAdminAccessAction(added.id);
      expect(revokeResult.success).toBe(true);

      const isStillAdmin = await isEmailAdmin(tempEmail);
      expect(isStillAdmin).toBe(false);
    });

    it('should reject revoking primary admin email via server action', async () => {
      await expect(removeAdminAccessAction(primaryEmail)).rejects.toThrow(
        'Cannot revoke access for the primary system administrator'
      );
    });
  });
});
