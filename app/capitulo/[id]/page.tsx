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

        {/* Voltar para a história */}
        <button
          onClick={() =>
            router.push(`/historia/${chapter.story_id}`)
          }
          className="text-sm text-gray-400 hover:text-white transition mb-8"
        >
          ← Voltar para a história
        </button>

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
    </main>
  );
}
