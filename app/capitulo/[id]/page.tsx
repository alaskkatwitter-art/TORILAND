'use client';

import { useEffect, useRef, useState } from 'react';
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

type Sticker = {
  id: string;
  image_url: string;
  created_at: string;
  last_used_at: string | null;
};

type Comment = {
  id: string;
  chapter_id: string;
  user_id: string;
  body: string;
  selected_text: string | null;
  start_offset: number | null;
  parent_comment_id: string | null;
  sticker_id: string | null;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  user_stickers?: {
    id: string;
    image_url: string;
  } | null;
};

export default function CapituloPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [previousChapter, setPreviousChapter] =
    useState<Chapter | null>(null);
  const [nextChapter, setNextChapter] =
    useState<Chapter | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);

  const [showContents, setShowContents] = useState(false);

  const [selectedText, setSelectedText] = useState('');
  const [selectionOffset, setSelectionOffset] = useState<number | null>(
    null
  );

  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const [showStickers, setShowStickers] = useState(false);
  const [selectedSticker, setSelectedSticker] =
    useState<Sticker | null>(null);
  const [uploadingSticker, setUploadingSticker] = useState(false);

  const [activeCommentGroup, setActiveCommentGroup] = useState<Comment[]>(
    []
  );

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

        const stickersResponse = await fetch('/api/stickers', {
          cache: 'no-store',
        });

        const stickersData = await stickersResponse.json();

        if (stickersResponse.ok) {
          setStickers(stickersData.stickers || []);
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
    setShowStickers(false);
    setSelectedSticker(null);

    window.getSelection()?.removeAllRanges();
  }

  async function handleStickerUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setUploadingSticker(true);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/stickers', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        alert('Você precisa estar logado para criar uma figurinha.');
        return;
      }

      if (!response.ok) {
        alert(
          data.error || 'Não foi possível criar a figurinha.'
        );
        return;
      }

      const newSticker = data.sticker as Sticker;

      setStickers((current) => [
        newSticker,
        ...current.filter(
          (sticker) => sticker.id !== newSticker.id
        ),
      ]);

      setSelectedSticker(newSticker);
      setShowStickers(false);
    } catch {
      alert('Não foi possível enviar a figurinha.');
    } finally {
      setUploadingSticker(false);
    }
  }

  function selectSticker(sticker: Sticker) {
    setSelectedSticker(sticker);
    setShowStickers(false);
  }

  async function submitComment() {
    if (!commentText.trim() && !selectedSticker) {
      alert('Escreva um comentário ou escolha uma figurinha.');
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
          body: commentText.trim() || ' ',
          selected_text: selectedText || null,
          start_offset: selectionOffset,
          sticker_id: selectedSticker?.id || null,
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

      if (selectedSticker) {
        setStickers((current) =>
          current
            .map((sticker) =>
              sticker.id === selectedSticker.id
                ? {
                    ...sticker,
                    last_used_at: new Date().toISOString(),
                  }
                : sticker
            )
            .sort((a, b) => {
              const aTime = a.last_used_at
                ? new Date(a.last_used_at).getTime()
                : 0;

              const bTime = b.last_used_at
                ? new Date(b.last_used_at).getTime()
                : 0;

              return bTime - aTime;
            })
        );
      }

      cancelComment();
    } catch {
      alert('Não foi possível publicar o comentário.');
    } finally {
      setSendingComment(false);
    }
  }

  function getCommentGroups() {
    const groups = new Map<string, Comment[]>();

    comments.forEach((comment) => {
      if (
        comment.start_offset === null ||
        !comment.selected_text
      ) {
        return;
      }

      const key = `${comment.start_offset}-${comment.selected_text.length}`;

      const current = groups.get(key) || [];

      groups.set(key, [...current, comment]);
    });

    return Array.from(groups.values());
  }

  function renderChapterText() {
    if (!chapter?.body) {
      return null;
    }

    const text = chapter.body;

    const commentGroups = getCommentGroups()
      .map((group) => {
        const first = group[0];

        if (
          first.start_offset === null ||
          !first.selected_text
        ) {
          return null;
        }

        return {
          comments: group,
          start: first.start_offset,
          end:
            first.start_offset +
            first.selected_text.length,
        };
      })
      .filter(
        (
          group
        ): group is {
          comments: Comment[];
          start: number;
          end: number;
        } => group !== null
      )
      .sort((a, b) => a.start - b.start);

    if (commentGroups.length === 0) {
      return text;
    }

    const pieces: React.ReactNode[] = [];

    let currentPosition = 0;

    commentGroups.forEach((group, index) => {
      if (group.start < currentPosition) {
        return;
      }

      if (group.start > currentPosition) {
        pieces.push(
          <span key={`text-${index}-${currentPosition}`}>
            {text.slice(currentPosition, group.start)}
          </span>
        );
      }

      const selected = text.slice(
        group.start,
        group.end
      );

      pieces.push(
        <span
          key={`commented-${index}`}
          className="relative inline rounded bg-white/[0.035] box-decoration-clone"
        >
          <span className="border-b border-white/20">
            {selected}
          </span>

          <button
            type="button"
            aria-label="Ver comentários deste trecho"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setActiveCommentGroup(group.comments);
            }}
            className="inline-flex align-middle ml-1.5 -translate-y-[1px] w-[18px] h-[18px] items-center justify-center rounded-full opacity-80 hover:opacity-100 transition"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-[15px] h-[15px]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 18.5C4.79 17.52 3.25 15.3 3.25 12.75C3.25 9.02 6.27 6 10 6H14C17.73 6 20.75 9.02 20.75 12.75C20.75 16.48 17.73 19.5 14 19.5H10.5L7 21V18.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500"
              />
            </svg>
          </button>
        </span>
      );

      currentPosition = group.end;
    });

    if (currentPosition < text.length) {
      pieces.push(
        <span key={`text-end-${currentPosition}`}>
          {text.slice(currentPosition)}
        </span>
      );
    }

    return pieces;
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

  const recentStickers = [...stickers]
    .sort((a, b) => {
      const aTime = a.last_used_at
        ? new Date(a.last_used_at).getTime()
        : 0;

      const bTime = b.last_used_at
        ? new Date(b.last_used_at).getTime()
        : 0;

      return bTime - aTime;
    })
    .slice(0, 12);

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
          {renderChapterText()}
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

              {/* Ferramentas */}
              <div className="mt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowStickers((current) => !current)
                  }
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-[#ff4f9a]/50 transition"
                >
                  ☁ Figurinhas
                </button>

                {showStickers && (
                  <div className="mt-3 rounded-2xl bg-[#101010] border border-white/10 p-4">

                    <div className="flex items-center justify-between gap-3 mb-4">

                      <div>
                        <p className="text-sm font-semibold text-white">
                          Usadas recentemente
                        </p>

                        <p className="text-xs text-gray-600 mt-1">
                          Escolha uma figurinha ou crie uma nova.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        disabled={uploadingSticker}
                        className="px-3 py-2 rounded-xl bg-[#ff4f9a] text-black text-xs font-semibold disabled:opacity-50"
                      >
                        {uploadingSticker
                          ? 'Enviando...'
                          : '+ Criar figurinha'}
                      </button>

                    </div>

                    {recentStickers.length === 0 ? (
                      <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">

                        <p className="text-sm text-gray-500">
                          Você ainda não tem figurinhas.
                        </p>

                        <p className="text-xs text-gray-600 mt-1">
                          Crie a primeira usando uma imagem da sua galeria.
                        </p>

                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">

                        {recentStickers.map((sticker) => (
                          <button
                            key={sticker.id}
                            type="button"
                            onClick={() =>
                              selectSticker(sticker)
                            }
                            className={`aspect-square rounded-xl overflow-hidden border transition ${
                              selectedSticker?.id === sticker.id
                                ? 'border-[#ff4f9a] ring-2 ring-[#ff4f9a]/30'
                                : 'border-white/10 hover:border-[#ff4f9a]/50'
                            }`}
                          >
                            <img
                              src={sticker.image_url}
                              alt="Figurinha"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}

                      </div>
                    )}

                  </div>
                )}

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleStickerUpload}
                className="hidden"
              />

              {/* Figurinha selecionada */}
              {selectedSticker && (
                <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-3">

                  <div className="flex items-center justify-between mb-2">

                    <p className="text-xs text-gray-500">
                      Figurinha selecionada
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedSticker(null)
                      }
                      className="text-gray-500 hover:text-white"
                    >
                      Remover
                    </button>

                  </div>

                  <div className="flex justify-center">
                    <img
                      src={selectedSticker.image_url}
                      alt="Figurinha selecionada"
                      className="max-h-40 max-w-full rounded-xl object-contain"
                    />
                  </div>

                </div>
              )}

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
                    (!commentText.trim() && !selectedSticker)
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

        {/* Janela dos comentários do trecho */}
        {activeCommentGroup.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4"
            onClick={() => setActiveCommentGroup([])}
          >
            <div
              className="w-full max-w-xl max-h-[80vh] overflow-y-auto bg-[#151515] border border-white/10 rounded-2xl p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >

              <div className="flex items-center justify-between gap-4 mb-5">

                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                    Comentários do trecho
                  </p>

                  <p className="text-sm text-white">
                    {activeCommentGroup[0]?.selected_text
                      ? `“${activeCommentGroup[0].selected_text}”`
                      : 'Trecho comentado'}
                  </p>
                </div>

                <button
                  onClick={() => setActiveCommentGroup([])}
                  className="text-gray-500 hover:text-white text-2xl"
                >
                  ×
                </button>

              </div>

              <div className="space-y-4">

                {activeCommentGroup.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-4"
                  >

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

                    {comment.body.trim() && (
                      <p className="text-gray-300 leading-7">
                        {comment.body}
                      </p>
                    )}

                    {comment.user_stickers?.image_url && (
                      <div className="mt-3">
                        <img
                          src={comment.user_stickers.image_url}
                          alt="Figurinha"
                          className="max-w-full max-h-64 rounded-xl object-contain"
                        />
                      </div>
                    )}

                  </div>
                ))}

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

                  {comment.body.trim() && (
                    <p className="text-gray-300 leading-7">
                      {comment.body}
                    </p>
                  )}

                  {comment.user_stickers?.image_url && (
                    <div className="mt-3">

                      <img
                        src={comment.user_stickers.image_url}
                        alt="Figurinha"
                        className="max-w-full max-h-64 rounded-xl object-contain"
                      />

                    </div>
                  )}

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
