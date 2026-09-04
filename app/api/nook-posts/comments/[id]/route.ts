import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function getCurrentUserId(request: Request) {
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
}

/*
 * PATCH
 *
 * Edita o próprio comentário.
 */
export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID do comentário não informado.',
        },
        { status: 400 }
      );
    }

    const { data: existingComment, error: findError } =
      await supabase
        .from('nook_comments')
        .select('id, author_id')
        .eq('id', id)
        .maybeSingle();

    if (findError) {
      console.error(
        'ERRO AO BUSCAR COMENTÁRIO:',
        findError
      );

      return NextResponse.json(
        {
          error: 'Erro ao buscar comentário.',
        },
        { status: 500 }
      );
    }

    if (!existingComment) {
      return NextResponse.json(
        {
          error: 'Comentário não encontrado.',
        },
        { status: 404 }
      );
    }

    if (existingComment.author_id !== userId) {
      return NextResponse.json(
        {
          error:
            'Você não tem permissão para editar este comentário.',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const content =
      typeof body.content === 'string'
        ? body.content.trim()
        : '';

    if (!content) {
      return NextResponse.json(
        {
          error: 'O comentário não pode estar vazio.',
        },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        {
          error:
            'O comentário pode ter no máximo 2000 caracteres.',
        },
        { status: 400 }
      );
    }

    const { data: comment, error } =
      await supabase
        .from('nook_comments')
        .update({
          content,
        })
        .eq('id', id)
        .eq('author_id', userId)
        .select(`
          id,
          post_id,
          author_id,
          content,
          parent_id,
          created_at,
          updated_at
        `)
        .single();

    if (error) {
      console.error(
        'ERRO AO EDITAR COMENTÁRIO:',
        error
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível editar o comentário.',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comment,
    });
  } catch (error) {
    console.error(
      'ERRO GERAL AO EDITAR COMENTÁRIO:',
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

/*
 * DELETE
 *
 * Exclui o próprio comentário.
 *
 * Como a tabela usa ON DELETE CASCADE,
 * respostas daquele comentário também serão
 * removidas.
 */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const userId = await getCurrentUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'Não autenticado.',
        },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: 'ID do comentário não informado.',
        },
        { status: 400 }
      );
    }

    const { data: comment, error: findError } =
      await supabase
        .from('nook_comments')
        .select('id, author_id')
        .eq('id', id)
        .maybeSingle();

    if (findError) {
      console.error(
        'ERRO AO BUSCAR COMENTÁRIO PARA EXCLUSÃO:',
        findError
      );

      return NextResponse.json(
        {
          error: 'Erro ao buscar comentário.',
        },
        { status: 500 }
      );
    }

    if (!comment) {
      return NextResponse.json(
        {
          error: 'Comentário não encontrado.',
        },
        { status: 404 }
      );
    }

    if (comment.author_id !== userId) {
      return NextResponse.json(
        {
          error:
            'Você não tem permissão para excluir este comentário.',
        },
        { status: 403 }
      );
    }

    const { error: deleteError } =
      await supabase
        .from('nook_comments')
        .delete()
        .eq('id', id)
        .eq('author_id', userId);

    if (deleteError) {
      console.error(
        'ERRO AO EXCLUIR COMENTÁRIO:',
        deleteError
      );

      return NextResponse.json(
        {
          error:
            'Não foi possível excluir o comentário.',
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comentário excluído com sucesso.',
      commentId: id,
    });
  } catch (error) {
    console.error(
      'ERRO GERAL AO EXCLUIR COMENTÁRIO:',
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
