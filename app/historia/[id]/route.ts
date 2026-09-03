import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .select(`
          id,
          author_id,
          title,
          description,
          cover_url,
          status,
          created_at,
          updated_at,
          profiles:author_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .maybeSingle();

    if (storyError) {
      return NextResponse.json(
        {
          error: 'Não foi possível carregar a história.',
          details: storyError.message,
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        {
          error: 'História não encontrada.',
        },
        { status: 404 }
      );
    }

    const { data: chapters, error: chaptersError } =
      await supabase
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
        .order('chapter_number', {
          ascending: true,
        });

    if (chaptersError) {
      return NextResponse.json(
        {
          error: 'Não foi possível carregar os capítulos.',
          details: chaptersError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      story,
      chapters: chapters || [],
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Erro ao carregar a história.',
      },
      { status: 500 }
    );
  }
}
