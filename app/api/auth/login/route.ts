import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const cleanUsername = username?.trim().toLowerCase();

    if (!cleanUsername || !password) {
      return NextResponse.json(
        { error: 'Username e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from('auth_accounts')
      .select('id, username, password_hash')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (error || !account) {
      return NextResponse.json(
        { error: 'Username ou senha incorretos.' },
        { status: 401 }
      );
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      account.password_hash
    );

    if (!passwordCorrect) {
      return NextResponse.json(
        { error: 'Username ou senha incorretos.' },
        { status: 401 }
      );
    }

    const sessionId = crypto.randomUUID();

    const sessionToken = crypto
      .randomBytes(32)
      .toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 30
    );

    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert({
        id: sessionId,
        user_id: account.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      return NextResponse.json(
        { error: 'Não foi possível iniciar sua sessão.' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      message: 'Login realizado com sucesso.',
      username: account.username,
    });

    response.cookies.set(
      'toriland_session',
      sessionToken,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: expiresAt,
      }
    );

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível realizar o login.' },
      { status: 500 }
    );
  }
}
