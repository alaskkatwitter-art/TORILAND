'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  published: boolean;
  created_at: string;
};

type Story = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

function CloudIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path
        d="M10.5 25.5H23C27.1421 25.5 30.5 22.1421 30.5 18C30.5 13.8579 27.1421 10.5 23 10.5C22.3634 10.5 21.7417 10.5793 21.1478 10.7308C19.6431 7.64767 16.4859 5.5 12.8284 5.5C7.86587 5.5 3.8421 9.52373 3.8421 14.4863C3.8421 15.0949 3.90266 15.6893 4.0178 16.2637C1.93835 17.4027 0.5 19.5991 0.5 22.133C0.5 25.8418 3.50821 28.85 7.21702 28.85H10.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  );
}

export default function HistoriaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/stories/${id}`, {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || 'Não foi possível carregar a história.'
          );
        }

        setStory(data.story);
        setChapters(data.chapters || []);

        const likesResponse = await fetch(
          `/api/stories/${id}/like`,
          {
            cache: 'no-store',
          }
        );

        const likesData = await likesResponse.json();

        if (likesResponse.ok) {
          setLikes(likesData.likes || 0);
          setLiked(!!likesData.liked);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar a história.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadStory();
    }
  }, [id]);

  async function handleLike() {
    if (liking) return;

    try {
      setLiking(true);

      const response = await fetch(
        `/api/stories/${id}/like`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        alert('Você precisa estar logado para curtir.');
        return;
      }

      if (!response.ok) {
        alert(
          data.error || 'Não foi possível atualizar a curtida.'
        );
        return;
      }

      setLikes(data.likes || 0);
      setLiked(!!data.liked);
    } catch {
      alert('Não foi possível atualizar a curtida.');
    } finally {
      setLiking(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center">
        <p className="text-[#ff4f9a]">
          Carregando história...
        </p>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-5">
            {error || 'História não encontrada.'}
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
      <div className="max-w-5xl mx-auto px-5 py-8">

        {/* Voltar */}
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white transition mb-8"
        >
          ← Voltar
        </button>

        {/* Informações da história */}
        <section className="flex flex-col md:flex-row gap-8">

          {/* Capa */}
          <div className="w-full md:w-64 shrink-0">
            {story.cover_url ? (
              <img
                src={story.cover_url}
                alt={story.title}
                className="w-full aspect-[2/3] object-cover rounded-2xl border border-white/10"
              />
            ) : (
              <div className="w-full aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <span className="text-gray-600">
                  Sem capa
                </span>
              </div>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1">

            <p className="text-sm text-[#ff4f9a] mb-2">
              {story.status}
            </p>

            <h1 className="text-4xl font-bold mb-4">
              {story.title}
            </h1>

            {story.profiles && (
              <button
                onClick={() =>
                  router.push(
                    `/perfil/${story.profiles?.username}`
                  )
                }
                className="text-gray-400 hover:text-white transition mb-6"
              >
                por{' '}
                <span className="text-white">
                  {story.profiles.display_name ||
                    story.profiles.username}
                </span>
              </button>
            )}

            <p className="text-gray-300 leading-7 whitespace-pre-wrap mb-8">
              {story.description}
            </p>

            {/* Ações */}
            <div className="flex flex-wrap items-center gap-3">

              {chapters.length > 0 && (
                <button
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapters[0].id}`
                    )
                  }
                  className="px-6 py-3 rounded-xl bg-[#ff4f9a] text-black font-semibold hover:opacity-90 transition"
                >
                  Começar a ler
                </button>
              )}

              {/* Curtida em formato de nuvem */}
              <button
                onClick={handleLike}
                disabled={liking}
                aria-label={
                  liked
                    ? 'Descurtir história'
                    : 'Curtir história'
                }
                className={`group px-5 py-3 rounded-xl border transition font-semibold flex items-center gap-2 ${
                  liked
                    ? 'bg-[#ff4f9a]/15 border-[#ff4f9a] text-[#ff4f9a]'
                    : 'bg-white/5 border-white/10 text-white hover:border-[#ff4f9a]/50'
                }`}
              >
                <span
                  className={`transition-transform duration-200 ${
                    liking
                      ? 'scale-90'
                      : 'group-active:scale-125'
                  }`}
                >
                  <CloudIcon filled={liked} />
                </span>

                <span>
                  {likes}
                </span>

                <span className="text-sm">
                  {liked ? 'Curtida' : 'Curtir'}
                </span>
              </button>

              <span className="text-sm text-gray-500">
                {chapters.length}{' '}
                {chapters.length === 1
                  ? 'capítulo'
                  : 'capítulos'}
              </span>

            </div>

          </div>
        </section>

        {/* Lista de capítulos */}
        <section className="mt-14">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold">
              Capítulos
            </h2>

            <button
              onClick={() =>
                router.push(`/novo-capitulo/${story.id}`)
              }
              className="text-sm text-[#ff4f9a] hover:underline"
            >
              + Novo capítulo
            </button>
          </div>

          {chapters.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="text-gray-500">
                Esta história ainda não possui capítulos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">

              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapter.id}`
                    )
                  }
                  className="w-full text-left px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#ff4f9a]/50 transition flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-[#ff4f9a] mb-1">
                      Capítulo {chapter.chapter_number}
                    </p>

                    <p className="font-semibold text-white">
                      {chapter.title}
                    </p>
                  </div>

                  <span className="text-gray-500">
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
