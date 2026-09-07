import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function getCurrentProfileId() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('toriland_session')?.value;

    if (!sessionToken) {
      return null;
    }

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const { data: session, error } = await supabase
      .from('auth_sessions')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !session) {
      return null;
    }

    if (
      session.expires_at &&
      new Date(session.expires_at).getTime() <= Date.now()
    ) {
      return null;
    }

    /*
     * auth_sessions.user_id corresponde ao profiles.user_id.
     * O restante do Nooklie usa profiles.id para follows/stories.
     */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', session.user_id)
      .maybeSingle();

    return profile?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({
        users: [],
        stories: [],
      });
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'A busca é muito longa.' },
        { status: 400 }
      );
    }

    const currentProfileId = await getCurrentProfileId();

    const search = `%${query}%`;

    /*
     * =========================================================
     * USUÁRIOS
     * =========================================================
     */

    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(
        'id, username, display_name, avatar_url, verified'
      )
      .or(`username.ilike.${search},display_name.ilike.${search}`)
      .order('username', { ascending: true })
      .limit(20);

    if (usersError) {
      console.error(
        'ERRO AO BUSCAR USUÁRIOS:',
        usersError
      );

      return NextResponse.json(
        { error: 'Erro ao buscar usuários.' },
        { status: 500 }
      );
    }

    /*
     * Verifica quem o usuário atual já segue.
     */

    let followingIds = new Set<string>();

    if (currentProfileId && users?.length) {
      const targetIds = users
        .map((user) => user.id)
        .filter((id) => id !== currentProfileId);

      if (targetIds.length > 0) {
        const { data: follows, error: followsError } =
          await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentProfileId)
            .in('following_id', targetIds);

        if (followsError) {
          console.error(
            'ERRO AO VERIFICAR FOLLOWS:',
            followsError
          );
        } else {
          followingIds = new Set(
            (follows || []).map(
              (follow) => follow.following_id
            )
          );
        }
      }
    }

    const publicUsers = (users || []).map((user) => ({
      ...user,
      is_following: followingIds.has(user.id),
      is_self: currentProfileId === user.id,
    }));

    /*
     * =========================================================
     * HISTÓRIAS
     * =========================================================
     */

    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .select(
        'id, author_id, title, description, cover_url, status, rating, created_at, updated_at'
      )
      .ilike('title', search)
      .order('updated_at', { ascending: false })
      .limit(30);

    if (storiesError) {
      console.error(
        'ERRO AO BUSCAR HISTÓRIAS:',
        storiesError
      );

      return NextResponse.json(
        { error: 'Erro ao buscar histórias.' },
        { status: 500 }
      );
    }

    const storyRows = stories || [];

    /*
     * =========================================================
     * AUTORES
     * =========================================================
     */

    const authorIds = Array.from(
      new Set(
        storyRows
          .map((story) => story.author_id)
          .filter(Boolean)
      )
    );

    let authors: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
      verified: boolean;
    }[] = [];

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorsError } =
        await supabase
          .from('profiles')
          .select(
            'id, username, display_name, avatar_url, verified'
          )
          .in('id', authorIds);

      if (authorsError) {
        console.error(
          'ERRO AO BUSCAR AUTORES:',
          authorsError
        );

        return NextResponse.json(
          { error: 'Erro ao carregar autores.' },
          { status: 500 }
        );
      }

      authors = authorRows || [];
    }

    const authorMap = new Map(
      authors.map((author) => [author.id, author])
    );

    /*
     * =========================================================
     * CAPÍTULOS PUBLICADOS
     * =========================================================
     */

    const storyIds = storyRows.map(
      (story) => story.id
    );

    let publishedStoryIds = new Set<string>();

    if (storyIds.length > 0) {
      const {
        data: publishedChapters,
        error: chaptersError,
      } = await supabase
        .from('chapters')
        .select('story_id')
        .in('story_id', storyIds)
        .eq('published', true);

      if (chaptersError) {
        console.error(
          'ERRO AO VERIFICAR CAPÍTULOS PUBLICADOS:',
          chaptersError
        );

        return NextResponse.json(
          {
            error:
              'Erro ao verificar histórias publicadas.',
          },
          { status: 500 }
        );
      }

      publishedStoryIds = new Set(
        (publishedChapters || []).map(
          (chapter) => chapter.story_id
        )
      );
    }

    const publicStoryRows = storyRows.filter(
      (story) => publishedStoryIds.has(story.id)
    );

    /*
     * =========================================================
     * HISTÓRIAS JÁ SALVAS NA BIBLIOTECA
     * =========================================================
     */

    let savedStoryIds = new Set<string>();

    if (
      currentProfileId &&
      publicStoryRows.length > 0
    ) {
      const { data: lists, error: listsError } =
        await supabase
          .from('reading_lists')
          .select('id')
          .eq('user_id', currentProfileId);

      if (!listsError && lists?.length) {
        const listIds = lists.map(
          (list) => list.id
        );

        const { data: savedItems, error: savedError } =
          await supabase
            .from('reading_list_items')
            .select('story_id')
            .in('list_id', listIds)
            .in(
              'story_id',
              publicStoryRows.map(
                (story) => story.id
              )
            );

        if (savedError) {
          console.error(
            'ERRO AO VERIFICAR BIBLIOTECA:',
            savedError
          );
        } else {
          savedStoryIds = new Set(
            (savedItems || []).map(
              (item) => item.story_id
            )
          );
        }
      }
    }

    const publicStories = publicStoryRows.map(
      (story) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        cover_url: story.cover_url,
        status: story.status,
        rating: story.rating,
        author: story.author_id
          ? authorMap.get(story.author_id) || null
          : null,
        is_saved: savedStoryIds.has(story.id),
        is_own_story:
          !!currentProfileId &&
          story.author_id === currentProfileId,
      })
    );

    return NextResponse.json({
      users: publicUsers,
      stories: publicStories,
      authenticated: !!currentProfileId,
    });
  } catch (error) {
    console.error(
      'ERRO GERAL NO EXPLORAR:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Erro interno ao realizar a busca.',
      },
      { status: 500 }
    );
  }
}
