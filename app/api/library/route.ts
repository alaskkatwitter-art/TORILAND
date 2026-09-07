import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET() {
  try {
    /* =====================================================
       1. PEGAR SESSÃO
    ===================================================== */

    const cookieStore = await cookies();

    const sessionToken =
      cookieStore.get('toriland_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. VALIDAR SESSÃO
    ===================================================== */

    const tokenHash =
      crypto
        .createHash('sha256')
        .update(sessionToken)
        .digest('hex');

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from('auth_sessions')
      .select(
        'user_id, expires_at'
      )
      .eq(
        'token_hash',
        tokenHash
      )
      .maybeSingle();

    if (sessionError) {
      console.error(
        'ERRO AO PROCURAR SESSÃO:',
        sessionError
      );

      return NextResponse.json(
        {
          error:
            'Erro ao verificar sessão.',
        },
        {
          status: 401,
        }
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          error:
            'Sessão inválida.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       3. VERIFICAR EXPIRAÇÃO
    ===================================================== */

    if (
      new Date(
        session.expires_at
      ).getTime() <= Date.now()
    ) {
      await supabase
        .from('auth_sessions')
        .delete()
        .eq(
          'token_hash',
          tokenHash
        );

      return NextResponse.json(
        {
          error:
            'Sessão expirada.',
        },
        {
          status: 401,
        }
      );
    }

    const userId =
      session.user_id;

    /* =====================================================
       4. PEGAR LISTAS DO USUÁRIO
       
       A biblioteca é formada pelas histórias
       presentes em reading_list_items das listas
       pertencentes ao usuário.
    ===================================================== */

    const {
      data: lists,
      error: listsError,
    } = await supabase
      .from('reading_lists')
      .select(
        'id, name'
      )
      .eq(
        'user_id',
        userId
      );

    if (listsError) {
      console.error(
        'ERRO AO PROCURAR LISTAS:',
        listsError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar suas listas de leitura.',
        },
        {
          status: 500,
        }
      );
    }

    const listIds =
      (lists || []).map(
        (list) => list.id
      );

    /* =====================================================
       5. SE NÃO EXISTIREM LISTAS,
          A BIBLIOTECA ESTÁ VAZIA
    ===================================================== */

    if (listIds.length === 0) {
      return NextResponse.json({
        items: [],
      });
    }

    /* =====================================================
       6. PEGAR HISTÓRIAS SALVAS NAS LISTAS
    ===================================================== */

    const {
      data: listItems,
      error: listItemsError,
    } = await supabase
      .from('reading_list_items')
      .select(
        'id, list_id, story_id, added_at'
      )
      .in(
        'list_id',
        listIds
      )
      .order(
        'added_at',
        {
          ascending: false,
        }
      );

    if (listItemsError) {
      console.error(
        'ERRO AO PROCURAR ITENS DA BIBLIOTECA:',
        listItemsError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar as histórias da biblioteca.',
        },
        {
          status: 500,
        }
      );
    }

    if (
      !listItems ||
      listItems.length === 0
    ) {
      return NextResponse.json({
        items: [],
      });
    }

    /* =====================================================
       7. PEGAR IDS ÚNICOS DAS HISTÓRIAS

       Uma mesma história pode estar em várias listas.
       Por isso removemos duplicações aqui.
    ===================================================== */

    const storyIds =
      Array.from(
        new Set(
          listItems
            .map(
              (item) =>
                item.story_id
            )
            .filter(Boolean)
        )
      );

    if (storyIds.length === 0) {
      return NextResponse.json({
        items: [],
      });
    }

    /* =====================================================
       8. PEGAR HISTÓRIAS
    ===================================================== */

    const {
      data: stories,
      error: storiesError,
    } = await supabase
      .from('stories')
      .select(
        `
          id,
          author_id,
          title,
          description,
          cover_url,
          status,
          created_at,
          updated_at,
          rating
        `
      )
      .in(
        'id',
        storyIds
      );

    if (storiesError) {
      console.error(
        'ERRO AO PROCURAR HISTÓRIAS:',
        storiesError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar as histórias.',
        },
        {
          status: 500,
        }
      );
    }

    if (
      !stories ||
      stories.length === 0
    ) {
      return NextResponse.json({
        items: [],
      });
    }

    /* =====================================================
       9. PEGAR AUTORES
    ===================================================== */

    const authorIds =
      Array.from(
        new Set(
          stories
            .map(
              (story) =>
                story.author_id
            )
            .filter(Boolean)
        )
      );

    let profiles: any[] = [];

    if (
      authorIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(
          `
            user_id,
            username,
            display_name,
            avatar_url
          `
        )
        .in(
          'user_id',
          authorIds
        );

      if (error) {
        console.error(
          'ERRO AO PROCURAR AUTORES:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Não foi possível carregar os autores das histórias.',
          },
          {
            status: 500,
          }
        );
      }

      profiles =
        data || [];
    }

    /* =====================================================
       10. PEGAR PROGRESSO DE LEITURA
    ===================================================== */

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from('reading_progress')
      .select(
        `
          user_id,
          story_id,
          chapter_id,
          progress_percent,
          position,
          updated_at
        `
      )
      .eq(
        'user_id',
        userId
      )
      .in(
        'story_id',
        storyIds
      );

    if (progressError) {
      console.error(
        'ERRO AO PROCURAR PROGRESSO:',
        progressError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível carregar seu progresso de leitura.',
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       11. PEGAR CAPÍTULOS DO PROGRESSO
    ===================================================== */

    const chapterIds =
      Array.from(
        new Set(
          (progress || [])
            .map(
              (item) =>
                item.chapter_id
            )
            .filter(Boolean)
        )
      );

    let chapters: any[] = [];

    if (
      chapterIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabase
        .from('chapters')
        .select(
          `
            id,
            title
          `
        )
        .in(
          'id',
          chapterIds
        );

      if (error) {
        console.error(
          'ERRO AO PROCURAR CAPÍTULOS:',
          error
        );

        return NextResponse.json(
          {
            error:
              'Não foi possível carregar os capítulos.',
          },
          {
            status: 500,
          }
        );
      }

      chapters =
        data || [];
    }

    /* =====================================================
       12. MAPAS PARA MONTAR A RESPOSTA
    ===================================================== */

    const listsById =
      new Map(
        (lists || []).map(
          (list) => [
            list.id,
            list,
          ]
        )
      );

    const profilesByUserId =
      new Map(
        profiles.map(
          (profile) => [
            profile.user_id,
            profile,
          ]
        )
      );

    const progressByStoryId =
      new Map(
        (progress || []).map(
          (item) => [
            item.story_id,
            item,
          ]
        )
      );

    const chaptersById =
      new Map(
        chapters.map(
          (chapter) => [
            chapter.id,
            chapter,
          ]
        )
      );

    /* =====================================================
       13. MONTAR ITENS DA BIBLIOTECA
    ===================================================== */

    const items =
      stories
        .map(
          (story) => {
            const storyListItems =
              listItems.filter(
                (item) =>
                  item.story_id ===
                  story.id
              );

            const storyLists =
              storyListItems
                .map(
                  (item) =>
                    listsById.get(
                      item.list_id
                    )?.name
                )
                .filter(
                  Boolean
                ) as string[];

            const storyProgress =
              progressByStoryId.get(
                story.id
              );

            const chapter =
              storyProgress?.chapter_id
                ? chaptersById.get(
                    storyProgress.chapter_id
                  )
                : null;

            const author =
              profilesByUserId.get(
                story.author_id
              );

            return {
              story_id:
                story.id,

              story_title:
                story.title,

              story_description:
                story.description,

              story_cover_url:
                story.cover_url,

              story_status:
                story.status,

              story_rating:
                story.rating,

              author_username:
                author?.username ||
                null,

              author_display_name:
                author?.display_name ||
                null,

              author_avatar_url:
                author?.avatar_url ||
                null,

              chapter_id:
                storyProgress?.chapter_id ||
                null,

              chapter_title:
                chapter?.title ||
                null,

              progress_percent:
                storyProgress?.progress_percent !=
                null
                  ? Number(
                      storyProgress.progress_percent
                    )
                  : 0,

              position:
                storyProgress?.position !=
                null
                  ? Number(
                      storyProgress.position
                    )
                  : 0,

              updated_at:
                storyProgress?.updated_at ||
                story.updated_at ||
                null,

              lists:
                storyLists,
            };
          }
        )
        .sort(
          (
            a,
            b
          ) => {
            const dateA =
              a.updated_at
                ? new Date(
                    a.updated_at
                  ).getTime()
                : 0;

            const dateB =
              b.updated_at
                ? new Date(
                    b.updated_at
                  ).getTime()
                : 0;

            return (
              dateB -
              dateA
            );
          }
        );

    /* =====================================================
       14. RESPOSTA
    ===================================================== */

    return NextResponse.json({
      items,
    });
  } catch (error) {
    console.error(
      'ERRO GERAL NA API DA BIBLIOTECA:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Erro interno ao carregar sua biblioteca.',
      },
      {
        status: 500,
      }
    );
  }
}
