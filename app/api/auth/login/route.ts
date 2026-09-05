import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const SESSION_DURATION_DAYS = 30;
const SESSION_DURATION_SECONDS =
  SESSION_DURATION_DAYS * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const username = data?.username?.trim().toLowerCase();
    const password = data?.password;

    if (!username || !password) {
      return NextResponse.json(
        {
          error: 'Username e senha são obrigatórios.',
        },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return NextResponse.json(
        {
          error:
            'O username deve ter entre 3 e 30 caracteres e usar apenas letras, números e _.',
        },
        { status: 400 }
      );
    }

    /*
     * Procura a conta pelo username.
     */
    const { data: account, error: accountError } =
      await supabase
        .from('auth_accounts')
        .select('id, username, password_hash')
        .eq('username', username)
        .maybeSingle();

    if (accountError) {
      console.error(
        'Erro ao procurar conta no login:',
        accountError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível entrar agora. Tente novamente.',
        },
        { status: 500 }
      );
    }

    /*
     * Não revelamos se o username existe ou não.
     */
    if (!account) {
      return NextResponse.json(
        {
          error: 'Username ou senha incorretos.',
        },
        { status: 401 }
      );
    }

    /*
     * Confere a senha usando o mesmo bcrypt usado no cadastro.
     */
    const passwordValid = await bcrypt.compare(
      password,
      account.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        {
          error: 'Username ou senha incorretos.',
        },
        { status: 401 }
      );
    }

    /*
     * Gera um token de sessão aleatório.
     *
     * O token puro vai apenas para o cookie.
     * No banco guardamos somente o SHA-256.
     */
    const sessionToken = crypto
      .randomBytes(32)
      .toString('base64url');

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_SECONDS * 1000
    ).toISOString();

    /*
     * Cria a sessão no banco.
     */
    const { error: sessionError } = await supabase
      .from('auth_sessions')
      .insert({
        user_id: account.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error(
        'Erro ao criar sessão:',
        sessionError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível criar sua sessão. Tente novamente.',
        },
        { status: 500 }
      );
    }

    /*
     * Cria a resposta de sucesso.
     */
    const response = NextResponse.json(
      {
        message: 'Login realizado com sucesso.',
        authenticated: true,
        user: {
          id: account.id,
          username: account.username,
        },
      },
      { status: 200 }
    );

    /*
     * Cookie da sessão.
     *
     * httpOnly:
     * JavaScript do navegador não consegue ler o token.
     *
     * secure:
     * em produção, o cookie só trafega por HTTPS.
     *
     * sameSite=lax:
     * ajuda a proteger contra CSRF mantendo o funcionamento
     * normal da navegação.
     */
    response.cookies.set({
      name: 'toriland_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('Erro inesperado no login:', error);

    return NextResponse.json(
      {
        error: 'Não foi possível conectar ao Toriland.',
      },
      { status: 500 }
    );
  }
}
