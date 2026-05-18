export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Register attempt:', { name, email });

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Lazy import everything
    const bcrypt = await import('bcryptjs');
    const { PrismaClient } = await import('@prisma/client');
    
    const prisma = new PrismaClient();
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      await prisma.$disconnect();
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.default.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    await prisma.$disconnect();
    
    console.log('User created:', user.id);
    return NextResponse.json({ message: 'User created', userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('Register error:', error.message, error.stack);
    return NextResponse.json({ error: 'Registration failed: ' + error.message }, { status: 500 });
  }
}
