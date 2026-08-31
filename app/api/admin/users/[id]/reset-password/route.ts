import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { forbidden, serverError, notFound } from '@/lib/api-utils';
import { isAdmin } from '@/lib/admin';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  if (!(await isAdmin())) {
    return forbidden();
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return notFound('Utente non trovato');
    }

    const defaultPassword = 'Prova123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return NextResponse.json({ message: 'Password resettata con successo' });
  } catch (error) {
    console.error('Reset password error:', error);
    return serverError();
  }
}
