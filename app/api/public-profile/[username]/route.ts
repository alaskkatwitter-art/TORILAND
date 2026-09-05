import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Variáveis do Supabase não configuradas.');
}

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey
);

const ALLOWED_REACTIONS = [
  '❤️',
  '😂',
  '😭',
  '😱',
  '👀',
  '🔥',
];

async function getCurrentUserId(request: Request) {
  try {
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
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username não informado.' },
        { status: 400 }
      );
    }

    const decodedUsername = decodeURIComponent(username).trim();

    if (!decodedUsername) {
      return NextResponse.json(
        { error: 'Username inválido.' },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * USUÁRIO ATUAL
     * =========================================================
     */

    const currentUserId = await getCurrentUserId(request);

    /*
     * =========================================================
     * PERFIL
     * =========================================================
     */

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select(
          `
          id,
          username,
          display_name,
          bio,
          avatar_url,
          cover_url,
          theme_color
          `
        )
        .eq('username', decodedUsername)
        .maybeSingle();

    if (profileError) {
      console.error(
        'Erro ao buscar perfil:',
        profileError
      );

      return NextResponse.json(
        { error: 'Erro ao buscar perfil.' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Perfil não encontrado.' },
        { status: 404 }
      );
    }

    /*
     * =========================================================
     * HISTÓRIAS
     * =========================================================
     */

    const { data: stories, error: storiesError } =
      await supabase
        .from('stories')
        .select('*')
        .eq('author_id', profile.id)
        .order('updated_at', {
          ascending: false,
        });

    if (storiesError) {
      console.error(
        'Erro ao buscar histórias:',
        storiesError
      );

      return NextResponse.json(
        { error: 'Erro ao buscar histórias.' },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * POSTS
     * =========================================================
     */

    const { data: posts, error: postsError } =
      await supabase
        .from('nook_posts')
        .select(
          `
          id,
          user_id,
          body,
          image_url,
          story_id,
          pinned,
          created_at,
          updated_at
          `
        )
        .eq('user_id', profile.id)
        .order('pinned', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        });

    if (postsError) {
      console.error(
        'Erro ao buscar posts:',
        postsError
      );

      return NextResponse.json(
        { error: 'Erro ao buscar posts.' },
        { status: 500 }
      );
    }

    const safePosts = posts || [];
    const postIds = safePosts.map((post) => post.id);

    if (postIds.length === 0) {
      return NextResponse.json({
        user: profile,
        stories: stories || [],
        posts: [],
      });
    }

    /*
     * =========================================================
     * MÍDIAS
     * =========================================================
     */

    const {
      data: media,
      error: mediaError,
    } = await supabase
      .from('nook_post_media')
      .select(
        `
        id,
        post_id,
        media_url,
        media_type,
        created_at
        `
      )
      .in('post_id', postIds)
      .order('created_at', {
        ascending: true,
      });

    if (mediaError) {
      console.error(
        'Erro ao buscar mídias:',
        mediaError
      );

      return NextResponse.json(
        {
          error:
            'Erro ao buscar mídias dos posts.',
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * REAÇÕES
     * =========================================================
     */

    const {
      data: reactions,
      error: reactionsError,
    } = await supabase
      .from('nook_post_reactions')
      .select(
        `
        post_id,
        user_id,
        emoji
        `
      )
      .in('post_id', postIds);

    if (reactionsError) {
      console.error(
        'Erro ao buscar reações:',
        reactionsError
      );

      return NextResponse.json(
        {
          error:
            'Erro ao buscar reações dos posts.',
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * COMENTÁRIOS
     * =========================================================
     */

    const {
      data: comments,
      error: commentsError,
    } = await supabase
      .from('nook_comments')
      .select(
        `
        id,
        post_id
        `
      )
      .in('post_id', postIds);

    if (commentsError) {
      console.error(
        'Erro ao buscar comentários:',
        commentsError
      );

      return NextResponse.json(
        {
          error:
            'Erro ao buscar comentários dos posts.',
        },
        { status: 500 }
      );
    }

    /*
     * =========================================================
     * ENRIQUECER POSTS
     * =========================================================
     */

    const postsWithData = safePosts.map((post) => {
      const postMedia =
        media
          ?.filter(
            (item) =>
              item.post_id === post.id
          )
          .slice(0, 4) || [];

      const postReactions =
        reactions?.filter(
          (reaction) =>
            reaction.post_id === post.id
        ) || [];

      const postComments =
        comments?.filter(
          (comment) =>
            comment.post_id === post.id
        ) || [];

      const reactionCounts: Record<
        string,
        number
      > = {};

      for (const reaction of ALLOWED_REACTIONS) {
        reactionCounts[reaction] = 0;
      }

      const userReactions: string[] = [];

      for (const reaction of postReactions) {
        if (
          typeof reaction.emoji === 'string' &&
          ALLOWED_REACTIONS.includes(
            reaction.emoji
          )
        ) {
          reactionCounts[reaction.emoji] =
            (reactionCounts[reaction.emoji] || 0) +
            1;
        }

        if (
          currentUserId &&
          reaction.user_id === currentUserId
        ) {
          userReactions.push(reaction.emoji);
        }
      }

      return {
        ...post,

        author: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
        },

        media: postMedia,

        reaction_counts: reactionCounts,

        user_reactions: userReactions,

        comments_count:
          postComments.length,
      };
    });

    /*
     * =========================================================
     * RESPOSTA
     * =========================================================
     */

    return NextResponse.json({
      user: profile,
      stories: stories || [],
      posts: postsWithData,
    });
  } catch (error) {
    console.error(
      'Erro inesperado no perfil público:',
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
