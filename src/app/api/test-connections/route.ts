import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  const results = {
    supabase: { status: 'pending', details: null as any },
    cloudinary: { status: 'pending', details: null as any },
  };

  // 1. Testar Supabase: Buscar o evento 'RAQUEL2026' que criamos no SQL
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('access_key', 'RAQUEL2026')
      .single();

    if (error) throw error;

    results.supabase = {
      status: '✅ Conectado com sucesso!',
      details: `Evento encontrado: "${data.name}" (ID: ${data.id})`,
    };
  } catch (err: any) {
    results.supabase = {
      status: '❌ Erro na conexão',
      details: err.message || 'Verifique as variáveis NEXT_PUBLIC_SUPABASE_* no .env.local',
    };
  }

  // 2. Testar Cloudinary: Solicitar o status da conta via API Admin
  try {
    const pingResult = await cloudinary.api.ping();
    results.cloudinary = {
      status: '✅ Conectado com sucesso!',
      details: `Resposta da API: "${pingResult.status}"`,
    };
  } catch (err: any) {
    results.cloudinary = {
      status: '❌ Erro na conexão',
      details: err.message || 'Verifique as variáveis CLOUDINARY_* no .env.local',
    };
  }

  // Retorna o status HTTP 200 se ambos estiverem OK, ou 500 se algo deu erro
  const allOk =
    results.supabase.status.includes('✅') &&
    results.cloudinary.status.includes('✅');

  return NextResponse.json(results, { status: allOk ? 200 : 500 });
}