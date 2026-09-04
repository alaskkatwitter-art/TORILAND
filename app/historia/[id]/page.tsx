'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  published: boolean;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug: string | null;
};

type Story = {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string;
  rating: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  chapters?: Chapter[];
  tags?: Tag[];
};

export default function HistoriaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

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
            data?.error ||
              'Não foi possível carregar a história.'
          );
        }

        setStory(data.story || null);

        if (data.story?.tags) {
          setTags(data.story.tags);
        } else {
          try {
            const tagsResponse = await fetch(
              `/api/stories/${id}/tags`,
              {
                cache: 'no-store',
              }
            );

            if (tagsResponse.ok) {
              const tagsData = await tagsResponse.json();
              setTags(tagsData.tags || []);
            }
          } catch {
            // A página continua funcionando mesmo se as tags falharem.
          }
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

    loadStory();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    async function loadLikes() {
      try {
        const response = await fetch(
          `/api/stories/${id}/like`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        setLikes(data.likes || 0);
        setLiked(Boolean(data.liked));
      } catch {
        // Não impede o restante da página de funcionar.
      }
    }

    loadLikes();
  }, [id]);

  async function handleLike() {
    if (likeLoading) return;

    try {
      setLikeLoading(true);

      const response = await fetch(
        `/api/stories/${id}/like`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return;
      }

      setLikes(data.likes || 0);
      setLiked(Boolean(data.liked));
    } catch {
      // Silencioso para não quebrar a experiência.
    } finally {
      setLikeLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09070a] text-white flex items-center justify-center">
        <div className="text-sm text-gray-400">
          Carregando história...
        </div>
      </main>
    );
  }

  if (error || !story) {
    return (
      <main className="min-h-screen bg-[#09070a] text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-300 mb-5">
            {error || 'História não encontrada.'}
          </p>

          <Link
            href="/"
            className="text-sm text-pink-300 hover:text-pink-200 transition"
          >
            Voltar para o início
          </Link>
        </div>
      </main>
    );
  }

  const chapters = story.chapters || [];

  const publishedChapters = chapters
    .filter((chapter) => chapter.published)
    .sort(
      (a, b) =>
        a.chapter_number - b.chapter_number
    );

  const firstChapter = publishedChapters[0];

  const authorName =
    story.author?.display_name ||
    story.author?.username ||
    'Autor';

  return (
    <main className="min-h-screen bg-[#09070a] text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">

        {/* VOLTAR */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition mb-8"
        >
          ← Voltar
        </Link>

        {/* CABEÇALHO */}
        <section className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-10">

          {/* CAPA */}
          <div className="w-full max-w-[260px] mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.04] border border-white/10 shadow-2xl">
              {story.cover_url ? (
                <img
                  src={story.cover_url}
                  alt={`Capa de ${story.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  Sem capa
                </div>
              )}
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div className="flex flex-col justify-center">

            <div className="flex flex-wrap items-center gap-2 mb-4">

              {/* CLASSIFICAÇÃO */}
              {story.rating && (
                <span className="inline-flex items-center justify-center min-w-9 h-7 px-2.5 rounded-md bg-white/[0.08] border border-white/10 text-xs font-medium text-gray-200">
                  {story.rating}
                </span>
              )}

              {/* STATUS */}
              {story.status && (
                <span className="inline-flex items-center h-7 px-3 rounded-md bg-pink-400/10 border border-pink-300/15 text-xs text-pink-200">
                  {story.status}
                </span>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4">
              {story.title}
            </h1>

            <p className="text-sm text-gray-400 mb-6">
              por{' '}
              <span className="text-gray-200">
                {authorName}
              </span>
            </p>

            {/* DESCRIÇÃO */}
            {story.description && (
              <p className="text-[16px] leading-7 text-gray-300 max-w-2xl mb-7 whitespace-pre-wrap">
                {story.description}
              </p>
            )}

            {/* TAGS */}
            {tags.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="
                        inline-flex
                        items-center
                        px-3
                        py-1.5
                        rounded-full
                        bg-pink-300/[0.08]
                        border
                        border-pink-200/10
                        text-xs
                        text-pink-100
                        hover:bg-pink-300/[0.13]
                        transition
                      "
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AÇÕES */}
            <div className="flex flex-wrap items-center gap-3">

              {firstChapter && (
                <Link
                  href={`/capitulo/${firstChapter.id}`}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    px-6
                    py-3
                    rounded-xl
                    bg-pink-400
                    hover:bg-pink-300
                    text-black
                    font-medium
                    text-sm
                    transition
                  "
                >
                  Começar a ler
                </Link>
              )}

              <button
                type="button"
                onClick={handleLike}
                disabled={likeLoading}
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  hover:bg-white/[0.08]
                  transition
                  disabled:opacity-50
                "
                aria-label={
                  liked
                    ? 'Remover curtida'
                    : 'Curtir história'
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 20.5C11.7 20.5 11.4 20.4 11.15 20.2C6.2 16.3 3 13.4 3 9.6C3 6.8 5.1 4.5 7.85 4.5C9.5 4.5 11 5.35 12 6.65C13 5.35 14.5 4.5 16.15 4.5C18.9 4.5 21 6.8 21 9.6C21 13.4 17.8 16.3 12.85 20.2C12.6 20.4 12.3 20.5 12 20.5Z"
                    stroke={liked ? '#f9a8d4' : '#a3a3a3'}
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={
                      liked
                        ? 'rgba(244,114,182,0.12)'
                        : 'none'
                    }
                  />
                </svg>

                <span className="text-sm text-gray-300">
                  {likes}
                </span>
              </button>

              {/* NOVO CAPÍTULO */}
              <Link
                href={`/novo-capitulo/${story.id}`}
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-4
                  py-3
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.04]
                  hover:bg-white/[0.08]
                  text-sm
                  text-gray-300
                  transition
                "
              >
                Novo capítulo
              </Link>
            </div>
          </div>
        </section>

        {/* DIVISÓRIA */}
        <div className="my-12 h-px bg-white/[0.08]" />

        {/* CAPÍTULOS */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Capítulos
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {publishedChapters.length}{' '}
                {publishedChapters.length === 1
                  ? 'capítulo publicado'
                  : 'capítulos publicados'}
              </p>
            </div>
          </div>

          {publishedChapters.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-8 text-center">
              <p className="text-gray-500 text-sm">
                Esta história ainda não possui capítulos publicados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {publishedChapters.map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/capitulo/${chapter.id}`}
                  className="
                    flex
                    items-center
                    justify-between
                    gap-4
                    rounded-xl
                    border
                    border-white/[0.07]
                    bg-white/[0.025]
                    px-5
                    py-4
                    hover:bg-white/[0.055]
                    hover:border-pink-300/10
                    transition
                  "
                >
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      Capítulo {chapter.chapter_number}
                    </p>

                    <p className="text-sm text-gray-200 truncate">
                      {chapter.title ||
                        `Capítulo ${chapter.chapter_number}`}
                    </p>
                  </div>

                  <span className="text-gray-500 text-lg shrink-0">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
                  }
