'use client';

import { useState } from 'react';
import Link from 'next/link';

const stories = [
  {
    title: 'Entre Dois Mundos',
    genre: 'Romance',
    chapters: 24,
    status: 'Completa',
  },
  {
    title: 'Depois da Meia-Noite',
    genre: 'Drama',
    chapters: 12,
    status: 'Em andamento',
  },
  {
    title: 'As Cinzas do Reino',
    genre: 'Fantasia',
    chapters: 8,
    status: 'Em andamento',
  },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(
    'Escrevendo histórias, criando mundos e tentando transformar ideias em palavras.'
  );

  const [username, setUsername] = useState('autora');

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-5">
          <Link href="/" className="flex flex-col items-center">
            <CloudLogo />

            <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
              TORILAND
            </span>
          </Link>

          <nav className="mt-6 flex w-full items-center justify-center gap-1 overflow-x-auto border-t border-white/5 py-3">
            <NavLink href="/">Início</NavLink>

            <NavLink href="/explorar">Explorar</NavLink>

            <NavLink href="/escrever">Escrever</NavLink>

            <NavLink href="/notificacoes">Notificações</NavLink>

            <NavLink href="/perfil" active>
              Perfil
            </NavLink>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5">
          
          <div className="group relative h-56 overflow-hidden rounded-b-3xl bg-gradient-to-br from-[#ff78b9]/35 via-[#241521] to-[#100b12]">
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,120,185,0.25),transparent_40%)]" />

            <button className="absolute right-5 top-5 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-semibold text-white/60 backdrop-blur transition hover:border-[#ff78b9]/40 hover:text-[#ff78b9]">
              Alterar capa
            </button>

            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#100b12] to-transparent" />
          </div>

          <div className="relative -mt-16 px-4 pb-10">
            <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">

                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-[#100b12] bg-[#ff78b9] text-5xl font-black text-[#180d15]">
                    A
                  </div>

                  <button className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#100b12] bg-[#191219] text-sm font-bold text-[#ff78b9] hover:bg-[#ff78b9] hover:text-[#180d15]">
                    +
                  </button>
                </div>

                <div className="pb-1">
                  <h1 className="text-3xl font-black">
                    Autora
                  </h1>

                  <p className="mt-1 text-sm text-white/35">
                    @{username}
                  </p>

                  {!editing ? (
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                      {bio}
                    </p>
                  ) : null}
                </div>
              </div>

              <button
                onClick={() => setEditing(!editing)}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/30 hover:text-[#ff78b9]"
              >
                {editing ? 'Fechar edição' : 'Editar perfil'}
              </button>
            </div>

            {editing && (
              <div className="mt-8 rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
                      Personalizar perfil
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      Editar informações
                    </h2>
                  </div>
                </div>

                <div className="mt-7 grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-white/70">
                      Nome de usuário
                    </label>

                    <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#100b12] px-4">
                      <span className="text-white/25">@</span>

                      <input
                        value={username}
                        onChange={(event) =>
                          setUsername(event.target.value)
                        }
                        className="w-full bg-transparent px-2 py-3.5 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white/70">
                      Nome exibido
                    </label>

                    <input
                      defaultValue="Autora"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 outline-none focus:border-[#ff78b9]/50"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white/70">
                      Biografia
                    </label>

                    <span className="text-xs text-white/25">
                      {bio.length}/300
                    </span>
                  </div>

                  <textarea
                    value={bio}
                    maxLength={300}
                    onChange={(event) => setBio(event.target.value)}
                    rows={4}
                    className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 leading-6 outline-none focus:border-[#ff78b9]/50"
                  />
                </div>

                <div className="mt-6">
                  <label className="text-sm font-semibold text-white/70">
                    Links
                  </label>

                  <input
                    placeholder="https://..."
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 outline-none placeholder:text-white/20 focus:border-[#ff78b9]/50"
                  />
                </div>

                <div className="mt-7 flex justify-end">
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-full bg-[#ff78b9] px-7 py-3 text-sm font-bold text-[#180d15] hover:brightness-110"
                  >
                    Salvar alterações
                  </button>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-8 border-t border-white/10 pt-6">
              <Stat value="3" label="Histórias" />

              <Stat value="44" label="Capítulos" />

              <Stat value="12.8K" label="Leituras" />

              <Stat value="1.7K" label="Seguidores" />

              <Stat value="248" label="Seguindo" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Biblioteca do autor
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Histórias
            </h2>
          </div>

          <Link
            href="/escrever"
            className="rounded-full bg-[#ff78b9] px-5 py-2.5 text-xs font-bold text-[#180d15] hover:brightness-110"
          >
            Nova história
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link
              href="/historia/1"
              key={story.title}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-[#191219] transition hover:-translate-y-1 hover:border-[#ff78b9]/25"
            >
              <div className="aspect-[2/1] bg-gradient-to-br from-[#ff78b9]/25 via-[#211520] to-[#100b12] p-5">
                <div className="flex h-full flex-col justify-between">

                  <div className="flex items-start justify-between gap-3">
                    <span className="w-fit rounded-full bg-[#ff78b9]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ff78b9]">
                      {story.genre}
                    </span>

                    <span className="text-xs text-white/25">
                      {story.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black group-hover:text-[#ff78b9]">
                      {story.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      {story.chapters} capítulos
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-sm text-white/40">
                  Uma história publicada no Toriland.
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#151016]">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <h2 className="text-2xl font-black">
            Atividade
          </h2>

          <div className="mt-6 rounded-3xl border border-white/10 bg-[#191219] p-6">
            <p className="text-sm text-white/40">
              As atividades recentes do usuário aparecerão aqui.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-white/30">
          TORILAND — Um lar para histórias.
        </div>
      </footer>
    </main>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium ${
        active
          ? 'bg-[#ff78b9] text-[#180d15]'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <p className="text-xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-white/30">
        {label}
      </p>
    </div>
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
