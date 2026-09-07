import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

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

    const search = `%${query}%`;

    /*
     * USUÁRIOS
     */
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.${search},display_name.ilike.${search}`)
      .order('username', { ascending: true })
      .limit(20);

    if (usersError) {
      console.error('ERRO AO BUSCAR USUÁRIOS:', usersError);

      return NextResponse.json(
        { error: 'Erro ao buscar usuários.' },
        { status: 500 }
      );
    }

    /*
     * HISTÓRIAS
     *
     * Procuramos pelo título.
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
      console.error('ERRO AO BUSCAR HISTÓRIAS:', storiesError);

      return NextResponse.json(
        { error: 'Erro ao buscar histórias.' },
        { status: 500 }
      );
    }

    const storyRows = stories || [];

    /*
     * Descobre quais autores estão relacionados às histórias.
     *
     * No banco do Nooklie, stories.author_id corresponde ao
     * profiles.id.
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
    }[] = [];

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorsError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', authorIds);

      if (authorsError) {
        console.error('ERRO AO BUSCAR AUTORES:', authorsError);

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
     * Mantemos apenas histórias que possuem pelo menos
     * um capítulo publicado.
     *
     * Assim uma história que ainda é apenas rascunho
     * não aparece publicamente no Explorar.
     */
    const storyIds = storyRows.map((story) => story.id);

    let publishedStoryIds = new Set<string>();

    if (storyIds.length > 0) {
      const { data: publishedChapters, error: chaptersError } =
        await supabase
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
          { error: 'Erro ao verificar histórias publicadas.' },
          { status: 500 }
        );
      }

      publishedStoryIds = new Set(
        (publishedChapters || []).map(
          (chapter) => chapter.story_id
        )
      );
    }

    const publicStories = storyRows
      .filter((story) => publishedStoryIds.has(story.id))
      .map((story) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        cover_url: story.cover_url,
        status: story.status,
        rating: story.rating,
        author: story.author_id
          ? authorMap.get(story.author_id) || null
          : null,
      }));

    return NextResponse.json({
      users: users || [],
      stories: publicStories,
    });
  } catch (error) {
    console.error('ERRO GERAL NO EXPLORAR:', error);

    return NextResponse.json(
      { error: 'Erro interno ao realizar a busca.' },
      { status: 500 }
    );
  }
}
