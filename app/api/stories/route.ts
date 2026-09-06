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

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

if (
  !supabaseUrl ||
  !supabaseSecretKey
) {
  throw new Error(
    'Variáveis do Supabase não configuradas.'
  );
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

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

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
      new URL(
        '/api/auth/me',
        request.url
      ),
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

    const data =
      await authResponse.json();

    if (
      !data?.authenticated ||
      !data?.user?.id
    ) {
      return null;
    }

    return data.user;
  } catch (error) {
    console.error(
      'Erro ao verificar autenticação:',
      error
    );

    return null;
  }
}

/*
=========================================================
GET — BUSCAR STORIES DE 24 HORAS
=========================================================
*/

export async function GET(
  request: NextRequest
) {
  try {
    const currentUser =
      await getAuthenticatedUser(
        request
      );

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
    const {
      error: expiredStoriesError,
    } = await supabase
      .from('social_stories')
      .delete()
      .lt(
        'expires_at',
        new Date().toISOString()
      );

    if (expiredStoriesError) {
      console.error(
        'Erro ao remover Stories expirados:',
        expiredStoriesError
      );
    }

    /*
     * Busca quem o usuário segue.
     */
    const {
      data: follows,
      error: followsError,
    } = await supabase
      .from('follows')
      .select(
        'following_id'
      )
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
          details:
            followsError.message,
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
    const userIds =
      Array.from(
        new Set([
          currentUser.id,
          ...followingIds,
        ])
      );

    /*
     * Busca os Stories de 24h.
     */
    const {
      data: stories,
      error: storiesError,
    } = await supabase
      .from('social_stories')
      .select(
        `
          id,
          user_id,
          media_url,
          media_type,
          created_at,
          expires_at,
          user:profiles!social_stories_user_id_fkey (
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
        {
          message:
            storiesError.message,
          details:
            storiesError.details,
          hint:
            storiesError.hint,
          code:
            storiesError.code,
        }
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar os Stories.',
          details:
            storiesError.message,
          code:
            storiesError.code,
        },
        {
          status: 500,
        }
      );
    }

    const normalizedStories =
      (
        (stories || []) as StoryRow[]
      ).map((story) => ({
        ...story,
        user:
          Array.isArray(
            story.user
          )
            ? story.user[0] || null
            : story.user || null,
      }));

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
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
POST — PUBLICAR STORY DE 24 HORAS
=========================================================
*/

export async function POST(
  request: NextRequest
) {
  let uploadedStoragePath =
    '';

  try {
    /*
     * 1. Verificar autenticação
     */
    const currentUser =
      await getAuthenticatedUser(
        request
      );

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

    console.log(
      '[SOCIAL STORIES] Usuário:',
      currentUser.id
    );

    /*
     * 2. Confirmar que o perfil existe.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('id')
      .eq(
        'id',
        currentUser.id
      )
      .maybeSingle();

    if (profileError) {
      console.error(
        '[SOCIAL STORIES] Erro ao verificar perfil:',
        profileError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível verificar seu perfil.',
          details:
            profileError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            'Seu perfil não foi encontrado. Faça login novamente.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * 3. Ler arquivo enviado.
     */
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

    /*
     * 4. Verificar tamanho.
     */
    if (
      file.size >
      MAX_FILE_SIZE
    ) {
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

    /*
     * 5. Verificar formato.
     */
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

    /*
     * IMPORTANTE:
     * Bucket exclusivo dos Stories de 24h.
     */
    const storagePath =
      `${currentUser.id}/${fileName}`;

    uploadedStoragePath =
      storagePath;

    console.log(
      '[SOCIAL STORIES] Upload:',
      storagePath
    );

    /*
     * 6. Upload para o bucket
     *    social-stories
     */
    const {
      error: uploadError,
    } = await supabase.storage
      .from('social-stories')
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
        '[SOCIAL STORIES] Erro no upload:',
        {
          message:
            uploadError.message,
          name:
            uploadError.name,
        }
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar a imagem.',
          details:
            uploadError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 7. URL pública.
     */
    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from('social-stories')
        .getPublicUrl(
          storagePath
        );

    const mediaUrl =
      publicUrlData.publicUrl;

    if (!mediaUrl) {
      await supabase.storage
        .from('social-stories')
        .remove([
          storagePath,
        ]);

      uploadedStoragePath =
        '';

      return NextResponse.json(
        {
          error:
            'Não foi possível gerar a URL da imagem.',
        },
        {
          status: 500,
        }
      );
    }

    /*
     * 8. Expiração de 24 horas.
     */
    const expiresAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000
      ).toISOString();

    /*
     * 9. Salvar no banco EXCLUSIVO
     *    dos Stories de 24h.
     */
    const {
      data: story,
      error: storyError,
    } = await supabase
      .from('social_stories')
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
        '[SOCIAL STORIES] ERRO AO SALVAR NO BANCO:',
        {
          message:
            storyError.message,
          details:
            storyError.details,
          hint:
            storyError.hint,
          code:
            storyError.code,
        }
      );

      /*
       * Se o banco falhar, remove
       * o arquivo que acabou de subir.
       */
      if (
        uploadedStoragePath
      ) {
        const {
          error:
            cleanupError,
        } =
          await supabase.storage
            .from(
              'social-stories'
            )
            .remove([
              uploadedStoragePath,
            ]);

        if (cleanupError) {
          console.error(
            '[SOCIAL STORIES] Erro ao limpar arquivo:',
            cleanupError
          );
        }
      }

      return NextResponse.json(
        {
          error:
            'Não foi possível publicar o Story.',
          details:
            storyError.message,
          code:
            storyError.code,
          hint:
            storyError.hint || null,
        },
        {
          status: 500,
        }
      );
    }

    console.log(
      '[SOCIAL STORIES] Story publicado:',
      story?.id
    );

    /*
     * 10. Sucesso.
     */
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
      '[SOCIAL STORIES] ERRO INESPERADO:',
      error
    );

    /*
     * Limpeza caso algo dê errado
     * depois do upload.
     */
    if (
      uploadedStoragePath
    ) {
      try {
        await supabase.storage
          .from(
            'social-stories'
          )
          .remove([
            uploadedStoragePath,
          ]);
      } catch (cleanupError) {
        console.error(
          '[SOCIAL STORIES] Erro na limpeza:',
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/*
=========================================================
DELETE — EXCLUIR STORY DE 24 HORAS
=========================================================
*/

export async function DELETE(
  request: NextRequest
) {
  try {
    const currentUser =
      await getAuthenticatedUser(
        request
      );

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
     * Buscar Story do usuário.
     */
    const {
      data: story,
      error: findError,
    } = await supabase
      .from('social_stories')
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
        '[SOCIAL STORIES] Erro ao localizar:',
        findError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível localizar o Story.',
          details:
            findError.message,
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
     * Descobrir o caminho do Storage.
     */
    let storagePath = '';

    try {
      const publicUrl =
        new URL(
          story.media_url
        );

      const marker =
        '/storage/v1/object/public/social-stories/';

      const markerIndex =
        publicUrl.pathname.indexOf(
          marker
        );

      if (
        markerIndex !== -1
      ) {
        storagePath =
          decodeURIComponent(
            publicUrl.pathname.slice(
              markerIndex +
                marker.length
            )
          );
      }
    } catch {
      storagePath = '';
    }

    /*
     * Apagar registro.
     */
    const {
      error: deleteError,
    } = await supabase
      .from('social_stories')
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
        '[SOCIAL STORIES] Erro ao excluir:',
        deleteError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível excluir o Story.',
          details:
            deleteError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Apagar arquivo do Storage.
     */
    if (storagePath) {
      const {
        error:
          storageDeleteError,
      } =
        await supabase.storage
          .from(
            'social-stories'
          )
          .remove([
            storagePath,
          ]);

      if (
        storageDeleteError
      ) {
        console.error(
          '[SOCIAL STORIES] Erro ao excluir arquivo:',
          storageDeleteError
        );
      }
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
      '[SOCIAL STORIES] ERRO INESPERADO NO DELETE:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Erro interno do servidor.',
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}
