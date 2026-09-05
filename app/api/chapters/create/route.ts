import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: Request) {
  try {
    const cookie = request.headers.get('cookie') || '';

    const sessionMatch = cookie.match(
      /(?:^|;\s*)toriland_session=([^;]+)/
    );

    if (!sessionMatch) {
      return NextResponse.json(
        { error: 'Você precisa estar logado.' },
        { status: 401 }
      );
    }

    const sessionToken = sessionMatch[1];

    const tokenHash = crypto
      .createHash('sha256')
      .update(sessionToken)
      .digest('hex');

    const { data: session, error: sessionError } =
      await supabase
        .from('auth_sessions')
        .select('id, user_id, expires_at')
        .eq('token_hash', tokenHash)
        .maybeSingle();

    if (sessionError) {
      console.error(
        'Erro ao verificar sessão:',
        sessionError
      );

      return NextResponse.json(
        {
          error: 'Não foi possível verificar sua sessão.',
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const storyId = data.story_id;
    const title = data.title?.trim();
    const chapterBody = data.body?.trim();

    const publishMode =
      data.publish_mode === 'schedule'
        ? 'schedule'
        : 'now';

    const scheduledFor =
      typeof data.scheduled_for === 'string'
        ? data.scheduled_for
        : null;

    if (!storyId) {
      return NextResponse.json(
        { error: 'História não encontrada.' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Digite um título para o capítulo.' },
        { status: 400 }
      );
    }

    if (!chapterBody) {
      return NextResponse.json(
        { error: 'Escreva o conteúdo do capítulo.' },
        { status: 400 }
      );
    }

    if (title.length > 150) {
      return NextResponse.json(
        {
          error:
            'O título pode ter no máximo 150 caracteres.',
        },
        { status: 400 }
      );
    }

    /*
     * Se for agendamento, precisamos obrigatoriamente
     * receber uma data.
     */
    if (publishMode === 'schedule' && !scheduledFor) {
      return NextResponse.json(
        {
          error:
            'Escolha uma data e horário para agendar o capítulo.',
        },
        { status: 400 }
      );
    }

    let scheduledDate: Date | null = null;

    if (publishMode === 'schedule' && scheduledFor) {
      scheduledDate = new Date(scheduledFor);

      if (Number.isNaN(scheduledDate.getTime())) {
        return NextResponse.json(
          {
            error:
              'A data de publicação escolhida é inválida.',
          },
          { status: 400 }
        );
      }

      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          {
            error:
              'A data de publicação precisa ser no futuro.',
          },
          { status: 400 }
        );
      }
    }

    /*
     * Verifica se a história pertence ao usuário.
     */
    const { data: story, error: storyError } =
      await supabase
        .from('stories')
        .select('id, author_id')
        .eq('id', storyId)
        .maybeSingle();

    if (storyError || !story) {
      return NextResponse.json(
        { error: 'História não encontrada.' },
        { status: 404 }
      );
    }

    if (story.author_id !== session.user_id) {
      return NextResponse.json(
        {
          error:
            'Você não pode adicionar capítulos a esta história.',
        },
        { status: 403 }
      );
    }

    /*
     * Descobre o próximo número do capítulo.
     */
    const { data: lastChapter, error: lastChapterError } =
      await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('story_id', storyId)
        .order('chapter_number', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (lastChapterError) {
      console.error(
        'Erro ao buscar último capítulo:',
        lastChapterError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível verificar os capítulos.',
        },
        { status: 500 }
      );
    }

    const chapterNumber = lastChapter
      ? lastChapter.chapter_number + 1
      : 1;

    /*
     * Se publicar agora:
     * published = true
     *
     * Se agendar:
     * published = false
     */
    const { data: chapter, error: chapterError } =
      await supabase
        .from('chapters')
        .insert({
          story_id: storyId,
          chapter_number: chapterNumber,
          tittle: title,
          body: chapterBody,
          published: publishMode === 'now',
        })
        .select()
        .single();

    if (chapterError) {
      console.error(
        'Erro ao criar capítulo:',
        chapterError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível criar o capítulo.',
          details: chapterError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Se foi agendado, cria o registro
     * na tabela scheduled_chapters.
     */
    if (
      publishMode === 'schedule' &&
      scheduledDate
    ) {
      const { error: scheduleError } =
        await supabase
          .from('scheduled_chapters')
          .insert({
            chapter_id: chapter.id,
            scheduled_for:
              scheduledDate.toISOString(),
          });

      if (scheduleError) {
        console.error(
          'Erro ao criar agendamento:',
          scheduleError
        );

        /*
         * Se o agendamento falhar, apagamos o capítulo
         * para não deixar um capítulo "perdido".
         */
        await supabase
          .from('chapters')
          .delete()
          .eq('id', chapter.id);

        return NextResponse.json(
          {
            error:
              'Não foi possível agendar o capítulo.',
            details: scheduleError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        chapter,
        scheduled:
          publishMode === 'schedule',
        scheduled_for:
          scheduledDate?.toISOString() || null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'Erro inesperado ao criar capítulo:',
      error
    );

    return NextResponse.json(
      {
        error: 'Erro ao criar o capítulo.',
      },
      { status: 500 }
    );
  }
}
