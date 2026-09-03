'use client';

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
            <Link
              href="/"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Início
            </Link>

            <Link
              href="/explorar"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Explorar
            </Link>

            <Link
              href="/escrever"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Escrever
            </Link>

            <Link
              href="/notificacoes"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Notificações
            </Link>

            <Link
              href="/perfil"
              className="whitespace-nowrap rounded-full bg-[#ff78b9] px-5 py-2 text-sm font-medium text-[#180d15]"
            >
              Perfil
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5">
          <div className="relative h-48 overflow-hidden rounded-b-3xl bg-gradient-to-br from-[#ff78b9]/30 via-[#211520] to-[#100b12]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,120,185,0.18),transparent_40%)]" />
          </div>

          <div className="relative -mt-14 px-4 pb-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#100b12] bg-[#ff78b9] text-4xl font-black text-[#180d15]">
                  A
                </div>

                <div>
                  <h1 className="text-3xl font-black">
                    autora
                  </h1>

                  <p className="mt-1 text-sm text-white/35">
                    @autora
                  </p>

                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/50">
                    Escrevendo histórias, criando mundos e tentando transformar
                    ideias em palavras.
                  </p>
                </div>
              </div>

              <button className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 hover:border-[#ff78b9]/30 hover:text-[#ff78b9]">
                Editar perfil
              </button>
            </div>

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
        <div className="flex items-center justify-between">
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
                  <span className="w-fit rounded-full bg-[#ff78b9]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ff78b9]">
                    {story.genre}
                  </span>

                  <div>
                    <h3 className="text-xl font-black group-hover:text-[#ff78b9]">
                      {story.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/30">
                      {story.chapters} capítulos · {story.status}
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

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-white/30">
          TORILAND — Um lar para histórias.
        </div>
      </footer>
    </main>
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
      <p className="mt-1 text-xs text-white/30">{label}</p>
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
