import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { getAdminToken } from '../auth/route';

// PATCH: Atualiza configurações de um evento (como icon_url, name ou admin_secret)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    const adminEventId = cookieStore.get('admin_event_id')?.value;

    if (!adminSession || !adminEventId) {
      return NextResponse.json({ error: 'Acesso negado: faça login como administrador do evento.' }, { status: 403 });
    }

    const validToken = getAdminToken(adminEventId);
    if (adminSession !== validToken) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 403 });
    }

    const { eventId, iconUrl, name, adminSecret } = await request.json();

    if (!eventId) {
      return NextResponse.json({ error: 'ID do evento é obrigatório.' }, { status: 400 });
    }

    if (eventId !== adminEventId) {
      return NextResponse.json({ 
        error: 'Você não tem permissão para modificar configurações de outro evento!' 
      }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (iconUrl !== undefined) updates.icon_url = iconUrl;
    if (name !== undefined) updates.name = name;
    if (adminSecret !== undefined) updates.admin_secret = adminSecret;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nenhum dado informado para atualização.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, event: data });
  } catch (err: any) {
    console.error('Erro ao atualizar evento:', err);
    return NextResponse.json({ error: err.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}