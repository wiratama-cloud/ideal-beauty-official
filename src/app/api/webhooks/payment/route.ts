import { NextResponse } from 'next/server';
import { processPaymentCompletion } from '@/lib/services/payment';
import { verifyWebhookSignature } from '@/lib/services/payment-gateway';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      payment_id,
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      transaction_id,
    } = body;

    const isProduction =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

    const isMockMode =
      process.env.MIDTRANS_MOCK_MODE === 'true' ||
      (!isProduction && !signature_key);

    if (isProduction && !signature_key) {
      return NextResponse.json({ error: 'Signature key is required in production' }, { status: 401 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY || (isProduction ? '' : 'SB-Mid-server-sample-key');

    if (!isMockMode || signature_key) {
      const isValid = verifyWebhookSignature(
        order_id || '',
        status_code || '',
        gross_amount || '',
        serverKey,
        signature_key || ''
      );

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature key' }, { status: 401 });
      }
    }

    // Process payment completion for settlement/capture/success
    if (
      transaction_status === 'settlement' ||
      transaction_status === 'capture' ||
      transaction_status === 'COMPLETED' ||
      transaction_status === 'success'
    ) {
      const targetPaymentId = payment_id || (body as any).custom_field1 || order_id;
      if (targetPaymentId) {
        await processPaymentCompletion(targetPaymentId, transaction_id);
      }
    }

    return NextResponse.json({ status: 'OK', message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('Error processing payment webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
