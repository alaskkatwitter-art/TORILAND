'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CriarHistoriaPage() {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState('');
  const [status, setStatus] = useState('Em andamento');
  const [tags, setTags] = useState('');

  const [coverPreview, setCoverPreview] = useState<string | null>(
    null
  );

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Use uma imagem JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('A capa pode ter no máximo 8 MB.');
      return;
    }

    setError('');

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError('Digite um título para sua história.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/stories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível criar a história.'
        );
        return;
      }

      router.push('/perfil');
      router.refresh();
    } catch {
      setError(
        'Não foi possível criar a história. Tente novamente.'
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3"
          >
            <CloudLogo />

            <span className="text-xl font-bold tracking-[0.15em] text-[#ff78b9]">
              TORILAND
            </span>
          </button>

          <button
            onClick={() => router.push('/perfil')}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
          >
            Voltar ao perfil
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
            Nova história
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Crie sua história
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
            Apresente sua história aos leitores. Você poderá
            adicionar capítulos depois.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
            <h2 className="text-xl font-black">
              Informações principais
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  Título
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  maxLength={100}
                  required
                  placeholder="Nome da sua história"
                  className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
                />

                <p className="mt-2 text-right text-xs text-white/25">
                  {title.length}/100
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  Sinopse
                </label>

                <textarea
                  value={synopsis}
                  onChange={(event) =>
                    setSynopsis(event.target.value)
                  }
                  maxLength={2000}
                  required
                  rows={7}
                  placeholder="Sobre o que é sua história?"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
                />

                <p className="mt-2 text-right text-xs text-white/25">
                  {synopsis.length}/2000
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
            <h2 className="text-xl font-black">
              Capa
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Escolha uma imagem para representar sua história.
            </p>

            <div className="mt-6 flex flex-col gap-6 sm:flex-row">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="group relative h-64 w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#100b12] transition hover:border-[#ff78b9]/50"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Prévia da capa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                    <span className="text-sm font-bold text-white/50">
                      Adicionar capa
                    </span>

                    <span className="mt-2 text-xs leading-5 text-white/25">
                      JPG, PNG ou WEBP
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <span className="rounded-full bg-black/70 px-4 py-2 text-xs font-bold">
                    Alterar capa
                  </span>
                </div>
              </button>

              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                className="hidden"
              />

              <div className="max-w-sm">
                <p className="text-sm leading-6 text-white/40">
                  Recomendamos uma imagem vertical para que a capa
                  fique bonita nas páginas da história e no feed.
                </p>

                <p className="mt-3 text-xs leading-5 text-white/25">
                  Tamanho máximo: 8 MB.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
            <h2 className="text-xl font-black">
              Classificação e categoria
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  Gênero
                </label>

                <select
                  value={genre}
                  onChange={(event) =>
                    setGenre(event.target.value)
                  }
                  required
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#ff78b9]/60"
                >
                  <option value="" disabled>
                    Selecione um gênero
                  </option>

                  <option value="Romance">
                    Romance
                  </option>

                  <option value="Fantasia">
                    Fantasia
                  </option>

                  <option value="Ação">
                    Ação
                  </option>

                  <option value="Aventura">
                    Aventura
                  </option>

                  <option value="Drama">
                    Drama
                  </option>

                  <option value="Terror">
                    Terror
                  </option>

                  <option value="Mistério">
                    Mistério
                  </option>

                  <option value="Ficção científica">
                    Ficção científica
                  </option>

                  <option value="Comédia">
                    Comédia
                  </option>

                  <option value="Outro">
                    Outro
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  Classificação indicativa
                </label>

                <select
                  value={rating}
                  onChange={(event) =>
                    setRating(event.target.value)
                  }
                  required
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#ff78b9]/60"
                >
                  <option value="" disabled>
                    Selecione uma classificação
                  </option>

                  <option value="Livre">
                    Livre
                  </option>

                  <option value="10">
                    10 anos
                  </option>

                  <option value="12">
                    12 anos
                  </option>

                  <option value="14">
                    14 anos
                  </option>

                  <option value="16">
                    16 anos
                  </option>

                  <option value="18">
                    18 anos
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-white/80">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm text-white outline-none transition focus:border-[#ff78b9]/60"
              >
                <option value="Em andamento">
                  Em andamento
                </option>

                <option value="Concluída">
                  Concluída
                </option>
              </select>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
            <h2 className="text-xl font-black">
              Tags
            </h2>

            <p className="mt-1 text-sm text-white/35">
              Separe as tags por vírgulas.
            </p>

            <input
              type="text"
              value={tags}
              onChange={(event) =>
                setTags(event.target.value)
              }
              maxLength={300}
              placeholder="slow burn, enemies to lovers, fantasia..."
              className="mt-5 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
            />
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/perfil')}
              disabled={creating}
              className="rounded-full border border-white/10 px-7 py-3.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-[#ff78b9] px-8 py-3.5 text-sm font-bold text-[#180d15] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50"
            >
              {creating
                ? 'Criando história...'
                : 'Criar história'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function CloudLogo() {
  return (
    <svg
      width="48"
      height="30"
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
