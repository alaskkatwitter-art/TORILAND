import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const sessionCookie = cookieHeader
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) =>
        cookie.startsWith('toriland_session=')
      );

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Você precisa estar logado.' },
        { status: 401 }
      );
    }

    const sessionToken = decodeURIComponent(
      sessionCookie.substring('toriland_session='.length)
    );

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Sessão inválida.' },
        { status: 401 }
      );
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const { data: session, error: sessionError } =
      await supabase
        .from('auth_sessions')
        .select('user_id, expires_at')
        .eq('token_hash', tokenHash)
        .maybeSingle();

    if (
      sessionError ||
      !session ||
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return NextResponse.json(
        { error: 'Sua sessão expirou. Entre novamente.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === 'string'
        ? body.title.trim()
        : '';

    if (!title) {
      return NextResponse.json(
        { error: 'O título da história é obrigatório.' },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return NextResponse.json(
        {
          error:
            'O título pode ter no máximo 100 caracteres.',
        },
        { status: 400 }
      );
    }

    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .insert({
          author: session.user_id,
          title,
        })
        .select('id, author, title')
        .single();

    if (storyError || !story) {
      return NextResponse.json(
        {
          error:
            'Não foi possível criar a história.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'História criada com sucesso.',
        story,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          'Não foi possível criar a história.',
      },
      { status: 500 }
    );
  }
}
