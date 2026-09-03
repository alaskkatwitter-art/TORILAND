import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const cookie = request.headers.get('cookie') || '';

    const sessionMatch = cookie.match(
      /(?:^|;\s*)toriland_session=([^;]+)/
    );

    if (!sessionMatch) {
      return NextResponse.json(
        {
          error: 'COOKIE_NAO_ENCONTRADO',
          cookies_recebidos: cookie
            ? 'Sim'
            : 'Não',
        },
        { status: 401 }
      );
    }

    const sessionToken = sessionMatch[1];

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const { data: session, error } =
      await supabase
        .from('auth_sessions')
        .select(
          'id, user_id, token_hash, expires_at'
        )
        .eq('token_hash', tokenHash)
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: 'ERRO_AO_BUSCAR_SESSAO',
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          error: 'TOKEN_NAO_ENCONTRADO',
          hash_tamanho: tokenHash.length,
        },
        { status: 401 }
      );
    }

    if (
      new Date(session.expires_at) < new Date()
    ) {
      return NextResponse.json(
        {
          error: 'SESSAO_EXPIRADA',
          expires_at: session.expires_at,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'SESSÃO FUNCIONANDO',
      user_id: session.user_id,
      expires_at: session.expires_at,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'ERRO_INTERNO',
      },
      { status: 500 }
    );
  }
      }
