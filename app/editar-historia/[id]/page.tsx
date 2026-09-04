'use client';

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';

type Tag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug: string | null;
};

type Story = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  tags: Tag[];
};

export default function EditarHistoriaPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [story, setStory] =
    useState<Story | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [genre, setGenre] = useState('');

  const [tags, setTags] = useState<string[]>(
    []
  );
  const [tagInput, setTagInput] =
    useState('');

  const [coverFile, setCoverFile] =
    useState<File | null>(null);
  const [coverPreview, setCoverPreview] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');

  // =========================
  // CARREGA HISTÓRIA
  // =========================

  useEffect(() => {
    if (!id) return;

    async function loadStory() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/stories/${id}`,
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

        const loadedStory =
          data.story as Story;

        setStory(loadedStory);

        setTitle(
          loadedStory.title || ''
        );

        setDescription(
          loadedStory.description || ''
        );

        setStatus(
          loadedStory.status || ''
        );

        setRating(
          loadedStory.rating || ''
        );

        setCoverPreview(
          loadedStory.cover_url || null
        );

        const loadedTags =
          loadedStory.tags || [];

        const loadedGenre =
          loadedTags.find(
            (tag) =>
              tag.category_slug ===
              'genre'
          );

        setGenre(
          loadedGenre?.name || ''
        );

        setTags(
          loadedTags
            .filter(
              (tag) =>
                tag.category_slug !==
                'genre'
            )
            .map((tag) => tag.name)
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err?.message ||
            'Não foi possível carregar a história.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [id]);

  // =========================
  // CAPA
  // =========================

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

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

    setCoverFile(file);
    setCoverPreview(
      URL.createObjectURL(file)
    );
    setError('');
  }

  // =========================
  // TAGS
  // =========================

  function addTag() {
    const newTag =
      tagInput.trim();

    if (!newTag) return;

    if (newTag.length > 50) {
      setError(
        'Cada tag pode ter no máximo 50 caracteres.'
      );
      return;
    }

    const exists = tags.some(
      (tag) =>
        tag.toLowerCase() ===
        newTag.toLowerCase()
    );

    if (exists) {
      setTagInput('');
      return;
    }

    if (tags.length >= 30) {
      setError(
        'Você pode adicionar no máximo 30 tags.'
      );
      return;
    }

    setTags((current) => [
      ...current,
      newTag,
    ]);

    setTagInput('');
    setError('');
  }

  function removeTag(
    index: number
  ) {
    setTags((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  function handleTagKeyDown(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === 'Enter' ||
      event.key === ','
    ) {
      event.preventDefault();
      addTag();
    }

    if (
      event.key === 'Backspace' &&
      !tagInput &&
      tags.length > 0
    ) {
      removeTag(tags.length - 1);
    }
  }

  // =========================
  // SALVAR
  // =========================

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const finalTags = [...tags];

      const pendingTag =
        tagInput.trim();

      if (
        pendingTag &&
        !finalTags.some(
          (tag) =>
            tag.toLowerCase() ===
            pendingTag.toLowerCase()
        )
      ) {
        finalTags.push(pendingTag);
      }

      const formData =
        new FormData();

      formData.append(
        'title',
        title.trim()
      );

      formData.append(
        'description',
        description
      );

      formData.append(
        'status',
        status
      );

      formData.append(
        'rating',
        rating
      );

      formData.append(
        'genre',
        genre.trim()
      );

      formData.append(
        'tags',
        finalTags.join(', ')
      );

      if (coverFile) {
        formData.append(
          'cover',
          coverFile
        );
      }

      const response =
        await fetch(
          `/api/stories/${id}`,
          {
            method: 'PUT',
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Não foi possível salvar as alterações.'
        );
      }

      setSuccess(
        'Obra atualizada com sucesso.'
      );

      setStory((current) =>
        current
          ? {
              ...current,
              ...data.story,
            }
          : current
      );

      setTimeout(() => {
        router.push(
          `/historia/${id}`
        );
      }, 700);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          'Não foi possível salvar as alterações.'
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#09070a] text-white flex items-center justify-center">
        <div className="text-sm text-gray-400">
          Carregando obra...
        </div>
      </main>
    );
  }

  if (!story) {
    return (
      <main className="min-h-screen bg-[#09070a] text-white flex items-center justify-center px-5">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            Não foi possível carregar a obra.
          </h1>

          {error && (
            <p className="mt-3 text-sm text-gray-500">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="mt-6 rounded-xl bg-pink-500 px-5 py-3 text-sm font-medium hover:bg-pink-400 transition"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09070a] text-white">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#0b090c]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-5 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/historia/${id}`
              )
            }
            className="text-xl font-semibold tracking-tight hover:text-pink-300 transition"
          >
            Nooklie
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/historia/${id}`
              )
            }
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8">
        {/* TÍTULO */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">
            Editar obra
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Altere as informações da sua história quando quiser.
          </p>
        </div>

        {/* MENSAGENS */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-400/20 bg-green-500/[0.07] px-4 py-3 text-sm text-green-200">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-7"
        >
          {/* CAPA */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-base font-medium">
              Capa
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Escolha uma nova imagem para substituir a capa atual.
            </p>

            <div className="mt-5 flex flex-col sm:flex-row gap-5">
              <div className="w-40">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Prévia da capa"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-gray-600">
                      Sem capa
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <label className="inline-flex cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.07] transition">
                  Escolher nova capa

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleCoverChange
                    }
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-xs text-gray-600">
                  JPG, PNG, WEBP ou GIF · até 10 MB
                </p>
              </div>
            </div>
          </section>

          {/* INFORMAÇÕES */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-base font-medium">
              Informações
            </h2>

            {/* TÍTULO */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Título
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                maxLength={150}
                required
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-pink-400/40"
                placeholder="Título da história"
              />
            </div>

            {/* SINOPSE */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Sinopse
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                maxLength={5000}
                rows={7}
                className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-pink-400/40"
                placeholder="Sobre o que é sua história?"
              />

              <div className="mt-1 text-right text-xs text-gray-600">
                {description.length}/5000
              </div>
            </div>

            {/* STATUS */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#110e12] px-4 py-3 text-sm text-white outline-none focus:border-pink-400/40"
              >
                <option value="">
                  Selecione
                </option>

                <option value="Em andamento">
                  Em andamento
                </option>

                <option value="Concluída">
                  Concluída
                </option>

                <option value="Hiato">
                  Hiato
                </option>
              </select>
            </div>

            {/* CLASSIFICAÇÃO */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Classificação
              </label>

              <select
                value={rating}
                onChange={(event) =>
                  setRating(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-[#110e12] px-4 py-3 text-sm text-white outline-none focus:border-pink-400/40"
              >
                <option value="">
                  Selecione
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

            {/* GÊNERO */}
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Gênero
              </label>

              <input
                value={genre}
                onChange={(event) =>
                  setGenre(
                    event.target.value
                  )
                }
                maxLength={50}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-pink-400/40"
                placeholder="Ex.: Romance, Fantasia, Drama..."
              />
            </div>
          </section>

          {/* TAGS */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="text-base font-medium">
              Tags
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Pressione Enter ou vírgula para adicionar uma tag.
            </p>

            <div className="mt-5 flex min-h-[48px] flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 focus-within:border-pink-400/40">
              {tags.map(
                (tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-pink-400/20 bg-pink-500/10 px-3 py-1.5 text-sm text-pink-200"
                  >
                    {tag}

                    <button
                      type="button"
                      onClick={() =>
                        removeTag(index)
                      }
                      className="text-pink-300/60 hover:text-pink-200 transition"
                      aria-label={`Remover ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                )
              )}

              <input
                value={tagInput}
                onChange={(event) =>
                  setTagInput(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleTagKeyDown
                }
                className="min-w-[150px] flex-1 bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-gray-600"
                placeholder={
                  tags.length >= 30
                    ? 'Limite de tags atingido'
                    : 'Adicionar tag...'
                }
                disabled={
                  tags.length >= 30
                }
              />
            </div>

            <div className="mt-2 text-right text-xs text-gray-600">
              {tags.length}/30 tags
            </div>
          </section>

          {/* BOTÕES */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-10">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/historia/${id}`
                )
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-pink-500 px-6 py-3 text-sm font-medium text-white hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50 transition"
            >
              {saving
                ? 'Salvando...'
                : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
