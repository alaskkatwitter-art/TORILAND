'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme_color: string | null;
};

type Story = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  created_at: string;
  updated_at: string;
};

type PostMedia = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  created_at?: string;
};

type NookPost = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  story_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  media?: PostMedia[];
};

type ProfileResponse = {
  user?: User;
  stories?: Story[];
  posts?: NookPost[];
  error?: string;
};

type Tab = 'stories' | 'nook';

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function getDisplayName(user: User) {
  return user.display_name?.trim() || user.username;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();

  const usernameParam = params?.username;

  const username =
    typeof usernameParam === 'string'
      ? usernameParam
      : Array.isArray(usernameParam)
        ? usernameParam[0]
        : undefined;

  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<NookPost[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>('stories');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    if (!username) {
      setLoading(false);
      setError('Perfil não encontrado.');
      return;
    }

    async function loadProfile() {
      setLoading(true);
      setError('');

      try {
        const encodedUsername = encodeURIComponent(username!);

        const response = await fetch(
          `/api/public-profile/${encodedUsername}`,
          {
            cache: 'no-store',
          }
        );

        const data: ProfileResponse = await response.json();

        if (!response.ok) {
          setError(
            data.error || 'Perfil não encontrado.'
          );
          return;
        }

        if (!data.user) {
          setError('Perfil não encontrado.');
          return;
        }

        setUser(data.user);

        setStories(
          Array.isArray(data.stories)
            ? data.stories
            : []
        );

        setPosts(
          Array.isArray(data.posts)
            ? data.posts
            : []
        );
      } catch (err) {
        console.error(
          'Erro ao carregar perfil público:',
          err
        );

        setError(
          'Não foi possível carregar este perfil.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0a0d] text-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015]">
            <div className="h-48 animate-pulse bg-white/5" />

            <div className="px-6 pb-7">
              <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-[#151015] bg-white/10" />

              <div className="mt-5 h-7 w-48 animate-pulse rounded bg-white/10" />

              <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/5" />

              <div className="mt-5 h-16 max-w-xl animate-pulse rounded bg-white/5" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d0a0d] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151015] p-8 text-center">
          <div className="text-5xl">
            📖
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Perfil não encontrado
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/50">
            {error ||
              'Este usuário não existe ou o perfil não está disponível.'}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-7 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-white/90"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0a0d] text-white">
      <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-5 sm:py-8">

        {/* VOLTAR */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
        >
          <span className="text-lg">
            ←
          </span>

          Voltar
        </button>

        {/* PERFIL */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015] shadow-2xl">

          {/* CAPA */}
          <div
            className="relative h-44 overflow-hidden sm:h-60"
            style={{
              backgroundColor:
                user.theme_color || '#241924',
            }}
          >
            {user.cover_url ? (
              <img
                src={user.cover_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_35%)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#151015] via-transparent to-black/10" />
          </div>

          {/* INFORMAÇÕES */}
          <div className="relative px-5 pb-7 sm:px-8">

            <div className="-mt-14 flex items-end justify-between">
              <div className="relative">

                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={getDisplayName(user)}
                    className="h-28 w-28 rounded-full border-4 border-[#151015] bg-[#211a21] object-cover shadow-xl sm:h-32 sm:w-32"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#151015] bg-[#211a21] text-4xl font-black text-white/40 shadow-xl sm:h-32 sm:w-32">
                    {getDisplayName(user)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

              </div>

              {/* BOTÃO DO PRÓPRIO PERFIL */}
              <button
                type="button"
                onClick={() => router.push('/perfil')}
                className="mb-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Meu perfil
              </button>
            </div>

            <div className="mt-5">
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                {getDisplayName(user)}
              </h1>

              <p className="mt-1 text-sm font-semibold text-white/40">
                @{user.username}
              </p>

              {user.bio ? (
                <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/70">
                  {user.bio}
                </p>
              ) : (
                <p className="mt-5 text-sm italic text-white/30">
                  Este usuário ainda não adicionou uma bio.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ABAS */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#151015] p-1.5">
          <div className="grid grid-cols-2 gap-1">

            <button
              type="button"
              onClick={() => setActiveTab('stories')}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                activeTab === 'stories'
                  ? 'bg-white text-black'
                  : 'text-white/45 hover:bg-white/5 hover:text-white'
              }`}
            >
              Histórias
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('nook')}
              className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                activeTab === 'nook'
                  ? 'bg-white text-black'
                  : 'text-white/45 hover:bg-white/5 hover:text-white'
              }`}
            >
              Mural
            </button>

          </div>
        </div>

        {/* CONTEÚDO */}
        <section className="mt-5">

          {/* HISTÓRIAS */}
          {activeTab === 'stories' && (
            <>
              {stories.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#151015] px-6 py-14 text-center">
                  <div className="text-4xl">
                    📚
                  </div>

                  <h2 className="mt-4 text-lg font-black">
                    Nenhuma história ainda
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    {getDisplayName(user)} ainda não publicou nenhuma história.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {stories.map((story) => (
                    <button
                      type="button"
                      key={story.id}
                      onClick={() =>
                        router.push(
                          `/historia/${story.id}`
                        )
                      }
                      className="group overflow-hidden rounded-3xl border border-white/10 bg-[#151015] text-left transition hover:-translate-y-0.5 hover:border-white/20"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden bg-[#211a21]">

                        {story.cover_url ? (
                          <img
                            src={story.cover_url}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl text-white/20">
                            📖
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                        {story.status && (
                          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white backdrop-blur">
                            {story.status}
                          </span>
                        )}

                      </div>

                      <div className="p-5">

                        <h3 className="line-clamp-2 text-lg font-black text-white">
                          {story.title}
                        </h3>

                        {story.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/45">
                            {story.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between text-xs text-white/30">

                          <span>
                            {story.rating
                              ? `Classificação ${story.rating}`
                              : 'História'}
                          </span>

                          <span>
                            {formatDate(
                              story.updated_at ||
                                story.created_at
                            )}
                          </span>

                        </div>

                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* MURAL */}
          {activeTab === 'nook' && (
            <>
              {posts.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-[#151015] px-6 py-14 text-center">
                  <div className="text-4xl">
                    📝
                  </div>

                  <h2 className="mt-4 text-lg font-black">
                    Nenhuma publicação ainda
                  </h2>

                  <p className="mt-2 text-sm text-white/40">
                    {getDisplayName(user)} ainda não publicou nada no Mural.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015]"
                    >
                      <div className="p-5 sm:p-6">

                        <div className="flex items-center gap-3">

                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="h-11 w-11 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#241c24] font-black text-white/40">
                              {getDisplayName(user)
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">

                            <p className="truncate text-sm font-black text-white">
                              {getDisplayName(user)}
                            </p>

                            <p className="text-xs text-white/35">
                              @{user.username}
                              {' · '}
                              {formatDate(
                                post.created_at
                              )}
                            </p>

                          </div>

                          {post.pinned && (
                            <span
                              title="Publicação fixada"
                              className="text-sm"
                            >
                              📌
                            </span>
                          )}

                        </div>

                        {post.body && (
                          <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-white/75">
                            {post.body}
                          </p>
                        )}

                        {/* IMAGEM LEGADA */}
                        {post.image_url && (
                          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                            <img
                              src={post.image_url}
                              alt=""
                              className="max-h-[600px] w-full object-cover"
                            />
                          </div>
                        )}

                        {/* ATÉ 4 MÍDIAS */}
                        {post.media &&
                          post.media.length > 0 && (
                            <div
                              className={`mt-5 grid gap-2 ${
                                post.media.length === 1
                                  ? 'grid-cols-1'
                                  : 'grid-cols-2'
                              }`}
                            >
                              {post.media
                                .slice(0, 4)
                                .map((media) => (
                                  <div
                                    key={media.id}
                                    className="overflow-hidden rounded-2xl border border-white/10 bg-black"
                                  >
                                    <img
                                      src={media.media_url}
                                      alt=""
                                      className="max-h-[500px] min-h-[180px] w-full object-cover"
                                    />
                                  </div>
                                ))}
                            </div>
                          )}

                      </div>
                    </article>
                  ))}

                </div>
              )}
            </>
          )}

        </section>
      </div>
    </main>
  );
}
