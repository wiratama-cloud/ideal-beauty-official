import { NextResponse } from 'next/server';
import { processAndStoreImageVariants } from '@/lib/services/image-processor';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'products';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${Date.now()}-${safeName || 'image.jpg'}`;

    const result = await processAndStoreImageVariants(buffer, filename, file.type, {
      folder,
    });

    return NextResponse.json({
      url: result.url,
      urls: result.urls,
      metadata: result.metadata,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    if (error?.message?.includes('Unsupported') || error?.message?.includes('invalid image')) {
      return NextResponse.json({ error: 'Invalid or unsupported image file' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
