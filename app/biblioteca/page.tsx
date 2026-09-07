'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CurrentUser = {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
};

type LibraryItem = {
  id: string;
  story_id?: string | null;
  chapter_id?: string | null;
  title?: string | null;
  story_title?: string | null;
  chapter_title?: string | null;
  cover_url?: string | null;
  story_cover_url?: string | null;
  author_username?: string | null;
  author_display_name?: string | null;
  author?: {
    username?: string | null;
    display_name?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/* =========================================================
   ÍCONES
========================================================= */

function CloudIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7.5 18.5H17a4.5 4.5 0 0 0 .72-8.942A6.5 6.5 0 0 0 5.02 10.5H4.5a4 4 0 0 0 0 8h3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5v-17Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M20 11a8.1 8.1 0 0 0-14.9-3.8L3 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 5v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13a8.1 8.1 0 0 0 14.9 3.8L21 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 19v-5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function BibliotecaPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [items, setItems] =
    useState<LibraryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  /* =======================================================
     USUÁRIO
  ======================================================= */

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            cache: 'no-store',
          }
        );

        const data =
          await response.json();

        if (
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          setCurrentUser(data.user);
          return data.user as CurrentUser;
        }

        router.replace('/login');
        return null;
      } catch (error) {
        console.error(
          'Erro ao carregar usuário:',
          error
        );

        router.replace('/login');
        return null;
      }
    }, [router]);

  /* =======================================================
     BIBLIOTECA
======================================================= */

  const loadLibrary =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          /*
           * A biblioteca utiliza a API de feed para
           * manter esta página compatível com o sistema
           * de publicações já existente.
           *
           * Caso exista uma API específica de biblioteca
           * no projeto, ela será utilizada primeiro.
           */

          let response =
            await fetch(
              '/api/library',
              {
                cache: 'no-store',
              }
            );

          let data: any = null;

          if (response.ok) {
            data =
              await response.json();
          } else {
            /*
             * Fallback: tenta a API de posts.
             * Isso evita que a página fique quebrada
             * caso /api/library ainda não exista.
             */

            response =
              await fetch(
                '/api/feed',
                {
                  cache: 'no-store',
                }
              );

            if (!response.ok) {
              throw new Error(
                'Não foi possível carregar sua biblioteca.'
              );
            }

            data =
              await response.json();
          }

          const incoming =
            Array.isArray(data)
              ? data
              : Array.isArray(data.items)
              ? data.items
              : Array.isArray(data.library)
              ? data.library
              : [];

          const normalized: LibraryItem[] =
            incoming
              .map(
                (item: any) => ({
                  id:
                    item.id ||
                    item.story_id ||
                    item.chapter_id ||
                    cryptoRandomId(),

                  story_id:
                    item.story_id ||
                    item.story?.id ||
                    null,

                  chapter_id:
                    item.chapter_id ||
                    item.chapter?.id ||
                    null,

                  title:
                    item.title ||
                    item.story_title ||
                    item.story?.title ||
                    item.chapter_title ||
                    item.chapter?.title ||
                    'Sem título',

                  story_title:
                    item.story_title ||
                    item.story?.title ||
                    null,

                  chapter_title:
                    item.chapter_title ||
                    item.chapter?.title ||
                    null,

                  cover_url:
                    item.cover_url ||
                    item.story_cover_url ||
                    item.story?.cover_url ||
                    null,

                  story_cover_url:
                    item.story_cover_url ||
                    item.story?.cover_url ||
                    null,

                  author_username:
                    item.author_username ||
                    item.author?.username ||
                    item.story?.author?.username ||
                    null,

                  author_display_name:
                    item.author_display_name ||
                    item.author?.display_name ||
                    item.story?.author?.display_name ||
                    null,

                  author:
                    item.author ||
                    item.story?.author ||
                    null,

                  created_at:
                    item.created_at ||
                    null,

                  updated_at:
                    item.updated_at ||
                    null,
                })
              )
              .filter(
                (item: LibraryItem) =>
                  Boolean(
                    item.story_id ||
                    item.chapter_id ||
                    item.id
                  )
              );

          const unique =
            Array.from(
              new Map(
                normalized.map(
                  (item) => [
                    item.story_id ||
                      item.chapter_id ||
                      item.id,
                    item,
                  ]
                )
              ).values()
            );

          setItems(unique);
        } catch (error) {
          console.error(
            'Erro ao carregar biblioteca:',
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar sua biblioteca.'
          );

          setItems([]);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  /* =======================================================
     INICIALIZAÇÃO
======================================================= */

  useEffect(() => {
    async function initialize() {
      const user =
        await loadCurrentUser();

      if (user) {
        await loadLibrary();
      }
    }

    initialize();
  }, [
    loadCurrentUser,
    loadLibrary,
  ]);

  /* =======================================================
     RENDER
======================================================= */

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080609] text-white">
      {/* BACKGROUND */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-180px] h-[500px] w-[500px] rounded-full bg-[#ff4d9d]/[0.08] blur-[130px]" />

        <div className="absolute right-[-180px] top-[25%] h-[500px] w-[500px] rounded-full bg-[#c63dff]/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-[#ff78b9]/[0.035] blur-[130px]" />
      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-[1180px] px-4 pb-20 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        {/* HEADER */}

        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/feed"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-white/50 transition hover:border-[#ff78b9]/30 hover:bg-[#ff78b9]/[0.06] hover:text-[#ff78b9]"
              aria-label="Voltar para o Feed"
            >
              <ArrowLeftIcon />
            </Link>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#ff78b9]/15 bg-[#ff78b9]/[0.06] text-[#ff78b9]">
              <CloudIcon />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#ff78b9]/70">
                Nooklie
              </p>

              <h1 className="mt-1 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                Minha biblioteca
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadLibrary(true)
            }
            disabled={
              loading ||
              refreshing
            }
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-white/45 transition hover:border-[#ff78b9]/30 hover:bg-[#ff78b9]/[0.06] hover:text-[#ff78b9] disabled:opacity-40"
            aria-label="Atualizar biblioteca"
          >
            <span
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            >
              <RefreshIcon />
            </span>
          </button>
        </header>

        {/* HERO */}

        <section className="mb-7 overflow-hidden rounded-[30px] border border-[#ff78b9]/10 bg-gradient-to-br from-[#ff78b9]/[0.09] via-[#100c11]/90 to-[#c63dff]/[0.05] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.24)] sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ff78b9]">
            Seu cantinho de leitura
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            Histórias que você
            escolheu guardar.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40 sm:text-[15px]">
            Encontre aqui as histórias e
            capítulos que você salvou para
            voltar depois.
          </p>
        </section>

        {/* ERRO */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-5 py-4">
            <p className="text-sm font-semibold text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadLibrary()
              }
              className="mt-2 text-xs font-bold text-red-300 underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* TÍTULO */}

        <div className="mb-5">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ff78b9]">
            Salvos
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            Sua biblioteca
          </h2>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-[26px] border border-white/[0.06] bg-white/[0.025]"
                >
                  <div className="h-[250px] bg-white/[0.04]" />

                  <div className="space-y-3 p-5">
                    <div className="h-5 w-3/4 rounded bg-white/[0.06]" />

                    <div className="h-3 w-1/2 rounded bg-white/[0.04]" />

                    <div className="h-10 w-full rounded-xl bg-white/[0.04]" />
                  </div>
                </div>
              )
            )}
          </div>
        ) : items.length === 0 ? (
          /* VAZIO */

          <div className="flex min-h-[430px] items-center justify-center rounded-[28px] border border-white/[0.06] bg-white/[0.015]">
            <div className="max-w-md px-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#ff78b9]/15 bg-[#ff78b9]/[0.05] text-[#ff78b9]/50">
                <BookIcon />
              </div>

              <h2 className="mt-6 text-xl font-black text-white">
                Sua biblioteca está vazia.
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/35">
                Quando você salvar uma história
                ou capítulo para ler depois,
                eles aparecerão aqui.
              </p>

              <Link
                href="/explorar"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff78b9] px-5 py-3 text-xs font-black text-[#190d16] transition hover:brightness-110"
              >
                Explorar histórias
                <ChevronRightIcon />
              </Link>
            </div>
          </div>
        ) : (
          /* CARDS */

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(
              (item) => {
                const storyId =
                  item.story_id;

                const title =
                  item.story_title ||
                  item.title ||
                  item.chapter_title ||
                  'Sem título';

                const cover =
                  item.story_cover_url ||
                  item.cover_url;

                const author =
                  item.author_display_name ||
                  item.author_username ||
                  item.author?.display_name ||
                  item.author?.username;

                const href =
                  storyId
                    ? `/historia/${storyId}`
                    : item.chapter_id
                    ? `/capitulo/${item.chapter_id}`
                    : '#';

                return (
                  <article
                    key={
                      item.story_id ||
                      item.chapter_id ||
                      item.id
                    }
                    className="group overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#100c11]/90 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:border-[#ff78b9]/20 hover:shadow-[0_20px_70px_rgba(255,120,185,0.06)]"
                  >
                    <Link
                      href={href}
                      className="relative block h-[250px] overflow-hidden bg-[#171117]"
                    >
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff78b9]/[0.12] via-[#171117] to-[#c63dff]/[0.08] text-[#ff78b9]/40">
                          <CloudIcon />
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="truncate text-lg font-black text-white">
                          {title}
                        </p>

                        {author && (
                          <p className="mt-1 truncate text-xs font-semibold text-white/50">
                            por {author}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      {item.chapter_title &&
                        item.story_title && (
                          <p className="mb-3 truncate text-xs text-white/35">
                            Último capítulo:{' '}
                            <span className="text-white/55">
                              {item.chapter_title}
                            </span>
                          </p>
                        )}

                      <Link
                        href={href}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-xs font-bold text-white/55 transition hover:border-[#ff78b9]/25 hover:bg-[#ff78b9]/[0.06] hover:text-[#ff78b9]"
                      >
                        Continuar lendo
                        <ChevronRightIcon />
                      </Link>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   ID LOCAL PARA NORMALIZAÇÃO
========================================================= */

function cryptoRandomId() {
  return `library-${Math.random()
    .toString(36)
    .slice(2)}-${Date.now()}`;
}
