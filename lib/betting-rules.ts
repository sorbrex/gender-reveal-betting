import { prisma } from '@/lib/prisma';

const BETTING_START = { month: 3, day: 18 };
const BETTING_END = { month: 4, day: 14 };

export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export function isAllowedBetDate(date: Date): boolean {
  const year = new Date().getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  return (
    date.getUTCFullYear() === year &&
    ((month === BETTING_START.month && day >= BETTING_START.day) ||
      (month === BETTING_END.month && day <= BETTING_END.day))
  );
}

export async function isBettingOpen(): Promise<boolean> {
  const result = await prisma.result.findUnique({
    where: { id: 'singleton' },
    select: { bettingClosed: true, isRevealed: true },
  });

  return !result?.bettingClosed && !result?.isRevealed;
}
