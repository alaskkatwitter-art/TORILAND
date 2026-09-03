import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  let uploadedCoverPath = '';

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

    const formData = await request.formData();

    const titleValue = formData.get('title');
    const descriptionValue = formData.get('description');
    const statusValue = formData.get('status');
    const coverValue = formData.get('cover');

    const title =
      typeof titleValue === 'string'
        ? titleValue.trim()
        : '';

    const description =
      typeof descriptionValue === 'string'
        ? descriptionValue.trim()
        : '';

    const status =
      typeof statusValue === 'string'
        ? statusValue.trim()
        : 'Em andamento';

    if (!title) {
      return NextResponse.json(
        {
          error: 'O título da história é obrigatório.',
        },
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

    if (description.length > 2000) {
      return NextResponse.json(
        {
          error:
            'A sinopse pode ter no máximo 2000 caracteres.',
        },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      'Em andamento',
      'Concluída',
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: 'Status de história inválido.',
        },
        { status: 400 }
      );
    }

    let coverUrl: string | null = null;

    if (coverValue instanceof File && coverValue.size > 0) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      if (!allowedTypes.includes(coverValue.type)) {
        return NextResponse.json(
          {
            error:
              'Formato de capa inválido. Use JPG, PNG ou WEBP.',
          },
          { status: 400 }
        );
      }

      if (coverValue.size > 8 * 1024 * 1024) {
        return NextResponse.json(
          {
            error:
              'A capa pode ter no máximo 8 MB.',
          },
          { status: 400 }
        );
      }

      const extension =
        coverValue.type === 'image/jpeg'
          ? 'jpg'
          : coverValue.type === 'image/png'
          ? 'png'
          : 'webp';

      uploadedCoverPath =
        `${session.user_id}/story-${Date.now()}.${extension}`;

      const arrayBuffer =
        await coverValue.arrayBuffer();

      const fileBuffer = Buffer.from(arrayBuffer);

      const { error: uploadError } =
        await supabase.storage
          .from('story-covers')
          .upload(
            uploadedCoverPath,
            fileBuffer,
            {
              contentType: coverValue.type,
              upsert: false,
            }
          );

      if (uploadError) {
        return NextResponse.json(
          {
            error:
              'Não foi possível enviar a capa da história.',
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('story-covers')
          .getPublicUrl(uploadedCoverPath);

      coverUrl = publicUrlData.publicUrl;
    }

    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .insert({
          author_id: session.user_id,
          title,
          description: description || null,
          cover_url: coverUrl,
          status,
        })
        .select(
          'id, author_id, title, description, cover_url, status, created_at, updated_at'
        )
        .single();

    if (storyError || !story) {
      if (uploadedCoverPath) {
        await supabase.storage
          .from('story-covers')
          .remove([uploadedCoverPath]);
      }

      return NextResponse.json(
        {
          error:
            storyError?.message ||
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
    if (uploadedCoverPath) {
      await supabase.storage
        .from('story-covers')
        .remove([uploadedCoverPath]);
    }

    return NextResponse.json(
      {
        error:
          'Não foi possível criar a história.',
      },
      { status: 500 }
    );
  }
}
