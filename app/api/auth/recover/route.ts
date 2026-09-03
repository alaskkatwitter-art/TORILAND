import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const {
      username,
      recoveryKey,
      newPassword,
    } = await request.json();

    const cleanUsername = username?.trim().toLowerCase();

    if (!cleanUsername || !recoveryKey || !newPassword) {
      return NextResponse.json(
        {
          error:
            'Username, chave de recuperação e nova senha são obrigatórios.',
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          error:
            'A nova senha precisa ter pelo menos 8 caracteres.',
        },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabase
      .from('auth_accounts')
      .select('id, recovery_key_hash')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (error || !account) {
      return NextResponse.json(
        {
          error:
            'Username ou chave de recuperação incorretos.',
        },
        { status: 401 }
      );
    }

    const recoveryKeyCorrect = await bcrypt.compare(
      recoveryKey,
      account.recovery_key_hash
    );

    if (!recoveryKeyCorrect) {
      return NextResponse.json(
        {
          error:
            'Username ou chave de recuperação incorretos.',
        },
        { status: 401 }
      );
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      12
    );

    const { error: updateError } = await supabase
      .from('auth_accounts')
      .update({
        password_hash: newPasswordHash,
      })
      .eq('id', account.id);

    if (updateError) {
      return NextResponse.json(
        {
          error:
            'Não foi possível alterar sua senha.',
        },
        { status: 500 }
      );
    }

    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', account.id);

    return NextResponse.json({
      message: 'Senha alterada com sucesso.',
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Não foi possível recuperar sua conta.',
      },
      { status: 500 }
    );
  }
}
