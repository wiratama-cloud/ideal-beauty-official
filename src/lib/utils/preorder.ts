export function getPreOrderDays(variant?: { preOrderDays?: number | null; preOrderNote?: string | null } | null): number {
  if (!variant) return 15;
  if (typeof variant.preOrderDays === 'number' && variant.preOrderDays > 0) {
    return Math.round(variant.preOrderDays);
  }
  if (variant.preOrderNote) {
    const match = variant.preOrderNote.match(/(\d+)\s*days?/i);
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return 15;
}

export function formatEstimatedArrival(days: number, fromDate: Date = new Date()): string {
  const targetDate = new Date(fromDate);
  targetDate.setDate(targetDate.getDate() + days);
  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
