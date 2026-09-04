import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function getCurrentUserId(request: Request) {
  const meResponse = await fetch(
    new URL('/api/auth/me', request.url),
    {
      headers: {
        cookie: (await cookies()).toString(),
      },
      cache: 'no-store',
    }
  );

  const meData = await meResponse.json();

  if (
    !meResponse.ok ||
    !meData.authenticated ||
    !meData.user?.id
  ) {
    return null;
  }

  return meData.user.id as string;
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'Nenhum arquivo foi enviado.',
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Formato não permitido. Use JPG, PNG, WEBP ou GIF.',
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            'A imagem ou GIF pode ter no máximo 10 MB.',
        },
        { status: 400 }
      );
    }

    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };

    const extension =
      extensionMap[file.type];

    const filePath =
      `${userId}/nook-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${extension}`;

    const arrayBuffer =
      await file.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } =
      await supabase.storage
        .from('nook-media')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error(
        'ERRO AO ENVIAR MÍDIA DO NOOK:',
        uploadError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar a mídia.',
          details: uploadError.message,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } =
      supabase.storage
        .from('nook-media')
        .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      media_type:
        file.type === 'image/gif'
          ? 'gif'
          : 'image',
    });
  } catch (error) {
    console.error(
      'ERRO GERAL AO ENVIAR MÍDIA DO NOOK:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
      },
      { status: 500 }
    );
  }
}
