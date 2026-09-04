import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('toriland_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      );
    }

    /*
     * Usa a mesma sessão que já funciona no /api/auth/me.
     * Primeiro encontramos a sessão pelo token.
     */
    const { data: session, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (sessionError) {
      console.error('ERRO AUTH_SESSIONS:', sessionError);

      return NextResponse.json(
        {
          error: 'Erro ao verificar sessão.',
          details: sessionError.message,
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada.' },
        { status: 401 }
      );
    }

    const userId = session.user_id;

    console.log('USER ID DA SESSÃO:', userId);

    /*
     * Agora buscamos TODAS as histórias desse usuário.
     * Não importa se possuem capítulos publicados ou não.
     */
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select(`
        id,
        author_id,
        title,
        description,
        cover_url,
        status,
        rating,
        created_at,
        updated_at
      `)
      .eq('author_id', userId)
      .order('updated_at', {
        ascending: false,
      });

    if (storiesError) {
      console.error('ERRO STORIES:', storiesError);

      return NextResponse.json(
        {
          error: 'Erro ao buscar histórias.',
          details: storiesError.message,
        },
        { status: 500 }
      );
    }

    console.log('HISTÓRIAS ENCONTRADAS:', stories);

    return NextResponse.json({
      stories: stories || [],
    });
  } catch (error) {
    console.error('ERRO GERAL:', error);

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
      },
      { status: 500 }
    );
  }
}
