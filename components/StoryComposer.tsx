'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

type StoryComposerProps = {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
};

type TextElement = {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
};

type FilterType =
  | 'none'
  | 'grayscale'
  | 'sepia'
  | 'brightness'
  | 'contrast';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/webp,image/gif';

const FILTERS: {
  id: FilterType;
  label: string;
}[] = [
  {
    id: 'none',
    label: 'Original',
  },
  {
    id: 'brightness',
    label: 'Claro',
  },
  {
    id: 'contrast',
    label: 'Contraste',
  },
  {
    id: 'grayscale',
    label: 'P&B',
  },
  {
    id: 'sepia',
    label: 'Vintage',
  },
];

const TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#ff78b9',
  '#ff4d4d',
  '#ffd84d',
  '#69e6ff',
  '#9b6cff',
];

const EMOJIS = [
  '❤️',
  '✨',
  '😍',
  '😭',
  '😂',
  '🥹',
  '🔥',
  '💗',
  '⭐',
  '🎀',
  '🦋',
  '📖',
];

function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getFilterStyle(
  filter: FilterType
) {
  switch (filter) {
    case 'grayscale':
      return 'grayscale(1)';

    case 'sepia':
      return 'sepia(0.75)';

    case 'brightness':
      return 'brightness(1.2)';

    case 'contrast':
      return 'contrast(1.3)';

    default:
      return 'none';
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  filter: FilterType
) {
  const imageRatio =
    image.naturalWidth /
    image.naturalHeight;

  const canvasRatio =
    canvasWidth / canvasHeight;

  let drawWidth =
    canvasWidth;

  let drawHeight =
    canvasHeight;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth =
      drawHeight * imageRatio;
  } else {
    drawWidth = canvasWidth;
    drawHeight =
      drawWidth / imageRatio;
  }

  const x =
    (canvasWidth - drawWidth) /
    2;

  const y =
    (canvasHeight - drawHeight) /
    2;

  ctx.save();

  ctx.filter =
    getFilterStyle(filter);

  ctx.drawImage(
    image,
    x,
    y,
    drawWidth,
    drawHeight
  );

  ctx.restore();
}

export default function StoryComposer({
  open,
  onClose,
  onPublished,
}: StoryComposerProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const previewImageRef =
    useRef<HTMLImageElement | null>(
      null
    );

  const dragRef =
    useRef<{
      id: string;
      offsetX: number;
      offsetY: number;
    } | null>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState('');

  const [step, setStep] =
    useState<'select' | 'edit'>(
      'select'
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [texts, setTexts] =
    useState<TextElement[]>([]);

  const [selectedTextId, setSelectedTextId] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<FilterType>('none');

  const [showTextTools, setShowTextTools] =
    useState(false);

  const [showEmojiTools, setShowEmojiTools] =
    useState(false);

  const [showFilterTools, setShowFilterTools] =
    useState(false);

  const [caption, setCaption] =
    useState('');

  /*
   * Limpa tudo quando fecha o modal.
   */
  function resetComposer() {
    setFile(null);
    setPreview('');
    setStep('select');
    setLoading(false);
    setError('');
    setTexts([]);
    setSelectedTextId(null);
    setFilter('none');
    setShowTextTools(false);
    setShowEmojiTools(false);
    setShowFilterTools(false);
    setCaption('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function close() {
    if (loading) {
      return;
    }

    resetComposer();
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

    setFile(selectedFile);

    const url =
      URL.createObjectURL(
        selectedFile
      );

    setPreview(url);

    setTexts([]);
    setSelectedTextId(null);
    setFilter('none');
    setCaption('');
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

  /*
   * Adiciona um novo texto.
   */
  function addText(
    initialText = 'Seu texto'
  ) {
    const id =
      createId();

    const newText: TextElement = {
      id,
      text: initialText,
      x: 50,
      y: 50,
      color: '#ffffff',
      fontSize: 42,
      fontWeight: 'bold',
      align: 'center',
    };

    setTexts((current) => [
      ...current,
      newText,
    ]);

    setSelectedTextId(id);
    setShowTextTools(true);
    setShowEmojiTools(false);
  }

  /*
   * Adiciona emoji como texto.
   */
  function addEmoji(
    emoji: string
  ) {
    const id =
      createId();

    const newText: TextElement = {
      id,
      text: emoji,
      x: 50,
      y: 50,
      color: '#ffffff',
      fontSize: 58,
      fontWeight: 'normal',
      align: 'center',
    };

    setTexts((current) => [
      ...current,
      newText,
    ]);

    setSelectedTextId(id);
    setShowEmojiTools(false);
    setShowTextTools(true);
  }

  function updateSelectedText(
    changes: Partial<TextElement>
  ) {
    if (!selectedTextId) {
      return;
    }

    setTexts((current) =>
      current.map((text) =>
        text.id ===
        selectedTextId
          ? {
              ...text,
              ...changes,
            }
          : text
      )
    );
  }

  function deleteSelectedText() {
    if (!selectedTextId) {
      return;
    }

    setTexts((current) =>
      current.filter(
        (text) =>
          text.id !==
          selectedTextId
      )
    );

    setSelectedTextId(null);
  }

  /*
   * Detecta o clique/arraste do texto.
   */
  function handleTextPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
    text: TextElement
  ) {
    event.preventDefault();

    setSelectedTextId(text.id);

    const target =
      event.currentTarget;

    const rect =
      target.parentElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const currentX =
      (text.x / 100) *
      rect.width;

    const currentY =
      (text.y / 100) *
      rect.height;

    dragRef.current = {
      id: text.id,
      offsetX:
        event.clientX -
        rect.left -
        currentX,
      offsetY:
        event.clientY -
        rect.top -
        currentY,
    };

    target.setPointerCapture(
      event.pointerId
    );
  }

  function handleTextPointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!dragRef.current) {
      return;
    }

    const rect =
      event.currentTarget.parentElement?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const x =
      ((event.clientX -
        rect.left -
        dragRef.current.offsetX) /
        rect.width) *
      100;

    const y =
      ((event.clientY -
        rect.top -
        dragRef.current.offsetY) /
        rect.height) *
      100;

    setTexts((current) =>
      current.map((text) =>
        text.id ===
        dragRef.current?.id
          ? {
              ...text,
              x: Math.max(
                4,
                Math.min(96, x)
              ),
              y: Math.max(
                4,
                Math.min(96, y)
              ),
            }
          : text
      )
    );
  }

  function handleTextPointerUp() {
    dragRef.current = null;
  }

  /*
   * Gera a imagem final no Canvas.
   */
  async function createFinalImage(): Promise<Blob | null> {
    if (
      !preview ||
      !previewImageRef.current
    ) {
      return null;
    }

    const image =
      previewImageRef.current;

    const canvas =
      canvasRef.current ||
      document.createElement(
        'canvas'
      );

    canvas.width = 1080;
    canvas.height = 1920;

    const ctx =
      canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    /*
     * Fundo preto.
     */
    ctx.fillStyle =
      '#000000';

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    drawCoverImage(
      ctx,
      image,
      canvas.width,
      canvas.height,
      filter
    );

    /*
     * Desenha os textos.
     */
    texts.forEach((text) => {
      const x =
        (text.x / 100) *
        canvas.width;

      const y =
        (text.y / 100) *
        canvas.height;

      const fontSize =
        text.fontSize *
        (canvas.width / 460);

      ctx.save();

      ctx.font = `${
        text.fontWeight
      } ${fontSize}px Arial, sans-serif`;

      ctx.textAlign =
        text.align;

      ctx.textBaseline =
        'middle';

      /*
       * Sombra para melhorar
       * a leitura sobre fotos.
       */
      ctx.shadowColor =
        'rgba(0,0,0,0.65)';

      ctx.shadowBlur =
        12;

      ctx.shadowOffsetY =
        3;

      ctx.fillStyle =
        text.color;

      ctx.fillText(
        text.text,
        x,
        y
      );

      ctx.restore();
    });

    /*
     * Converte para PNG.
     */
    return new Promise(
      (resolve) => {
        canvas.toBlob(
          (blob) =>
            resolve(blob),
          'image/png',
          0.95
        );
      }
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
      const hasEdits =
        texts.length > 0 ||
        filter !== 'none';

      let uploadFile =
        file;

      /*
       * GIF sem alterações:
       * preserva o GIF original.
       *
       * GIF editado:
       * vira PNG estático.
       */
      if (hasEdits) {
        const blob =
          await createFinalImage();

        if (!blob) {
          throw new Error(
            'Não foi possível gerar a imagem editada.'
          );
        }

        uploadFile =
          new File(
            [blob],
            'story-editado.png',
            {
              type: 'image/png',
            }
          );
      }

      const formData =
        new FormData();

      formData.append(
        'file',
        uploadFile
      );

      /*
       * Caption é enviado também,
       * caso o backend queira utilizar
       * no futuro.
       */
      if (caption.trim()) {
        formData.append(
          'caption',
          caption.trim()
        );
      }

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

      resetComposer();

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

  /*
   * Voltar para seleção.
   */
  function backToSelect() {
    if (loading) {
      return;
    }

    setStep('select');
    setTexts([]);
    setSelectedTextId(null);
    setFilter('none');
  }

  /*
   * Abre o editor.
   */
  function openEditor() {
    if (!file) {
      return;
    }

    setError('');
    setStep('edit');
  }

  /*
   * Fecha menus secundários.
   */
  function toggleTextTools() {
    setShowTextTools(
      (current) => !current
    );

    setShowEmojiTools(false);
    setShowFilterTools(false);
  }

  function toggleEmojiTools() {
    setShowEmojiTools(
      (current) => !current
    );

    setShowTextTools(false);
    setShowFilterTools(false);
  }

  function toggleFilterTools() {
    setShowFilterTools(
      (current) => !current
    );

    setShowTextTools(false);
    setShowEmojiTools(false);
  }

  /*
   * Re-renderiza o editor quando
   * imagem/filtro muda.
   */
  useEffect(() => {
    if (
      !open ||
      step !== 'edit'
    ) {
      return;
    }

    /*
     * O preview visual usa a própria
     * imagem + CSS. O canvas é utilizado
     * somente no momento da publicação.
     */
  }, [
    open,
    step,
    filter,
    texts,
  ]);

  if (!open) {
    return null;
  }

  const selectedText =
    texts.find(
      (text) =>
        text.id ===
        selectedTextId
    ) || null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5">
      <div className="flex max-h-[96vh] w-full max-w-[1050px] flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#120d13] shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            {step === 'edit' && (
              <button
                type="button"
                onClick={backToSelect}
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                aria-label="Voltar"
              >
                ←
              </button>
            )}

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#ff78b9]/70">
                NOOKLIE
              </p>

              <h2 className="mt-0.5 text-base font-black text-white sm:text-lg">
                {step === 'select'
                  ? 'Novo Story'
                  : 'Editar Story'}
              </h2>
            </div>
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

        {/* =====================================================
            ETAPA 1 — SELEÇÃO
        ====================================================== */}
        {step === 'select' && (
          <div className="overflow-y-auto p-5">
            {!preview ? (
              <button
                type="button"
                onClick={() =>
                  inputRef.current?.click()
                }
                className="mx-auto flex aspect-[9/13] w-full max-w-[460px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#ff78b9]/25 bg-gradient-to-br from-[#ff78b9]/[0.07] via-white/[0.02] to-[#c63dff]/[0.06] transition hover:border-[#ff78b9]/50 hover:bg-[#ff78b9]/[0.09]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff78b9]/20 bg-[#ff78b9]/[0.08] text-3xl font-light text-[#ff78b9]">
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
              <div className="mx-auto w-full max-w-[460px]">
                <div className="relative overflow-hidden rounded-[24px] bg-black">
                  <img
                    src={preview}
                    alt="Prévia do Story"
                    className="mx-auto max-h-[600px] w-full object-contain"
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

                <button
                  type="button"
                  onClick={openEditor}
                  className="mt-4 w-full rounded-full bg-gradient-to-r from-[#ff78b9] to-[#c95cff] px-5 py-3.5 text-sm font-black text-[#190d16] transition hover:scale-[1.01]"
                >
                  Editar Story →
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
              <div className="mx-auto mt-4 max-w-[460px] rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-sm leading-5 text-red-300">
                {error}
              </div>
            )}

            <p className="mx-auto mt-5 max-w-[460px] text-center text-xs leading-5 text-white/25">
              Você poderá adicionar texto,
              emojis e filtros antes de
              publicar.
            </p>
          </div>
        )}

        {/* =====================================================
            ETAPA 2 — EDITOR
        ====================================================== */}
        {step === 'edit' && (
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* =================================================
                ÁREA DO STORY
            ================================================== */}
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#09070a] p-3 sm:p-5">
              <div
                className="relative h-[min(70vh,680px)] aspect-[9/16] max-h-full overflow-hidden rounded-[22px] bg-black shadow-[0_20px_80px_rgba(0,0,0,0.55)] select-none"
              >
                <img
                  ref={
                    previewImageRef
                  }
                  src={preview}
                  alt="Imagem do Story"
                  className="absolute inset-0 h-full w-full object-cover transition-all duration-200"
                  style={{
                    filter:
                      getFilterStyle(
                        filter
                      ),
                  }}
                  draggable={false}
                />

                {/* Overlay escuro muito leve */}
                <div className="pointer-events-none absolute inset-0 bg-black/[0.02]" />

                {/* TEXTOS */}
                {texts.map(
                  (text) => {
                    const selected =
                      text.id ===
                      selectedTextId;

                    return (
                      <div
                        key={text.id}
                        onPointerDown={(
                          event
                        ) =>
                          handleTextPointerDown(
                            event,
                            text
                          )
                        }
                        onPointerMove={
                          handleTextPointerMove
                        }
                        onPointerUp={
                          handleTextPointerUp
                        }
                        onPointerCancel={
                          handleTextPointerUp
                        }
                        className={`absolute z-20 max-w-[90%] cursor-move touch-none px-2 py-1 ${
                          selected
                            ? 'rounded-lg border border-dashed border-white/70 bg-black/10'
                            : ''
                        }`}
                        style={{
                          left: `${text.x}%`,
                          top: `${text.y}%`,
                          transform:
                            'translate(-50%, -50%)',
                          color:
                            text.color,
                          fontSize: `${Math.max(
                            12,
                            text.fontSize /
                              2.2
                          )}px`,
                          fontWeight:
                            text.fontWeight,
                          textAlign:
                            text.align,
                          lineHeight: 1.05,
                          textShadow:
                            '0 3px 12px rgba(0,0,0,.8)',
                          whiteSpace:
                            'pre-wrap',
                        }}
                      >
                        {text.text}
                      </div>
                    );
                  }
                )}

                {/* Hint */}
                {texts.length === 0 && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-7 z-10 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">
                    Adicione texto, emoji
                    ou filtro
                  </div>
                )}
              </div>
            </div>

            {/* =================================================
                PAINEL DE FERRAMENTAS
            ================================================== */}
            <div className="flex w-full shrink-0 flex-col border-t border-white/[0.06] bg-[#120d13] lg:w-[340px] lg:border-l lg:border-t-0">
              {/* Ferramentas principais */}
              <div className="flex shrink-0 items-center justify-around border-b border-white/[0.06] px-2 py-2">
                <button
                  type="button"
                  onClick={
                    toggleTextTools
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-bold transition ${
                    showTextTools
                      ? 'bg-[#ff78b9]/10 text-[#ff78b9]'
                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="text-lg">
                    T
                  </span>
                  Texto
                </button>

                <button
                  type="button"
                  onClick={
                    toggleEmojiTools
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-bold transition ${
                    showEmojiTools
                      ? 'bg-[#ff78b9]/10 text-[#ff78b9]'
                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="text-lg">
                    😊
                  </span>
                  Emoji
                </button>

                <button
                  type="button"
                  onClick={
                    toggleFilterTools
                  }
                  className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-[10px] font-bold transition ${
                    showFilterTools
                      ? 'bg-[#ff78b9]/10 text-[#ff78b9]'
                      : 'text-white/45 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  <span className="text-lg">
                    ◐
                  </span>
                  Filtro
                </button>
              </div>

              {/* ===============================================
                  TEXTO
              ================================================ */}
              {showTextTools && (
                <div className="max-h-[280px] overflow-y-auto border-b border-white/[0.06] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                      Texto
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        addText()
                      }
                      className="rounded-full bg-[#ff78b9] px-3 py-1.5 text-[10px] font-black text-[#190d16] transition hover:scale-[1.03]"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {selectedText ? (
                    <div className="mt-4 space-y-4">
                      <input
                        type="text"
                        value={
                          selectedText.text
                        }
                        onChange={(
                          event
                        ) =>
                          updateSelectedText(
                            {
                              text:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        placeholder="Digite seu texto..."
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#ff78b9]/40"
                      />

                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/35">
                            Tamanho
                          </span>

                          <span className="text-[10px] text-white/30">
                            {
                              selectedText.fontSize
                            }
                            px
                          </span>
                        </div>

                        <input
                          type="range"
                          min="18"
                          max="90"
                          value={
                            selectedText.fontSize
                          }
                          onChange={(
                            event
                          ) =>
                            updateSelectedText(
                              {
                                fontSize:
                                  Number(
                                    event
                                      .target
                                      .value
                                  ),
                              }
                            )
                          }
                          className="w-full accent-[#ff78b9]"
                        />
                      </div>

                      <div>
                        <p className="mb-2 text-[10px] font-bold text-white/35">
                          Cor
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {TEXT_COLORS.map(
                            (color) => (
                              <button
                                key={
                                  color
                                }
                                type="button"
                                onClick={() =>
                                  updateSelectedText(
                                    {
                                      color,
                                    }
                                  )
                                }
                                className={`h-7 w-7 rounded-full border-2 transition ${
                                  selectedText.color ===
                                  color
                                    ? 'scale-110 border-white'
                                    : 'border-white/10'
                                }`}
                                style={{
                                  backgroundColor:
                                    color,
                                }}
                                aria-label={`Cor ${color}`}
                              />
                            )
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedText(
                              {
                                fontWeight:
                                  selectedText.fontWeight ===
                                  'bold'
                                    ? 'normal'
                                    : 'bold',
                              }
                            )
                          }
                          className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                            selectedText.fontWeight ===
                            'bold'
                              ? 'border-[#ff78b9]/30 bg-[#ff78b9]/10 text-[#ff78b9]'
                              : 'border-white/[0.07] bg-white/[0.03] text-white/45 hover:text-white'
                          }`}
                        >
                          Negrito
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateSelectedText(
                              {
                                align:
                                  selectedText.align ===
                                  'left'
                                    ? 'center'
                                    : selectedText.align ===
                                      'center'
                                    ? 'right'
                                    : 'left',
                              }
                            )
                          }
                          className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs font-bold text-white/45 transition hover:text-white"
                        >
                          Alinhar
                        </button>

                        <button
                          type="button"
                          onClick={
                            deleteSelectedText
                          }
                          className="rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3 py-2 text-xs font-bold text-red-300/60 transition hover:bg-red-400/[0.08] hover:text-red-300"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] px-4 py-5 text-center text-xs text-white/25">
                      Adicione um texto
                      e toque nele para
                      editar.
                    </div>
                  )}
                </div>
              )}

              {/* ===============================================
                  EMOJIS
              ================================================ */}
              {showEmojiTools && (
                <div className="border-b border-white/[0.06] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Emojis
                  </p>

                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {EMOJIS.map(
                      (emoji) => (
                        <button
                          key={
                            emoji
                          }
                          type="button"
                          onClick={() =>
                            addEmoji(
                              emoji
                            )
                          }
                          className="flex h-10 items-center justify-center rounded-xl bg-white/[0.03] text-xl transition hover:bg-white/[0.08] hover:scale-110"
                        >
                          {emoji}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ===============================================
                  FILTROS
              ================================================ */}
              {showFilterTools && (
                <div className="border-b border-white/[0.06] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                    Filtros
                  </p>

                  <div className="mt-3 grid grid-cols-5 gap-1.5">
                    {FILTERS.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            setFilter(
                              item.id
                            )
                          }
                          className={`rounded-xl px-1 py-2 text-[9px] font-bold transition ${
                            filter ===
                            item.id
                              ? 'bg-[#ff78b9]/15 text-[#ff78b9]'
                              : 'bg-white/[0.03] text-white/35 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ===============================================
                  LEGENDA OPCIONAL
              ================================================ */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                  Legenda
                  <span className="ml-1 font-normal normal-case tracking-normal text-white/20">
                    opcional
                  </span>
                </p>

                <textarea
                  value={caption}
                  onChange={(event) =>
                    setCaption(
                      event.target.value
                    )
                  }
                  maxLength={180}
                  rows={3}
                  placeholder="Escreva algo sobre seu Story..."
                  className="w-full resize-none rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-3 text-sm leading-5 text-white outline-none placeholder:text-white/20 focus:border-[#ff78b9]/30"
                />

                <p className="mt-1 text-right text-[9px] text-white/20">
                  {caption.length}/180
                </p>
              </div>

              {/* ===============================================
                  ERRO
              ================================================ */}
              {error && (
                <div className="mx-4 mb-3 rounded-xl border border-red-400/15 bg-red-400/[0.05] px-3 py-2.5 text-xs leading-5 text-red-300">
                  {error}
                </div>
              )}

              {/* ===============================================
                  RODAPÉ
              ================================================ */}
              <div className="shrink-0 border-t border-white/[0.06] p-4">
                {file?.type ===
                  'image/gif' &&
                  (texts.length >
                    0 ||
                    filter !==
                      'none') && (
                    <p className="mb-3 text-[10px] leading-4 text-amber-300/60">
                      Como você editou
                      este GIF, ele
                      será publicado
                      como imagem
                      estática.
                    </p>
                  )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={
                      backToSelect
                    }
                    disabled={
                      loading
                    }
                    className="rounded-full border border-white/[0.08] px-4 py-3 text-xs font-bold text-white/45 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-30"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={
                      publish
                    }
                    disabled={
                      !file ||
                      loading
                    }
                    className="flex-1 rounded-full bg-gradient-to-r from-[#ff78b9] to-[#c95cff] px-5 py-3 text-sm font-black text-[#190d16] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {loading
                      ? 'Publicando...'
                      : 'Publicar Story'}
                  </button>
                </div>

                <p className="mt-3 text-center text-[10px] text-white/20">
                  Seu Story ficará
                  disponível por
                  24 horas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Canvas invisível usado para
            gerar a versão final */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
}
