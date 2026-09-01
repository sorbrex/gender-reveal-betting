import { NextResponse } from 'next/server';

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 });
}

export function isValidGender(gender: unknown): gender is 'BOY' | 'GIRL' {
  return gender === 'BOY' || gender === 'GIRL';
}

export function isValidAmount(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isInteger(amount) && amount >= 0;
}

export function isValidUsername(username: unknown): username is string {
  return typeof username === 'string' && username.trim().length >= 3;
}

export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 6;
}
