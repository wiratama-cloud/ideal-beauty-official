import { getOptimizedImageUrl } from './src/lib/utils/image-url.ts';
console.log(getOptimizedImageUrl('https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/products%2Fimage%2D1024w.webp?alt=media', 256));
console.log(getOptimizedImageUrl('https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/products%2Fimage-1024w.webp?alt=media', 512));
