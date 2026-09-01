import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, unauthorized, serverError, isValidAmount } from '@/lib/api-utils';
import { isAllowedBetDate, isBettingOpen, parseDateOnly } from '@/lib/betting-rules';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { date, amount } = body;

    const parsedDate = parseDateOnly(date);
    if (!parsedDate) {
      return badRequest('Data non valida');
    }

    if (!isAllowedBetDate(parsedDate)) {
      return badRequest('La data deve essere tra il 18 marzo e il 14 aprile');
    }

    if (!isValidAmount(amount)) {
      return badRequest('Importo non valido: usa un numero intero non negativo');
    }

    if (!(await isBettingOpen())) {
      return badRequest('Le scommesse sono chiuse');
    }

    const bet = await prisma.dateBet.upsert({
      where: { userId: session.user.id },
      update: {
        date: parsedDate,
        amount,
      },
      create: {
        userId: session.user.id,
        date: parsedDate,
        amount,
      },
    });

    return NextResponse.json({ bet });
  } catch (error) {
    console.error('Date bet creation error:', error);
    return serverError();
  }
}
