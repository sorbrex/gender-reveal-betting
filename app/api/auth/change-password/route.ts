import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { badRequest, unauthorized, serverError } from '@/lib/api-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return unauthorized();
  }

  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return badRequest('Password attuale e nuova password sono richieste');
    }

    if (newPassword.length < 6) {
      return badRequest('La nuova password deve essere di almeno 6 caratteri');
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return unauthorized();
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return badRequest('Password attuale non valida');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({ message: 'Password cambiata con successo' });
  } catch (error) {
    console.error('Change password error:', error);
    return serverError();
  }
}
