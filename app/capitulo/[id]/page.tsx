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
  const [showContents, setShowContents] = useState(false);

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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <p className="text-[#ff4f9a]">Carregando capítulo...</p>
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
        <article className="text-[18px] leading-8 text-gray-200 font-serif whitespace-pre-wrap">
          {chapter.body}
        </article>

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

      {/* Painel do Sumário */}
      {showContents && (
        <div
          className="fixed inset-0 z-50 bg-black/70"
          onClick={() => setShowContents(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md bg-[#111111] border-l border-white/10 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Cabeçalho do painel */}
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

            {/* Lista */}
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
                            router.push(`/capitulo/${item.id}`);
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
