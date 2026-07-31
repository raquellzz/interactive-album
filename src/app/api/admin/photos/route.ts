import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import cloudinary from '@/lib/cloudinary';
import { getAdminToken } from '../auth/route';

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value;
    const adminEventId = cookieStore.get('admin_event_id')?.value;

    // Compara o cookie com o token HMAC em vez da senha original
    if (!adminSession || !adminEventId || adminSession !== getAdminToken(adminEventId)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'ID da foto é obrigatório' }, { status: 400 });
    }

    const { data: photo } = await supabase
      .from('photos')
      .select('image_url')
      .eq('id', photoId)
      .single();

    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) throw deleteError;

    if (photo?.image_url) {
      try {
        const urlParts = photo.image_url.split('/upload/');
        if (urlParts.length > 1) {
          const pathWithoutVersion = urlParts[1].replace(/^v\d+\//, '');
          const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }
      } catch (cErr) {
        console.warn('Erro ao deletar no Cloudinary:', cErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}