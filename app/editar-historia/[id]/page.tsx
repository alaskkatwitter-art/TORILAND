'use client';

import React, {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useParams,
  useRouter,
  useSearchParams,
} from 'next/navigation';

type Tag = {
  id?: string;
  name: string;
};

type StoryChapter = {
  id: string;
  chapter_number: number;
  title: string;
  published: boolean;
  scheduled_for: string | null;
  is_scheduled: boolean;
  publication_status?:
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'unpublished';
};

type Story = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  status: string;
  rating: string;
  genre: string;
  tags: Tag[];
  chapters: StoryChapter[];
};

type ChapterMedia = {
  id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  created_at?: string;
};

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  updated_at?: string | null;
  publication_status:
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'unpublished';
  original_published_at: string | null;
  republished_at: string | null;
  author_notes: string;
  scheduled_for?: string | null;
  media?: ChapterMedia[];
};

type ChapterResponse = {
  chapter?: Chapter;
  media?: ChapterMedia[];
  scheduled?: boolean;
  published?: boolean;
  scheduled_for?: string | null;
  error?: string;
};

type EditorMedia = {
  id: string;
  url: string;
  type: 'image' | 'gif';
  existing: boolean;
  file?: File;
};

const MAX_MEDIA = 25;
const MAX_MEDIA_SIZE = 5 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDateForInput(value: string | null | undefined) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number: number) =>
    String(number).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}

function getLocalDateTimeInputMin() {
  const date = new Date();

  const pad = (number: number) =>
    String(number).padStart(2, '0');

  return (
    date.getFullYear() +
    '-' +
    pad(date.getMonth() + 1) +
    '-' +
    pad(date.getDate()) +
    'T' +
    pad(date.getHours()) +
    ':' +
    pad(date.getMinutes())
  );
}

function getStatusLabel(
  status: Chapter['publication_status'],
  published?: boolean
) {
  if (status === 'scheduled') {
    return 'AGENDADO';
  }

  if (status === 'published' || published) {
    return 'PUBLICADO';
  }

  if (status === 'unpublished') {
    return 'FORA DO AR';
  }

  return 'RASCUNHO';
}

function getStatusClass(
  status: Chapter['publication_status'],
  published?: boolean
) {
  if (status === 'scheduled') {
    return 'border-violet-400/20 bg-violet-500/10 text-violet-200';
  }

  if (status === 'published' || published) {
    return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'unpublished') {
    return 'border-orange-400/20 bg-orange-500/10 text-orange-200';
  }

  return 'border-white/10 bg-white/[0.04] text-gray-400';
}

function sanitizeHtml(html: string) {
  if (!html) return '';

  if (typeof window === 'undefined') {
    return html;
  }

  const documentNode = new DOMParser().parseFromString(
    html,
    'text/html'
  );

  documentNode
    .querySelectorAll(
      'script, iframe, object, embed, style, link'
    )
    .forEach((element) => {
      element.remove();
    });

  documentNode
    .querySelectorAll('*')
    .forEach((element) => {
      Array.from(element.attributes).forEach(
        (attribute) => {
          const name = attribute.name.toLowerCase();
          const value = attribute.value.trim();

          if (name.startsWith('on')) {
            element.removeAttribute(attribute.name);
            return;
          }

          if (
            ['href', 'src', 'action', 'formaction'].includes(
              name
            ) &&
            value
              .toLowerCase()
              .startsWith('javascript:')
          ) {
            element.removeAttribute(attribute.name);
          }
        }
      );
    });

  documentNode
    .querySelectorAll('a')
    .forEach((anchor) => {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute(
        'rel',
        'noopener noreferrer nofollow'
      );
    });

  return documentNode.body.innerHTML;
}

export default function EditarHistoriaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = String(params.id);

  const editorRef =
    useRef<HTMLDivElement | null>(null);

  const mediaInputRef =
    useRef<HTMLInputElement | null>(null);

  const coverInputRef =
    useRef<HTMLInputElement | null>(null);

  const linkInputRef =
    useRef<HTMLInputElement | null>(null);

  const savedSelectionRef =
    useRef<Range | null>(null);

  const storyRef =
    useRef<Story | null>(null);

  const [story, setStory] =
    useState<Story | null>(null);

  const [chapter, setChapter] =
    useState<Chapter | null>(null);

  const [selectedChapterId, setSelectedChapterId] =
    useState<string | null>(
      searchParams.get('chapter')
    );

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [rating, setRating] =
    useState('');

  const [genre, setGenre] =
    useState('');

  const [tags, setTags] =
    useState<string[]>([]);

  const [tagInput, setTagInput] =
    useState('');

  const [coverPreview, setCoverPreview] =
    useState<string | null>(null);

  const [chapterTitle, setChapterTitle] =
    useState('');

  const [chapterBody, setChapterBody] =
    useState('');

  const [authorNotes, setAuthorNotes] =
    useState('');

  const [chapterStatus, setChapterStatus] =
    useState<Chapter['publication_status']>(
      'draft'
    );

  const [scheduledFor, setScheduledFor] =
    useState('');

  const [chapterMedia, setChapterMedia] =
    useState<EditorMedia[]>([]);

  const [previewMode, setPreviewMode] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [loadingChapter, setLoadingChapter] =
    useState(false);

  const [savingStory, setSavingStory] =
    useState(false);

  const [savingChapter, setSavingChapter] =
    useState(false);

  const [mediaUploading, setMediaUploading] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [showLinkBox, setShowLinkBox] =
    useState(false);

  const [linkValue, setLinkValue] =
    useState('');

  function saveSelection() {
    if (!editorRef.current) return;

    const selection = window.getSelection();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    if (
      editorRef.current.contains(
        range.commonAncestorContainer
      )
    ) {
      savedSelectionRef.current =
        range.cloneRange();
    }
  }

  function restoreSelection() {
    if (!savedSelectionRef.current) return;

    const selection = window.getSelection();

    if (!selection) return;

    selection.removeAllRanges();
    selection.addRange(
      savedSelectionRef.current
    );
  }

  function syncEditorBody() {
    if (!editorRef.current) {
      return chapterBody;
    }

    const value =
      editorRef.current.innerHTML;

    setChapterBody(value);

    return value;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadStory() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `/api/stories/${id}`,
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível carregar a obra.'
          );
        }

        const loadedStory: Story =
          data.story || data;

        if (!loadedStory?.id) {
          throw new Error(
            'Resposta inválida da obra.'
          );
        }

        if (cancelled) return;

        const normalizedChapters =
          Array.isArray(
            loadedStory.chapters
          )
            ? loadedStory.chapters.map(
                (item: StoryChapter) => ({
                  ...item,
                  scheduled_for:
                    item.scheduled_for || null,
                  is_scheduled:
                    item.is_scheduled ||
                    item.publication_status ===
                      'scheduled',
                })
              )
            : [];

        const normalizedTags =
          Array.isArray(
            loadedStory.tags
          )
            ? loadedStory.tags.map(
                (tag: Tag | string) =>
                  typeof tag === 'string'
                    ? { name: tag }
                    : tag
              )
            : [];

        const normalizedStory: Story = {
          ...loadedStory,
          chapters:
            normalizedChapters,
          tags:
            normalizedTags,
        };

        storyRef.current =
          normalizedStory;

        setStory(normalizedStory);

        setTitle(
          normalizedStory.title || ''
        );

        setDescription(
          normalizedStory.description || ''
        );

        setStatus(
          normalizedStory.status || ''
        );

        setRating(
          normalizedStory.rating || ''
        );

        setGenre(
          normalizedStory.genre || ''
        );

        setTags(
          normalizedTags.map(
            (tag) => tag.name
          )
        );

        setCoverPreview(
          normalizedStory.cover_url || null
        );

        const requestedChapter =
          searchParams.get('chapter');

        // Quando abrimos um capítulo novo, ele ainda é um rascunho.
        // A API pública da obra pode não incluí-lo em story.chapters.
        // Mesmo assim, o editor precisa carregá-lo diretamente pelo ID.
        if (requestedChapter) {
          setSelectedChapterId(requestedChapter);
        }
      } catch (caughtError) {
        if (cancelled) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Erro ao carregar a obra.'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStory();

    return () => {
      cancelled = true;
    };
  }, [id, searchParams]);

  useEffect(() => {
    if (!selectedChapterId) {
      setChapter(null);
      setLoadingChapter(false);
      return;
    }

    let cancelled = false;

    async function loadChapter() {
      setLoadingChapter(true);
      setError('');
      setSuccess('');

      try {
        const response = await fetch(
          `/api/chapters/${selectedChapterId}`,
          {
            cache: 'no-store',
          }
        );

        const data: ChapterResponse =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível carregar o capítulo.'
          );
        }

        if (!data.chapter) {
          throw new Error(
            'Capítulo não encontrado.'
          );
        }

        if (cancelled) return;

        const loadedChapter =
          data.chapter;

        const currentStory =
          storyRef.current;

        const storyChapter =
          currentStory?.chapters?.find(
            (item) =>
              item.id ===
              loadedChapter.id
          );

        const resolvedScheduledFor =
          data.scheduled_for ??
          loadedChapter.scheduled_for ??
          storyChapter?.scheduled_for ??
          null;

        const normalizedChapter: Chapter =
          {
            ...loadedChapter,
            scheduled_for:
              resolvedScheduledFor,
            author_notes:
              loadedChapter.author_notes ||
              '',
          };

        setChapter(
          normalizedChapter
        );

        setChapterTitle(
          normalizedChapter.title || ''
        );

        setChapterBody(
          normalizedChapter.body || ''
        );

        setAuthorNotes(
          normalizedChapter.author_notes ||
            ''
        );

        setChapterStatus(
          normalizedChapter.publication_status ||
            (normalizedChapter.published
              ? 'published'
              : 'draft')
        );

        setScheduledFor(
          formatDateForInput(
            resolvedScheduledFor
          )
        );

        const loadedMedia =
          data.media ||
          normalizedChapter.media ||
          [];

        setChapterMedia(
          loadedMedia.map(
            (media) => ({
              id: media.id,
              url: media.media_url,
              type:
                media.media_type ===
                'gif'
                  ? 'gif'
                  : 'image',
              existing: true,
            })
          )
        );

        savedSelectionRef.current =
          null;

        const currentUrl =
          new URL(
            window.location.href
          );

        currentUrl.searchParams.set(
          'chapter',
          normalizedChapter.id
        );

        window.history.replaceState(
          null,
          '',
          currentUrl.toString()
        );
      } catch (caughtError) {
        if (cancelled) return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Erro ao carregar o capítulo.'
        );

        setChapter(null);
      } finally {
        if (!cancelled) {
          setLoadingChapter(false);
        }
      }
    }

    void loadChapter();

    return () => {
      cancelled = true;
    };
  }, [selectedChapterId]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!chapter) return;

    if (
      editorRef.current.innerHTML !==
      chapterBody
    ) {
      editorRef.current.innerHTML =
        chapterBody || '';
    }
  }, [chapter, chapterBody]);

  useEffect(() => {
    if (!showLinkBox) return;

    const timer =
      window.setTimeout(() => {
        linkInputRef.current?.focus();
      }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showLinkBox]);

  function selectChapter(
    chapterId: string
  ) {
    setSelectedChapterId(chapterId);
    setPreviewMode(false);
    setShowLinkBox(false);
    setLinkValue('');
    setError('');
    setSuccess('');

    const currentUrl =
      new URL(window.location.href);

    currentUrl.searchParams.set(
      'chapter',
      chapterId
    );

    router.replace(
      currentUrl.pathname +
        '?' +
        currentUrl.searchParams.toString()
    );
  }

  async function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !ALLOWED_MEDIA_TYPES.includes(
        file.type
      )
    ) {
      setError(
        'Formato de capa inválido.'
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        'A capa pode ter no máximo 10 MB.'
      );
      return;
    }

    setSavingStory(true);
    setError('');
    setSuccess('');

    try {
      const formData =
        new FormData();

      formData.append(
        'cover',
        file
      );

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
          data.error ||
            'Não foi possível alterar a capa.'
        );
      }

      const newCover =
        data.story?.cover_url ||
        data.cover_url ||
        null;

      if (newCover) {
        setCoverPreview(newCover);

        setStory(
          (current) =>
            current
              ? {
                  ...current,
                  cover_url:
                    newCover,
                }
              : current
        );
      }

      setSuccess(
        'Capa alterada com sucesso.'
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Erro ao alterar a capa.'
      );
    } finally {
      setSavingStory(false);

      if (
        coverInputRef.current
      ) {
        coverInputRef.current.value =
          '';
      }
    }
  }

  function addTag(value?: string) {
    const valueToAdd =
      (
        value ??
        tagInput
      ).trim();

    if (!valueToAdd) return;

    const newTags =
      valueToAdd
        .split(',')
        .map((item) =>
          item.trim()
        )
        .filter(Boolean);

    setTags((current) => {
      const result = [
        ...current,
      ];

      for (const tag of newTags) {
        if (
          result.length >=
          30
        ) {
          break;
        }

        if (
          !result.some(
            (item) =>
              item.toLowerCase() ===
              tag.toLowerCase()
          )
        ) {
          result.push(tag);
        }
      }

      return result;
    });

    setTagInput('');
  }

  function removeTag(
    index: number
  ) {
    setTags((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index
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
      setTags((current) =>
        current.slice(
          0,
          -1
        )
      );
    }
  }

  async function handleSaveStory(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        'O título da obra é obrigatório.'
      );
      return;
    }

    setSavingStory(true);
    setError('');
    setSuccess('');

    try {
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
        genre
      );

      tags.forEach((tag) => {
        formData.append(
          'tags',
          tag
        );
      });

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
          data.error ||
            'Não foi possível salvar a obra.'
        );
      }

      const updatedStory =
        data.story;

      if (updatedStory) {
        const normalizedStory: Story =
          {
            ...updatedStory,
            chapters:
              Array.isArray(
                updatedStory.chapters
              )
                ? updatedStory.chapters
                : story?.chapters ||
                  [],
            tags:
              Array.isArray(
                updatedStory.tags
              )
                ? updatedStory.tags.map(
                    (tag: Tag | string) =>
                      typeof tag ===
                      'string'
                        ? {
                            name: tag,
                          }
                        : tag
                  )
                : tags.map(
                    (name) => ({
                      name,
                    })
                  ),
          };

        storyRef.current =
          normalizedStory;

        setStory(
          normalizedStory
        );

        setTitle(
          normalizedStory.title ||
            title
        );

        setDescription(
          normalizedStory.description ||
            description
        );

        setStatus(
          normalizedStory.status ||
            status
        );

        setRating(
          normalizedStory.rating ||
            rating
        );

        setGenre(
          normalizedStory.genre ||
            genre
        );

        setTags(
          normalizedStory.tags.map(
            (tag) => tag.name
          )
        );

        setCoverPreview(
          normalizedStory.cover_url ||
            coverPreview
        );
      }

      setSuccess(
        'Informações da obra salvas com sucesso.'
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Erro ao salvar a obra.'
      );
    } finally {
      setSavingStory(false);
    }
  }

  function executeCommand(
    command: string,
    value?: string
  ) {
    restoreSelection();

    document.execCommand(
      command,
      false,
      value
    );

    saveSelection();
    syncEditorBody();
  }

  function setAlignment(
    alignment:
      | 'left'
      | 'center'
      | 'right'
  ) {
    restoreSelection();

    document.execCommand(
      'justify' +
        alignment.charAt(0).toUpperCase() +
        alignment.slice(1),
      false
    );

    saveSelection();
    syncEditorBody();
  }

  function addLink() {
    const value =
      linkValue.trim();

    if (!value) return;

    let url = value;

    if (
      !/^https?:\/\//i.test(
        url
      )
    ) {
      url =
        'https://' + url;
    }

    restoreSelection();

    document.execCommand(
      'createLink',
      false,
      url
    );

    saveSelection();
    syncEditorBody();

    setLinkValue('');
    setShowLinkBox(false);
  }

  function createPendingMediaMarker(
    mediaId: string,
    type: 'image' | 'gif'
  ) {
    return (
      '<div class="chapter-media-placeholder" ' +
      'data-pending-media-id="' +
      mediaId +
      '" ' +
      'data-media-type="' +
      type +
      '">' +
      'Carregando mídia...' +
      '</div>'
    );
  }

  function insertPendingMediaBatch(
    mediaItems: EditorMedia[]
  ) {
    restoreSelection();

    const html =
      mediaItems
        .map((media) =>
          createPendingMediaMarker(
            media.id,
            media.type
          )
        )
        .join('');

    document.execCommand(
      'insertHTML',
      false,
      html
    );

    saveSelection();
    syncEditorBody();
  }

  function handleMediaSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files || []
      );

    if (
      files.length === 0
    ) {
      return;
    }

    setError('');

    const remaining =
      MAX_MEDIA -
      chapterMedia.length;

    if (
      remaining <= 0
    ) {
      setError(
        `Este capítulo já possui o limite de ${MAX_MEDIA} mídias.`
      );
      return;
    }

    const selected =
      files.slice(
        0,
        remaining
      );

    const invalid =
      selected.find(
        (file) =>
          !ALLOWED_MEDIA_TYPES.includes(
            file.type
          ) ||
          file.size >
            MAX_MEDIA_SIZE
      );

    if (invalid) {
      setError(
        'Cada mídia deve ser JPG, PNG, WEBP ou GIF e ter no máximo 5 MB.'
      );
      return;
    }

    const newMedia: EditorMedia[] =
      selected.map(
        (file) => ({
          id:
            crypto.randomUUID(),
          url:
            URL.createObjectURL(
              file
            ),
          type:
            file.type ===
            'image/gif'
              ? 'gif'
              : 'image',
          existing: false,
          file,
        })
      );

    setChapterMedia(
      (current) => [
        ...current,
        ...newMedia,
      ]
    );

    insertPendingMediaBatch(
      newMedia
    );

    if (
      mediaInputRef.current
    ) {
      mediaInputRef.current.value =
        '';
    }
  }

  function replacePendingMediaWithRealUrls(
    body: string,
    pending: EditorMedia[],
    uploaded: ChapterMedia[]
  ) {
    let result = body;

    pending.forEach(
      (item, index) => {
        const uploadedMedia =
          uploaded[index];

        if (!uploadedMedia) {
          return;
        }

        const marker =
          new RegExp(
            '<div[^>]*data-pending-media-id=["\\\']' +
              item.id +
              '["\\\'][^>]*>.*?<\\/div>',
            'gi'
          );

        const imageHtml =
          '<img src="' +
          uploadedMedia.media_url +
          '" alt="Imagem do capítulo" data-media-id="' +
          uploadedMedia.id +
          '" data-media-type="' +
          uploadedMedia.media_type +
          '" loading="lazy" style="max-width: 100%; height: auto;">';

        result =
          result.replace(
            marker,
            imageHtml
          );
      }
    );

    return result;
  }

  function removeMedia(
    mediaId: string
  ) {
    const media =
      chapterMedia.find(
        (item) =>
          item.id === mediaId
      );

    if (
      media &&
      !media.existing
    ) {
      URL.revokeObjectURL(
        media.url
      );
    }

    setChapterMedia(
      (current) =>
        current.filter(
          (item) =>
            item.id !== mediaId
        )
    );

    if (editorRef.current) {
      const element =
        editorRef.current.querySelector(
          `[data-media-id="${mediaId}"]`
        );

      element?.remove();

      const pendingElement =
        editorRef.current.querySelector(
          `[data-pending-media-id="${mediaId}"]`
        );

      pendingElement?.remove();

      syncEditorBody();
    }
  }

  async function saveChapter(
    targetStatus?: Chapter['publication_status']
  ) {
    if (!chapter) return;

    const finalStatus =
      targetStatus ||
      chapterStatus;

    if (
      finalStatus === 'scheduled' &&
      !scheduledFor
    ) {
      setError(
        'Escolha a data e o horário da publicação.'
      );
      return;
    }

    if (
      finalStatus === 'scheduled'
    ) {
      const selectedDate =
        new Date(
          scheduledFor
        );

      if (
        Number.isNaN(
          selectedDate.getTime()
        ) ||
        selectedDate.getTime() <=
          Date.now()
      ) {
        setError(
          'A data de publicação precisa estar no futuro.'
        );
        return;
      }
    }

    const body =
      syncEditorBody();

    const sanitizedBody =
      sanitizeHtml(body);

    const plainText =
      sanitizedBody
        .replace(
          /<[^>]+>/g,
          ''
        )
        .replace(
          /&nbsp;/gi,
          ' '
        )
        .trim();

    if (
      !sanitizedBody ||
      sanitizedBody === '<br>' ||
      plainText === ''
    ) {
      setError(
        'O conteúdo do capítulo não pode estar vazio.'
      );
      return;
    }

    if (
      !chapterTitle.trim()
    ) {
      setError(
        'O título do capítulo é obrigatório.'
      );
      return;
    }

    if (
      chapterTitle.trim().length >
      150
    ) {
      setError(
        'O título do capítulo pode ter no máximo 150 caracteres.'
      );
      return;
    }

    if (
