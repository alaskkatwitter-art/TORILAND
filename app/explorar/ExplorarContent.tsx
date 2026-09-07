'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const fandoms = [
  'House of the Dragon',
  'Game of Thrones',
  'Harry Potter',
  'Marvel',
  'DC',
  'K-pop',
];

const genres = [
  'Romance',
  'Fantasia',
  'Drama',
  'Aventura',
  'Mistério',
  'Terror',
  'Comédia',
  'Ficção',
];

const featuredStories = [
  {
    title: 'Histórias em destaque',
    description:
      'Descubra histórias que estão chamando a atenção dos leitores no Nooklie.',
  },
  {
    title: 'Atualizadas recentemente',
    description:
      'Encontre capítulos novos e acompanhe histórias que continuam sendo atualizadas.',
  },
  {
    title: 'Para descobrir',
    description:
      'Explore diferentes fandoms e gêneros até encontrar sua próxima leitura.',
  },
];

export default function ExplorarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSearch = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filters = ['Todos', 'Fandoms', 'Gêneros'];

  const filteredFandoms = useMemo(() => {
    if (!search.trim()) return fandoms;

    return fandoms.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const filteredGenres = useMemo(() => {
    if (!search.trim()) return genres;

    return genres.filter((item) =>
      item.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  function handleSearch(value: string) {
    setSearch(value);

    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set('q', value);
    } else {
      params.delete('q');
    }

    router.replace(`/explorar?${params.toString()}`, {
      scroll: false,
    });
  }

  function goToFandom(fandom: string) {
    router.push(
      `/fandom/${encodeURIComponent(
        fandom.toLowerCase().replace(/\s+/g, '-')
      )}`
    );
  }

  function goToGenre(genre: string) {
    router.push(
      `/genero/${encodeURIComponent(
        genre.toLowerCase().replace(/\s+/g, '-')
      )}`
    );
  }

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100b12]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="group flex shrink-0 items-center gap-2"
          >
            <CloudLogo />

            <span className="text-xl font-black tracking-[0.18em] text-[#ff78b9] transition group-hover:text-[#ff9bca]">
              NOOKLIE
            </span>
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            <NavButton
              label="Início"
              onClick={() => router.push('/')}
            />

            <NavButton
              label="Explorar"
              active
              onClick={() => router.push('/explorar')}
            />

            <NavButton
              label="Escrever"
              onClick={() => router.push('/escrever')}
            />

            <NavButton
              label="Fandoms"
              onClick={() => router.push('/fandoms')}
            />

            <NavButton
              label="Notícias"
              onClick={() => router.push('/noticias')}
            />
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition hover:border-[#ff78b9]/30 hover:text-white sm:block"
            >
              Voltar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border-t border-white/5 md:hidden">
          <nav className="mx-auto flex min-w-max items-center justify-center gap-1 px-4 py-2">
            <MobileNavButton
              label="Início"
              onClick={() => router.push('/')}
            />

            <MobileNavButton
              label="Explorar"
              active
              onClick={() => router.push('/explorar')}
            />

            <MobileNavButton
              label="Escrever"
              onClick={() => router.push('/escrever')}
            />

            <MobileNavButton
              label="Fandoms"
              onClick={() => router.push('/fandoms')}
            />

            <MobileNavButton
              label="Notícias"
              onClick={() => router.push('/noticias')}
            />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5">
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#ff4fa3]/10 blur-3xl" />

          <div className="pointer-events-none absolute right-0 top-10 h-80 w-80 rounded-full bg-[#ff78b9]/5 blur-3xl" />

          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Descubra
            </p>

            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              Encontre sua próxima
              <span className="block bg-gradient-to-r from-[#ff68ae] to-[#ff9acb] bg-clip-text text-transparent">
                obsessão.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg">
              Explore histórias, fandoms e gêneros. Descubra novos autores
              e encontre universos para chamar de seus.
            </p>

            <div className="mt-9 flex items-center rounded-2xl border border-white/10 bg-[#191219] px-5 py-4 transition focus-within:border-[#ff78b9]/30 focus-within:bg-[#1d141c]">
              <SearchIcon />

              <input
                value={search}
                onChange={(event) =>
                  handleSearch(event.target.value)
                }
                placeholder="Pesquisar histórias, fandoms ou gêneros..."
                className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
              />
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mb-6 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  activeFilter === filter
                    ? 'bg-gradient-to-r from-[#ff5fab] to-[#ff8fc5] text-[#180d15]'
                    : 'border border-white/10 bg-white/5 text-white/50 hover:border-[#ff78b9]/20 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {(activeFilter === 'Todos' ||
            activeFilter === 'Fandoms') && (
            <div className="mb-14">
              <SectionHeading
                title="Fandoms"
                subtitle="Explore histórias dos universos que você já conhece."
              />

              {filteredFandoms.length === 0 ? (
                <EmptySearch />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFandoms.map((fandom, index) => (
                    <CategoryCard
                      key={fandom}
                      title={fandom}
                      type="Fandom"
                      index={index}
                      onClick={() => goToFandom(fandom)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {(activeFilter === 'Todos' ||
            activeFilter === 'Gêneros') && (
            <div>
              <SectionHeading
                title="Gêneros"
                subtitle="Escolha o tipo de história que você quer encontrar."
              />

              {filteredGenres.length === 0 ? (
                <EmptySearch />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredGenres.map((genre, index) => (
                    <CategoryCard
                      key={genre}
                      title={genre}
                      type="Gênero"
                      index={index}
                      onClick={() => goToGenre(genre)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="pb-20">
          <SectionHeading
            title="Explore o Nooklie"
            subtitle="Há mais para descobrir além da busca."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {featuredStories.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => router.push('/fandoms')}
                className="group rounded-2xl border border-white/10 bg-gradient-to-br from-[#21131e] to-[#171018] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#ff78b9]/25"
              >
                <div className="mb-5 h-10 w-10 rounded-xl bg-[#ff78b9]/10" />

                <h3 className="text-lg font-bold transition group-hover:text-[#ff9bca]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-white/40">
                  {item.description}
                </p>

                <span className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.15em] text-[#ff78b9]/60 transition group-hover:text-[#ff9bca]">
                  Explorar
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-5 py-10 text-sm text-white/35">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="transition hover:text-[#ff9bca]"
            >
              Início
            </button>

            <button
              type="button"
              onClick={() => router.push('/explorar')}
              className="transition hover:text-[#ff9bca]"
            >
              Explorar
            </button>

            <button
              type="button"
              onClick={() => router.push('/fandoms')}
              className="transition hover:text-[#ff9bca]"
            >
              Fandoms
            </button>

            <button
              type="button"
              onClick={() => router.push('/noticias')}
              className="transition hover:text-[#ff9bca]"
            >
              Notícias
            </button>
          </div>

          <p className="text-white/25">
            De escritor para escritor.
          </p>

          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} Nooklie
          </p>
        </div>
      </footer>
    </main>
  );
}

function NavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-[#ff5fab] to-[#ff8fc5] text-[#180d15] shadow-[0_0_20px_rgba(255,120,185,0.15)]'
          : 'text-white/60 hover:bg-gradient-to-r hover:from-[#ff5fab]/15 hover:to-[#ff9bca]/15 hover:text-[#ff9bca]'
      }`}
    >
      {label}
    </button>
  );
}

function MobileNavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-[#ff5fab] to-[#ff8fc5] text-[#180d15]'
          : 'text-white/60 hover:bg-[#ff78b9]/10 hover:text-[#ff9bca]'
      }`}
    >
      {label}
    </button>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
        Descubra
      </p>

      <h2 className="mt-2 text-3xl font-black">{title}</h2>

      <p className="mt-1 text-sm text-white/40">{subtitle}</p>
    </div>
  );
}

function CategoryCard({
  title,
  type,
  index,
  onClick,
}: {
  title: string;
  type: 'Fandom' | 'Gênero';
  index: number;
  onClick: () => void;
}) {
  const gradients = [
    'from-[#5a2345] to-[#21121d]',
    'from-[#46284f] to-[#171018]',
    'from-[#303e59] to-[#13131b]',
    'from-[#58332f] to-[#1a1015]',
    'from-[#3d4b42] to-[#121714]',
    'from-[#523f62] to-[#17121c]',
  ];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${
        gradients[index % gradients.length]
      } p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#ff78b9]/30`}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-white/5 bg-white/5 transition duration-500 group-hover:scale-125" />

      <div className="relative">
        <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/35">
          {type}
        </span>

        <h3 className="mt-2 text-lg font-bold transition group-hover:text-[#ff9bca]">
          {title}
        </h3>

        <span className="mt-4 inline-block text-xs text-white/30 transition group-hover:text-white/50">
          Explorar
        </span>
      </div>
    </button>
  );
}

function EmptySearch() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <h3 className="font-medium text-white/60">
        Nenhum resultado encontrado
      </h3>

      <p className="mt-2 text-sm text-white/30">
        Tente pesquisar por outro termo.
      </p>
    </div>
  );
}

function CloudLogo() {
  return (
    <svg
      width="48"
      height="32"
      viewBox="0 0 180 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Nooklie"
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

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 text-white/35"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
