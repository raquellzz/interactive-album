import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import cloudinary from '@/lib/cloudinary';

// GET: Lista todas as fotos de um evento em ordem cronológica (mais recentes primeiro)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId obrigatório' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Cadastra uma nova foto no banco depois do upload bem-sucedido
export async function POST(request: Request) {
  try {
    const { eventId, imageUrl, authorName } = await request.json();

    if (!eventId || !imageUrl || !authorName) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('photos')
      .insert([
        {
          event_id: eventId,
          image_url: imageUrl,
          author_name: authorName.trim(),
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

// DELETE: Apagar foto (valida autor e remove do Supabase + Cloudinary)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');
    const authorName = searchParams.get('author');

    if (!photoId || !authorName) {
      return NextResponse.json({ error: 'ID da foto e autor são obrigatórios' }, { status: 400 });
    }

    // 1. Buscar a foto para confirmar que o autor é o mesmo
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return NextResponse.json({ error: 'Foto não encontrada' }, { status: 404 });
    }

    if (photo.author_name.trim().toLowerCase() !== authorName.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Você só pode apagar as fotos que você mesmo enviou!' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) throw deleteError;

    try {
      const urlParts = photo.image_url.split('/upload/');
      if (urlParts.length > 1) {
        const pathWithoutVersion = urlParts[1].replace(/^v\d+\//, '');
        const publicId = pathWithoutVersion.substring(0, pathWithoutVersion.lastIndexOf('.'));
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (cErr) {
      console.warn('Foto removida do banco, mas falhou ao apagar no Cloudinary:', cErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}