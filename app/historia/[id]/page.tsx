'use client';

import Link from 'next/link';

export default function StoryPage() {
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
              className="whitespace-nowrap rounded-full bg-[#ff78b9] px-5 py-2 text-sm font-medium text-[#180d15]"
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
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Perfil
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#151016]">
        <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
          <div className="grid gap-10 md:grid-cols-[260px_1fr] md:items-center">
            
            <div className="mx-auto w-full max-w-[260px]">
              <div className="aspect-[2/3] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#ff78b9]/30 via-[#241521] to-[#100b12] shadow-2xl shadow-black/30">
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <CloudLogo small />

                  <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff78b9]">
                    TORILAND
                  </p>

                  <h2 className="mt-3 text-3xl font-black leading-tight">
                    Entre Dois Mundos
                  </h2>

                  <p className="mt-4 text-sm text-white/35">
                    Uma história original
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#ff78b9]/10 px-3 py-1.5 text-xs font-semibold text-[#ff78b9]">
                  Romance
                </span>

                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/45">
                  16+
                </span>

                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/45">
                  Completa
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Entre Dois Mundos
              </h1>

              <p className="mt-4 text-base text-white/50">
                por{' '}
                <Link
                  href="/perfil"
                  className="font-semibold text-white/80 hover:text-[#ff78b9]"
                >
                  autora
                </Link>
              </p>

              <p className="mt-7 max-w-2xl text-base leading-8 text-white/60">
                Ela nunca acreditou que sua vida pudesse mudar em uma única
                noite. Até conhecer alguém que parecia pertencer a um mundo
                completamente diferente do seu.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/ler/1"
                  className="rounded-full bg-[#ff78b9] px-7 py-3.5 text-center text-sm font-bold text-[#180d15] transition hover:brightness-110"
                >
                  Começar a ler
                </Link>

                <button className="rounded-full border border-white/10 px-7 py-3.5 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/30 hover:text-white">
                  Adicionar à biblioteca
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 border-t border-white/10 pt-6">
                <div>
                  <p className="text-xl font-bold">24</p>
                  <p className="mt-1 text-xs text-white/30">Capítulos</p>
                </div>

                <div>
                  <p className="text-xl font-bold">8.4K</p>
                  <p className="mt-1 text-xs text-white/30">Leituras</p>
                </div>

                <div>
                  <p className="text-xl font-bold">1.2K</p>
                  <p className="mt-1 text-xs text-white/30">Curtidas</p>
                </div>

                <div>
                  <p className="text-xl font-bold">4.8</p>
                  <p className="mt-1 text-xs text-white/30">Avaliação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
          
          <div>
            <h2 className="text-2xl font-black">Sobre a história</h2>

            <p className="mt-5 text-base leading-8 text-white/50">
              Algumas histórias começam com um encontro. Outras começam com
              uma escolha. Esta começa quando duas pessoas completamente
              diferentes descobrem que talvez tenham mais em comum do que
              imaginavam.
            </p>

            <p className="mt-5 text-base leading-8 text-white/50">
              Entre segredos, sentimentos inesperados e decisões que podem
              mudar tudo, os dois precisarão descobrir se é possível construir
              algo verdadeiro quando seus mundos parecem estar destinados a
              permanecer separados.
            </p>

            <div className="mt-10">
              <h2 className="text-2xl font-black">Tags</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'romance',
                  'slow burn',
                  'drama',
                  'enemies to lovers',
                  'universidade',
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/45"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-white/10 bg-[#191219] p-6">
            <h3 className="font-bold">Informações</h3>

            <div className="mt-6 space-y-5">
              <Info label="Gênero" value="Romance" />
              <Info label="Classificação" value="16+" />
              <Info label="Status" value="Completa" />
              <Info label="Capítulos" value="24" />
              <Info label="Publicado" value="2026" />
            </div>
          </aside>
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-white/30">{label}</span>
      <span className="text-sm font-semibold text-white/70">{value}</span>
    </div>
  );
}

function CloudLogo({ small = false }: { small?: boolean }) {
  return (
    <svg
      width={small ? '62' : '82'}
      height={small ? '36' : '48'}
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
