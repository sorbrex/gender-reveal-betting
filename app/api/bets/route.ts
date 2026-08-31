import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  badRequest,
  unauthorized,
  serverError,
  isValidGender,
  isValidAmount,
} from '@/lib/api-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { gender, amount } = body;

    if (!isValidGender(gender)) {
      return badRequest('Invalid gender. Must be BOY or GIRL');
    }

    if (!isValidAmount(amount)) {
      return badRequest('Amount must be a non-negative number');
    }

    const bet = await prisma.bet.upsert({
      where: { userId: session.user.id },
      update: {
        gender,
        amount: Number(amount),
      },
      create: {
        userId: session.user.id,
        gender,
        amount: Number(amount),
      },
    });

    return NextResponse.json({ bet });
  } catch (error) {
    console.error('Bet creation error:', error);
    return serverError();
  }
}
