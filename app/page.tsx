'use client';

import { useState } from 'react';
import AuthStatus from '@/components/AuthStatus';

type Story = {
  title: string;
  author: string;
  description: string;
  genre: string;
  color: string;
};

const trendingStories: Story[] = [
  {
    title: 'Entre Dragões e Estrelas',
    author: 'Valarr',
    description:
      'Dois destinos ligados por uma promessa antiga e um reino prestes a despertar.',
    genre: 'Fantasia',
    color: '#6d294f',
  },
  {
    title: 'Depois da Meia-Noite',
    author: 'Jolie',
    description:
      'Algumas histórias de amor começam justamente quando deveriam terminar.',
    genre: 'Romance',
    color: '#472d58',
  },
  {
    title: 'O Último Herdeiro',
    author: 'Daeron',
    description:
      'Um segredo de família pode mudar para sempre o destino de um império.',
    genre: 'Drama',
    color: '#293d59',
  },
];

const recentStories: Story[] = [
  {
    title: 'Coroa de Cinzas',
    author: 'Alys',
    description:
      'Uma princesa, uma guerra e um casamento que nunca deveria acontecer.',
    genre: 'Fantasia',
    color: '#54302f',
  },
  {
    title: 'A Cidade Entre Nós',
    author: 'Mira',
    description:
      'Eles vivem na mesma cidade, mas parecem viver em mundos diferentes.',
    genre: 'Romance',
    color: '#3f3152',
  },
  {
    title: 'Quando o Inverno Chegar',
    author: 'Elena',
    description:
      'Uma promessa feita na infância retorna muitos anos depois.',
    genre: 'Drama',
    color: '#314552',
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('Início');
  const [search, setSearch] = useState('');

  const menu = ['Início', 'Explorar', 'Escrever', 'Notificações', 'Perfil'];

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-5">
          <button
            onClick={() => setActiveTab('Início')}
            className="group flex flex-col items-center"
          >
            <CloudLogo />
            <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
              TORILAND
            </span>
          </button>

          <nav className="mt-6 flex w-full items-center justify-center gap-1 overflow-x-auto border-t border-white/5 py-3">
            {menu.map((item) => (
              <button
                key={item}
                onClick={() => setActiveTab(item)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium transition ${
                  activeTab === item
                    ? 'bg-[#ff78b9] text-[#180d15]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="mb-4 flex w-full justify-center">
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5">
        <section className="relative overflow-hidden py-14 md:py-20">
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff4fa3]/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Um lar para histórias
            </p>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Encontre uma história.
              <br />
              <span className="text-[#ff78b9]">Ou escreva a sua.</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
              Descubra novos universos, acompanhe seus autores favoritos e
              encontre histórias que fazem você querer virar a próxima página.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setActiveTab('Explorar')}
                className="rounded-full bg-[#ff78b9] px-7 py-3.5 font-bold text-[#180d15] transition hover:brightness-110"
              >
                Explorar histórias
              </button>

              <button
                onClick={() => setActiveTab('Escrever')}
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-bold transition hover:bg-white/10"
              >
                Começar a escrever
              </button>
            </div>
          </div>
        </section>

        <section className="pb-12">
          <div className="flex items-center rounded-2xl border border-white/10 bg-[#191219] px-5 py-4">
            <span className="mr-3 text-white/35">⌕</span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar histórias, autores ou gêneros..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {search && (
            <p className="mt-3 text-sm text-white/40">
              Procurando por:{' '}
              <span className="text-[#ff78b9]">{search}</span>
            </p>
          )}
        </section>

        <StorySection
          title="Em alta"
          subtitle="As histórias que estão conquistando leitores"
          stories={trendingStories}
        />

        <StorySection
          title="Histórias recentes"
          subtitle="Novas histórias acabaram de chegar ao Toriland"
          stories={recentStories}
        />

        <section className="my-16 overflow-hidden rounded-3xl border border-[#ff78b9]/15 bg-gradient-to-r from-[#291522] to-[#191119]">
          <div className="flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center md:p-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
                Para quem escreve
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Sua história merece um lugar.
              </h2>

              <p className="mt-3 leading-7 text-white/50">
                Crie seu perfil, publique seus capítulos e encontre leitores
                que querem conhecer o seu universo.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('Escrever')}
              className="shrink-0 rounded-full bg-[#ff78b9] px-7 py-3.5 font-bold text-[#180d15]"
            >
              Publicar uma história
            </button>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
          <p>TORILAND</p>

          <div className="flex gap-5">
            <button className="hover:text-white">Sobre</button>
            <button className="hover:text-white">Termos</button>
            <button className="hover:text-white">Privacidade</button>
          </div>

          <p>Um lar para histórias.</p>
        </div>
      </footer>
    </main>
  );
}

function CloudLogo() {
  return (
    <svg
      width="82"
      height="48"
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

function StorySection({
  title,
  subtitle,
  stories,
}: {
  title: string;
  subtitle: string;
  stories: Story[];
}) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-white/40">{subtitle}</p>
        </div>

        <button className="w-fit text-sm font-semibold text-[#ff78b9] hover:underline">
          Ver tudo
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.title} story={story} />
        ))}
      </div>
    </section>
  );
}

function StoryCard({ story }: { story: Story }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#191219] transition hover:-translate-y-1 hover:border-[#ff78b9]/30">
      <div
        className="relative flex h-56 items-end overflow-hidden p-5"
        style={{
          background: `linear-gradient(135deg, ${story.color}, #120b16)`,
        }}
      >
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/10 bg-white/5" />

        <div className="absolute bottom-5 left-5 h-20 w-20 rounded-full bg-white/5 blur-xl" />

        <div className="relative">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur">
            {story.genre}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold transition group-hover:text-[#ff78b9]">
          {story.title}
        </h3>

        <p className="mt-1 text-sm text-[#ff78b9]">
          por {story.author}
        </p>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">
          {story.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs text-white/30">
            12 capítulos
          </span>

          <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold transition hover:border-[#ff78b9]/40 hover:text-[#ff78b9]">
            Ler história
          </button>
        </div>
      </div>
    </article>
  );
}          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#ff4fa3]/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Um lar para histórias
            </p>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Encontre uma história.
              <br />
              <span className="text-[#ff78b9]">
                Ou escreva a sua.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
              Descubra novos universos, acompanhe seus autores favoritos e
              encontre histórias que fazem você querer virar a próxima página.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setActiveTab('Explorar')}
                className="rounded-full bg-[#ff78b9] px-7 py-3.5 font-bold text-[#180d15] transition hover:brightness-110"
              >
                Explorar histórias
              </button>

              <button
                onClick={() => setActiveTab('Escrever')}
                className="rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-bold transition hover:bg-white/10"
              >
                Começar a escrever
              </button>
            </div>
          </div>
        </section>

        {/* BUSCA */}
        <section className="pb-12">
          <div className="flex items-center rounded-2xl border border-white/10 bg-[#191219] px-5 py-4">
            <span className="mr-3 text-white/35">⌕</span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar histórias, autores ou gêneros..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>

          {search && (
            <p className="mt-3 text-sm text-white/40">
              Procurando por: <span className="text-[#ff78b9]">{search}</span>
            </p>
          )}
        </section>

        {/* EM ALTA */}
        <StorySection
          title="Em alta"
          subtitle="As histórias que estão conquistando leitores"
          stories={trendingStories}
        />

        {/* RECENTES */}
        <StorySection
          title="Histórias recentes"
          subtitle="Novas histórias acabaram de chegar ao Toriland"
          stories={recentStories}
        />

        {/* BANNER AUTOR */}
        <section className="my-16 overflow-hidden rounded-3xl border border-[#ff78b9]/15 bg-gradient-to-r from-[#291522] to-[#191119]">
          <div className="flex flex-col items-start justify-between gap-8 p-8 md:flex-row md:items-center md:p-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
                Para quem escreve
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Sua história merece um lugar.
              </h2>

              <p className="mt-3 leading-7 text-white/50">
                Crie seu perfil, publique seus capítulos e encontre leitores
                que querem conhecer o seu universo.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('Escrever')}
              className="shrink-0 rounded-full bg-[#ff78b9] px-7 py-3.5 font-bold text-[#180d15]"
            >
              Publicar uma história
            </button>
          </div>
        </section>
      </div>

      {/* RODAPÉ */}
      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-white/35 md:flex-row md:items-center md:justify-between">
          <p>TORILAND</p>

          <div className="flex gap-5">
            <button className="hover:text-white">Sobre</button>
            <button className="hover:text-white">Termos</button>
            <button className="hover:text-white">Privacidade</button>
          </div>

          <p>Um lar para histórias.</p>
        </div>
      </footer>
    </main>
  );
}

/* =========================
   LOGO DA NUVEM
========================= */

function CloudLogo() {
  return (
    <svg
      width="82"
      height="48"
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

/* =========================
   SEÇÃO DE HISTÓRIAS
========================= */

function StorySection({
  title,
  subtitle,
  stories,
}: {
  title: string;
  subtitle: string;
  stories: Story[];
}) {
  return (
    <section className="mb-16">
      <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
        <div>
          <h2 className="text-2xl font-black md:text-3xl">{title}</h2>

          <p className="mt-1 text-sm text-white/40">{subtitle}</p>
        </div>

        <button className="w-fit text-sm font-semibold text-[#ff78b9] hover:underline">
          Ver tudo
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {stories.map((story) => (
          <StoryCard key={story.title} story={story} />
        ))}
      </div>
    </section>
  );
}

/* =========================
   CARD
========================= */

function StoryCard({ story }: { story: Story }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-[#191219] transition hover:-translate-y-1 hover:border-[#ff78b9]/30">
      <div
        className="relative flex h-56 items-end overflow-hidden p-5"
        style={{
          background: `linear-gradient(135deg, ${story.color}, #120b16)`,
        }}
      >
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border border-white/10 bg-white/5" />

        <div className="absolute bottom-5 left-5 h-20 w-20 rounded-full bg-white/5 blur-xl" />

        <div className="relative">
          <span className="rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur">
            {story.genre}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold transition group-hover:text-[#ff78b9]">
          {story.title}
        </h3>

        <p className="mt-1 text-sm text-[#ff78b9]">
          por {story.author}
        </p>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/45">
          {story.description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs text-white/30">
            12 capítulos
          </span>

          <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold transition hover:border-[#ff78b9]/40 hover:text-[#ff78b9]">
            Ler história
          </button>
        </div>
      </div>
    </article>
  );
}
