import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { badRequest, forbidden, isValidGender, serverError } from '@/lib/api-utils';

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

    if (winningGender && !isValidGender(winningGender)) {
      return badRequest('Genere non valido');
    }

    if (birthDate && typeof birthDate === 'string') {
      // validate date
      if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return badRequest('Data non valida');
      }
      const parsedDate = new Date(birthDate);
      if (isNaN(parsedDate.getTime())) {
        return badRequest('Data non valida');
      }
      // optionally check range
    }

    // Build update data
    const updateData: any = {
      isRevealed: true,
    };
    if (winningGender) updateData.winningGender = winningGender;
    if (birthDate) updateData.birthDate = new Date(birthDate);

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
