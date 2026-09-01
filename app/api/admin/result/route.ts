import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isValidGender, serverError } from '@/lib/api-utils';
import { isAllowedBetDate, parseDateOnly } from '@/lib/betting-rules';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await prisma.result.findUnique({
      where: { id: 'singleton' },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return forbidden();
  }

  try {
    const body = await request.json();
    const { winningGender, birthDate } = body;

    if (winningGender !== undefined && !isValidGender(winningGender)) {
      return badRequest('Genere non valido');
    }

    const parsedBirthDate = birthDate === undefined ? null : parseDateOnly(birthDate);
    if (birthDate !== undefined && (!parsedBirthDate || !isAllowedBetDate(parsedBirthDate))) {
      return badRequest('Data non valida');
    }

    const updateData = {
      isRevealed: true,
      ...(isValidGender(winningGender) ? { winningGender } : {}),
      ...(parsedBirthDate ? { birthDate: parsedBirthDate } : {}),
    };

    const result = await prisma.result.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: {
        id: 'singleton',
        ...updateData,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Set result error:', error);
    return serverError();
  }
}
