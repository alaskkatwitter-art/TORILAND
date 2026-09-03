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

            <span className="text-2xl font-black tracking-tight">
              Toriland
            </span>
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
                      background: `radial-gradient(circle, ${theme}
background: `radial-gradient(circle, ${theme}
