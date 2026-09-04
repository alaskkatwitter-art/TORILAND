import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da história não informado.' },
        { status: 400 }
      );
    }

    // =========================
    // USUÁRIO LOGADO
    // =========================

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('toriland_session')?.value;

    let currentUserId: string | null = null;

    if (sessionToken) {
      const { data: session } = await supabase
        .from('auth_sessions')
        .select('user_id, expires_at')
        .eq('token', sessionToken)
        .maybeSingle();

      if (
        session &&
        (!session.expires_at ||
          new Date(session.expires_at).getTime() > Date.now())
      ) {
        currentUserId = session.user_id;
      }
    }

    // =========================
    // HISTÓRIA
    // =========================

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        id,
        author_id,
        title,
        description,
        cover_url,
        status,
        rating,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .maybeSingle();

    if (storyError) {
      console.error('Erro ao buscar história:', storyError);

      return NextResponse.json(
        { error: 'Erro ao buscar história.' },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        { error: 'História não encontrada.' },
        { status: 404 }
      );
    }

    // =========================
    // AUTOR
    // =========================

    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        display_name,
        avatar_url
      `)
      .eq('id', story.author_id)
      .maybeSingle();

    if (authorError) {
      console.error('Erro ao buscar autor:', authorError);
    }

    // =========================
    // CAPÍTULOS
    // =========================

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        id,
        story_id,
        chapter_number,
        title,
        published,
        created_at
      `)
      .eq('story_id', id)
      .eq('published', true)
      .order('chapter_number', { ascending: true });

    if (chaptersError) {
      console.error('Erro ao buscar capítulos:', chaptersError);

      return NextResponse.json(
        { error: 'Erro ao buscar capítulos.' },
        { status: 500 }
      );
    }

    const storyChapters = chapters || [];

    // =========================
    // TAGS
    // =========================

    const { data: storyTags, error: tagsError } = await supabase
      .from('story_tags')
      .select(`
        tag_id,
        tags (
          id,
          name,
          slug,
          category_id,
          tag_categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq('story_id', id);

    if (tagsError) {
      console.error('Erro ao buscar tags:', tagsError);
    }

    const tags = (storyTags || [])
      .map((item: any) => {
        const tag = item.tags;

        if (!tag) {
          return null;
        }

        const category = Array.isArray(tag.tag_categories)
          ? tag.tag_categories[0]
          : tag.tag_categories;

        return {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          category: category?.name || null,
          category_slug: category?.slug || null,
        };
      })
      .filter(Boolean);

    // =========================
    // CURTIDAS
    // =========================

    const { count: likesCount, error: likesError } = await supabase
      .from('story_likes')
      .select('*', {
        count: 'exact',
        head: true,
      })
      .eq('story_id', id);

    if (likesError) {
      console.error('Erro ao contar curtidas:', likesError);
    }

    // =========================
    // USUÁRIO CURTIU?
    // =========================

    let liked = false;

    if (currentUserId) {
      const { data: like } = await supabase
        .from('story_likes')
        .select('story_id')
        .eq('story_id', id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      liked = !!like;
    }

    // =========================
    // RESPOSTA
    // =========================

    return NextResponse.json({
      story: {
        ...story,
        author: author || null,

        // Tags
        tags,

        // Capítulos dentro da história
        chapters: storyChapters,

        // Curtidas
        likes: likesCount || 0,
        liked,
      },

      // Mantém também no nível principal
      // para compatibilidade com o page.tsx antigo
      chapters: storyChapters,
    });
  } catch (error) {
    console.error(
      'Erro inesperado na API da história:',
      error
    );

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
