import { prisma } from '../prisma';
import { EntryType, ExpenseCategory } from '@prisma/client';

export interface CreateExpenseInput {
  amount: number;
  description: string;
  expenseCategory: 'DESIGN_RND' | 'MANUFACTURING_COGS' | 'OPERATIONAL' | 'MARKETING';
  productId?: string;
  variantId?: string;
}

export async function getLedgerEntries(filter?: { type?: 'INCOME' | 'EXPENSE' }) {
  const whereClause: any = {};
  if (filter?.type) {
    whereClause.type = filter.type === 'INCOME' ? EntryType.INCOME : EntryType.EXPENSE;
  }

  const entries = await prisma.ledgerEntry.findMany({
    where: whereClause,
    include: {
      payment: true,
      product: true,
      variant: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return entries.map(entry => ({
    ...entry,
    amount: entry.amount ? Number(entry.amount) : null,
    payment: entry.payment ? {
      ...entry.payment,
      amount: entry.payment.amount ? Number(entry.payment.amount) : null,
    } : null,
    variant: entry.variant ? {
      ...entry.variant,
      priceSale: entry.variant.priceSale ? Number(entry.variant.priceSale) : null,
      priceRent: entry.variant.priceRent ? Number(entry.variant.priceRent) : null,
      costPrice: entry.variant.costPrice ? Number(entry.variant.costPrice) : null,
    } : null,
  }));
}

export async function createExpenseEntry(input: CreateExpenseInput) {
  const cat = ExpenseCategory[input.expenseCategory];

  return prisma.ledgerEntry.create({
    data: {
      type: EntryType.EXPENSE,
      amount: input.amount,
      description: input.description,
      expenseCategory: cat,
      productId: input.productId,
      variantId: input.variantId,
    },
  });
}

export async function getFinancialSummary() {
  const entries = await prisma.ledgerEntry.findMany();

  let totalIncome = 0;
  let totalExpense = 0;

  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  for (const entry of entries) {
    const amount = Number(entry.amount);
    if (entry.type === EntryType.INCOME) {
      totalIncome += amount;
      const cat = entry.incomeCategory || 'OTHER';
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + amount;
    } else if (entry.type === EntryType.EXPENSE) {
      totalExpense += amount;
      const cat = entry.expenseCategory || 'OPERATIONAL';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amount;
    }
  }

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netProfit,
    profitMargin,
    incomeByCategory,
    expenseByCategory,
    totalEntriesCount: entries.length,
  };
}

export async function generateLedgerCSV() {
  const entries = await getLedgerEntries();

  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (IDR)', 'Description', 'Payment ID', 'Product ID'];
  const rows = entries.map((e) => [
    e.id,
    new Date(e.createdAt).toISOString(),
    e.type,
    e.type === EntryType.INCOME ? e.incomeCategory || 'OTHER' : e.expenseCategory || 'OPERATIONAL',
    Number(e.amount).toString(),
    `"${(e.description || '').replace(/"/g, '""')}"`,
    e.paymentId || '',
    e.productId || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
