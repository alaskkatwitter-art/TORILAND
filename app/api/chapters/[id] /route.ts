
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

    if (!id) {
      return NextResponse.json(
        { error: 'Capítulo não encontrado.' },
        { status: 404 }
      );
    }

    const { data: chapter, error } = await supabase
      .from('chapters')
      .select(`
        id,
        story_id,
        chapter_number,
        title,
        body,
        published,
        created_at
      `)
      .eq('id', id)
      .eq('published', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: 'Não foi possível carregar o capítulo.',
        },
        { status: 500 }
      );
    }

    if (!chapter) {
      return NextResponse.json(
        { error: 'Capítulo não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      chapter,
    });
  } catch {
    return NextResponse.json(
      {
        error: 'Não foi possível carregar o capítulo.',
      },
      { status: 500 }
    );
  }
}
