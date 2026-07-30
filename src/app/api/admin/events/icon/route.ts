import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import cloudinary from '@/lib/cloudinary';
import { supabase } from '@/lib/supabase';
import { getAdminToken } from '../../auth/route';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    const adminEventId = cookieStore.get('admin_event_id')?.value;

    if (!adminSession || !adminEventId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const validToken = getAdminToken(adminEventId);
    if (adminSession !== validToken) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('eventId') as string;

    if (!file || !eventId) {
      return NextResponse.json({ error: 'Arquivo e eventId são obrigatórios' }, { status: 400 });
    }

    if (eventId !== adminEventId) {
      return NextResponse.json({ error: 'Você só pode alterar o evento atual' }, { status: 403 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'icones-eventos',
          transformation: [{ width: 64, height: 64, crop: 'fit', quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    const optimizedIconUrl = uploadResult.secure_url;

    const { error: dbError } = await supabase
      .from('events')
      .update({ icon_url: optimizedIconUrl })
      .eq('id', eventId);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true, iconUrl: optimizedIconUrl });
  } catch (err: any) {
    console.error('Erro no upload do ícone:', err);
    return NextResponse.json({ error: err.message || 'Erro ao enviar ícone' }, { status: 500 });
  }
}