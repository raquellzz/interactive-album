import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const { accessKey } = await request.json();

    if (!accessKey) {
      return NextResponse.json({ error: 'Chave de acesso obrigatória' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('id, name')
      .eq('access_key', accessKey.trim().toUpperCase())
      .single();

    if (error || !event) {
      return NextResponse.json({ error: 'Chave de evento inválida!' }, { status: 401 });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `eventos/${event.id}`;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      eventId: event.id,
      eventName: event.name,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 });
  }
}