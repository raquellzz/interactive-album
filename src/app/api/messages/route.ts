import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Lista mensagens do evento (filtra privadas a menos que seja Admin)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const adminSecret = request.headers.get('x-admin-password');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 });
  }
  const isAdmin = adminSecret === process.env.ADMIN_PASSWORD;

  let query = supabase
    .from('messages')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Enviar novo recado (com a opção de ser público ou privado)
export async function POST(request: Request) {
  try {
    const { eventId, authorName, content, isPublic } = await request.json();

    if (!eventId || !authorName || !content) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          event_id: eventId,
          author_name: authorName.trim(),
          content: content.trim(),
          is_public: isPublic ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}