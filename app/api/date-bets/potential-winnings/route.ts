import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unauthorized, serverError } from '@/lib/api-utils';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const myBet = await prisma.dateBet.findUnique({
      where: { userId: session.user.id },
    });

    if (!myBet) {
      return NextResponse.json({ potentialWinnings: 0 });
    }

    const allBets = await prisma.dateBet.findMany({
      select: { date: true, amount: true },
    });

    const totalPot = allBets.reduce((sum, bet) => sum + bet.amount, 0);
    const myDateKey = myBet.date.toISOString().split('T')[0];
    const totalOnMyDate = allBets
      .filter((bet) => bet.date.toISOString().split('T')[0] === myDateKey)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (totalOnMyDate === 0) {
      return NextResponse.json({ potentialWinnings: 0 });
    }

    const potentialWinnings = (myBet.amount / totalOnMyDate) * totalPot;

    return NextResponse.json({ potentialWinnings });
  } catch (error) {
    console.error('Date potential winnings error:', error);
    return serverError();
  }
}
