import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serverError } from '@/lib/api-utils';

export async function GET() {
  try {
    const result = await prisma.result.findUnique({
      where: { id: 'singleton' },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Get public result error:', error);
    return serverError();
  }
}
