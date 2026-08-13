import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
    const filename = `${Date.now()}-${safeName || 'image.jpg'}`;
    const filePath = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
