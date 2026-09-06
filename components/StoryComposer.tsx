'use client';

import {
  useRef,
  useState,
} from 'react';

type StoryComposerProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
};

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,image/gif';

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: StoryComposerProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [preview, setPreview] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  function close() {
    if (loading) {
      return;
    }

    setFile(null);
    setPreview('');
    setError('');
    onClose();
  }

  function handleFile(
    selectedFile: File | null
  ) {
    setError('');

    if (!selectedFile) {
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        'A imagem ou GIF deve ter no máximo 5 MB.'
      );

      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {
      setError(
        'Formato não permitido. Use JPG, PNG, WEBP ou GIF.'
      );

      return;
    }

    setFile(
      selectedFile
    );

    const url =
      URL.createObjectURL(
        selectedFile
      );

    setPreview(url);
  }

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile =
      event.target.files?.[0] ||
      null;

    handleFile(
      selectedFile
    );
  }

  async function publish() {
    if (
      !file ||
      loading
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/stories',
          {
            method: 'POST',
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Não foi possível publicar o Story.'
        );
      }

      setFile(null);
      setPreview('');
      setError('');

      onPublished?.();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Não foi possível publicar o Story.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[460px] overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#120d13] shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ff78b9]/70">
              NOOKLIE
            </p>

            <h2 className="mt-1 text-lg font-black text-white">
              Novo Story
            </h2>
          </div>

          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-white/35 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-30"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="p-5">
          {!preview ? (
            <button
              type="button"
              onClick={() =>
                inputRef.current?.click()
              }
              className="flex aspect-[9/13] w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-[#ff78b9]/25 bg-gradient-to-br from-[#ff78b9]/[0.07] via-white/[0.02] to-[#c63dff]/[0.06] transition hover:border-[#ff78b9]/50 hover:bg-[#ff78b9]/[0.09]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff78b9]/20 bg-[#ff78b9]/[0.08] text-3xl text-[#ff78b9]">
                +
              </span>

              <span className="mt-5 text-sm font-bold text-white">
                Adicionar imagem ou GIF
              </span>

              <span className="mt-2 text-xs text-white/30">
                JPG, PNG, WEBP ou GIF
              </span>

              <span className="mt-1 text-[11px] text-white/20">
                Máximo de 5 MB
              </span>
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-[24px] bg-black">
              <img
                src={preview}
                alt="Prévia do Story"
                className="mx-auto max-h-[520px] w-full object-contain"
              />

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setPreview('');
                  setError('');

                  if (
                    inputRef.current
                  ) {
                    inputRef.current.value =
                      '';
                  }
                }}
                disabled={loading}
                className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs font-bold text-white/70 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
              >
                Trocar
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={
              handleInputChange
            }
            className="hidden"
          />

          {error && (
            <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs leading-5 text-white/25">
              Seu Story ficará disponível
              por 24 horas.
            </p>

            <button
              type="button"
              onClick={publish}
              disabled={
                !file ||
                loading
              }
              className="shrink-0 rounded-full bg-gradient-to-r from-[#ff78b9] to-[#c95cff] px-5 py-3 text-sm font-black text-[#190d16] transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading
                ? 'Publicando...'
                : 'Publicar Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
