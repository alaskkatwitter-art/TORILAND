'use client';

import { useState } from 'react';

const genres = [
  'Romance',
  'Fantasia',
  'Drama',
  'Aventura',
  'Terror',
  'Mistério',
  'Ficção científica',
  'Fanfic',
];

const ratings = ['Livre', '12+', '14+', '16+', '18+'];

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('');
  const [tags, setTags] = useState('');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-5">
          <a href="/" className="flex flex-col items-center">
            <CloudLogo />

            <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
              TORILAND
            </span>
          </a>

          <nav className="mt-6 flex w-full items-center justify-center gap-1 overflow-x-auto border-t border-white/5 py-3">
            <a
              href="/"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Início
            </a>

            <a
              href="/explorar"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Explorar
            </a>

            <a
              href="/escrever"
              className="whitespace-nowrap rounded-full bg-[#ff78b9] px-5 py-2 text-sm font-medium text-[#180d15]"
            >
              Escrever
            </a>

            <a
              href="/notificacoes"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Notificações
            </a>

            <a
              href="/perfil"
              className="whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white"
            >
              Perfil
            </a>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
            Área do autor
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Comece sua história.
          </h1>

          <p className="mt-4 max-w-2xl text-white/50">
            Crie o universo da sua história e prepare tudo para compartilhar
            com seus leitores.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <section>
            <div className="sticky top-6">
              <p className="mb-3 text-sm font-semibold text-white/60">
                Capa da história
              </p>

              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[#191219] p-6 text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff78b9]/10 text-2xl text-[#ff78b9]">
                    +
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Adicionar capa
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/30">
                    JPG ou PNG
                    <br />
                    Recomendado: 600 × 900
                  </p>

                  <button className="mt-5 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold hover:border-[#ff78b9]/40 hover:text-[#ff78b9]">
                    Escolher imagem
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
            <div>
              <label className="text-sm font-semibold text-white/75">
                Título
              </label>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Dê um nome à sua história"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/50"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white/75">
                  Sinopse
                </label>

                <span className="text-xs text-white/25">
                  {description.length}/500
                </span>
              </div>

              <textarea
                value={description}
                onChange={(event) => {
                  if (event.target.value.length <= 500) {
                    setDescription(event.target.value);
                  }
                }}
                placeholder="Conte um pouco sobre a sua história..."
                rows={6}
                className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/50"
              />
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-white/75">
                  Gênero
                </label>

                <select
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  className="mt-2 w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-white/70 outline-none focus:border-[#ff78b9]/50"
                >
                  <option value="">Escolha um gênero</option>

                  {genres.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-white/75">
                  Classificação
                </label>

                <select
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  className="mt-2 w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-white/70 outline-none focus:border-[#ff78b9]/50"
                >
                  <option value="">Escolha a classificação</option>

                  {ratings.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-white/75">
                Tags
              </label>

              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Ex.: romance, slow burn, fantasia..."
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 outline-none placeholder:text-white/25 focus:border-[#ff78b9]/50"
              />

              <p className="mt-2 text-xs text-white/25">
                Separe as tags por vírgulas.
              </p>
            </div>

            <div className="my-8 border-t border-white/10" />

            <div className="rounded-2xl border border-[#ff78b9]/10 bg-[#ff78b9]/5 p-5">
              <h2 className="font-bold">
                Pronto para começar?
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Depois de criar sua história, você poderá adicionar capítulos,
                editar informações e publicar para seus leitores.
              </p>
            </div>

            {saved && (
              <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-300">
                Rascunho criado com sucesso. Agora podemos adicionar o
                primeiro capítulo.
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
                Cancelar
              </button>

              <button
                onClick={handleSave}
                className="rounded-full bg-[#ff78b9] px-7 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110"
              >
                Criar história
              </button>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-white/30">
          TORILAND — Um lar para histórias.
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
