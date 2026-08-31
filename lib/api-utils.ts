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

export function isValidGender(gender: any): gender is 'BOY' | 'GIRL' {
  return gender === 'BOY' || gender === 'GIRL';
}

export function isValidAmount(amount: any): amount is number {
  const num = Number(amount);
  return !isNaN(num) && num >= 0 && Number.isFinite(num);
}

export function isValidUsername(username: any): username is string {
  return typeof username === 'string' && username.trim().length >= 3;
}

export function isValidPassword(password: any): password is string {
  return typeof password === 'string' && password.length >= 6;
}
