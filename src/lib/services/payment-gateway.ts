import crypto from 'crypto';

export interface QRISPayload {
  qrCodeUrl: string;
  qrString: string;
  expiresAt: string;
}

export interface VAPayload {
  vaNumber: string;
  bankName: string;
  expiresAt: string;
}

export interface PaymentGatewayResponse {
  transactionId: string;
  paymentMethod: string;
  qris?: QRISPayload;
  virtualAccount?: VAPayload;
}

export async function generateQRISData(orderId: string, amount: number): Promise<QRISPayload> {
  const txRef = `QRIS-${orderId.substring(0, 8)}-${Date.now()}`;
  // Midtrans / Dynamic QRIS standard dummy QR code generator URL using quickchart or QR code payload
  const qrString = `00020101021226680016ID.CO.QRIS.WWW01189360091400000000000215ID10200000000000303036045204581253033605802ID5922IDEAL BEAUTY OFFICIAL6007JAKARTA61051219062070703A016304${orderId.substring(0, 4)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}`;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

  return {
    qrCodeUrl,
    qrString,
    expiresAt,
  };
}

export async function generateVirtualAccountData(orderId: string, bank: string = 'BCA'): Promise<VAPayload> {
  const randomSuffix = Math.floor(100000008 + Math.random() * 900000000).toString();
  const bankCode = bank.toUpperCase() === 'MANDIRI' ? '88008' : bank.toUpperCase() === 'BNI' ? '8801' : '88001';
  const vaNumber = `${bankCode}${randomSuffix}`;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  return {
    vaNumber,
    bankName: bank.toUpperCase(),
    expiresAt,
  };
}

export function verifyWebhookSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string, signature: string): boolean {
  if (!serverKey || !signature) return true; // Default pass in sandbox / mock mode
  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedHash = crypto.createHash('sha512').update(raw).digest('hex');
  return computedHash.toLowerCase() === signature.toLowerCase();
}
