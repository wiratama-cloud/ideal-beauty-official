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

    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-sample-key';

    if (signature_key) {
      const isValid = verifyWebhookSignature(
        order_id,
        status_code,
        gross_amount,
        serverKey,
        signature_key
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
      if (payment_id) {
        await processPaymentCompletion(payment_id, transaction_id);
      }
    }

    return NextResponse.json({ status: 'OK', message: 'Webhook processed successfully' });
  } catch (err: any) {
    console.error('Error processing payment webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
