'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Author = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug: string | null;
};

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
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  created_at: string;
  updated_at: string;
  author: Author | null;
  tags: Tag[];
  chapters: Chapter[];
  likes: number;
  liked: boolean;
};

export default function HistoriaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liking, setLiking] = useState(false);

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
            data?.error || 'Não foi possível carregar a história.'
          );
        }

        const loadedStory = data.story;

        setStory(loadedStory);

        setChapters(
          data.chapters ||
            loadedStory?.chapters ||
            []
        );

        setLiked(Boolean(loadedStory?.liked));
        setLikes(Number(loadedStory?.likes || 0));
      } catch (err: any) {
        console.error(err);
        setError(
          err?.message ||
            'Não foi possível carregar a história.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [id]);

  async function toggleLike() {
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

      if (!response.ok) {
        throw new Error(
          data?.error || 'Não foi possível atualizar a curtida.'
        );
      }

      setLiked(Boolean(data.liked));
      setLikes(Number(data.likes || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  }

  function getCategoryTags(categorySlug: string) {
    if (!story?.tags) return [];

    return story.tags.filter(
      (tag) => tag.category_slug === categorySlug
    );
  }

  function getFreeformTags() {
    if (!story?.tags) return [];

    return story.tags.filter(
      (tag) =>
        tag.category_slug === 'freeform' ||
        !tag.category_slug
    );
  }

  function getGenreTags() {
    return getCategoryTags('genre');
  }

  const genreTags = getGenreTags();
  const fandomTags = getCategoryTags('fandom');
  const characterTags = getCategoryTags('characters');
  const relationshipTags = getCategoryTags('relationships');
  const tropeTags = getCategoryTags('tropes');
  const warningTags = getCategoryTags('content-warning');
  const freeformTags = getFreeformTags();

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
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-3">
            História não encontrada
          </h1>

          <p className="text-sm text-gray-400 mb-6">
            {error || 'Essa história não existe ou não está disponível.'}
          </p>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-medium hover:bg-pink-400 transition"
          >
            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09070a] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#0b090c]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-xl font-semibold tracking-tight hover:text-pink-300 transition"
          >
            Nooklie
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Voltar
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-6xl px-5 py-8">
        {/* FICHA PRINCIPAL */}
        <section className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-7">
          {/* CAPA */}
          <div>
            <div className="aspect-[2/3] w-full max-w-[230px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl">
              {story.cover_url ? (
                <img
                  src={story.cover_url}
                  alt={`Capa de ${story.title}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-600 text-sm">
                  Sem capa
                </div>
              )}
            </div>
          </div>

          {/* INFORMAÇÕES */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {story.status && (
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-gray-300">
                  {story.status}
                </span>
              )}

              {story.rating && (
                <span className="rounded-full border border-pink-400/30 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-300">
                  {story.rating === 'Livre'
                    ? 'Livre'
                    : `+${story.rating}`}
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight break-words">
              {story.title}
            </h1>

            {story.author && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/perfil/${story.author?.username}`
                  )
                }
                className="mt-3 text-sm text-gray-400 hover:text-pink-300 transition"
              >
                por{' '}
                <span className="text-gray-200">
                  {story.author.display_name ||
                    story.author.username}
                </span>
              </button>
            )}

            {story.description && (
              <p className="mt-6 max-w-3xl whitespace-pre-wrap text-[15px] leading-7 text-gray-300">
                {story.description}
              </p>
            )}

            {/* GÊNERO */}
            {genreTags.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                  Gênero
                </div>

                <div className="flex flex-wrap gap-2">
                  {genreTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-lg border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-sm text-pink-200"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* TAGS */}
            <div className="mt-6 space-y-5">
              {fandomTags.length > 0 && (
                <TagGroup
                  title="Fandom"
                  tags={fandomTags}
                />
              )}

              {characterTags.length > 0 && (
                <TagGroup
                  title="Personagens"
                  tags={characterTags}
                />
              )}

              {relationshipTags.length > 0 && (
                <TagGroup
                  title="Relacionamentos"
                  tags={relationshipTags}
                />
              )}

              {tropeTags.length > 0 && (
                <TagGroup
                  title="Tropes"
                  tags={tropeTags}
                />
              )}

              {warningTags.length > 0 && (
                <TagGroup
                  title="Avisos de conteúdo"
                  tags={warningTags}
                  warning
                />
              )}

              {freeformTags.length > 0 && (
                <TagGroup
                  title="Tags"
                  tags={freeformTags}
                />
              )}
            </div>

            {/* AÇÕES */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {chapters.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapters[0].id}`
                    )
                  }
                  className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-medium text-white hover:bg-pink-400 transition"
                >
                  Começar a ler
                </button>
              )}

              <button
                type="button"
                onClick={toggleLike}
                disabled={liking}
                className={`rounded-xl border px-5 py-3 text-sm transition ${
                  liked
                    ? 'border-pink-400/40 bg-pink-500/10 text-pink-300'
                    : 'border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {liked ? 'Curtida' : 'Curtir'}
                {' · '}
                {likes}
              </button>

              <button
                type="button"
                onClick={() =>
                  router.push(`/novo-capitulo/${story.id}`)
                }
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition"
              >
                Novo capítulo
              </button>
            </div>
          </div>
        </section>

        {/* DIVISÓRIA */}
        <div className="my-10 h-px bg-white/10" />

        {/* CAPÍTULOS */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Capítulos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
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

          {chapters.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              {chapters.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() =>
                    router.push(
                      `/capitulo/${chapter.id}`
                    )
                  }
                  className={`group w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-white/[0.04] transition ${
                    index !== chapters.length - 1
                      ? 'border-b border-white/10'
                      : ''
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-sm font-medium text-pink-300">
                    {chapter.chapter_number}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-200 group-hover:text-pink-200 transition">
                      {chapter.title ||
                        `Capítulo ${chapter.chapter_number}`}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Capítulo {chapter.chapter_number}
                    </div>
                  </div>

                  <div className="text-gray-600 group-hover:text-pink-300 transition">
                    →
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <p className="text-sm text-gray-500">
                Essa história ainda não possui capítulos publicados.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function TagGroup({
  title,
  tags,
  warning = false,
}: {
  title: string;
  tags: Tag[];
  warning?: boolean;
}) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-wider text-gray-500">
        {title}
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              warning
                ? 'border-red-400/20 bg-red-500/[0.07] text-red-200'
                : 'border-white/10 bg-white/[0.04] text-gray-300'
            }`}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
