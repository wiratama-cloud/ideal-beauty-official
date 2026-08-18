import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/upload/route';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

describe('Upload API Route (/api/upload)', () => {
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');

  beforeEach(async () => {
    if (!fs.existsSync(uploadsDir)) {
      await fs.promises.mkdir(uploadsDir, { recursive: true });
    }
  });

  afterEach(async () => {
    // Cleanup generated test files
    if (fs.existsSync(uploadsDir)) {
      const files = await fs.promises.readdir(uploadsDir);
      for (const file of files) {
        if (file.includes('test-upload')) {
          await fs.promises.unlink(path.join(uploadsDir, file)).catch(() => {});
        }
      }
    }
  });

  it('rejects request if no file is provided', async () => {
    const formData = new FormData();
    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No file provided');
  });

  it('rejects non-image files', async () => {
    const formData = new FormData();
    const textBlob = new Blob(['hello world'], { type: 'text/plain' });
    formData.append('file', textBlob, 'test-upload.txt');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Only image files are allowed');
  });

  it('successfully processes valid image and returns multi-resolution payload', async () => {
    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', imageBlob, 'test-upload-sample.jpg');
    formData.append('folder', 'products');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();

    // Check backward-compatible url
    expect(data.url).toBeDefined();
    expect(typeof data.url).toBe('string');
    expect(data.url).toContain('-1024w.webp');

    // Check multi-resolution urls dictionary
    expect(data.urls).toBeDefined();
    expect(data.urls['256']).toContain('-256w.webp');
    expect(data.urls['512']).toContain('-512w.webp');
    expect(data.urls['768']).toContain('-768w.webp');
    expect(data.urls['1024']).toContain('-1024w.webp');
    expect(data.urls['original']).toBeDefined();

    // Check metadata
    expect(data.metadata).toBeDefined();
    expect(data.metadata.originalWidth).toBe(1200);
    expect(data.metadata.originalHeight).toBe(800);
    expect(data.metadata.format).toBe('jpeg');
  });

  it('handles PNG uploads with transparency and returns valid WebP variants', async () => {
    const pngBuffer = await sharp({
      create: {
        width: 800,
        height: 800,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();

    const imageBlob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', imageBlob, 'test-upload-alpha.png');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.urls['256']).toContain('-256w.webp');
    expect(data.urls['1024']).toContain('-1024w.webp');
    expect(data.metadata.format).toBe('png');
  });

  it('handles small image uploads without upscaling higher resolutions', async () => {
    const smallBuffer = await sharp({
      create: {
        width: 400,
        height: 300,
        channels: 3,
        background: { r: 50, g: 100, b: 150 },
      },
    })
      .webp()
      .toBuffer();

    const imageBlob = new Blob([smallBuffer], { type: 'image/webp' });
    const formData = new FormData();
    formData.append('file', imageBlob, 'test-upload-small.webp');

    const request = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.metadata.originalWidth).toBe(400);
    expect(data.metadata.originalHeight).toBe(300);
    expect(data.urls['256']).toBeDefined();
    expect(data.urls['1024']).toBeDefined();
  });
});
