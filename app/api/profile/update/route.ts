import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function PATCH(request: Request) {
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

    const displayName =
      typeof body.display_name === 'string'
        ? body.display_name.trim()
        : '';

    const bio =
      typeof body.bio === 'string'
        ? body.bio.trim()
        : '';

    if (displayName.length > 50) {
      return NextResponse.json(
        {
          error:
            'O nome de exibição pode ter no máximo 50 caracteres.',
        },
        { status: 400 }
      );
    }

    if (bio.length > 500) {
      return NextResponse.json(
        {
          error:
            'A bio pode ter no máximo 500 caracteres.',
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          bio: bio || null,
        })
        .eq('user_id', session.user_id)
        .select(
          'id, username, display_name, bio, avatar_url, cover_url, theme_color'
        )
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: 'Não foi possível atualizar seu perfil.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Perfil atualizado com sucesso.',
      user: profile,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Não foi possível atualizar seu perfil.',
      },
      { status: 500 }
    );
  }
}
