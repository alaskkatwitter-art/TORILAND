'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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

type Story = {
id: string;
title: string;
description: string | null;
cover_url: string | null;
status: string | null;
rating: string | null;
};

export default function WritePage() {
const router = useRouter();
const searchParams = useSearchParams();

const storyId = searchParams.get('id');
const isEditing = Boolean(storyId);

const [title, setTitle] = useState('');
const [description, setDescription] = useState('');
const [genre, setGenre] = useState('');
const [rating, setRating] = useState('');
const [tags, setTags] = useState('');

const [coverFile, setCoverFile] = useState<File | null>(null);
const [coverPreview, setCoverPreview] = useState<string | null>(null);

const [loadingStory, setLoadingStory] = useState(false);
const [saving, setSaving] = useState(false);

const [error, setError] = useState('');
const [saved, setSaved] = useState(false);

// ======================================================
// CARREGA HISTÓRIA PARA EDIÇÃO
// ======================================================

useEffect(() => {
if (!storyId) return;

async function loadStory() {
  try {
    setLoadingStory(true);
    setError('');

    const response = await fetch(
      `/api/stories/${storyId}`,
      {
        cache: 'no-store',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          'Não foi possível carregar a história.'
      );
    }

    const story: Story = data.story;

    setTitle(story.title || '');
    setDescription(story.description || '');
    setGenre('');
    setRating(
      story.rating
        ? story.rating === 'Livre'
          ? 'Livre'
          : `${story.rating}+`
        : ''
    );

    setCoverPreview(story.cover_url || null);

    // Recupera as tags da história.
    const loadedTags = Array.isArray(story.tags)
      ? story.tags
          .filter(
            (tag: any) =>
              tag.category_slug !== 'genre'
          )
          .map((tag: any) => tag.name)
          .join(', ')
      : '';

    setTags(loadedTags);

    // O gênero vem das tags.
    const genreTag = Array.isArray(story.tags)
      ? story.tags.find(
          (tag: any) =>
            tag.category_slug === 'genre'
        )
      : null;

    if (genreTag?.name) {
      setGenre(genreTag.name);
    }
  } catch (err: any) {
    console.error(err);

    setError(
      err?.message ||
        'Não foi possível carregar a história.'
    );
  } finally {
    setLoadingStory(false);
  }
}

loadStory();

}, [storyId]);

// ======================================================
// SELECIONAR CAPA
// ======================================================

function handleCoverChange(
event: React.ChangeEvent<HTMLInputElement>
) {
const file = event.target.files?.[0];

if (!file) return;

const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

if (!allowedTypes.includes(file.type)) {
  setError(
    'A capa precisa ser JPG, PNG, WEBP ou GIF.'
  );
  return;
}

if (file.size > 10 * 1024 * 1024) {
  setError(
    'A capa pode ter no máximo 10 MB.'
  );
  return;
}

setError('');
setCoverFile(file);

const previewUrl =
  URL.createObjectURL(file);

setCoverPreview(previewUrl);

}

// ======================================================
// SALVAR
// ======================================================

async function handleSave(
event: React.FormEvent
) {
event.preventDefault();

setError('');
setSaved(false);

if (!title.trim()) {
  setError('Digite um título para a história.');
  return;
}

if (title.trim().length > 150) {
  setError(
    'O título pode ter no máximo 150 caracteres.'
  );
  return;
}

if (description.trim().length > 500) {
  setError(
    'A sinopse pode ter no máximo 500 caracteres.'
  );
  return;
}

if (!genre) {
  setError('Escolha um gênero para a história.');
  return;
}

setSaving(true);

try {
  const formData = new FormData();

  formData.append('title', title.trim());
  formData.append(
    'description',
    description.trim()
  );

  formData.append(
    'status',
    'Em andamento'
  );

  formData.append(
    'genre',
    genre
  );

  // A interface mostra "12+", mas a API
  // trabalha com "12".
  const normalizedRating =
    rating === 'Livre'
      ? 'Livre'
      : rating.replace('+', '');

  formData.append(
    'rating',
    normalizedRating
  );

  formData.append(
    'tags',
    tags.trim()
  );

  if (coverFile) {
    formData.append(
      'cover',
      coverFile
    );
  }

  const endpoint = isEditing
    ? `/api/stories/${storyId}`
    : '/api/stories/create';

  const response = await fetch(
    endpoint,
    {
      method: isEditing
        ? 'PUT'
        : 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        'Não foi possível salvar a história.'
    );
  }

  setSaved(true);

  const savedStoryId =
    data?.story?.id || storyId;

  if (savedStoryId) {
    router.push(
      `/historia/${savedStoryId}`
    );
  }
} catch (err: any) {
  console.error(err);

  setError(
    err?.message ||
      'Erro de conexão. Tente novamente.'
  );
} finally {
  setSaving(false);
}

}

// ======================================================
// CARREGAMENTO
// ======================================================

if (loadingStory) {
return (
<main className="min-h-screen bg-[#100b12] text-white flex items-center justify-center">
<div className="text-sm text-white/50">
Carregando história...
</div>
</main>
);
}

return (
<main className="min-h-screen bg-[#100b12] text-white">
<header className="border-b border-white/10 bg-[#100b12]">
<div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-5">
<button
type="button"
onClick={() => router.push('/')}
className="flex flex-col items-center"
>
<CloudLogo />

        <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
          NOOKLIE
        </span>
      </button>

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
        {isEditing
          ? 'Edite sua história.'
          : 'Comece sua história.'}
      </h1>

      <p className="mt-4 max-w-2xl text-white/50">
        {isEditing
          ? 'Atualize as informações da sua obra e mantenha tudo do jeitinho que você quiser.'
          : 'Crie o universo da sua história e prepare tudo para compartilhar com seus leitores.'}
      </p>
    </div>

    <form
      onSubmit={handleSave}
      className="grid gap-6 md:grid-cols-[280px_1fr]"
    >
      {/* CAPA */}
      <section>
        <div className="sticky top-6">
          <p className="mb-3 text-sm font-semibold text-white/60">
            Capa da história
          </p>

          <div className="relative flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-3xl border border-dashed border-white/15 bg-[#191219] text-center">
            {coverPreview ? (
              <>
                <img
                  src={coverPreview}
                  alt="Prévia da capa"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4">
                  <label className="inline-flex cursor-pointer rounded-full bg-[#ff78b9] px-4 py-2 text-xs font-bold text-[#180d15] hover:brightness-110">
                    Trocar imagem

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff78b9]/10 text-2xl text-[#ff78b9]">
                  +
                </div>

                <p className="mt-4 text-sm font-semibold">
                  Adicionar capa
                </p>

                <p className="mt-2 text-xs leading-5 text-white/30">
                  JPG, PNG, WEBP ou GIF
                  <br />
                  Recomendado: 600 × 900
                </p>

                <label className="mt-5 inline-flex cursor-pointer rounded-full border border-white/10 px-4 py-2 text-xs font-semibold hover:border-[#ff78b9]/40 hover:text-[#ff78b9]">
                  Escolher imagem

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* INFORMAÇÕES */}
      <section className="rounded-3xl border border-white/10 bg-[#191219] p-6 md:p-8">
        <div>
          <label className="text-sm font-semibold text-white/75">
            Título
          </label>

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            placeholder="Dê um nome à sua história"
            maxLength={150}
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
              if (
                event.target.value.length <=
                500
              ) {
                setDescription(
                  event.target.value
                );
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
              onChange={(event) =>
                setGenre(event.target.value)
              }
              className="mt-2 w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-white/70 outline-none focus:border-[#ff78b9]/50"
            >
              <option value="">
                Escolha um gênero
              </option>

              {genres.map((item) => (
                <option
                  key={item}
                  value={item}
                >
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
              onChange={(event) =>
                setRating(event.target.value)
              }
              className="mt-2 w-full appearance-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-white/70 outline-none focus:border-[#ff78b9]/50"
            >
              <option value="">
                Escolha a classificação
              </option>

              {ratings.map((item) => (
                <option
                  key={item}
                  value={item}
                >
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
            onChange={(event) =>
              setTags(event.target.value)
            }
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
            {isEditing
              ? 'Sua história'
              : 'Pronto para começar?'}
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/40">
            {isEditing
              ? 'As alterações serão salvas na sua obra.'
              : 'Depois de criar sua história, você poderá adicionar capítulos, editar informações e publicar para seus leitores.'}
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {saved && (
          <div className="mt-5 rounded-2xl border border-green-400/20 bg-green-400/5 p-4 text-sm text-green-300">
            {isEditing
              ? 'História atualizada com sucesso.'
              : 'História criada com sucesso.'}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              if (storyId) {
                router.push(
                  `/historia/${storyId}`
                );
              } else {
                router.back();
              }
            }}
            disabled={saving}
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#ff78b9] px-7 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'Salvando...'
              : isEditing
              ? 'Salvar alterações'
              : 'Criar história'}
          </button>
        </div>
      </section>
    </form>
  </div>

  <footer className="border-t border-white/10 bg-[#0b080d]">
    <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-white/30">
      NOOKLIE — Um lar para histórias.
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
