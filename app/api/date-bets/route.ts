import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, unauthorized, serverError, isValidAmount } from '@/lib/api-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { date, amount } = body;

    // Validate date: string YYYY-MM-DD and within allowed range
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return badRequest('Data non valida');
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return badRequest('Data non valida');
    }

    // Check month/day within allowed window (March 18 - April 14)
    const month = parsedDate.getUTCMonth() + 1; // getUTCMonth is 0-indexed
    const day = parsedDate.getUTCDate();
    const isValidMonthDay =
      (month === 3 && day >= 18) || // March 18-31
      (month === 4 && day <= 14);   // April 1-14

    if (!isValidMonthDay) {
      return badRequest('La data deve essere tra il 18 marzo e il 14 aprile');
    }

    if (!isValidAmount(amount)) {
      return badRequest('Importo non valido');
    }

    const bet = await prisma.dateBet.upsert({
      where: { userId: session.user.id },
      update: {
        date: parsedDate,
        amount: Number(amount),
      },
      create: {
        userId: session.user.id,
        date: parsedDate,
        amount: Number(amount),
      },
    });

    return NextResponse.json({ bet });
  } catch (error) {
    console.error('Date bet creation error:', error);
    return serverError();
  }
}
