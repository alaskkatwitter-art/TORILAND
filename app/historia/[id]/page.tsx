'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Author = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Story = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  profiles: Author | null;
};

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  published: boolean;
  created_at: string;
};

export default function HistoriaPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStory() {
      try {
        const response = await fetch(
          `/api/stories/${id}`,
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error ||
              'Não foi possível carregar a história.'
          );
          return;
        }

        setStory(data.story);
        setChapters(data.chapters || []);
      } catch {
        setError(
          'Não foi possível carregar a história.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadStory();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100b12] text-white">
        <p className="text-sm text-white/40">
          Carregando história...
        </p>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100b12] px-5 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black">
            História não encontrada
          </h1>

          <p className="mt-2 text-sm text-white/40">
            {error ||
              'Essa história não existe ou não está disponível.'}
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

  const author = story.profiles;

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3"
          >
            <CloudLogo />

            <span className="text-xl font-bold tracking-[0.15em] text-[#ff78b9]">
              TORILAND
            </span>
          </button>

          <button
            onClick={() => router.push('/perfil')}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
          >
            Meu perfil
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#191219]">
          <div className="relative h-64 w-full overflow-hidden bg-gradient-to-r from-[#3b1b30] via-[#572544] to-[#241322]">
            {story.cover_url && (
              <img
                src={story.cover_url}
                alt={`Capa de ${story.title}`}
                className="h-full w-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#191219] via-black/10 to-transparent" />
          </div>

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-20 flex flex-col gap-6 md:flex-row md:items-end">
              <div className="h-40 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-[#191219] bg-[#ff78b9] shadow-xl">
                {story.cover_url ? (
                  <img
                    src={story.cover_url}
                    alt={`Capa de ${story.title}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-3 text-center text-sm font-black text-[#180d15]">
                    TORILAND
                  </div>
                )}
              </div>

              <div className="pb-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#ff78b9]/10 px-3 py-1 text-xs font-bold text-[#ff78b9]">
                    {story.status || 'Em andamento'}
                  </span>
                </div>

                <h1 className="text-3xl font-black md:text-4xl">
                  {story.title}
                </h1>

                <button
                  onClick={() =>
                    author?.username &&
                    router.push(
                      `/perfil/${author.username}`
                    )
                  }
                  className="mt-2 text-sm text-white/40 transition hover:text-[#ff78b9]"
                >
                  por @{author?.username || 'autor'}
                </button>
              </div>
            </div>

            <div className="mt-8 max-w-3xl">
              <h2 className="text-lg font-black">
                Sinopse
              </h2>

              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/50">
                {story.description ||
                  'Esta história ainda não possui uma sinopse.'}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {chapters.length > 0 && (
                <button
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapters[0].id}`
                    )
                  }
                  className="rounded-full bg-[#ff78b9] px-7 py-3.5 text-sm font-black text-[#180d15] transition hover:brightness-110"
                >
                  Começar a ler
                </button>
              )}

              <button
                onClick={() =>
                  router.push(
                    `/novo-capitulo/${story.id}`
                  )
                }
                className="rounded-full border border-[#ff78b9]/30 px-7 py-3.5 text-sm font-bold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
              >
                Novo capítulo
              </button>

              <button
                onClick={() => router.push('/')}
                className="rounded-full border border-white/10 px-7 py-3.5 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
              >
                Voltar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Capítulos
              </h2>

              <p className="mt-1 text-sm text-white/35">
                {chapters.length === 0
                  ? 'Nenhum capítulo publicado ainda.'
                  : `${chapters.length} ${
                      chapters.length === 1
                        ? 'capítulo'
                        : 'capítulos'
                    } publicado${
                      chapters.length === 1 ? '' : 's'
                    }`}
              </p>
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-[#191219] px-6 py-14 text-center">
              <p className="text-sm text-white/35">
                Esta história ainda não possui capítulos.
              </p>

              <button
                onClick={() =>
                  router.push(
                    `/novo-capitulo/${story.id}`
                  )
                }
                className="mt-5 rounded-full bg-[#ff78b9] px-6 py-3 text-sm font-black text-[#180d15] transition hover:brightness-110"
              >
                Escrever primeiro capítulo
              </button>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapter.id}`
                    )
                  }
                  className="group flex w-full items-center gap-5 rounded-2xl border border-white/10 bg-[#191219] p-5 text-left transition hover:border-[#ff78b9]/40 hover:bg-[#211721]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#ff78b9]/10 text-sm font-black text-[#ff78b9]">
                    {chapter.chapter_number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-white/30">
                      Capítulo {chapter.chapter_number}
                    </p>

                    <h3 className="mt-1 truncate text-base font-bold text-white transition group-hover:text-[#ff78b9]">
                      {chapter.title}
                    </h3>
                  </div>

                  <span className="text-xl text-white/20 transition group-hover:translate-x-1 group-hover:text-[#ff78b9]">
                    →
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CloudLogo() {
  return (
    <svg
      width="48"
      height="30"
      viewBox="0 0 180 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Toriland"
    >
      <path
        d="M45 79C26 79 14 67 14 51C14 36 25 24 40 23C45 9 58 2 73 2C89 2 102 12 106 27C111 24 117 22 124 22C143 22 158 36 158 54C158 57 158 60 157 63C168 66 174 74 174 84C174 96 164 103 151 103H45C28 103 17 94 17 83C17 81 17 80 18 78C26 79 35 79 45 79Z"
        fill="#FF78B9"
      />

      <path
        d="M45 79C26 79 14 67 14 51C14 36 25 24 40 23C45 9 58 2 73 2C89 2 102 12 106 27C111 24 117 22 124 22C143 22 158 36 158 54C158 57 158 60 157 63C168 66 174 74 174 84C174 96 164 103 151 103H45C28 103 17 94 17 83C17 81 17 80 18 78C26 79 35 79 45 79Z"
        stroke="#FF9BCB"
        strokeWidth="3"
      />
    </svg>
  );
}
