import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  generateQRISData,
  generateVirtualAccountData,
  verifyWebhookSignature,
} from '@/lib/services/payment-gateway';

// Mock payment services
vi.mock('@/lib/services/payment', () => ({
  processPaymentCompletion: vi.fn().mockImplementation(async (paymentId: string, providerTxId?: string) => ({
    id: paymentId,
    status: 'COMPLETED',
    providerTxId: providerTxId || `MID-${paymentId}`,
    amount: 5000000,
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { POST as paymentWebhookHandler } from '@/app/api/webhooks/payment/route';
import { processPaymentCompletion } from '@/lib/services/payment';
import { simulatePaymentCompletionAction } from '@/app/actions/checkout';

describe('Midtrans Payment Gateway Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate valid QRIS payload with dynamic URL and expiry', async () => {
    const orderId = 'ORD-TEST-12345';
    const amount = 5000000;
    const qris = await generateQRISData(orderId, amount);

    expect(qris).toBeDefined();
    expect(qris.qrString).toContain('IDEAL BEAUTY OFFICIAL');
    expect(qris.qrString).toContain('00020101');
    expect(qris.qrCodeUrl).toContain('https://api.qrserver.com/v1/create-qr-code/');
    expect(qris.qrCodeUrl).toContain(encodeURIComponent(qris.qrString));
    expect(new Date(qris.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('should generate deterministic Bank Virtual Account numbers by bank type', async () => {
    const orderId = 'ORD-TEST-12345';

    const bcaVA = await generateVirtualAccountData(orderId, 'BCA');
    expect(bcaVA.bankName).toBe('BCA');
    expect(bcaVA.vaNumber.startsWith('88001')).toBe(true);

    const mandiriVA = await generateVirtualAccountData(orderId, 'MANDIRI');
    expect(mandiriVA.bankName).toBe('MANDIRI');
    expect(mandiriVA.vaNumber.startsWith('88008')).toBe(true);

    const bniVA = await generateVirtualAccountData(orderId, 'BNI');
    expect(bniVA.bankName).toBe('BNI');
    expect(bniVA.vaNumber.startsWith('8801')).toBe(true);
  });

  it('should correctly verify Midtrans SHA-512 webhook signature', () => {
    const orderId = 'IB-ORD-9988';
    const statusCode = '200';
    const grossAmount = '1250000.00';
    const serverKey = 'SB-Mid-server-TESTKEY123';

    // Calculate expected hash
    const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    const validSignature = crypto.createHash('sha512').update(raw).digest('hex');

    // Should return true for matching signature
    const isValid = verifyWebhookSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      validSignature
    );
    expect(isValid).toBe(true);

    // Should return false for invalid signature
    const isInvalid = verifyWebhookSignature(
      orderId,
      statusCode,
      grossAmount,
      serverKey,
      'invalid_hex_signature_string'
    );
    expect(isInvalid).toBe(false);

    // In development / mock mode, returns true if signature or serverKey are omitted
    expect(verifyWebhookSignature(orderId, statusCode, grossAmount, '', '')).toBe(true);

    // In production mode, missing signature or serverKey MUST return false
    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      expect(verifyWebhookSignature(orderId, statusCode, grossAmount, '', '')).toBe(false);
      expect(verifyWebhookSignature(orderId, statusCode, grossAmount, serverKey, '')).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });

  it('should process webhook settlement notification with valid signature', async () => {
    const orderId = 'IB-ORD-1001';
    const statusCode = '200';
    const grossAmount = '5000000.00';
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-sample-key';
    const signature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    const req = new Request('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: 'pay-uuid-1234',
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signature,
        transaction_status: 'settlement',
        transaction_id: 'midtrans-tx-5678',
      }),
    });

    const res = await paymentWebhookHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('OK');
    expect(processPaymentCompletion).toHaveBeenCalledWith('pay-uuid-1234', 'midtrans-tx-5678');
  });

  it('should reject webhook request when signature is invalid', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: 'pay-uuid-1234',
        order_id: 'IB-ORD-1001',
        status_code: '200',
        gross_amount: '5000000.00',
        signature_key: 'tampered_signature_key',
        transaction_status: 'settlement',
      }),
    });

    const res = await paymentWebhookHandler(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Invalid signature key');
    expect(processPaymentCompletion).not.toHaveBeenCalled();
  });

  it('should reject webhook request when signature is missing in production', async () => {
    const origEnv = process.env.NODE_ENV;
    try {
      (process.env as any).NODE_ENV = 'production';
      const req = new Request('http://localhost:3000/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: 'pay-uuid-prod-no-sig',
          order_id: 'IB-ORD-1001',
          status_code: '200',
          gross_amount: '5000000.00',
          transaction_status: 'settlement',
        }),
      });

      const res = await paymentWebhookHandler(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain('Signature key is required in production');
      expect(processPaymentCompletion).not.toHaveBeenCalled();
    } finally {
      (process.env as any).NODE_ENV = origEnv;
    }
  });

  it('should support local webhook simulation without signature (sandbox mode)', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: 'pay-uuid-local-sim',
        transaction_status: 'settlement',
        transaction_id: 'SIM-TX-999',
      }),
    });

    const res = await paymentWebhookHandler(req);
    expect(res.status).toBe(200);
    expect(processPaymentCompletion).toHaveBeenCalledWith('pay-uuid-local-sim', 'SIM-TX-999');
  });

  it('should support standard Midtrans webhook payload mapping via order_id', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'ORD-STANDARD-MIDTRANS',
        transaction_status: 'capture',
        transaction_id: 'MID-TX-777',
      }),
    });

    const res = await paymentWebhookHandler(req);
    expect(res.status).toBe(200);
    expect(processPaymentCompletion).toHaveBeenCalledWith('ORD-STANDARD-MIDTRANS', 'MID-TX-777');
  });

  it('should not complete payment if transaction_status is pending or deny', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_id: 'pay-pending-123',
        transaction_status: 'pending',
      }),
    });

    const res = await paymentWebhookHandler(req);
    expect(res.status).toBe(200);
    expect(processPaymentCompletion).not.toHaveBeenCalled();
  });

  it('should execute simulatePaymentCompletionAction for instant UI testing', async () => {
    const payment = await simulatePaymentCompletionAction('pay-ui-test-123');
    expect(payment).toBeDefined();
    expect(payment.id).toBe('pay-ui-test-123');
    expect(payment.status).toBe('COMPLETED');
    expect(processPaymentCompletion).toHaveBeenCalledWith('pay-ui-test-123', expect.stringMatching(/^SIM-/));
  });
});
