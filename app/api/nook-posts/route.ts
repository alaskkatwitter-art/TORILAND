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

/*
 * GET
 *
 * Busca os posts do Meu Nook do usuário atualmente logado.
 */
export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        {
          status: 401,
        }
      );
    }

    const { data: posts, error } = await supabase
      .from('nook_posts')
      .select(`
        id,
        user_id,
        body,
        image_url,
        story_id,
        pinned,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('pinned', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'ERRO AO BUSCAR POSTS DO NOOK:',
        error
      );

      return NextResponse.json(
        {
          error: 'Erro ao buscar os posts.',
          details: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      posts: posts || [],
    });
  } catch (error) {
    console.error(
      'ERRO GERAL NA API DO NOOK:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * POST
 *
 * Cria um novo post no Meu Nook.
 */
export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const text =
      typeof body.body === 'string'
        ? body.body.trim()
        : '';

    const imageUrl =
      typeof body.image_url === 'string' &&
      body.image_url.trim()
        ? body.image_url.trim()
        : null;

    const storyId =
      typeof body.story_id === 'string' &&
      body.story_id.trim()
        ? body.story_id.trim()
        : null;

    if (!text && !imageUrl) {
      return NextResponse.json(
        {
          error:
            'O post precisa ter um texto ou uma imagem.',
        },
        {
          status: 400,
        }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        {
          error:
            'O post pode ter no máximo 5000 caracteres.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Se uma história for informada, verificamos
     * se ela pertence ao usuário.
     */
    if (storyId) {
      const { data: story, error: storyError } =
        await supabase
          .from('stories')
          .select('id')
          .eq('id', storyId)
          .eq('author_id', userId)
          .maybeSingle();

      if (storyError) {
        console.error(
          'ERRO AO VALIDAR HISTÓRIA DO POST:',
          storyError
        );

        return NextResponse.json(
          {
            error:
              'Não foi possível validar a história.',
            details: storyError.message,
          },
          {
            status: 500,
          }
        );
      }

      if (!story) {
        return NextResponse.json(
          {
            error:
              'A história selecionada não pertence a você.',
          },
          {
            status: 403,
          }
        );
      }
    }

    const { data: post, error } = await supabase
      .from('nook_posts')
      .insert({
        user_id: userId,
        body: text,
        image_url: imageUrl,
        story_id: storyId,
        pinned: false,
      })
      .select(`
        id,
        user_id,
        body,
        image_url,
        story_id,
        pinned,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error(
        'ERRO AO CRIAR POST DO NOOK:',
        error
      );

      return NextResponse.json(
        {
          error: 'Não foi possível criar o post.',
          details: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        post,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'ERRO GERAL AO CRIAR POST:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    );
  }
}
