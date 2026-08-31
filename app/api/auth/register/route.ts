import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  badRequest,
  serverError,
  isValidUsername,
  isValidPassword,
} from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!isValidUsername(username)) {
      return badRequest('Username must be at least 3 characters');
    }

    if (!isValidPassword(password)) {
      return badRequest('Password must be at least 6 characters');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        passwordHash,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return serverError();
  }
}
