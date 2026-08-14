import { chromium } from 'playwright';

export interface LaamSubCategory {
  name: string;
  href?: string;
  imageUrl?: string;
  items?: { name: string; href?: string }[];
}

export interface LaamDepartmentCategory {
  department: string;
  categories: LaamSubCategory[];
}

export async function inspectLaamCategoryTree(targetUrl = 'https://laam.com'): Promise<LaamDepartmentCategory[]> {
  console.log(`[Laam Inspector] Launching Playwright Chromium...`);
  const browser = await chromium.launch({
    headless: true,
  });

  const departmentData: LaamDepartmentCategory[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    console.log(`[Laam Inspector] Navigating to ${targetUrl}...`);
    try {
      await page.goto(targetUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });
      await page.waitForTimeout(3000);
    } catch (navError: any) {
      console.warn(`[Laam Inspector] Navigation warning: ${navError.message}`);
    }

    // Try clicking menu/category drawer button if present
    try {
      const menuButton = page.locator('button:has-text("Categories"), button:has-text("Menu"), [aria-label*="menu"]').first();
      if (await menuButton.isVisible({ timeout: 2000 })) {
        console.log('[Laam Inspector] Clicking categories menu button...');
        await menuButton.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // Menu button not found or optional
    }

    // Expand category accordion triggers if present
    try {
      const accordionTriggers = page.locator('[data-state="closed"], [aria-expanded="false"], .accordion-trigger, [class*="accordion"] button');
      const count = await accordionTriggers.count();
      console.log(`[Laam Inspector] Found ${count} potential accordion triggers to expand.`);
      for (let i = 0; i < Math.min(count, 15); i++) {
        try {
          await accordionTriggers.nth(i).click({ timeout: 1000 });
          await page.waitForTimeout(300);
        } catch {
          // ignore individual trigger click timeout
        }
      }
    } catch {
      // ignore
    }

    // Parse the page DOM to extract category hierarchy
    const extractedHierarchy = await page.evaluate(() => {
      const departmentsMap = new Map<string, { [catName: string]: { href?: string; imageUrl?: string; items: { name: string; href?: string }[] } }>();

      // Strategy 1: Look for nav headers, department tabs, category links
      const allLinks = Array.from(document.querySelectorAll('a[href]'));

      for (const link of allLinks) {
        const anchor = link as HTMLAnchorElement;
        const text = anchor.textContent?.trim() || '';
        const href = anchor.href;

        if (!text || text.length < 2 || href.startsWith('javascript:')) continue;

        // Determine department context from parent elements or href
        let department = 'Main';
        const parentDeptAttr = anchor.closest('[data-department], [data-category], [class*="department"]');
        if (parentDeptAttr) {
          department = parentDeptAttr.getAttribute('data-department') || parentDeptAttr.textContent?.split('\n')[0].trim() || 'Main';
        } else if (href.includes('/women') || href.toLowerCase().includes('women')) {
          department = 'Women';
        } else if (href.includes('/men') || href.toLowerCase().includes('men')) {
          department = 'Menswear';
        } else if (href.includes('/kids') || href.toLowerCase().includes('kids')) {
          department = 'Kids';
        }

        if (!departmentsMap.has(department)) {
          departmentsMap.set(department, {});
        }

        const deptObj = departmentsMap.get(department)!;

        // Find parent container or accordion section for grouping subcategories
        const accordionContainer = anchor.closest('[class*="accordion"], [class*="category-group"], li, ul');
        const catHeader = accordionContainer?.querySelector('h2, h3, h4, [class*="title"], [class*="header"]')?.textContent?.trim() || 'General';

        if (!deptObj[catHeader]) {
          deptObj[catHeader] = { items: [] };
        }

        const imgEl = anchor.querySelector('img') || accordionContainer?.querySelector('img');
        const imageUrl = imgEl?.src || imgEl?.getAttribute('data-src') || undefined;

        if (!deptObj[catHeader].items.some((i) => i.name === text)) {
          deptObj[catHeader].items.push({ name: text, href });
        }
        if (imageUrl && !deptObj[catHeader].imageUrl) {
          deptObj[catHeader].imageUrl = imageUrl;
        }
      }

      // Convert map to array
      const results: { department: string; categories: { name: string; href?: string; imageUrl?: string; items: { name: string; href?: string }[] }[] }[] = [];

      departmentsMap.forEach((catObj, department) => {
        const categories = Object.entries(catObj).map(([name, val]) => ({
          name,
          href: val.href,
          imageUrl: val.imageUrl,
          items: val.items,
        }));
        results.push({ department, categories });
      });

      return results;
    });

    departmentData.push(...extractedHierarchy);

    console.log(`[Laam Inspector] Successfully extracted ${departmentData.length} department categories.`);
    console.log('[Laam Inspector] Category Tree Output:\n', JSON.stringify(departmentData, null, 2));

    return departmentData;
  } catch (err: any) {
    console.error(`[Laam Inspector] Error inspecting category tree: ${err.message}`);
    return [];
  } finally {
    await browser.close();
    console.log('[Laam Inspector] Inspection complete, browser closed.');
  }
}

async function main() {
  await inspectLaamCategoryTree();
}

main().catch((err) => {
  console.error('[Laam Inspector] Unhandled error:', err);
  process.exit(1);
});
