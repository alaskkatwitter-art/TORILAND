import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

async function getCurrentUserId(request: NextRequest) {
  try {
    const response = await fetch(
      `${request.nextUrl.origin}/api/auth/me`,
      {
        method: 'GET',
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data.authenticated || !data.user?.id) {
      return null;
    }

    return data.user.id as string;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Você precisa estar logado.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const postId = formData.get('post_id');

    const files = formData
      .getAll('files')
      .filter(
        (item): item is File =>
          item instanceof File
      );

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhuma imagem foi enviada.',
        },
        { status: 400 }
      );
    }

    if (files.length > 4) {
      return NextResponse.json(
        {
          error:
            'Você pode adicionar no máximo 4 imagens ou GIFs por postagem.',
        },
        { status: 400 }
      );
    }

    if (postId && typeof postId !== 'string') {
      return NextResponse.json(
        {
          error: 'Postagem inválida.',
        },
        { status: 400 }
      );
    }

    /*
     * Se estamos anexando mídia a um post existente,
     * verificamos se o post pertence ao usuário.
     */
    if (postId) {
      const { data: post, error: postError } =
        await supabase
          .from('nook_posts')
          .select('id,user_id')
          .eq('id', postId)
          .maybeSingle();

      if (postError) {
        return NextResponse.json(
          {
            error:
              'Não foi possível verificar a postagem.',
            details: postError.message,
          },
          { status: 500 }
        );
      }

      if (!post || post.user_id !== userId) {
        return NextResponse.json(
          {
            error:
              'Você não pode adicionar mídia a esta postagem.',
          },
          { status: 403 }
        );
      }

      const { count } = await supabase
        .from('nook_post_media')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('post_id', postId);

      const currentCount = count || 0;

      if (currentCount + files.length > 4) {
        return NextResponse.json(
          {
            error:
              'Esta postagem já possui mídias suficientes. O limite é 4.',
          },
          { status: 400 }
        );
      }
    }

    const uploadedMedia: {
      url: string;
      media_type: 'image' | 'gif';
    }[] = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `O arquivo "${file.name}" não é um formato permitido.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `O arquivo "${file.name}" ultrapassa o limite de 10 MB.`,
          },
          { status: 400 }
        );
      }

      const extension =
        file.name.split('.').pop()?.toLowerCase() ||
        'jpg';

      const randomName = crypto
        .randomBytes(8)
        .toString('hex');

      const fileName = `${userId}/nook-${Date.now()}-${randomName}.${extension}`;

      const buffer = Buffer.from(
        await file.arrayBuffer()
      );

      const { error: uploadError } =
        await supabase.storage
          .from('nook-media')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        console.error(
          'Erro no upload da mídia:',
          uploadError
        );

        return NextResponse.json(
          {
            error:
              'Não foi possível enviar uma das imagens.',
            details: uploadError.message,
          },
          { status: 500 }
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('nook-media')
          .getPublicUrl(fileName);

      uploadedMedia.push({
        url: publicUrlData.publicUrl,
        media_type:
          file.type === 'image/gif'
            ? 'gif'
            : 'image',
      });
    }

    /*
     * Quando existe post_id, já registramos as mídias
     * na tabela nook_post_media.
     */
    if (postId) {
      const rows = uploadedMedia.map(
        (media) => ({
          post_id: postId,
          media_url: media.url,
          media_type: media.media_type,
        })
      );

      const { data: insertedMedia, error: insertError } =
        await supabase
          .from('nook_post_media')
          .insert(rows)
          .select(
            'id,post_id,media_url,media_type,created_at'
          );

      if (insertError) {
        console.error(
          'Erro ao registrar mídia:',
          insertError
        );

        return NextResponse.json(
          {
            error:
              'As imagens foram enviadas, mas não foi possível vinculá-las à postagem.',
            details: insertError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        media: insertedMedia || [],
      });
    }

    /*
     * Sem post_id, apenas fazemos o upload.
     * A página criará o post e depois vinculará
     * as mídias usando o ID criado.
     */
    return NextResponse.json({
      success: true,
      media: uploadedMedia,
    });
  } catch (error) {
    console.error(
      'Erro inesperado no upload:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Ocorreu um erro ao enviar as imagens.',
      },
      { status: 500 }
    );
  }
}
