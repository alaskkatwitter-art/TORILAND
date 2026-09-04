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

    const { data: session, error: sessionError } =
      await supabase
        .from('auth_sessions')
        .select('user_id, expires_at')
        .eq('token', token)
        .maybeSingle();

    if (sessionError) {
      console.error(
        'Erro ao buscar sessão:',
        sessionError
      );

      return NextResponse.json(
        { error: 'Não foi possível verificar sua sessão.' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada.' },
        { status: 401 }
      );
    }

    if (
      session.expires_at &&
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: 'Sessão expirada.' },
        { status: 401 }
      );
    }

    const { data: stories, error: storiesError } =
      await supabase
        .from('stories')
        .select(
          `
          id,
          author_id,
          title,
          description,
          cover_url,
          status,
          rating,
          created_at,
          updated_at
          `
        )
        .eq('author_id', session.user_id)
        .order('updated_at', {
          ascending: false,
        });

    if (storiesError) {
      console.error(
        'Erro ao buscar histórias:',
        storiesError
      );

      return NextResponse.json(
        { error: 'Não foi possível carregar suas histórias.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stories: stories || [],
    });
  } catch (error) {
    console.error(
      'Erro inesperado na API de histórias do perfil:',
      error
    );

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
