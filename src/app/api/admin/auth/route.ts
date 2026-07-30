import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export function getAdminToken(eventId: string) {
  const secret = process.env.ADMIN_PASSWORD || 'default_secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`admin_session_${eventId}`)
    .digest('hex');
}

export async function POST(request: Request) {
  try {
    const { accessKey, password } = await request.json();

    if (!accessKey || !password) {
      return NextResponse.json({ error: 'Chave do evento e senha são obrigatórias.' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('id, name, admin_secret')
      .eq('access_key', accessKey.trim().toUpperCase())
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Chave de evento não encontrada.' }, { status: 404 });
    }

    if (event.admin_secret !== password) {
      return NextResponse.json({ error: 'Senha de administrador incorreta para este evento.' }, { status: 401 });
    }

    const token = getAdminToken(event.id);
    const cookieStore = await cookies();

    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    cookieStore.set('admin_event_id', event.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    return NextResponse.json({ success: true, eventId: event.id, eventName: event.name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('admin_event_id');
  return NextResponse.json({ success: true });
}