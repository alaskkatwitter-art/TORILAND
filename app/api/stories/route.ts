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
GET — BUSCAR STORIES
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
      .from('stories')
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
     * Usuários que o usuário atual segue.
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
      '[STORIES] Usuário autenticado:',
      currentUser.id
    );

    /*
     * 2. Verificar se o usuário possui
     *    um perfil.
     *
     * A tabela stories possui:
     *
     * user_id uuid references profiles(id)
     *
     * Portanto, o perfil precisa existir.
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
        '[STORIES] Erro ao verificar perfil:',
        {
          message:
            profileError.message,
          details:
            profileError.details,
          hint:
            profileError.hint,
          code:
            profileError.code,
        }
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
      console.error(
        '[STORIES] Perfil não encontrado para o usuário:',
        currentUser.id
      );

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
     * 3. Ler o arquivo
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
     * 4. Verificar tamanho
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
     * 5. Verificar formato
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

    const storagePath =
      `${currentUser.id}/${fileName}`;

    uploadedStoragePath =
      storagePath;

    console.log(
      '[STORIES] Enviando arquivo:',
      storagePath
    );

    /*
     * 6. Upload para Storage
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
        '[STORIES] Erro no upload:',
        {
          message:
            uploadError.message,
          details:
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

    console.log(
      '[STORIES] Upload concluído.'
    );

    /*
     * 7. Obter URL pública
     */
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

    if (!mediaUrl) {
      console.error(
        '[STORIES] URL pública não foi gerada.'
      );

      await supabase.storage
        .from('stories')
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
     * 8. Expiração de 24 horas
     */
    const expiresAt =
      new Date(
        Date.now() +
          24 *
            60 *
            60 *
            1000
      ).toISOString();

    console.log(
      '[STORIES] Salvando registro no banco...'
    );

    /*
     * 9. Salvar Story no banco
     */
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
      /*
       * ESTE É O PONTO IMPORTANTE:
       * agora o erro real do Supabase
       * ficará visível nos logs.
       */
      console.error(
        '[STORIES] ERRO AO SALVAR NO BANCO:',
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
       * Remove o arquivo que foi enviado,
       * já que o registro não foi criado.
       */
      if (
        uploadedStoragePath
      ) {
        const {
          error: cleanupError,
        } =
          await supabase.storage
            .from('stories')
            .remove([
              uploadedStoragePath,
            ]);

        if (cleanupError) {
          console.error(
            '[STORIES] Erro ao limpar arquivo:',
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
      '[STORIES] Story publicado:',
      story?.id
    );

    /*
     * 10. Tudo certo
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
      '[STORIES] ERRO INESPERADO:',
      error
    );

    /*
     * Se alguma coisa explodir depois
     * do upload, tenta limpar o arquivo.
     */
    if (
      uploadedStoragePath
    ) {
      try {
        await supabase.storage
          .from('stories')
          .remove([
            uploadedStoragePath,
          ]);
      } catch (cleanupError) {
        console.error(
          '[STORIES] Erro na limpeza após exceção:',
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
DELETE — EXCLUIR STORY
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
     * Localiza o Story do usuário.
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
        {
          message:
            findError.message,
          details:
            findError.details,
          hint:
            findError.hint,
          code:
            findError.code,
        }
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
     * Extrai o caminho do Storage
     * a partir da URL pública.
     */
    let storagePath = '';

    try {
      const publicUrl =
        new URL(
          story.media_url
        );

      const marker =
        '/storage/v1/object/public/stories/';

      const pathname =
        publicUrl.pathname;

      const markerIndex =
        pathname.indexOf(
          marker
        );

      if (
        markerIndex !== -1
      ) {
        storagePath =
          decodeURIComponent(
            pathname.slice(
              markerIndex +
                marker.length
            )
          );
      }
    } catch {
      storagePath = '';
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
        {
          message:
            deleteError.message,
          details:
            deleteError.details,
          hint:
            deleteError.hint,
          code:
            deleteError.code,
        }
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
     * Apaga também o arquivo do Storage.
     */
    if (storagePath) {
      const {
        error: storageDeleteError,
      } =
        await supabase.storage
          .from('stories')
          .remove([
            storagePath,
          ]);

      if (
        storageDeleteError
      ) {
        console.error(
          'Erro ao excluir arquivo do Storage:',
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
      'Erro inesperado em DELETE /api/stories:',
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
