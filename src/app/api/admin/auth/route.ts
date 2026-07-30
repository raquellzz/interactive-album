import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Função que gera um Token HMAC seguro a partir da senha de Admin
export function getAdminToken() {
  const secret = process.env.ADMIN_PASSWORD || 'default_secret';
  return crypto
    .createHmac('sha256', secret)
    .update('admin_authenticated_session')
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Senha de admin incorreta.' }, { status: 401 });
    }

    const token = getAdminToken();

    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}