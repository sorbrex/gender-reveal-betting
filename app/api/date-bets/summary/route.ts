import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverError } from '@/lib/api-utils';

export async function GET() {
  try {
    const bets = await prisma.dateBet.findMany({
      select: {
        date: true,
        amount: true,
      },
    });

    // Group by date
    const summaryMap = new Map<string, { count: number; total: number }>();
    let totalPot = 0;

    for (const bet of bets) {
      const dateKey = bet.date.toISOString().split('T')[0];
      const existing = summaryMap.get(dateKey) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += bet.amount;
      summaryMap.set(dateKey, existing);
      totalPot += bet.amount;
    }

    const dates = Array.from(summaryMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      total: data.total,
    }));

    return NextResponse.json({ summary: { dates, totalPot } });
  } catch (error) {
    console.error('Date bets summary error:', error);
    return serverError();
  }
}
