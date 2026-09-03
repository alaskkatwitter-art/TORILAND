'use client';

import { useState } from 'react';

type Story = {
  id: number;
  title: string;
  author: string;
  description: string;
};

const stories: Story[] = [
  {
    id: 1,
    title: 'Entre Dragões e Estrelas',
    author: 'Valarr',
    description: 'Uma história de amor, magia e dragões.',
  },
  {
    id: 2,
    title: 'O Último Reino',
    author: 'Jolie',
    description: 'Quando dois destinos se encontram.',
  },
  {
    id: 3,
    title: 'Asas de Fogo',
    author: 'Daeron',
    description: 'Um segredo antigo está prestes a despertar.',
  },
];

export default function Home() {
  const [tab, setTab] = useState('home');
  const [liked, setLiked] = useState<number[]>([]);
  const [following, setFollowing] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [dark, setDark] = useState(true);

  function toggleLike(id: number) {
    setLiked((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  return (
    <main className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-[#120b16] text-white">
        <header className="sticky top-0 z-20 border-b border-pink-300/10 bg-[#120b16]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <button
              onClick={() => setTab('home')}
              className="text-2xl font-black text-pink-400"
            >
              Toriland
            </button>

            <button
              onClick={() => setDark(!dark)}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm"
            >
              {dark ? '☀️' : '🌙'}
            </button>
          </div>

          <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
            <NavButton
              active={tab === 'home'}
              onClick={() => setTab('home')}
            >
              🏠 Início
            </NavButton>

            <NavButton
              active={tab === 'feed'}
              onClick={() => setTab('feed')}
            >
              ✨ Feed
            </NavButton>

            <NavButton
              active={tab === 'stories'}
              onClick={() => setTab('stories')}
            >
              📚 Histórias
            </NavButton>

            <NavButton
              active={tab === 'profile'}
              onClick={() => setTab('profile')}
            >
              👤 Perfil
            </NavButton>
          </nav>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-8">
          {tab === 'home' && (
            <>
              <div className="rounded-3xl border border-pink-300/10 bg-[#1b101f] p-6">
                <p className="mb-2 text-sm font-semibold text-pink-300">
                  SEU CANTINHO DE HISTÓRIAS
                </p>

                <h1 className="text-4xl font-black">
                  Bem-vinda ao Toriland ✨
                </h1>

                <p className="mt-3 max-w-2xl text-white/60">
                  Um lugar para descobrir histórias, acompanhar autores,
                  comentar e mergulhar em novos universos.
                </p>

                <button
                  onClick={() => setTab('stories')}
                  className="mt-6 rounded-2xl bg-pink-500 px-5 py-3 font-bold"
                >
                  Explorar histórias
                </button>
              </div>

              <h2 className="mt-10 text-2xl font-bold">
                Histórias em destaque
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    liked={liked.includes(story.id)}
                    onLike={() => toggleLike(story.id)}
                    onOpen={() => setSelectedStory(story)}
                  />
                ))}
              </div>
            </>
          )}

          {tab === 'feed' && (
            <div>
              <h1 className="text-3xl font-black">Seu Feed ✨</h1>

              <div className="mt-6 space-y-4">
                <article className="rounded-3xl border border-white/10 bg-[#1b101f] p-5">
                  <p className="font-bold">Valarr publicou um novo capítulo.</p>
                  <p className="mt-2 text-white/50">
                    Entre Dragões e Estrelas — Capítulo 12
                  </p>

                  <button className="mt-4 rounded-xl bg-pink-500 px-4 py-2 font-semibold">
                    Ler capítulo
                  </button>
                </article>

                <article className="rounded-3xl border border-white/10 bg-[#1b101f] p-5">
                  <p className="font-bold">Jolie começou uma nova história.</p>
                  <p className="mt-2 text-white/50">
                    O Último Reino
                  </p>
                </article>
              </div>
            </div>
          )}

          {tab === 'stories' && (
            <div>
              <h1 className="text-3xl font-black">Todas as histórias 📚</h1>

              <div className="mt-6 space-y-4">
                {stories.map((story) => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    liked={liked.includes(story.id)}
                    onLike={() => toggleLike(story.id)}
                    onOpen={() => setSelectedStory(story)}
                  />
                ))}
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border border-white/10 bg-[#1b101f] p-8 text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-500 text-4xl">
                  🐉
                </div>

                <h1 className="mt-4 text-2xl font-black">
                  Seu perfil
                </h1>

                <p className="mt-2 text-white/50">
                  Leitora e futura autora do Toriland.
                </p>

                <button
                  onClick={() => setFollowing(!following)}
                  className="mt-6 rounded-xl bg-pink-500 px-6 py-3 font-bold"
                >
                  {following ? 'Seguindo ✓' : 'Seguir'}
                </button>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  <Stat number="0" label="Histórias" />
                  <Stat number={String(liked.length)} label="Curtidas" />
                  <Stat number="0" label="Seguidores" />
                </div>
              </div>
            </div>
          )}
        </section>

        {selectedStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#1b101f] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-pink-300">
                    História
                  </p>

                  <h2 className="mt-1 text-2xl font-black">
                    {selectedStory.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedStory(null)}
                  className="rounded-xl border border-white/10 px-3 py-2"
                >
                  ✕
                </button>
              </div>

              <p className="mt-5 text-white/60">
                {selectedStory.description}
              </p>

              <p className="mt-4 text-sm text-white/40">
                Por {selectedStory.author}
              </p>

              <button
                onClick={() => setSelectedStory(null)}
                className="mt-6 w-full rounded-xl bg-pink-500 py-3 font-bold"
              >
                Começar a ler
              </button>
            </div>
          </div>
        )}

        <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/30">
          Toriland © 2026 — histórias para quem ama histórias.
        </footer>
      </div>
    </main>
  );
}

function NavButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold ${
        active
          ? 'bg-pink-500 text-white'
          : 'bg-white/5 text-white/60'
      }`}
    >
      {children}
    </button>
  );
}

function StoryCard({
  story,
  liked,
  onLike,
  onOpen,
}: {
  story: Story;
  liked: boolean;
  onLike: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-[#1b101f] p-5">
      <div className="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/40 to-purple-900/40 text-6xl">
        📖
      </div>

      <h3 className="mt-4 text-xl font-black">
        {story.title}
      </h3>

      <p className="mt-1 text-sm text-pink-300">
        por {story.author}
      </p>

      <p className="mt-3 text-sm text-white/50">
        {story.description}
      </p>

      <div className="mt-5 flex gap-2">
        <button
          onClick={onOpen}
          className="flex-1 rounded-xl bg-pink-500 py-2 font-bold"
        >
          Ler
        </button>

        <button
          onClick={onLike}
          className="rounded-xl border border-white/10 px-4"
        >
          {liked ? '❤️' : '🤍'}
        </button>
      </div>
    </article>
  );
}

function Stat({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <strong className="block text-xl">{number}</strong>
      <span className="text-xs text-white/40">{label}</span>
    </div>
  );
}
