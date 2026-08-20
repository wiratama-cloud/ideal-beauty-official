import { describe, it, expect } from 'vitest';
import { verifyIdToken } from '@/lib/firebase/admin';

describe('Firebase Admin ID Token Verification', () => {
  it('successfully verifies and decodes valid Firebase ID token in development / emulator mode', async () => {
    const token =
      'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiRGFmYSBXaXJhdGFtYSIsImVtYWlsIjoiZGFmYS53aXJhdGFtYUB3aXJhdGFtYS5jbG91ZCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3ODcyMzkyODgsInVzZXJfaWQiOiJNckZNdjRURjJncmM4VG1IeFdySFl0dTNYWnVLIiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJkYWZhLndpcmF0YW1hQHdpcmF0YW1hLmNsb3VkIl0sImdvb2dsZS5jb20iOlsiNzg5ODAxNDgzMDM3NjM4NDA0MzE4NTAyMTYwNDYwMzUxOTgyOTk1NCJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifSwiaWF0IjoxNzg3MjM5Mjg4LCJleHAiOjE3ODcyNDI4ODgsImF1ZCI6ImlkZWFsLWJlYXV0eS1vZmZpY2lhbC1iMzEzZCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9pZGVhbC1iZWF1dHktb2ZmaWNpYWwtYjMxM2QiLCJzdWIiOiJNckZNdjRURjJncmM4VG1IeFdySFl0dTNYWnVLIn0.';

    const result = await verifyIdToken(token);
    expect(result).not.toBeNull();
    expect(result?.uid).toBe('MrFMv4TF2grc8TmHxWrHYtu3XZuK');
    expect(result?.email).toBe('dafa.wiratama@wiratama.cloud');
    expect(result?.name).toBe('Dafa Wiratama');
  });

  it('returns null for empty or malformed token string', async () => {
    expect(await verifyIdToken('')).toBeNull();
    expect(await verifyIdToken('invalid-jwt-token')).toBeNull();
    expect(await verifyIdToken('a.b')).toBeNull();
  });

  it('rejects unverified/mock tokens when NODE_ENV is production and real admin auth is not initialized', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const token =
        'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJuYW1lIjoiRGFmYSBXaXJhdGFtYSIsImVtYWlsIjoiZGFmYS53aXJhdGFtYUB3aXJhdGFtYS5jbG91ZCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJhdXRoX3RpbWUiOjE3ODcyMzkyODgsInVzZXJfaWQiOiJNckZNdjRURjJncmM4VG1IeFdySFl0dTNYWnVLIiwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJkYWZhLndpcmF0YW1hQHdpcmF0YW1hLmNsb3VkIl0sImdvb2dsZS5jb20iOlsiNzg5ODAxNDgzMDM3NjM4NDA0MzE4NTAyMTYwNDYwMzUxOTgyOTk1NCJdfSwic2lnbl9pbl9wcm92aWRlciI6Imdvb2dsZS5jb20ifSwiaWF0IjoxNzg3MjM5Mjg4LCJleHAiOjE3ODcyNDI4ODgsImF1ZCI6ImlkZWFsLWJlYXV0eS1vZmZpY2lhbC1iMzEzZCIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9pZGVhbC1iZWF1dHktb2ZmaWNpYWwtYjMxM2QiLCJzdWIiOiJNckZNdjRURjJncmM4VG1IeFdySFl0dTNYWnVLIn0.';

      const result = await verifyIdToken(token);
      expect(result).toBeNull();
    } finally {
      (process.env as any).NODE_ENV = originalEnv;
    }
  });
});
