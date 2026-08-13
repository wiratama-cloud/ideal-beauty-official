import fs from 'fs';
import path from 'path';
import https from 'https';

const imageMap = [
  // Default & Hero
  {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/default-product.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=2000&auto=format&fit=crop',
    dest: 'public/images/hero/hero-banner.jpg',
  },

  // Products
  {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/kaftan-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/kaftan-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/lehenga-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/lehenga-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/anarkali-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/anarkali-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/sherwani-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/sherwani-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/saree-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/saree-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/sharara-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/sharara-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/cape-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/cape-2.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/veil-1.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/products/veil-2.jpg',
  },

  // Sections
  {
    url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/sections/brand-atelier.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/sections/brand-kaftan.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/sections/brand-silk.jpg',
  },
  {
    url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop',
    dest: 'public/images/sections/brand-groom.jpg',
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(dest));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading images locally to public/...');
  for (const item of imageMap) {
    try {
      await downloadFile(item.url, item.dest);
      console.log(`Downloaded ${item.dest}`);
    } catch (err) {
      console.error(`Failed to download ${item.url} -> ${item.dest}:`, err.message);
    }
  }
  console.log('Done downloading images.');
}

run();
