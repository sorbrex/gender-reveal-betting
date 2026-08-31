import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { forbidden } from '@/lib/api-utils';

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return forbidden()
  }

  try {
    const body = await request.json();
    const { bettingClosed } = body;

    if (typeof bettingClosed !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    const result = await prisma.result.upsert({
      where: { id: 'singleton' },
      update: {
        bettingClosed,
      },
      create: {
        id: 'singleton',
        bettingClosed,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Toggle betting error:', error);
    return serverError();
  }
}
