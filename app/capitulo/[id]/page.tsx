'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Chapter = {
  id: string;
  story_id?: string;
  chapter_number: number;
  title: string;
  body?: string;
  published?: boolean;
  created_at?: string;
};

type Comment = {
  id: string;
  chapter_id: string;
  user_id: string;
  body: string;
  selected_text: string | null;
  start_offset: number | null;
  parent_comment_id: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function CapituloPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [previousChapter, setPreviousChapter] =
    useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] =
    useState<Chapter | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const [showContents, setShowContents] = useState(false);

  const [selectedText, setSelectedText] = useState('');
  const [selectionOffset, setSelectionOffset] = useState<number | null>(
    null
  );

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadChapter() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/chapters/${id}`, {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Não foi possível carregar o capítulo.'
          );
        }

        setChapter(data.chapter);
        setPreviousChapter(data.previousChapter || null);
        setNextChapter(data.nextChapter || null);

        if (data.chapter?.story_id) {
          const storyResponse = await fetch(
            `/api/stories/${data.chapter.story_id}`,
            {
              cache: 'no-store',
            }
          );

          const storyData = await storyResponse.json();

          if (storyResponse.ok) {
            setChapters(storyData.chapters || []);
          }
        }

        const commentsResponse = await fetch(
          `/api/comments?chapter_id=${id}`,
          {
            cache: 'no-store',
          }
        );

        const commentsData = await commentsResponse.json();

        if (commentsResponse.ok) {
          setComments(commentsData.comments || []);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar o capítulo.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadChapter();
    }
  }, [id]);

  function handleTextSelection() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();

    if (!text) {
      return;
    }

    if (!chapter?.body) {
      return;
    }

    const fullText = chapter.body;
    const start = fullText.indexOf(text);

    if (start === -1) {
      return;
    }

    setSelectedText(text);
    setSelectionOffset(start);
    setShowCommentBox(true);
  }

  function cancelComment() {
    setShowCommentBox(false);
    setCommentText('');
    setSelectedText('');
    setSelectionOffset(null);

    window.getSelection()?.removeAllRanges();
  }

  async function submitComment() {
    if (!commentText.trim()) {
      return;
    }

    try {
      setSendingComment(true);

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_id: id,
          body: commentText.trim(),
          selected_text: selectedText || null,
          start_offset: selectionOffset,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        alert('Você precisa estar logado para comentar.');
        return;
      }

      if (!response.ok) {
        alert(
          data.error || 'Não foi possível publicar o comentário.'
        );
        return;
      }

      setComments((current) => [
        ...current,
        data.comment,
      ]);

      cancelComment();
    } catch {
      alert('Não foi possível publicar o comentário.');
    } finally {
      setSendingComment(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <p className="text-[#ff4f9a]">
          Carregando capítulo...
        </p>
      </main>
    );
  }

  if (error || !chapter) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-5">
            {error || 'Capítulo não encontrado.'}
          </p>

          <button
            onClick={() => router.back()}
            className="px-5 py-3 rounded-xl bg-[#ff4f9a] text-black font-semibold"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-3xl mx-auto px-5 py-8">

        {/* Topo */}
        <div className="flex items-center justify-between gap-4 mb-8">

          <button
            onClick={() =>
              router.push(`/historia/${chapter.story_id}`)
            }
            className="text-sm text-gray-400 hover:text-white transition"
          >
            ← Voltar para a história
          </button>

          <button
            onClick={() => setShowContents(true)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold hover:border-[#ff4f9a]/50 transition"
          >
            ☰ Sumário
          </button>

        </div>

        {/* Cabeçalho */}
        <header className="mb-10">
          <p className="text-sm text-[#ff4f9a] mb-2">
            Capítulo {chapter.chapter_number}
          </p>

          <h1 className="text-3xl font-bold">
            {chapter.title}
          </h1>
        </header>

        {/* Texto */}
        <article
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          className="text-[18px] leading-8 text-gray-200 font-serif whitespace-pre-wrap select-text"
        >
          {chapter.body}
        </article>

        {/* Caixa de comentário */}
        {showCommentBox && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4">

            <div className="w-full max-w-xl bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-2xl">

              <div className="flex items-start justify-between gap-4 mb-5">

                <div>
                  <p className="text-xs text-[#ff4f9a] uppercase tracking-wider mb-2">
                    Comentando o trecho
                  </p>

                  <p className="text-sm text-gray-300 italic leading-6">
                    “{selectedText}”
                  </p>
                </div>

                <button
                  onClick={cancelComment}
                  className="text-gray-500 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              <textarea
                value={commentText}
                onChange={(event) =>
                  setCommentText(event.target.value)
                }
                placeholder="Escreva seu comentário..."
                rows={4}
                autoFocus
                className="w-full resize-none rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-gray-600 outline-none focus:border-[#ff4f9a]/60"
              />

              <div className="flex justify-end gap-3 mt-4">

                <button
                  onClick={cancelComment}
                  className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={submitComment}
                  disabled={
                    sendingComment ||
                    !commentText.trim()
                  }
                  className="px-5 py-2 rounded-xl bg-[#ff4f9a] text-black text-sm font-semibold disabled:opacity-50 transition"
                >
                  {sendingComment
                    ? 'Publicando...'
                    : 'Comentar'}
                </button>

              </div>

            </div>
          </div>
        )}

        {/* Comentários */}
        <section className="mt-16 pt-10 border-t border-white/10">

          <h2 className="text-2xl font-bold mb-6">
            Comentários
          </h2>

          {comments.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
              <p className="text-gray-500 text-sm">
                Ainda não há comentários neste capítulo.
              </p>

              <p className="text-gray-600 text-xs mt-2">
                Selecione um trecho do texto para ser o primeiro.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-2xl bg-white/5 border border-white/10 p-5"
                >

                  {comment.selected_text && (
                    <div className="border-l-2 border-[#ff4f9a] pl-4 mb-4">
                      <p className="text-xs text-gray-500 mb-1">
                        Trecho comentado
                      </p>

                      <p className="text-sm text-gray-300 italic">
                        “{comment.selected_text}”
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">

                    {comment.profiles?.avatar_url ? (
                      <img
                        src={comment.profiles.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#ff4f9a]/20 flex items-center justify-center text-[#ff4f9a] text-xs font-bold">
                        {(comment.profiles?.display_name ||
                          comment.profiles?.username ||
                          '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-semibold text-white">
                        {comment.profiles?.display_name ||
                          comment.profiles?.username ||
                          'Usuário'}
                      </p>

                      {comment.profiles?.username && (
                        <p className="text-xs text-gray-600">
                          @{comment.profiles.username}
                        </p>
                      )}
                    </div>

                  </div>

                  <p className="text-gray-300 leading-7">
                    {comment.body}
                  </p>

                </div>
              ))}

            </div>
          )}

        </section>

        {/* Navegação */}
        <nav className="mt-14 pt-8 border-t border-white/10 flex items-center justify-between gap-4">

          {previousChapter ? (
            <button
              onClick={() =>
                router.push(`/capitulo/${previousChapter.id}`)
              }
              className="flex-1 text-left px-4 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4f9a]/50 transition"
            >
              <span className="block text-xs text-gray-500 mb-1">
                Capítulo anterior
              </span>

              <span className="text-sm font-semibold text-white">
                ← Capítulo {previousChapter.chapter_number}
              </span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {nextChapter ? (
            <button
              onClick={() =>
                router.push(`/capitulo/${nextChapter.id}`)
              }
              className="flex-1 text-right px-4 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4f9a]/50 transition"
            >
              <span className="block text-xs text-gray-500 mb-1">
                Próximo capítulo
              </span>

              <span className="text-sm font-semibold text-white">
                Capítulo {nextChapter.chapter_number} →
              </span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

        </nav>

      </div>

      {/* Sumário */}
      {showContents && (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setShowContents(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#111111] border-l border-white/10 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="sticky top-0 bg-[#111111] border-b border-white/10 px-6 py-5 flex items-center justify-between">

              <div>
                <p className="text-xs text-[#ff4f9a] uppercase tracking-wider">
                  História
                </p>

                <h2 className="text-xl font-bold mt-1">
                  Sumário
                </h2>
              </div>

              <button
                onClick={() => setShowContents(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>

            </div>

            <div className="p-4">

              {chapters.length === 0 ? (
                <p className="text-gray-500 text-sm px-2 py-4">
                  Nenhum capítulo encontrado.
                </p>
              ) : (
                <div className="space-y-2">

                  {chapters.map((item) => {
                    const isCurrent =
                      item.id === chapter.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowContents(false);

                          if (!isCurrent) {
                            router.push(
                              `/capitulo/${item.id}`
                            );
                          }
                        }}
                        className={`w-full text-left px-4 py-4 rounded-xl border transition ${
                          isCurrent
                            ? 'bg-[#ff4f9a]/10 border-[#ff4f9a]/50'
                            : 'bg-white/5 border-white/10 hover:border-[#ff4f9a]/40'
                        }`}
                      >

                        <div className="flex items-center gap-3">

                          <span
                            className={`text-xs font-semibold ${
                              isCurrent
                                ? 'text-[#ff4f9a]'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.chapter_number}
                          </span>

                          <div className="min-w-0">

                            <p
                              className={`font-semibold truncate ${
                                isCurrent
                                  ? 'text-[#ff4f9a]'
                                  : 'text-white'
                              }`}
                            >
                              {item.title}
                            </p>

                            {isCurrent && (
                              <p className="text-xs text-gray-500 mt-1">
                                Você está aqui
                              </p>
                            )}

                          </div>

                        </div>

                      </button>
                    );
                  })}

                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </main>
  );
}
