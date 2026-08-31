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
    const bet = await prisma.dateBet.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ bet: bet || null });
  } catch (error) {
    console.error('Get my date bet error:', error);
    return serverError();
  }
}
