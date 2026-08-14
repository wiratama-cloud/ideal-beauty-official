import { prisma } from './src/lib/prisma';
import { getNavCategoryTree } from './src/lib/services/nav-category';

async function main() {
  const catA = await prisma.navCategory.create({
    data: { name: 'CatTreeA', href: '/a', parentId: null }
  });
  const catB = await prisma.navCategory.create({
    data: { name: 'CatTreeB', href: '/b', parentId: catA.id }
  });
  await prisma.navCategory.update({
    where: { id: catA.id },
    data: { parentId: catB.id }
  });
  console.log("Created cycle A -> B -> A");
  
  const tree = await getNavCategoryTree(false);
  try {
    JSON.stringify(tree);
    console.log("JSON stringify successful");
  } catch (e) {
    console.error("JSON stringify error:", e);
  }
  
  await prisma.navCategory.deleteMany({ where: { name: { in: ['CatTreeA', 'CatTreeB'] } } });
}
main().catch(console.error).finally(() => prisma.$disconnect());
