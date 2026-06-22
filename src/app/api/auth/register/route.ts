export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed, remaining, resetIn } = rateLimit(`register:${ip}`, 10, 60000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests', remaining, resetIn: Math.ceil(resetIn / 1000) },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(resetIn / 1000)) } }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');

    const { hashPassword } = await import('@/lib/password');
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    
    return NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error.message, error.stack);
    return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 });
  }
}
