import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { forbidden, serverError } from '@/lib/api-utils';

export async function GET() {
  if (!(await isAdmin())) {
    return forbidden();
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return serverError();
  }
}
