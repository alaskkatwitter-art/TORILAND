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

    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return NextResponse.json(
        {
          error:
            'O username deve ter entre 3 e 30 caracteres e usar apenas letras, números e _.',
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha precisa ter pelo menos 8 caracteres.' },
        { status: 400 }
      );
    }

    const { data: existingAccount, error: searchError } = await supabase
      .from('auth_accounts')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (searchError) {
      return NextResponse.json(
        { error: 'Não foi possível verificar o username.' },
        { status: 500 }
      );
    }

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Esse username já está sendo usado.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const recoveryKey = crypto.randomBytes(16).toString('hex');
    const recoveryKeyHash = await bcrypt.hash(recoveryKey, 12);

    const userId = crypto.randomUUID();

    const { error: accountError } = await supabase
      .from('auth_accounts')
      .insert({
        id: userId,
        username: cleanUsername,
        password_hash: passwordHash,
        recovery_key_hash: recoveryKeyHash,
      });

    if (accountError) {
      return NextResponse.json(
        { error: 'Não foi possível criar a conta.' },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_id: userId,
        username: cleanUsername,
      });

    if (profileError) {
      await supabase
        .from('auth_accounts')
        .delete()
        .eq('id', userId);

      return NextResponse.json(
        { error: 'Não foi possível criar o perfil.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Conta criada com sucesso.',
        recoveryKey,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível criar a conta.' },
      { status: 500 }
    );
  }
      }
