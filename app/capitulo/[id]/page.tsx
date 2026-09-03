'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
};

export default function CapituloPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadChapter() {
      try {
        const response = await fetch(
          `/api/chapters/${id}`,
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              'Não foi possível carregar o capítulo.'
          );
          return;
        }

        setChapter(data.chapter);
      } catch {
        setError(
          'Não foi possível carregar o capítulo.'
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
      <main className="flex min-h-screen items-center justify-center bg-[#100b12] text-white">
        <p className="text-sm text-white/40">
          Carregando capítulo...
        </p>
      </main>
    );
  }

  if (error || !chapter) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100b12] px-5 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            Capítulo não encontrado
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error ||
              'Esse capítulo não existe ou não está disponível.'}
          </p>

          <button
            onClick={() => router.push('/')}
            className="mt-6 rounded-full bg-[#ff78b9] px-6 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110"
          >
            Voltar ao início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <button
            onClick={() =>
              router.push(
                `/historia/${chapter.story_id}`
              )
            }
            className="text-sm font-semibold text-white/50 transition hover:text-[#ff78b9]"
          >
            ← Voltar para a história
          </button>

          <button
            onClick={() => router.push('/perfil')}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
          >
            Meu perfil
          </button>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-12 md:py-20">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff78b9]">
            Capítulo {chapter.chapter_number}
          </p>

          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
            {chapter.title}
          </h1>
        </div>

        <div className="my-10 h-px bg-white/10" />

        <div className="whitespace-pre-wrap font-serif text-[18px] leading-[1.9] text-white/80 md:text-[19px]">
          {chapter.body}
        </div>

        <div className="my-12 h-px bg-white/10" />

        <div className="flex justify-center">
          <button
            onClick={() =>
              router.push(
                `/historia/${chapter.story_id}`
              )
            }
            className="rounded-full border border-[#ff78b9]/30 px-7 py-3.5 text-sm font-bold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
          >
            Voltar para a história
          </button>
        </div>
      </article>
    </main>
  );
      }
