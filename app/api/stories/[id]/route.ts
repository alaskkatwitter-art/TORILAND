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
        { error: 'História não encontrada.' },
        { status: 404 }
      );
    }

    const { data: story, error } =
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

    if (error) {
      return NextResponse.json(
        {
          error:
            'Não foi possível carregar a história.',
        },
        { status: 500 }
      );
    }

    if (!story) {
      return NextResponse.json(
        { error: 'História não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      story,
    });
  } catch {
    return NextResponse.json(
      {
        error:
          'Não foi possível carregar a história.',
      },
      { status: 500 }
    );
  }
}
