import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverError } from '@/lib/api-utils';

export async function GET() {
  try {
    const bets = await prisma.bet.findMany({
      select: {
        gender: true,
        amount: true,
      },
    });

    const summary = bets.reduce(
      (acc, bet) => {
        if (bet.gender === 'BOY') {
          acc.boyCount += 1;
          acc.boyTotal += bet.amount;
        } else if (bet.gender === 'GIRL') {
          acc.girlCount += 1;
          acc.girlTotal += bet.amount;
        }
        acc.totalPot += bet.amount;
        return acc;
      },
      { boyCount: 0, boyTotal: 0, girlCount: 0, girlTotal: 0, totalPot: 0 }
    );

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary error:', error);
    return serverError();
  }
}
