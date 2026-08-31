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
    const myBet = await prisma.bet.findUnique({
      where: { userId: session.user.id },
    });

    if (!myBet) {
      return NextResponse.json({ potentialWinnings: 0 });
    }

    const allBets = await prisma.bet.findMany({
      select: { gender: true, amount: true },
    });

    const totalPot = allBets.reduce((sum, bet) => sum + bet.amount, 0);
    const totalOnMyGender = allBets
      .filter((bet) => bet.gender === myBet.gender)
      .reduce((sum, bet) => sum + bet.amount, 0);

    if (totalOnMyGender === 0) {
      return NextResponse.json({ potentialWinnings: 0 });
    }

    const potentialWinnings = (myBet.amount / totalOnMyGender) * totalPot;

    return NextResponse.json({ potentialWinnings });
  } catch (error) {
    console.error('Potential winnings error:', error);
    return serverError();
  }
}
