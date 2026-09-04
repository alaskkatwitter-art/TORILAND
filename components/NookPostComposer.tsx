'use client';

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

type Story = {
  id: string;
  title: string;
};

type PostMedia = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  created_at?: string;
};

type NookPostComposerProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
};

const MAX_MEDIA = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ACCEPTED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export default function NookPostComposer({
  open,
  onClose,
  onPublished,
}: NookPostComposerProps) {
  const mediaInputRef =
    useRef<HTMLInputElement | null>(null);

  const [newPost, setNewPost] =
    useState('');

  const [selectedStoryId, setSelectedStoryId] =
    useState('');

  const [stories, setStories] =
    useState<Story[]>([]);

  const [mediaFiles, setMediaFiles] =
    useState<File[]>([]);

  const [mediaPreviews, setMediaPreviews] =
    useState<string[]>([]);

  const [creatingPost, setCreatingPost] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    if (!open) return;

    setError('');

    async function loadStories() {
      try {
        const response = await fetch(
          '/api/profile/stories',
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) return;

        const data =
          await response.json();

        setStories(
          Array.isArray(data.stories)
            ? data.stories
            : []
        );
      } catch {
        setStories([]);
      }
    }

    loadStories();
  }, [open]);

  useEffect(() => {
    const urls =
      mediaFiles.map((file) =>
        URL.createObjectURL(file)
      );

    setMediaPreviews(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [mediaFiles]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        if (creatingPost) return;

        handleClose();
      }
    };

    document.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [open, creatingPost]);

  function handleClose() {
    if (creatingPost) return;

    setNewPost('');
    setSelectedStoryId('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setError('');

    onClose();
  }

  function handleMediaSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files || []
      );

    if (!selected.length) return;

    setError('');

    setMediaFiles((current) => {
      const availableSlots =
        MAX_MEDIA - current.length;

      if (availableSlots <= 0) {
        setError(
          'Você pode adicionar no máximo 4 imagens ou GIFs por publicação.'
        );

        return current;
      }

      const validFiles: File[] = [];

      for (const file of selected) {
        if (
          !ACCEPTED_MEDIA_TYPES.includes(
            file.type
          )
        ) {
          setError(
            'Use apenas JPG, PNG, WEBP ou GIF.'
          );

          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(
            'Cada imagem pode ter no máximo 10 MB.'
          );

          continue;
        }

        validFiles.push(file);
      }

      if (
        validFiles.length >
        availableSlots
      ) {
        setError(
          'Você pode adicionar no máximo 4 imagens ou GIFs por publicação.'
        );
      }

      return [
        ...current,
        ...validFiles.slice(
          0,
          availableSlots
        ),
      ];
    });

    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }

  function removeMedia(index: number) {
    setMediaFiles((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
    );
  }

  async function uploadPostMedia(
    postId: string
  ) {
    const uploaded: PostMedia[] = [];

    for (const file of mediaFiles) {
      const formData =
        new FormData();

      formData.append('file', file);
      formData.append('post_id', postId);

      const response = await fetch(
        '/api/nook-posts/media',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível enviar uma das mídias.'
        );
      }

      if (data.media) {
        uploaded.push(data.media);
      }
    }

    return uploaded;
  }

  async function handleCreatePost() {
    const text =
      newPost.trim();

    if (
      !text &&
      mediaFiles.length === 0
    ) {
      setError(
        'Escreva alguma coisa ou adicione uma imagem/GIF.'
      );

      return;
    }

    if (text.length > 5000) {
      setError(
        'A publicação pode ter no máximo 5000 caracteres.'
      );

      return;
    }

    setCreatingPost(true);
    setError('');

    try {
      const response = await fetch(
        '/api/nook-posts',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            body: text,
            image_url: null,
            story_id:
              selectedStoryId || null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível publicar.'
        );

        return;
      }

      const createdPost =
        data.post;

      if (
        mediaFiles.length > 0 &&
        createdPost?.id
      ) {
        try {
          await uploadPostMedia(
            createdPost.id
          );
        } catch (mediaError) {
          console.error(
            'Erro ao enviar mídias:',
            mediaError
          );

          setError(
            'A publicação foi criada, mas não foi possível enviar todas as mídias.'
          );

          onPublished?.();

          return;
        }
      }

      onPublished?.();

      handleClose();
    } catch (error) {
      console.error(error);

      setError(
        'Não foi possível publicar. Tente novamente.'
      );
    } finally {
      setCreatingPost(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-5 sm:py-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#191219] shadow-2xl">
        {/* CABEÇALHO */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#191219]/95 px-5 py-4 backdrop-blur-xl sm:px-6">
          <div>
            <h2 className="text-lg font-black text-white">
              Nova publicação
            </h2>

            <p className="mt-0.5 text-xs text-white/30">
              Compartilhe alguma coisa com outros escritores.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={creatingPost}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-white/35 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
          >
            ×
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {/* TEXTO */}

          <textarea
            autoFocus
            value={newPost}
            onChange={(event) =>
              setNewPost(
                event.target.value
              )
            }
            maxLength={5000}
            rows={7}
            placeholder="O que está passando pela sua cabeça?"
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-white/20 transition focus:border-[#ff78b9]/50"
          />

          {/* CONTADOR */}

          <div className="mt-2 text-right text-xs text-white/25">
            {newPost.length}/5000
          </div>

          {/* PREVIEWS */}

          {mediaPreviews.length > 0 && (
            <div
              className={`mt-4 grid gap-2 ${
                mediaPreviews.length === 1
                  ? 'grid-cols-1'
                  : 'grid-cols-2'
              }`}
            >
              {mediaPreviews.map(
                (preview, index) => (
                  <div
                    key={preview}
                    className="group relative aspect-square overflow-hidden rounded-2xl bg-[#100b12]"
                  >
                    <img
                      src={preview}
                      alt={`Prévia ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeMedia(index)
                      }
                      disabled={creatingPost}
                      aria-label={`Remover mídia ${index + 1}`}
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-xl text-white transition hover:bg-black disabled:opacity-40"
                    >
                      ×
                    </button>

                    <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      {index + 1} / 4
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* OPÇÕES */}

          <div className="mt-5 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-2">
              <button
                type="button"
                onClick={() =>
                  mediaInputRef.current?.click()
                }
                disabled={
                  creatingPost ||
                  mediaFiles.length >=
                    MAX_MEDIA
                }
                className="shrink-0 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/50 transition hover:border-[#ff78b9]/40 hover:text-[#ff78b9] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Adicionar mídia
                {mediaFiles.length > 0 &&
                  ` ${mediaFiles.length}/4`}
              </button>

              <input
                ref={mediaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={
                  handleMediaSelection
                }
                className="hidden"
              />

              <select
                value={selectedStoryId}
                onChange={(event) =>
                  setSelectedStoryId(
                    event.target.value
                  )
                }
                disabled={creatingPost}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#100b12] px-4 py-2.5 text-xs font-semibold text-white/60 outline-none transition focus:border-[#ff78b9]/50 disabled:opacity-40"
              >
                <option value="">
                  Vincular uma história
                </option>

                {stories.map((story) => (
                  <option
                    key={story.id}
                    value={story.id}
                  >
                    {story.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={
                handleCreatePost
              }
              disabled={
                creatingPost ||
                (!newPost.trim() &&
                  mediaFiles.length === 0)
              }
              className="rounded-full bg-[#ff78b9] px-7 py-3 text-sm font-black text-[#180d15] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creatingPost
                ? 'Publicando...'
                : 'Publicar'}
            </button>
          </div>

          {/* ERRO */}

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
            }
