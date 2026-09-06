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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthUser | null> {
  try {
    const cookieHeader =
      request.headers.get('cookie') || '';

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

    if (
      !data?.authenticated ||
      !data?.user?.id
    ) {
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

export async function GET(
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

    /*
     * Remove Stories expirados.
     */
    await supabase
      .from('stories')
      .delete()
      .lt(
        'expires_at',
        new Date().toISOString()
      );

    /*
     * Usuários que o usuário atual segue.
     */
    const {
      data: follows,
      error: followsError,
    } = await supabase
      .from('follows')
      .select('following_id')
      .eq(
        'follower_id',
        currentUser.id
      );

    if (followsError) {
      console.error(
        'Erro ao buscar follows:',
        followsError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar os Stories.',
        },
        {
          status: 500,
        }
      );
    }

    const followingIds =
      (follows || []).map(
        (follow) =>
          follow.following_id
      );

    /*
     * O próprio usuário também aparece.
     */
    const userIds = Array.from(
      new Set([
        currentUser.id,
        ...followingIds,
      ])
    );

    const {
      data: stories,
      error: storiesError,
    } = await supabase
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
      .in(
        'user_id',
        userIds
      )
      .gt(
        'expires_at',
        new Date().toISOString()
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (storiesError) {
      console.error(
        'Erro ao buscar Stories:',
        storiesError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar os Stories.',
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
          user: Array.isArray(
            story.user
          )
            ? story.user[0] || null
            : story.user || null,
        })
      );

    return NextResponse.json(
      {
        stories:
          normalizedStories,
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
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
POST — PUBLICAR STORY
=========================================================
*/

export async function POST(
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

    const formData =
      await request.formData();

    const file =
      formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error:
            'Nenhuma imagem foi enviada.',
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            'A imagem ou GIF deve ter no máximo 5 MB.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !ALLOWED_TYPES.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Formato não permitido. Use JPG, PNG, WEBP ou GIF.',
        },
        {
          status: 400,
        }
      );
    }

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg';

    const mediaType =
      file.type ===
      'image/gif'
        ? 'gif'
        : 'image';

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const storagePath =
      `${currentUser.id}/${fileName}`;

    /*
     * Envia o arquivo para:
     *
     * Storage → stories → user_id → arquivo
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from('stories')
      .upload(
        storagePath,
        file,
        {
          contentType:
            file.type,
          cacheControl:
            '3600',
          upsert: false,
        }
      );

    if (uploadError) {
      console.error(
        'Erro ao fazer upload do Story:',
        uploadError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar a imagem.',
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from('stories')
        .getPublicUrl(
          storagePath
        );

    const mediaUrl =
      publicUrlData.publicUrl;

    /*
     * Story expira depois de 24 horas.
     */
    const expiresAt =
      new Date(
        Date.now() +
          24 * 60 * 60 * 1000
      ).toISOString();

    const {
      data: story,
      error: storyError,
    } = await supabase
      .from('stories')
      .insert({
        user_id:
          currentUser.id,
        media_url:
          mediaUrl,
        media_type:
          mediaType,
        expires_at:
          expiresAt,
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

    if (storyError) {
      console.error(
        'Erro ao salvar Story:',
        storyError
      );

      /*
       * Se o registro não puder ser salvo,
       * tentamos remover o arquivo enviado.
       */
      await supabase.storage
        .from('stories')
        .remove([
          storagePath,
        ]);

      return NextResponse.json(
        {
          error:
            'Não foi possível publicar o Story.',
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
        error:
          'Erro interno do servidor.',
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

    const body =
      await request.json();

    const storyId =
      typeof body?.storyId ===
      'string'
        ? body.storyId.trim()
        : '';

    if (!storyId) {
      return NextResponse.json(
        {
          error:
            'Story não informado.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Buscamos primeiro a URL para
     * conseguir apagar também o arquivo
     * do Storage.
     */
    const {
      data: story,
      error: findError,
    } = await supabase
      .from('stories')
      .select(
        'id, user_id, media_url'
      )
      .eq(
        'id',
        storyId
      )
      .eq(
        'user_id',
        currentUser.id
      )
      .maybeSingle();

    if (findError) {
      console.error(
        'Erro ao localizar Story:',
        findError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível localizar o Story.',
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
            'Story não encontrado.',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Apaga o registro.
     */
    const {
      error: deleteError,
    } = await supabase
      .from('stories')
      .delete()
      .eq(
        'id',
        storyId
      )
      .eq(
        'user_id',
        currentUser.id
      );

    if (deleteError) {
      console.error(
        'Erro ao excluir Story:',
        deleteError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível excluir o Story.',
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
        error:
          'Erro interno do servidor.',
      },
      {
        status: 500,
      }
    );
  }
}
