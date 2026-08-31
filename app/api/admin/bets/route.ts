import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { forbidden, serverError } from '@/lib/api-utils';

export async function GET() {
  if (!(await isAdmin())) {
    return forbidden();
  }

  try {
    const bets = await prisma.bet.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ bets });
  } catch (error) {
    console.error('Admin bets error:', error);
    return serverError();
  }
}
