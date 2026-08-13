import { prisma } from '../prisma';
import { InventoryTransactionType, EntryType, DebitCredit, ExpenseCategory } from '@prisma/client';

export interface RecordStockAdjustmentInput {
  variantId: string;
  type: 'ADD' | 'REMOVE' | 'ADJUSTMENT' | 'SALE' | 'RENTAL' | 'RETURN';
  quantity: number;
  reason: string;
  stockPool?: 'SALE' | 'RENTAL';
  cost?: number | null;
  notes?: string | null;
  createLedgerEntry?: boolean;
}

export async function recordStockAdjustment(input: RecordStockAdjustmentInput) {
  const stockPool = input.stockPool || 'SALE';
  const qty = Math.abs(input.quantity);
  const cost = input.cost !== undefined && input.cost !== null ? Number(input.cost) : null;

  return prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      include: { product: true },
    });

    if (!variant) {
      throw new Error(`Product variant with ID ${input.variantId} not found.`);
    }

    let saleTotal = variant.stockSaleTotal;
    let saleAvailable = variant.stockSaleAvailable;
    let rentTotal = variant.stockRentTotal;
    let rentAvailable = variant.stockRentAvailable;

    if (stockPool === 'RENTAL') {
      if (input.type === 'ADD' || input.type === 'RETURN') {
        rentTotal += qty;
        rentAvailable += qty;
      } else if (input.type === 'REMOVE' || input.type === 'RENTAL') {
        rentTotal = Math.max(0, rentTotal - qty);
        rentAvailable = Math.max(0, rentAvailable - qty);
      } else if (input.type === 'ADJUSTMENT') {
        rentTotal = qty;
        rentAvailable = qty;
      }
    } else {
      if (input.type === 'ADD' || input.type === 'RETURN') {
        saleTotal += qty;
        saleAvailable += qty;
      } else if (input.type === 'REMOVE' || input.type === 'SALE') {
        saleTotal = Math.max(0, saleTotal - qty);
        saleAvailable = Math.max(0, saleAvailable - qty);
      } else if (input.type === 'ADJUSTMENT') {
        saleTotal = qty;
        saleAvailable = qty;
      }
    }

    const legacyTotal = saleTotal + rentTotal;
    const legacyAvailable = saleAvailable + rentAvailable;

    const updatedVariant = await tx.productVariant.update({
      where: { id: input.variantId },
      data: {
        stockSaleTotal: saleTotal,
        stockSaleAvailable: saleAvailable,
        stockRentTotal: rentTotal,
        stockRentAvailable: rentAvailable,
        stockTotal: legacyTotal,
        stockAvailable: legacyAvailable,
        ...(cost !== null ? { purchaseCost: cost, costPrice: cost } : {}),
      },
    });

    const txType = InventoryTransactionType[input.type] || InventoryTransactionType.ADD;

    const inventoryTransaction = await tx.inventoryTransaction.create({
      data: {
        variantId: input.variantId,
        type: txType,
        quantity: qty,
        reason: input.reason,
        cost,
        purchaseCost: cost,
        notes: input.notes || null,
      },
    });

    // Optionally create an automated purchase ledger entry when stock is added with a cost
    if ((input.type === 'ADD' || input.type === 'ADJUSTMENT') && cost !== null && cost > 0 && input.createLedgerEntry !== false) {
      const totalCost = cost * qty;
      await tx.ledgerEntry.create({
        data: {
          type: EntryType.EXPENSE,
          dcType: DebitCredit.DEBIT,
          tranCode: 'STOCK_PURCHASE',
          tranSequence: 1,
          amount: totalCost,
          description: `Inventory Purchase: ${qty}x ${variant.product.name} (${variant.sku}) - Reason: ${input.reason}`,
          expenseCategory: ExpenseCategory.MANUFACTURING_COGS,
          productId: variant.productId,
          variantId: variant.id,
        },
      });
    }

    return {
      variant: {
        ...updatedVariant,
        priceSale: updatedVariant.priceSale ? Number(updatedVariant.priceSale) : null,
        priceRent: updatedVariant.priceRent ? Number(updatedVariant.priceRent) : null,
        compareAtPrice: updatedVariant.compareAtPrice ? Number(updatedVariant.compareAtPrice) : null,
        costPrice: updatedVariant.costPrice ? Number(updatedVariant.costPrice) : null,
        purchaseCost: updatedVariant.purchaseCost ? Number(updatedVariant.purchaseCost) : null,
      },
      inventoryTransaction: {
        ...inventoryTransaction,
        cost: inventoryTransaction.cost ? Number(inventoryTransaction.cost) : null,
        purchaseCost: inventoryTransaction.purchaseCost ? Number(inventoryTransaction.purchaseCost) : null,
      },
    };
  });
}

export async function getInventoryTransactions(variantId?: string) {
  const whereClause = variantId ? { variantId } : {};

  const transactions = await prisma.inventoryTransaction.findMany({
    where: whereClause,
    include: {
      variant: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return transactions.map((t) => ({
    ...t,
    cost: t.cost ? Number(t.cost) : null,
    purchaseCost: t.purchaseCost ? Number(t.purchaseCost) : null,
    variant: t.variant ? {
      ...t.variant,
      priceSale: t.variant.priceSale ? Number(t.variant.priceSale) : null,
      priceRent: t.variant.priceRent ? Number(t.variant.priceRent) : null,
      compareAtPrice: t.variant.compareAtPrice ? Number(t.variant.compareAtPrice) : null,
      costPrice: t.variant.costPrice ? Number(t.variant.costPrice) : null,
      purchaseCost: t.variant.purchaseCost ? Number(t.variant.purchaseCost) : null,
    } : null,
  }));
}
