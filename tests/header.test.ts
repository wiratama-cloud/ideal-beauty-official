import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Header Layout & Centering', () => {
  it('should have a 12-column grid layout for header centering', () => {
    const headerPath = path.resolve(__dirname, '../src/components/layout/Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf-8');

    // Verify grid layout with 12 columns
    expect(headerContent).toContain('grid grid-cols-12 items-center');

    // Verify logo center spans 6 columns with flex centering
    expect(headerContent).toContain('col-span-6 flex flex-col items-center justify-center text-center');

    // Verify logo text content "IDEAL BEAUTY" and "OFFICIAL"
    expect(headerContent).toContain('IDEAL BEAUTY');
    expect(headerContent).toContain('OFFICIAL');
  });
});
