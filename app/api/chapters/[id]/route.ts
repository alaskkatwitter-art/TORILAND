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

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        {
          error: 'Capítulo não encontrado.',
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    /*
     * Primeiro procuramos o capítulo pelo ID.
     *
     * Não filtramos "published" aqui.
     * Assim evitamos que um problema no valor dessa coluna
     * transforme um capítulo existente em um falso 404.
     */
    const { data: chapter, error: chapterError } = await supabase
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
      .maybeSingle();

    if (chapterError) {
      console.error(
        'Erro ao buscar capítulo:',
        chapterError
      );

      return NextResponse.json(
        {
          error: 'Não foi possível carregar o capítulo.',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    if (!chapter) {
      return NextResponse.json(
        {
          error: 'Capítulo não encontrado.',
        },
        {
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      );
    }

    /*
     * Busca o capítulo anterior.
     */
    const { data: previousChapter, error: previousError } =
      await supabase
        .from('chapters')
        .select(
          'id, story_id, chapter_number, title, published'
        )
        .eq('story_id', chapter.story_id)
        .eq('published', true)
        .lt(
          'chapter_number',
          chapter.chapter_number
        )
        .order('chapter_number', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (previousError) {
      console.error(
        'Erro ao buscar capítulo anterior:',
        previousError
      );
    }

    /*
     * Busca o próximo capítulo.
     */
    const { data: nextChapter, error: nextError } =
      await supabase
        .from('chapters')
        .select(
          'id, story_id, chapter_number, title, published'
        )
        .eq('story_id', chapter.story_id)
        .eq('published', true)
        .gt(
          'chapter_number',
          chapter.chapter_number
        )
        .order('chapter_number', {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

    if (nextError) {
      console.error(
        'Erro ao buscar próximo capítulo:',
        nextError
      );
    }

    /*
     * Retorna sempre uma resposta sem cache.
     */
    return NextResponse.json(
      {
        chapter,
        previousChapter: previousChapter || null,
        nextChapter: nextChapter || null,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error(
      'Erro inesperado ao carregar capítulo:',
      error
    );

    return NextResponse.json(
      {
        error: 'Não foi possível carregar o capítulo.',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
