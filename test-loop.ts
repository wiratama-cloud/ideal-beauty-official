import { prisma } from './src/lib/prisma';
import { getCategoryAndDescendantNames } from './src/lib/services/nav-category';

async function main() {
  const catA = await prisma.navCategory.create({
    data: { name: 'CatA', href: '/a', parentId: null }
  });
  const catB = await prisma.navCategory.create({
    data: { name: 'CatB', href: '/b', parentId: catA.id }
  });
  await prisma.navCategory.update({
    where: { id: catA.id },
    data: { parentId: catB.id }
  });
  console.log("Created cycle A -> B -> A");
  
  console.log("Getting names for CatA...");
  
  // adding a timeout so it doesn't run forever
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
  const workPromise = getCategoryAndDescendantNames(catA.id);
  
  try {
    const names = await Promise.race([workPromise, timeoutPromise]);
    console.log("Names:", names);
  } catch (e) {
    console.error("Error:", e);
  }

  // Cleanup
  await prisma.navCategory.deleteMany({ where: { name: { in: ['CatA', 'CatB'] } } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
