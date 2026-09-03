'use client';

import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  BookOpen,
  Home,
  User,
  Search,
  Moon,
  Sun,
  Send,
  Bookmark,
  BarChart3,
  Share2,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';

type Story = {
  title: string;
  author: string;
  description: string;
  progress: number;
  comments: number;
  likes: number;
  chapters: number;
};

const stories: Story[] = [
  {
    title: 'The Dragon and the Rose',
    author: 'alaskkatwitter',
    description:
      'Entre dragões, segredos e uma promessa antiga, dois destinos se encontram.',
    progress: 68,
    comments: 342,
    likes: 1240,
    chapters: 18,
  },
  {
    title: 'Ashes of Winter',
    author: 'rhaenyra',
    description:
      'Um reino dividido. Uma princesa sem medo. E uma guerra que ninguém consegue evitar.',
    progress: 34,
    comments: 189,
    likes: 876,
    chapters: 12,
  },
  {
    title: 'A Crown of Starlight',
    author: 'daeron',
    description:
      'Algumas histórias começam muito antes de seus protagonistas nascerem.',
    progress: 12,
    comments: 91,
    likes: 534,
    chapters: 9,
  },
];

const feedPosts = [
  {
    author: 'alaskkatwitter',
    time: '2h',
    text: 'Finalmente terminei o capítulo 18! 🥹',
    likes: 82,
    comments: 21,
  },
  {
    author: 'rhaenyra',
    time: '5h',
    text: 'Qual personagem vocês acham que vai trair a protagonista?',
    likes: 114,
    comments: 47,
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('home');
  const [darkMode, setDarkMode] = useState(true);
  const [liked, setLiked] = useState<number[]>([]);
  const [followed, setFollowed] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shared, setShared] = useState(false);
  const [theme, setTheme] = useState('#ff6fba');

  const toggleLike = (index: number) => {
    setLiked((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index]
    );
  };

  const openStory = (story: Story) => {
    setSelectedStory(story);
    setActiveTab('reading');
  };

  const pageClass = darkMode
    ? 'min-h-screen bg-[#120b16] text-[#fff4fb]'
    : 'min-h-screen bg-[#fff7fc] text-[#271523]';

  return (
    <main className={pageClass}>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#120b16]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3"
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: theme }}
            >
              <span className="text-xl font-black text-white">🐉</span>
            </div>
            <span className="text-2xl font-black tracking-tight">Toriland</span>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              ['home', 'Início', Home],
              ['feed', 'Feed', MessageCircle],
              ['stories', 'Histórias', BookOpen],
              ['profile', 'Perfil', User],
            ].map(([id, label, Icon]) => (
              <button
                key={id as string}
                onClick={() => setActiveTab(id as string)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === id
                    ? 'bg-white/10'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={17} />
                {label as string}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl p-2 text-white/70 hover:bg-white/10"
            >
              {darkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className="h-10 w-10 overflow-hidden rounded-full border-2"
              style={{ borderColor: theme }}
            >
              <div
                className="flex h-full w-full items-center justify-center text-sm font-black"
                style={{ backgroundColor: `${theme}55` }}
              >
                A
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {activeTab === 'home' && (
          <>
            <section className="mb-10">
              <div className="grid gap-8 rounded-3xl border border-pink-300/10 bg-gradient-to-br from-[#29142d] to-[#160d1b] p-7 md:grid-cols-[1.4fr_.6fr] md:p-10">
                <div>
                  <p
                    className="mb-3 text-sm font-bold uppercase tracking-[.25em]"
                    style={{ color: theme }}
                  >
                    seu cantinho de histórias
                  </p>
                  <h1 className="max-w-2xl text-4xl font-black leading-tight md:text-6xl">
                    Leia. Escreva.
                    <br />
                    <span style={{ color: theme }}>Compartilhe.</span>
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
                    Uma comunidade feita para quem vive dentro das histórias.
                    Salve seu progresso, converse sobre seus trechos favoritos
                    e descubra novas fanfics.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('stories')}
                      className="rounded-2xl px-5 py-3 font-bold text-black"
                      style={{ backgroundColor: theme }}
                    >
                      Explorar histórias
                    </button>
                    <button
                      onClick={() => setActiveTab('feed')}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold"
                    >
                      Ver comunidade
                    </button>
                  </div>
                </div>

                <div className="hidden items-center justify-center md:flex">
                  <div
                    className="flex h-56 w-56 items-center justify-center rounded-full border"
                    style={{
                      borderColor: `${theme}55`,
                      background: `radial-gradient(circle, ${theme}30, transparent 65%)`,
                    }}
                  >
                    <span className="text-8xl">🐉</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black">Continue lendo</h2>
                    <p className="mt-1 text-sm text-white/45">
                      Suas histórias continuam exatamente de onde você parou.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('stories')}
                    className="text-sm font-bold"
                    style={{ color: theme }}
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-4">
                  {stories.slice(0, 2).map((story, index) => (
                    <button
                      key={story.title}
                      onClick={() => openStory(story)}
                      className="group w-full rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-pink-300/30 hover:bg-white/[.06]"
                    >
                      <div className="flex gap-4">
                        <div
                          className="hidden h-28 w-20 shrink-0 items-center justify-center rounded-xl sm:flex"
                          style={{
                            background: `linear-gradient(145deg, ${theme}88, #271329)`,
                          }}
                        >
                          <span className="text-3xl">📖</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-black group-hover:text-pink-200">
                                {story.title}
                              </h3>
                              <p className="text-sm text-white/45">
                                por @{story.author}
                              </p>
                            </div>
                            <ChevronRight
                              size={19}
                              className="shrink-0 text-white/30"
                            />
                          </div>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/55">
                            {story.description}
                          </p>

                          <div className="mt-4">
                            <div className="mb-2 flex justify-between text-xs text-white/40">
                              <span>Capítulo {Math.ceil(story.chapters * story.progress / 100)} de {story.chapters}</span>
                              <span>{story.progress}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${story.progress}%`,
                                  backgroundColor: theme,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 size={19} style={{ color: theme }} />
                  <h2 className="font-black">Trecho mais comentado</h2>
                </div>

                <p className="text-sm leading-6 text-white/65">
                  “Às vezes, amar alguém é escolher ficar mesmo quando todos
                  dizem que você deveria partir.”
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                  <span>Chapter 18</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} /> 127 comentários
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedStory(stories[0]);
                    setCommentOpen(true);
                  }}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-bold hover:bg-white/10"
                >
                  Ver conversa
                  <ChevronRight size={16} />
                </button>
              </aside>
            </section>
          </>
        )}

        {activeTab === 'feed' && (
          <section className="mx-auto max-w-3xl">
            <div className="mb-7">
              <h1 className="text-3xl font-black">Feed</h1>
              <p className="mt-2 text-white/45">
                O que está acontecendo na comunidade.
              </p>
            </div>

            <div className="space-y-4">
              {feedPosts.map((post, index) => (
                <article
                  key={index}
                  className="rounded-2xl border border-white/10 bg-white/[.035] p-5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full font-black"
                      style={{ backgroundColor: `${theme}44` }}
                    >
                      {post.author[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold">@{post.author}</p>
                      <p className="text-xs text-white/35">{post.time}</p>
                    </div>
                  </div>

                  <p className="mt-5 leading-7 text-white/80">{post.text}</p>

                  <div className="mt-5 flex items-center gap-6 border-t border-white/10 pt-4">
                    <button
                      onClick={() => toggleLike(index)}
                      className={`flex items-center gap-2 text-sm ${
                        liked.includes(index) ? 'text-pink-300' : 'text-white/45'
                      }`}
                    >
                      <Heart
                        size={17}
                        fill={liked.includes(index) ? 'currentColor' : 'none'}
                      />
                      {post.likes + (liked.includes(index) ? 1 : 0)}
                    </button>
                    <button className="flex items-center gap-2 text-sm text-white/45">
                      <MessageCircle size={17} />
                      {post.comments}
                    </button>
                    <button className="ml-auto text-white/45">
                      <Share2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'stories' && (
          <section>
            <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-black">Histórias</h1>
                <p className="mt-2 text-white/45">
                  Encontre sua próxima obsessão.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <Search size={17} className="text-white/40" />
                <input
                  placeholder="Buscar histórias..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <article
                  key={story.title}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.035]"
                >
                  <div
                    className="flex h-44 items-center justify-center"
                    style={{
                      background: `linear-gradient(145deg, ${theme}66, #1a0d20)`,
                    }}
                  >
                    <span className="text-6xl">📖</span>
                  </div>

                  <div className="p-5">
                    <h2 className="text-xl font-black">{story.title}</h2>
                    <p className="mt-1 text-sm text-white/40">
                      @{story.author}
                    </p>
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/55">
                      {story.description}
                    </p>

                    <div className="mt-5 flex items-center gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Heart size={14} /> {story.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={14} /> {story.comments}
                      </span>
                      <span>{story.chapters} capítulos</span>
                    </div>

                    <button
                      onClick={() => openStory(story)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-black"
                      style={{ backgroundColor: theme }}
                    >
                      Ler história
                      <BookOpen size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'profile' && (
          <section className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.035]">
              <div
                className="h-40"
                style={{
                  background: `linear-gradient(120deg, ${theme}99, #25102d 70%)`,
                }}
              />

              <div className="px-6 pb-7">
                <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#120b16] text-3xl font-black"
                      style={{ backgroundColor: `${theme}77` }}
                    >
                      A
                    </div>
                    <div className="pb-2">
                      <h1 className="text-2xl font-black">Alaska</h1>
                      <p className="text-sm text-white/40">@alaskkatwitter</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setFollowed(!followed)}
                    className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-bold"
                    style={{
                      backgroundColor: followed ? 'transparent' : theme,
                      color: followed ? 'white' : 'black',
                      border: followed ? '1px solid rgba(255,255,255,.15)' : 'none',
                    }}
                  >
                    {followed ? <Check size={17} /> : <Plus size={17} />}
                    {followed ? 'Seguindo' : 'Seguir'}
                  </button>
                </div>

                <p className="mt-6 max-w-xl text-sm leading-6 text-white/60">
                  Escrevendo histórias que provavelmente vão me destruir
                  emocionalmente antes de destruir vocês.
                </p>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  <Stat label="Histórias" value="12" />
                  <Stat label="Seguidores" value="2.4k" />
                  <Stat label="Seguindo" value="184" />
                </div>

                <div className="mt-8 border-t border-white/10 pt-7">
                  <h2 className="text-lg font-black">Tema do perfil</h2>
                  <p className="mt-1 text-sm text-white/40">
                    Escolha a cor que representa seu cantinho.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      '#ff6fba',
                      '#b78cff',
                      '#62b8ff',
                      '#65d69a',
                      '#f7c969',
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setTheme(color)}
                        className="h-9 w-9 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'reading' && selectedStory && (
          <section className="mx-auto max-w-3xl">
            <button
              onClick={() => setActiveTab('stories')}
              className="mb-6 text-sm font-bold text-white/50 hover:text-white"
            >
              ← Voltar para histórias
            </button>

            <article className="rounded-3xl border border-white/10 bg-white/[.035] p-6 md:p-10">
              <div className="mb-8">
                <p className="text-sm font-bold" style={{ color: theme }}>
                  CAPÍTULO 18
                </p>
                <h1 className="mt-2 text-3xl font-black md:text-4xl">
                  The Dragon and the Rose
                </h1>
                <p className="mt-2 text-sm text-white/40">
                  por @{selectedStory.author}
                </p>
              </div>

              <div className="space-y-6 text-[17px] leading-8 text-white/75">
                <p>
                  A noite havia caído sobre o reino quando ela finalmente
                  atravessou os portões do castelo.
                </p>

                <p>
                  O vento carregava o cheiro de chuva e, ao longe, um dragão
                  rugia entre as montanhas.
                </p>

                <p>
                  <button
                    onClick={() => setCommentOpen(true)}
                    className="rounded bg-pink-300/10 px-1 text-left underline decoration-pink-300/50 underline-offset-4"
                  >
                    “Às vezes, amar alguém é escolher ficar mesmo quando todos
                    dizem que você deveria partir.”
                  </button>
                </p>

                <p>
                  Ela respirou fundo. Pela primeira vez, percebeu que talvez
                  não estivesse diante de uma escolha entre o dever e o amor.
                  Talvez estivesse diante de uma escolha sobre quem queria ser.
                </p>
              </div>

              <div className="mt-10 rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-black">Enquete</p>
                    <p className="text-sm text-white/40">
                      O que você acha que ela deve fazer?
                    </p>
                  </div>
                  <BarChart3 size={19} style={{ color: theme }} />
                </div>

                <div className="space-y-2">
                  <PollOption text="Ficar no castelo" percent={64} />
                  <PollOption text="Fugir durante a noite" percent={23} />
                  <PollOption text="Confrontá-lo" percent={13} />
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Progresso dos leitores</p>
                  <span className="text-sm" style={{ color: theme }}>
                    68%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{ width: '68%', backgroundColor: theme }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/35">
                  68% dos leitores chegaram a este capítulo.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setCommentOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                >
                  <MessageCircle size={17} />
                  Comentar trecho
                </button>

                <button
                  onClick={() => setShared(true)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold"
                >
                  <Share2 size={17} />
                  {shared ? 'Trecho compartilhado' : 'Compartilhar trecho'}
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold">
                  <Bookmark size={17} />
                  Salvar
                </button>
              </div>
            </article>
          </section>
        )}
      </div>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/30">
        Toriland · feito para quem ama histórias
      </footer>

      {commentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 md:items-center md:p-6">
          <div className="w-full max-w-xl rounded-t-3xl border border-white/10 bg-[#1b101f] p-6 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Comentários do trecho</h2>
                <p className="mt-1 text-sm text-white/40">
                  Conversa ancorada exatamente nesta passagem.
                </p>
              </div>
              <button
                onClick={() => setCommentOpen(false)}
                className="rounded-xl px-3 py-2 text-white/50 hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <Comment
                author="alaskkatwitter"
                authorTag
                text="EU NÃO ESTOU BEM. Essa frase acabou comigo."
              />
              <Comment
                author="rhaenyra"
                text="Eu sabia que essa parte ia gerar caos nos comentários KKKK."
              />
            </div>

            <div className="mt-6 flex gap-2">
              <input
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Comente este trecho..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-white/30"
