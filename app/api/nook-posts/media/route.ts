import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_MEDIA_PER_POST = 4;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

async function getCurrentUserId(request: NextRequest) {
  try {
    const response = await fetch(
      new URL('/api/auth/me', request.url),
      {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) return null;

    const data = await response.json();

    return data?.authenticated && data?.user?.id
      ? data.user.id
      : null;
  } catch {
    return null;
  }
}

function getExtension(type: string) {
  switch (type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const file = formData.get('file');
    const postId = formData.get('post_id');
    const positionValue = formData.get('position');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Arquivo não enviado.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Formato não permitido. Use JPG, PNG, WEBP ou GIF.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Cada arquivo pode ter no máximo 10 MB.' },
        { status: 400 }
      );
    }

    let position = Number(positionValue);

    if (!Number.isInteger(position) || position < 0 || position > 3) {
      position = 0;
    }

    /*
     * Se a mídia pertence a uma postagem, verificamos:
     * 1. A postagem existe.
     * 2. A postagem pertence ao usuário.
     * 3. A postagem ainda não possui 4 mídias.
     */
    if (postId) {
      if (typeof postId !== 'string') {
        return NextResponse.json(
          { error: 'Postagem inválida.' },
          { status: 400 }
        );
      }

      const { data: post, error: postError } = await supabase
        .from('nook_posts')
        .select('id,user_id')
        .eq('id', postId)
        .maybeSingle();

      if (postError) {
        console.error(postError);

        return NextResponse.json(
          { error: 'Erro ao verificar a postagem.' },
          { status: 500 }
        );
      }

      if (!post) {
        return NextResponse.json(
          { error: 'Postagem não encontrada.' },
          { status: 404 }
        );
      }

      if (post.user_id !== userId) {
        return NextResponse.json(
          { error: 'Você não pode adicionar mídia a esta postagem.' },
          { status: 403 }
        );
      }

      const { count, error: countError } = await supabase
        .from('nook_post_media')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('post_id', postId);

      if (countError) {
        console.error(countError);

        return NextResponse.json(
          { error: 'Erro ao verificar as mídias da postagem.' },
          { status: 500 }
        );
      }

      if ((count ?? 0) >= MAX_MEDIA_PER_POST) {
        return NextResponse.json(
          {
            error:
              'Cada postagem pode ter no máximo 4 imagens ou GIFs.',
          },
          { status: 400 }
        );
      }
    }

    const extension = getExtension(file.type);

    const randomName = crypto.randomBytes(8).toString('hex');

    const path = `${userId}/nook-${Date.now()}-${randomName}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('nook-media')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error(uploadError);

      return NextResponse.json(
        { error: 'Não foi possível enviar a mídia.' },
        { status: 500 }
      );
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from('nook-media')
      .getPublicUrl(path);

    const url = publicUrlData.publicUrl;

    const mediaType =
      file.type === 'image/gif'
        ? 'gif'
        : 'image';

    /*
     * Quando post_id foi enviado, já vinculamos
     * automaticamente a mídia à postagem.
     */
    if (postId) {
      const { data: media, error: mediaError } = await supabase
        .from('nook_post_media')
        .insert({
          post_id: postId,
          media_url: url,
          media_type: mediaType,
          position,
        })
        .select('id,post_id,media_url,media_type,position,created_at')
        .single();

      if (mediaError) {
        console.error(mediaError);

        /*
         * Se falhar ao criar o registro no banco,
         * tentamos remover o arquivo que acabou de subir.
         */
        await supabase.storage
          .from('nook-media')
          .remove([path]);

        return NextResponse.json(
          { error: 'Não foi possível vincular a mídia à postagem.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        media,
      });
    }

    /*
     * Mantemos o comportamento sem post_id para compatibilidade.
     */
    return NextResponse.json({
      success: true,
      url,
      media_type: mediaType,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: 'Erro interno ao enviar mídia.' },
      { status: 500 }
    );
  }
}
