import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type AuthUser = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type StoryRow = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'gif' | 'video';
  created_at: string;
  expires_at: string;
  user?: AuthUser | AuthUser[] | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Variáveis do Supabase não configuradas.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    const authResponse = await fetch(
      new URL('/api/auth/me', request.url),
      {
        method: 'GET',
        headers: {
          cookie: cookieHeader,
        },
        cache: 'no-store',
      }
    );

    if (!authResponse.ok) {
      return null;
    }

    const data = await authResponse.json();

    if (!data?.authenticated || !data?.user?.id) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}

/*
=========================================================
GET — BUSCAR STORIES
=========================================================
*/

export async function GET(request: NextRequest) {
  try {
    const currentUser =
      await getAuthenticatedUser(request);

    if (!currentUser) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Primeiro removemos Stories expirados.
     *
     * Isso evita que Stories antigos continuem aparecendo
     * mesmo que ainda estejam registrados no banco.
     */
    await supabase
      .from('stories')
      .delete()
      .lt('expires_at', new Date().toISOString());

    /*
     * Buscamos os usuários que o usuário atual segue.
     */
    const { data: follows, error: followsError } =
      await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

    if (followsError) {
      console.error(
        'Erro ao buscar follows:',
        followsError
      );

      return NextResponse.json(
        {
          error: 'Não foi possível carregar os Stories.',
        },
        {
          status: 500,
        }
      );
    }

    const followingIds = (follows || []).map(
      (follow) => follow.following_id
    );

    /*
     * O próprio usuário também pode visualizar
     * seus próprios Stories.
     */
    const userIds = Array.from(
      new Set([
        currentUser.id,
        ...followingIds,
      ])
    );

    const { data: stories, error: storiesError } =
      await supabase
        .from('stories')
        .select(
          `
            id,
            user_id,
            media_url,
            media_type,
            created_at,
            expires_at,
            user:profiles!stories_user_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `
        )
        .in('user_id', userIds)
        .gt(
          'expires_at',
          new Date().toISOString()
        )
        .order('created_at', {
          ascending: true,
        });

    if (storiesError) {
      console.error(
        'Erro ao buscar Stories:',
        storiesError
      );

      return NextResponse.json(
        {
          error: 'Não foi possível carregar os Stories.',
        },
        {
          status: 500,
        }
      );
    }

    const normalizedStories =
      ((stories || []) as StoryRow[]).map(
        (story) => ({
          ...story,
          user: Array.isArray(story.user)
            ? story.user[0] || null
            : story.user || null,
        })
      );

    return NextResponse.json(
      {
        stories: normalizedStories,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'Erro inesperado em GET /api/stories:',
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
=========================================================
POST — CRIAR STORY
=========================================================
*/

export async function POST(request: NextRequest) {
  try {
    const currentUser =
      await getAuthenticatedUser(request);

    if (!currentUser) {
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

    const mediaUrl =
      typeof body?.mediaUrl === 'string'
        ? body.mediaUrl.trim()
        : '';

    const mediaType =
      body?.mediaType === 'gif'
        ? 'gif'
        : body?.mediaType === 'video'
          ? 'video'
          : 'image';

    if (!mediaUrl) {
      return NextResponse.json(
        {
          error: 'A mídia do Story é obrigatória.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Um usuário pode ter vários Stories ativos.
     *
     * Cada Story dura 24 horas.
     */
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: story, error } =
      await supabase
        .from('stories')
        .insert({
          user_id: currentUser.id,
          media_url: mediaUrl,
          media_type: mediaType,
          expires_at: expiresAt,
        })
        .select(
          `
            id,
            user_id,
            media_url,
            media_type,
            created_at,
            expires_at
          `
        )
        .single();

    if (error) {
      console.error(
        'Erro ao criar Story:',
        error
      );

      return NextResponse.json(
        {
          error: 'Não foi possível publicar o Story.',
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        story,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      'Erro inesperado em POST /api/stories:',
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
=========================================================
DELETE — EXCLUIR STORY
=========================================================
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const currentUser =
      await getAuthenticatedUser(request);

    if (!currentUser) {
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

    const storyId =
      typeof body?.storyId === 'string'
        ? body.storyId.trim()
        : '';

    if (!storyId) {
      return NextResponse.json(
        {
          error: 'Story não informado.',
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', currentUser.id);

    if (error) {
      console.error(
        'Erro ao excluir Story:',
        error
      );

      return NextResponse.json(
        {
          error: 'Não foi possível excluir o Story.',
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'Erro inesperado em DELETE /api/stories:',
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
