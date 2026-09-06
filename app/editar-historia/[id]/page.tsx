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
  publication_status?: Chapter['publication_status'];
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
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function formatDateForInput(
  value: string | null | undefined
) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const hours = String(
    date.getHours()
  ).padStart(2, '0');

  const minutes = String(
    date.getMinutes()
  ).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getLocalDateTimeInputMin() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  const hours = String(
    date.getHours()
  ).padStart(2, '0');

  const minutes = String(
    date.getMinutes()
  ).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getStatusLabel(
  status: Chapter['publication_status'],
  published?: boolean
) {
  if (status === 'scheduled') {
    return 'AGENDADO';
  }

  if (
    status === 'published' ||
    published
  ) {
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
    return 'border-violet-400/30 bg-violet-500/10 text-violet-200';
  }

  if (
    status === 'published' ||
    published
  ) {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'unpublished') {
    return 'border-orange-400/30 bg-orange-500/10 text-orange-200';
  }

  return 'border-white/10 bg-white/[0.04] text-gray-400';
}

function sanitizeHtml(html: string) {
  if (!html) {
    return '';
  }

  const documentNode =
    new DOMParser().parseFromString(
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
      Array.from(
        element.attributes
      ).forEach((attribute) => {
        const name =
          attribute.name.toLowerCase();

        const value =
          attribute.value;

        if (name.startsWith('on')) {
          element.removeAttribute(
            attribute.name
          );
          return;
        }

        if (
          [
            'href',
            'src',
            'action',
            'formaction',
          ].includes(name) &&
          /^\s*javascript:/i.test(value)
        ) {
          element.removeAttribute(
            attribute.name
          );
        }
      });
    });

  documentNode
    .querySelectorAll('a')
    .forEach((link) => {
      link.setAttribute(
        'target',
        '_blank'
      );

      link.setAttribute(
        'rel',
        'noopener noreferrer nofollow'
      );
    });

  return documentNode.body.innerHTML;
}

export default function EditarHistoriaPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams =
    useSearchParams();

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
    const selection =
      window.getSelection();

    if (
      !selection ||
      selection.rangeCount === 0
    ) {
      return;
    }

    const range =
      selection.getRangeAt(0);

    if (
      !editorRef.current ||
      !editorRef.current.contains(
        range.commonAncestorContainer
      )
    ) {
      return;
    }

    savedSelectionRef.current =
      range.cloneRange();
  }

  function restoreSelection() {
    if (!editorRef.current) {
      return;
    }

    const range =
      savedSelectionRef.current;

    if (!range) {
      editorRef.current.focus();
      return;
    }

    try {
      const selection =
        window.getSelection();

      if (!selection) {
        return;
      }

      selection.removeAllRanges();
      selection.addRange(
        range
      );

      editorRef.current.focus();
    } catch {
      editorRef.current.focus();
    }
  }

  function syncEditorBody() {
    if (!editorRef.current) {
      return '';
    }

    const html =
      editorRef.current.innerHTML;

    setChapterBody(html);

    return html;
  }

  useEffect(() => {
    async function loadStory() {
      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
            `/api/stories/${id}`,
            {
              cache: 'no-store',
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              'Não foi possível carregar a obra.'
          );
        }

        const loadedStory =
          data.story || data;

        storyRef.current =
          loadedStory;

        setStory(
          loadedStory
        );

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

        setGenre(
          loadedStory.genre || ''
        );

        setTags(
          Array.isArray(
            loadedStory.tags
          )
            ? loadedStory.tags.map(
                (
                  tag: Tag | string
                ) =>
                  typeof tag ===
                  'string'
                    ? tag
                    : tag.name
              )
            : []
        );

        setCoverPreview(
          loadedStory.cover_url ||
            null
        );

        const requestedChapter =
          searchParams.get(
            'chapter'
          );

        if (
          requestedChapter &&
          loadedStory.chapters?.some(
            (
              item: StoryChapter
            ) =>
              item.id ===
              requestedChapter
          )
        ) {
          setSelectedChapterId(
            requestedChapter
          );
        }
      } catch (err: unknown) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar a obra.'
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStory();
  }, [id, searchParams]);

  useEffect(() => {
    if (!selectedChapterId) {
      return;
    }

    async function loadChapter() {
      try {
        setLoadingChapter(true);
        setError('');
        setSuccess('');

        const response =
          await fetch(
            `/api/chapters/${selectedChapterId}`,
            {
              cache: 'no-store',
            }
          );

        const data =
          (await response.json()) as ChapterResponse;

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível carregar o capítulo.'
          );
        }

        if (!data.chapter) {
          throw new Error(
            'A API não retornou o capítulo.'
          );
        }

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

        setChapter(
          {
            ...loadedChapter,
            scheduled_for:
              resolvedScheduledFor,
          }
        );

        setChapterTitle(
          loadedChapter.title || ''
        );

        setChapterBody(
          loadedChapter.body || ''
        );

        setAuthorNotes(
          loadedChapter.author_notes ||
            ''
        );

        setChapterStatus(
          loadedChapter.publication_status ||
            (loadedChapter.published
              ? 'published'
              : 'draft')
        );

        setScheduledFor(
          resolvedScheduledFor
            ? formatDateForInput(
                resolvedScheduledFor
              )
            : ''
        );

        const loadedMedia =
          data.media ||
          loadedChapter.media ||
          [];

        setChapterMedia(
          loadedMedia.map(
            (media: ChapterMedia) => ({
              id: media.id,
              url: media.media_url,
              type: media.media_type,
              existing: true,
            })
          )
        );

        savedSelectionRef.current =
          null;

        const nextParams =
          new URLSearchParams(
            searchParams.toString()
          );

        nextParams.set(
          'chapter',
          loadedChapter.id
        );

        const nextQuery =
          nextParams.toString();

        const nextUrl =
          nextQuery
            ? `/editar-historia/${id}?${nextQuery}`
            : `/editar-historia/${id}`;

        if (
          window.location.pathname +
            window.location.search !==
          nextUrl
        ) {
          router.replace(
            nextUrl
          );
        }
      } catch (err: unknown) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar o capítulo.'
        );
      } finally {
        setLoadingChapter(false);
      }
    }

    void loadChapter();
  }, [
    selectedChapterId,
    id,
    router,
    searchParams,
  ]);

  useEffect(() => {
    if (
      !editorRef.current ||
      previewMode ||
      !chapter
    ) {
      return;
    }

    if (
      editorRef.current.innerHTML !==
      chapterBody
    ) {
      editorRef.current.innerHTML =
        chapterBody || '';
    }
  }, [
    chapter,
    chapterBody,
    previewMode,
  ]);

  useEffect(() => {
    if (
      showLinkBox &&
      linkInputRef.current
    ) {
      window.setTimeout(() => {
        linkInputRef.current?.focus();
      }, 0);
    }
  }, [showLinkBox]);

  useEffect(() => {
    return () => {
      chapterMedia.forEach(
        (media) => {
          if (
            !media.existing &&
            media.url.startsWith('blob:')
          ) {
            URL.revokeObjectURL(
              media.url
            );
          }
        }
      );
    };
  }, [chapterMedia]);

  function selectChapter(
    chapterId: string
  ) {
    saveSelection();

    setSelectedChapterId(
      chapterId
    );

    setPreviewMode(false);
    setShowLinkBox(false);
    setLinkValue('');
    setError('');
    setSuccess('');

    const nextParams =
      new URLSearchParams(
        searchParams.toString()
      );

    nextParams.set(
      'chapter',
      chapterId
    );

    router.replace(
      `/editar-historia/${id}?${nextParams.toString()}`
    );
  }

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (
      !ALLOWED_MEDIA_TYPES.includes(
        file.type
      )
    ) {
      setError(
        'A capa precisa ser JPG, PNG, WEBP ou GIF.'
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

    const objectUrl =
      URL.createObjectURL(file);

    setCoverPreview(
      objectUrl
    );

    setError('');
    setSuccess('');

    void (async () => {
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
            data?.error ||
              'Não foi possível alterar a capa.'
          );
        }

        if (
          data.cover_url
        ) {
          setCoverPreview(
            data.cover_url
          );

          URL.revokeObjectURL(
            objectUrl
          );
        }

        setStory(
          (current) =>
            current
              ? {
                  ...current,
                  cover_url:
                    data.cover_url ||
                    current.cover_url,
                }
              : current
        );

        if (storyRef.current) {
          storyRef.current = {
            ...storyRef.current,
            cover_url:
              data.cover_url ||
              storyRef.current.cover_url,
          };
        }

        setSuccess(
          'Capa alterada com sucesso.'
        );
      } catch (err: unknown) {
        URL.revokeObjectURL(
          objectUrl
        );

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível alterar a capa.'
        );
      }
    })();
  }

  function addTag(
    rawValue: string
  ) {
    const value =
      rawValue.trim();

    if (!value) {
      return;
    }

    if (
      tags.length >= 30
    ) {
      setError(
        'A obra pode ter no máximo 30 tags.'
      );

      return;
    }

    const normalized =
      value.toLowerCase();

    if (
      tags.some(
        (tag) =>
          tag.toLowerCase() ===
          normalized
      )
    ) {
      setTagInput('');
      return;
    }

    setTags(
      (current) => [
        ...current,
        value.slice(0, 50),
      ]
    );

    setTagInput('');
    setError('');
  }

  function removeTag(
    index: number
  ) {
    setTags(
      (current) =>
        current.filter(
          (_, tagIndex) =>
            tagIndex !== index
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

      addTag(
        tagInput.replace(
          /,$/,
          ''
        )
      );

      return;
    }

    if (
      event.key === 'Backspace' &&
      !tagInput &&
      tags.length > 0
    ) {
      setTags(
        (current) =>
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
        'A obra precisa ter um título.'
      );

      return;
    }

    if (
      title.trim().length >
      150
    ) {
      setError(
        'O título da obra pode ter no máximo 150 caracteres.'
      );

      return;
    }

    try {
      setSavingStory(true);
      setError('');
      setSuccess('');

      const response =
        await fetch(
          `/api/stories/${id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              title:
                title.trim(),
              description:
                description.trim(),
              status,
              rating,
              genre:
                genre.trim(),
              tags,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Não foi possível salvar as informações da obra.'
        );
      }

      const nextTitle =
        title.trim();

      const nextDescription =
        description.trim();

      const nextGenre =
        genre.trim();

      const nextTags =
        tags.map(
          (name) => ({
            name,
          })
        );

      setStory(
        (current) =>
          current
            ? {
                ...current,
                title:
                  nextTitle,
                description:
                  nextDescription,
                status,
                rating,
                genre:
                  nextGenre,
                tags: nextTags,
              }
            : current
      );

      if (storyRef.current) {
        storyRef.current = {
          ...storyRef.current,
          title:
            nextTitle,
          description:
            nextDescription,
          status,
          rating,
          genre:
            nextGenre,
          tags: nextTags,
        };
      }

      setSuccess(
        'Informações da obra salvas com sucesso.'
      );
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a obra.'
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

    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      value
    );

    syncEditorBody();
    saveSelection();
  }

  function addLink() {
    const value =
      linkValue.trim();

    if (!value) {
      setError(
        'Digite um endereço para inserir o link.'
      );

      return;
    }

    let href = value;

    if (
      !/^https?:\/\//i.test(
        href
      )
    ) {
      href =
        `https://${href}`;
    }

    restoreSelection();

    document.execCommand(
      'createLink',
      false,
      href
    );

    syncEditorBody();
    saveSelection();

    setLinkValue('');
    setShowLinkBox(false);
    setError('');
  }

  function createPendingMediaMarker(
    media: EditorMedia
  ) {
    const marker =
      document.createElement(
        'span'
      );

    marker.setAttribute(
      'data-pending-media',
      media.id
    );

    marker.setAttribute(
      'data-media-type',
      media.type
    );

    marker.contentEditable =
      'false';

    marker.className =
      'chapter-media-placeholder';

    const image =
      document.createElement(
        'img'
      );

    image.src =
      media.url;

    image.alt =
      media.type === 'gif'
        ? 'GIF do capítulo'
        : 'Imagem do capítulo';

    image.style.maxWidth =
      '100%';

    image.style.height =
      'auto';

    const label =
      document.createElement(
        'span'
      );

    label.textContent =
      media.type === 'gif'
        ? 'GIF aguardando salvamento'
        : 'Imagem aguardando salvamento';

    marker.appendChild(
      image
    );

    marker.appendChild(
      label
    );

    return marker;
  }

  function insertPendingMediaBatch(
    mediaItems: EditorMedia[]
  ) {
    if (
      !editorRef.current ||
      mediaItems.length === 0
    ) {
      return;
    }

    restoreSelection();

    const selection =
      window.getSelection();

    let range: Range | null =
      null;

    if (
      selection &&
      selection.rangeCount > 0
    ) {
      const currentRange =
        selection.getRangeAt(0);

      if (
        editorRef.current.contains(
          currentRange.commonAncestorContainer
        )
      ) {
        range =
          currentRange.cloneRange();
      }
    }

    if (!range) {
      range =
        document.createRange();

      range.selectNodeContents(
        editorRef.current
      );

      range.collapse(false);
    }

    range.deleteContents();

    const fragment =
      document.createDocumentFragment();

    mediaItems.forEach(
      (media, index) => {
        const marker =
          createPendingMediaMarker(
            media
          );

        fragment.appendChild(
          marker
        );

        if (
          index <
          mediaItems.length - 1
        ) {
          fragment.appendChild(
            document.createElement(
              'br'
            )
          );
        }
      }
    );

    range.insertNode(
      fragment
    );

    const newRange =
      document.createRange();

    newRange.selectNodeContents(
      editorRef.current
    );

    newRange.collapse(false);

    if (selection) {
      selection.removeAllRanges();
      selection.addRange(
        newRange
      );
    }

    savedSelectionRef.current =
      newRange.cloneRange();

    syncEditorBody();
  }

  function handleMediaSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files =
      Array.from(
        event.target.files || []
      );

    event.target.value = '';

    if (
      files.length === 0
    ) {
      return;
    }

    const availableSlots =
      MAX_MEDIA -
      chapterMedia.length;

    if (
      availableSlots <= 0
    ) {
      setError(
        `Este capítulo já possui o limite de ${MAX_MEDIA} mídias.`
      );

      return;
    }

    if (
      files.length >
      availableSlots
    ) {
      setError(
        `Você pode adicionar apenas mais ${availableSlots} mídia${
          availableSlots === 1
            ? ''
            : 's'
        } neste capítulo.`
      );

      return;
    }

    const invalidType =
      files.find(
        (file) =>
          !ALLOWED_MEDIA_TYPES.includes(
            file.type
          )
      );

    if (invalidType) {
      setError(
        'As mídias precisam ser JPG, PNG, WEBP ou GIF.'
      );

      return;
    }

    const oversized =
      files.find(
        (file) =>
          file.size >
          MAX_MEDIA_SIZE
      );

    if (oversized) {
      setError(
        'Cada imagem ou GIF pode ter no máximo 5 MB.'
      );

      return;
    }

    saveSelection();

    const timestamp =
      Date.now();

    const pendingMedia: EditorMedia[] =
      files.map(
        (file, index): EditorMedia => ({
          id:
            `pending-${timestamp}-${index}-${Math.random()
              .toString(36)
              .slice(2)}`,
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
        ...pendingMedia,
      ]
    );

    setError('');

    window.setTimeout(() => {
      insertPendingMediaBatch(
        pendingMedia
      );
    }, 0);
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
      !media.existing &&
      media.url.startsWith('blob:')
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

    if (
      editorRef.current
    ) {
      const elements =
        Array.from(
          editorRef.current.querySelectorAll(
            '[data-pending-media], [data-media-id]'
          )
        );

      elements.forEach(
        (element) => {
          const pendingId =
            element.getAttribute(
              'data-pending-media'
            );

          const existingId =
            element.getAttribute(
              'data-media-id'
            );

          if (
            pendingId === mediaId ||
            existingId === mediaId
          ) {
            element.remove();
          }
        }
      );

      syncEditorBody();
      saveSelection();
    }
  }

  function replacePendingMediaWithRealUrls(
    html: string,
    pendingMedia: EditorMedia[],
    uploaded: ChapterMedia[]
  ) {
    const documentNode =
      new DOMParser().parseFromString(
        html,
        'text/html'
      );

    const pendingElements =
      Array.from(
        documentNode.querySelectorAll(
          '[data-pending-media]'
        )
      );

    const pendingIdsInDocument =
      pendingElements
        .map(
          (element) =>
            element.getAttribute(
              'data-pending-media'
            )
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );

    const pendingInOrder =
      pendingIdsInDocument
        .map(
          (pendingId) =>
            pendingMedia.find(
              (item) =>
                item.id ===
                pendingId
            )
        )
        .filter(
          (
            item
          ): item is EditorMedia =>
            Boolean(item)
        );

    pendingInOrder.forEach(
      (pendingItem, index) => {
        const uploadedMedia =
          uploaded[index];

        if (!uploadedMedia) {
          return;
        }

        const matchingElements =
          Array.from(
            documentNode.querySelectorAll(
              '[data-pending-media]'
            )
          ).filter(
            (element) =>
              element.getAttribute(
                'data-pending-media'
              ) ===
              pendingItem.id
          );

        matchingElements.forEach(
          (element) => {
            const image =
              documentNode.createElement(
                'img'
              );

            image.src =
              uploadedMedia.media_url;

            image.alt =
              uploadedMedia.media_type ===
              'gif'
                ? 'GIF do capítulo'
                : 'Imagem do capítulo';

            image.setAttribute(
              'data-media-id',
              uploadedMedia.id
            );

            image.setAttribute(
              'data-media-type',
              uploadedMedia.media_type
            );

            image.setAttribute(
              'loading',
              'lazy'
            );

            element.replaceWith(
              image
            );
          }
        );
      }
    );

    documentNode
      .querySelectorAll(
        '[data-pending-media]'
      )
      .forEach(
        (element) => {
          element.removeAttribute(
            'data-pending-media'
          );

          element.removeAttribute(
            'data-media-type'
          );

          element.classList.remove(
            'chapter-media-placeholder'
          );
        }
      );

    return documentNode.body.innerHTML;
  }

  async function saveChapter(
    targetStatus?: Chapter['publication_status']
  ) {
    if (!chapter) {
      return;
    }

    const finalStatus =
      targetStatus ||
      chapterStatus;

    if (
      finalStatus ===
        'scheduled' &&
      !scheduledFor
    ) {
      setError(
        'Escolha a data e o horário da publicação.'
      );

      return;
    }

    if (
      finalStatus ===
      'scheduled'
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

    let sanitizedBody =
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
        'O capítulo não pode estar vazio.'
      );

      return;
    }

    if (
      !chapterTitle.trim()
    ) {
      setError(
        'O capítulo precisa ter um título.'
      );

      return;
    }

    if (
      chapterTitle.trim()
        .length > 150
    ) {
      setError(
        'O título do capítulo pode ter no máximo 150 caracteres.'
      );

      return;
    }

    if (
      authorNotes.length >
      5000
    ) {
      setError(
        'As notas do autor podem ter no máximo 5.000 caracteres.'
      );

      return;
    }

    const pending =
      chapterMedia.filter(
        (media) =>
          !media.existing &&
          media.file
      );

    const existing =
      chapterMedia.filter(
        (media) =>
          media.existing
      );

    try {
      setSavingChapter(true);
      setError('');
      setSuccess('');

      let workingBody =
        sanitizedBody;

      let finalMediaIds =
        existing.map(
          (media) =>
            media.id
        );

      /*
       * A API atual precisa primeiro receber os arquivos
       * para gerar as URLs reais. Por isso, quando existem
       * novas mídias, fazemos uma primeira gravação técnica
       * como rascunho e, depois, a gravação definitiva.
       *
       * O capítulo nunca é publicado nessa primeira etapa.
       */
      if (
        pending.length > 0
      ) {
        setMediaUploading(true);

        const uploadData =
          new FormData();

        uploadData.append(
          'title',
          chapterTitle.trim()
        );

        uploadData.append(
          'body',
          workingBody
        );

        uploadData.append(
          'author_notes',
          authorNotes
        );

        uploadData.append(
          'publication_status',
          'draft'
        );

        existing.forEach(
          (media) => {
            uploadData.append(
              'existing_media_ids',
              media.id
            );
          }
        );

        pending.forEach(
          (media) => {
            if (media.file) {
              uploadData.append(
                'media',
                media.file
              );
            }
          }
        );

        const uploadResponse =
          await fetch(
            `/api/chapters/${chapter.id}`,
            {
              method: 'PUT',
              body: uploadData,
            }
          );

        const uploadResult =
          (await uploadResponse.json()) as ChapterResponse;

        if (
          !uploadResponse.ok
        ) {
          throw new Error(
            uploadResult.error ||
              'Não foi possível enviar as mídias.'
          );
        }

        const returnedMedia =
          uploadResult.media ||
          [];

        const newMedia =
          returnedMedia.filter(
            (media) =>
              !existing.some(
                (item) =>
                  item.id ===
                  media.id
              )
          );

        if (
          newMedia.length !==
          pending.length
        ) {
          throw new Error(
            'Nem todas as mídias foram enviadas corretamente. Tente novamente.'
          );
        }

        workingBody =
          replacePendingMediaWithRealUrls(
            workingBody,
            pending,
            newMedia
          );

        finalMediaIds =
          returnedMedia.map(
            (media) =>
              media.id
          );

        setChapterMedia(
          returnedMedia.map(
            (media: ChapterMedia) => ({
              id: media.id,
              url: media.media_url,
              type: media.media_type,
              existing: true,
            })
          )
        );

        pending.forEach(
          (media) => {
            if (
              media.url.startsWith(
                'blob:'
              )
            ) {
              URL.revokeObjectURL(
                media.url
              );
            }
          }
        );

        setMediaUploading(false);
      }

      /*
       * Gravação definitiva.
       */
      const formData =
        new FormData();

      formData.append(
        'title',
        chapterTitle.trim()
      );

      formData.append(
        'body',
        workingBody
      );

      formData.append(
        'author_notes',
        authorNotes
      );

      formData.append(
        'publication_status',
        finalStatus
      );

      finalMediaIds.forEach(
        (mediaId) => {
          formData.append(
            'existing_media_ids',
            mediaId
          );
        }
      );

      if (
        finalStatus ===
        'scheduled'
      ) {
        formData.append(
          'scheduled_for',
          new Date(
            scheduledFor
          ).toISOString()
        );
      }

      const response =
        await fetch(
          `/api/chapters/${chapter.id}`,
          {
            method: 'PUT',
            body: formData,
          }
        );

      const data =
        (await response.json()) as ChapterResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível salvar o capítulo.'
        );
      }

      if (!data.chapter) {
        throw new Error(
          'A API não retornou o capítulo salvo.'
        );
      }

      const savedChapter =
        data.chapter;

      /*
       * A API pode não devolver scheduled_for enquanto
       * ele estiver armazenado na tabela de agendamento.
       * Por isso preservamos o valor que o usuário acabou
       * de escolher quando estamos agendando.
       */
      const resolvedScheduledFor =
        finalStatus === 'scheduled'
          ? data.scheduled_for ??
            savedChapter.scheduled_for ??
            new Date(
              scheduledFor
            ).toISOString()
          : null;

      const normalizedSavedChapter: Chapter =
        {
          ...savedChapter,
          scheduled_for:
            resolvedScheduledFor,
        };

      setChapter(
        normalizedSavedChapter
      );

      setChapterStatus(
        savedChapter.publication_status
      );

      setChapterBody(
        savedChapter.body ||
          workingBody
      );

      setScheduledFor(
        resolvedScheduledFor
          ? formatDateForInput(
              resolvedScheduledFor
            )
          : ''
      );

      if (
        data.media
      ) {
        setChapterMedia(
          data.media.map(
            (media: ChapterMedia) => ({
              id: media.id,
              url: media.media_url,
              type: media.media_type,
              existing: true,
            })
          )
        );
      }

      if (
        editorRef.current
      ) {
        editorRef.current.innerHTML =
          savedChapter.body ||
          workingBody;
      }

      savedSelectionRef.current =
        null;

      if (
        finalStatus ===
        'published'
      ) {
        setSuccess(
          'Capítulo publicado com sucesso.'
        );
      } else if (
        finalStatus ===
        'scheduled'
      ) {
        setSuccess(
          'Capítulo agendado com sucesso.'
        );
      } else if (
        finalStatus ===
        'unpublished'
      ) {
        setSuccess(
          'Capítulo retirado do ar.'
        );
      } else {
        setSuccess(
          'Rascunho salvo com sucesso.'
        );
      }

      setStory(
        (current) =>
          current
            ? {
                ...current,
                chapters:
                  current.chapters.map(
                    (item) =>
                      item.id ===
                      savedChapter.id
                        ? {
                            ...item,
                            title:
                              savedChapter.title,
                            published:
                              savedChapter.published,
                            publication_status:
                              savedChapter.publication_status,
                            scheduled_for:
                              resolvedScheduledFor,
                            is_scheduled:
                              finalStatus ===
                              'scheduled',
                          }
                        : item
                  ),
              }
            : current
      );

      if (storyRef.current) {
        storyRef.current = {
          ...storyRef.current,
          chapters:
            storyRef.current.chapters.map(
              (item) =>
                item.id ===
                savedChapter.id
                  ? {
                      ...item,
                      title:
                        savedChapter.title,
                      published:
                        savedChapter.published,
                      publication_status:
                        savedChapter.publication_status,
                      scheduled_for:
                        resolvedScheduledFor,
                      is_scheduled:
                        finalStatus ===
                        'scheduled',
                    }
                  : item
            ),
        };
      }
    } catch (err: unknown) {
      console.error(err);

      setMediaUploading(false);

      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar o capítulo.'
      );
    } finally {
      setSavingChapter(false);
      setMediaUploading(false);
    }
  }

  function handleEditorInput() {
    if (!editorRef.current) {
      return;
    }

    setChapterBody(
      editorRef.current.innerHTML
    );

    saveSelection();
  }

  function handleEditorPaste(
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const text =
      event.clipboardData.getData(
        'text/plain'
      );

    restoreSelection();

    document.execCommand(
      'insertText',
      false,
      text
    );

    syncEditorBody();
    saveSelection();
  }

  function handleEditorKeyDown(
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key.toLowerCase() ===
        's'
    ) {
      event.preventDefault();

      void saveChapter(
        'draft'
      );

      return;
    }

    saveSelection();
  }

  function handleChapterFormSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    void saveChapter(
      chapterStatus
    );
  }

  function addHorizontalRule() {
    restoreSelection();

    document.execCommand(
      'insertHorizontalRule',
      false
    );

    syncEditorBody();
    saveSelection();
  }

  function handleScheduleChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setScheduledFor(
      event.target.value
    );

    setChapterStatus(
      'scheduled'
    );
  }

  function openMediaPicker() {
    saveSelection();

    mediaInputRef.current?.click();
  }

  function handleMediaButtonClick(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();

    saveSelection();
    openMediaPicker();
  }

  function clearChapterSelection() {
    chapterMedia.forEach(
      (media) => {
        if (
          !media.existing &&
          media.url.startsWith('blob:')
        ) {
          URL.revokeObjectURL(
            media.url
          );
        }
      }
    );

    setSelectedChapterId(null);
    setChapter(null);
    setPreviewMode(false);
    setChapterMedia([]);
    setChapterBody('');
    setChapterTitle('');
    setAuthorNotes('');
    setScheduledFor('');
    setChapterStatus('draft');
    setShowLinkBox(false);
    setLinkValue('');
    setError('');
    setSuccess('');

    savedSelectionRef.current =
      null;

    const nextParams =
      new URLSearchParams(
        searchParams.toString()
      );

    nextParams.delete(
      'chapter'
    );

    const query =
      nextParams.toString();

    router.replace(
      query
        ? `/editar-historia/${id}?${query}`
        : `/editar-historia/${id}`
    );
  }

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
      <style jsx global>{`
        .chapter-editor {
          min-height: 620px;
          outline: none;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
          font-family: inherit;
        }

        .chapter-editor:empty:before {
          content: 'Comece a escrever seu capítulo...';
          color: rgba(156, 163, 175, 0.45);
          pointer-events: none;
        }

        .chapter-editor p {
          margin: 0 0 1.15rem;
        }

        .chapter-editor h2 {
          margin: 2rem 0 1rem;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .chapter-editor h3 {
          margin: 1.5rem 0 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .chapter-editor blockquote {
          margin: 1.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid rgba(236, 72, 153, 0.55);
          color: rgba(229, 231, 235, 0.8);
        }

        .chapter-editor a {
          color: rgb(244, 114, 182);
          text-decoration: underline;
        }

        .chapter-editor img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          border-radius: 0.9rem;
        }

        .chapter-editor hr {
          margin: 2rem 0;
          border-color: rgba(255, 255, 255, 0.12);
        }

        .chapter-media-placeholder {
          display: block;
          width: 100%;
          max-width: 680px;
          margin: 1.5rem auto;
          padding: 0.5rem;
          border-radius: 0.9rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed rgba(244, 114, 182, 0.35);
          text-align: center;
        }

        .chapter-media-placeholder img {
          margin: 0 auto 0.5rem;
        }

        .chapter-media-placeholder span {
          display: block;
          color: rgba(156, 163, 175, 0.7);
          font-size: 0.75rem;
        }

        .chapter-preview {
          overflow-wrap: anywhere;
        }

        .chapter-preview img {
          display: block;
          max-width: 100%;
          height: auto;
          margin: 1.5rem auto;
          border-radius: 0.9rem;
        }

        .chapter-preview p {
          margin: 0 0 1.15rem;
        }

        .chapter-preview h2 {
          margin: 2rem 0 1rem;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .chapter-preview h3 {
          margin: 1.5rem 0 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .chapter-preview a {
          color: rgb(244, 114, 182);
          text-decoration: underline;
        }

        .chapter-preview blockquote {
          margin: 1.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid rgba(236, 72, 153, 0.55);
          color: rgba(229, 231, 235, 0.8);
        }

        .chapter-preview hr {
          margin: 2rem 0;
          border-color: rgba(255, 255, 255, 0.12);
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b090c]/95 backdrop-blur">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            {chapter && (
              <button
                type="button"
                onClick={() =>
                  setPreviewMode(
                    (current) =>
                      !current
                  )
                }
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
              >
                {previewMode
                  ? 'Voltar ao editor'
                  : 'Pré-visualizar'}
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/historia/${id}`
                )
              }
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        )}

        {!chapter ? (
          <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)_320px]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt={`Capa de ${story.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-600">
                      Sem capa
                    </div>
                  )}
                </div>

                <label className="mt-4 block cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">
                  ALTERAR A CAPA

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleCoverChange
                    }
                    className="hidden"
                  />
                </label>

                <p className="mt-2 text-center text-xs text-gray-600">
                  JPG, PNG, WEBP ou GIF
                  <br />
                  até 10 MB
                </p>
              </div>
            </aside>

            <section>
              <div className="mb-7">
                <p className="text-xs uppercase tracking-[0.18em] text-pink-300/70">
                  Configurações da obra
                </p>

                <h1 className="mt-2 text-3xl font-semibold">
                  {story.title}
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Edite as informações da obra ou escolha um capítulo para começar a escrever.
                </p>
              </div>

              <form
                onSubmit={
                  handleSaveStory
                }
                className="space-y-6"
              >
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <h2 className="text-base font-medium">
                    Informações
                  </h2>

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
                    />
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-300">
                      Sinopse
                    </label>

                    <textarea
                      value={
                        description
                      }
                      onChange={(event) =>
                        setDescription(
                          event.target.value
                        )
                      }
                      maxLength={5000}
                      rows={8}
                      className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-600 focus:border-pink-400/40"
                    />

                    <div className="mt-1 text-right text-xs text-gray-600">
                      {
                        description.length
                      }
                      /5000
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm text-gray-300">
                      Status da obra
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

                      <option value="EM ANDAMENTO">
                        EM ANDAMENTO
                      </option>

                      <option value="CONCLUÍDA">
                        CONCLUÍDA
                      </option>

                      <option value="HIATUS">
                        HIATUS
                      </option>
                    </select>
                  </div>

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
                      placeholder="Romance, Fantasia, Drama..."
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <h2 className="text-base font-medium">
                    Tags
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    Pressione Enter ou vírgula para adicionar.
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
                              removeTag(
                                index
                              )
                            }
                            className="text-pink-300/60 hover:text-pink-200 transition"
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}

                    <input
                      value={
                        tagInput
                      }
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
                        tags.length >=
                        30
                          ? 'Limite atingido'
                          : 'Adicionar tag...'
                      }
                      disabled={
                        tags.length >=
                        30
                      }
                    />
                  </div>

                  <div className="mt-2 text-right text-xs text-gray-600">
                    {tags.length}/30
                  </div>
                </section>

                <button
                  type="submit"
                  disabled={
                    savingStory
                  }
                  className="w-full rounded-xl bg-pink-500 px-6 py-3 text-sm font-medium text-white hover:bg-pink-400 disabled:opacity-50 transition"
                >
                  {savingStory
                    ? 'Salvando...'
                    : 'Salvar informações da obra'}
                </button>
              </form>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">
                      Capítulos
                    </h2>

                    <p className="mt-1 text-xs text-gray-600">
                      {
                        story.chapters
                          .length
                      }{' '}
                      {story.chapters
                        .length === 1
                        ? 'capítulo'
                        : 'capítulos'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {story.chapters
                    .length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-gray-600">
                      Sua obra ainda não possui capítulos.
                    </div>
                  ) : (
                    story.chapters.map(
                      (item) => (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            selectChapter(
                              item.id
                            )
                          }
                          className="w-full rounded-xl border border-white/10 bg-black/20 p-3 text-left hover:border-pink-400/30 hover:bg-pink-500/[0.04] transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-gray-600">
                                Capítulo{' '}
                                {
                                  item.chapter_number
                                }
                              </p>

                              <p className="mt-1 truncate text-sm text-gray-200">
                                {item.title ||
                                  'Sem título'}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-medium tracking-wide ${getStatusClass(
                                item.is_scheduled
                                  ? 'scheduled'
                                  : item.publication_status ||
                                    (item.published
                                      ? 'published'
                                      : 'draft'),
                                item.published
                              )}`}
                            >
                              {item.is_scheduled
                                ? 'AGENDADO'
                                : item.publication_status ===
                                  'unpublished'
                                  ? 'FORA DO AR'
                                  : item.published
                                    ? 'PUBLICADO'
                                    : 'RASCUNHO'}
                            </span>
                          </div>

                          {item.scheduled_for && (
                            <p className="mt-2 text-[11px] text-violet-300/70">
                              {formatDate(
                                item.scheduled_for
                              )}
                            </p>
                          )}
                        </button>
                      )
                    )
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-black/20">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt={`Capa de ${story.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-600">
                      Sem capa
                    </div>
                  )}
                </div>

                <label className="mt-4 block cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white transition">
                  ALTERAR A CAPA

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={
                      handleCoverChange
                    }
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={
                    clearChapterSelection
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-400 hover:bg-white/[0.05] hover:text-white transition"
                >
                  Voltar para a obra
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium">
                    Capítulos
                  </h2>

                  <span className="text-xs text-gray-600">
                    {
                      story.chapters
                        .length
                    }
                  </span>
                </div>

                <div className="mt-3 max-h-[420px] overflow-y-auto space-y-2 pr-1">
                  {story.chapters.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          selectChapter(
                            item.id
                          )
                        }
                        className={`w-full rounded-xl border p-3 text-left transition ${
                          item.id ===
                          selectedChapterId
                            ? 'border-pink-400/40 bg-pink-500/[0.08]'
                            : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Capítulo{' '}
                          {
                            item.chapter_number
                          }
                        </p>

                        <p className="mt-1 truncate text-sm text-gray-200">
                          {item.title ||
                            'Sem título'}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <span
                            className={`rounded-full border px-2 py-1 text-[8px] ${getStatusClass(
                              item.is_scheduled
                                ? 'scheduled'
                                : item.publication_status ||
                                  (item.published
                                    ? 'published'
                                    : 'draft'),
                              item.published
                            )}`}
                          >
                            {item.is_scheduled
                              ? 'AGENDADO'
                              : item.publication_status ===
                                'unpublished'
                                ? 'FORA DO AR'
                                : item.published
                                  ? 'PUBLICADO'
                                  : 'RASCUNHO'}
                          </span>
                        </div>

                        {item.scheduled_for && (
                          <p className="mt-2 text-[10px] text-violet-300/60">
                            {formatShortDate(
                              item.scheduled_for
                            )}
                          </p>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            </aside>

            <section className="min-w-0">
              {loadingChapter ? (
                <div className="min-h-[500px] flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02]">
                  <p className="text-sm text-gray-500">
                    Carregando capítulo...
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={
                    handleChapterFormSubmit
                  }
                  className="space-y-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-pink-300/70">
                        Capítulo{' '}
                        {
                          chapter.chapter_number
                        }
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] tracking-wide ${getStatusClass(
                            chapterStatus,
                            chapter.published
                          )}`}
                        >
                          {getStatusLabel(
                            chapterStatus,
                            chapter.published
                          )}
                        </span>

                        {chapter.original_published_at && (
                          <span className="text-xs text-gray-600">
                            Original:{' '}
                            {formatShortDate(
                              chapter.original_published_at
                            )}
                          </span>
                        )}

                        {chapter.republished_at && (
                          <span className="text-xs text-gray-600">
                            Republicado:{' '}
                            {formatShortDate(
                              chapter.republished_at
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void saveChapter(
                            'draft'
                          )
                        }
                        disabled={
                          savingChapter ||
                          mediaUploading
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 transition"
                      >
                        {savingChapter
                          ? 'Salvando...'
                          : 'Salvar rascunho'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void saveChapter(
                            'published'
                          )
                        }
                        disabled={
                          savingChapter ||
                          mediaUploading
                        }
                        className="rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-medium hover:bg-pink-400 disabled:opacity-50 transition"
                      >
                        {savingChapter
                          ? 'Salvando...'
                          : 'Publicar'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
                    <input
                      value={
                        chapterTitle
                      }
                      onChange={(event) =>
                        setChapterTitle(
                          event.target.value
                        )
                      }
                      maxLength={150}
                      className="w-full border-none bg-transparent px-2 py-3 text-2xl sm:text-3xl font-semibold text-white outline-none placeholder:text-gray-700"
                      placeholder="Título do capítulo"
                    />

                    {previewMode ? (
                      <article className="chapter-preview mt-4 min-h-[620px] px-2 sm:px-8 py-6 text-[17px] leading-8 text-gray-200">
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              sanitizeHtml(
                                chapterBody
                              ) ||
                              '<p>O capítulo está vazio.</p>',
                          }}
                        />

                        {authorNotes.trim() && (
                          <div className="mt-12 border-t border-white/10 pt-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-pink-300/70">
                              NOTAS DO AUTOR
                            </p>

                            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-400">
                              {
                                authorNotes
                              }
                            </p>
                          </div>
                        )}
                      </article>
                    ) : (
                      <>
                        <div className="sticky top-[61px] z-20 mt-2 border-y border-white/10 bg-[#0d0a0e]/95 backdrop-blur">
                          <div className="flex flex-wrap items-center gap-1 p-2">
                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                executeCommand(
                                  'bold'
                                )
                              }
                              className="h-9 min-w-9 rounded-lg px-3 text-sm font-bold text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                              title="Negrito"
                            >
                              B
                            </button>

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                executeCommand(
                                  'italic'
                                )
                              }
                              className="h-9 min-w-9 rounded-lg px-3 text-sm italic text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                              title="Itálico"
                            >
                              I
                            </button>

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                executeCommand(
                                  'underline'
                                )
                              }
                              className="h-9 min-w-9 rounded-lg px-3 text-sm underline text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                              title="Sublinhado"
                            >
                              U
                            </button>

                            <span className="mx-1 h-6 w-px bg-white/10" />

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                executeCommand(
                                  'formatBlock',
                                  'h2'
                                )
                              }
                              className="h-9 rounded-lg px-3 text-xs font-semibold text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              Título
                            </button>

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                executeCommand(
                                  'formatBlock',
                                  'blockquote'
                                )
                              }
                              className="h-9 rounded-lg px-3 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              Citação
                            </button>

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={
                                addHorizontalRule
                              }
                              className="h-9 rounded-lg px-3 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              Separador
                            </button>

                            <span className="mx-1 h-6 w-px bg-white/10" />

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={() =>
                                setShowLinkBox(
                                  (current) =>
                                    !current
                                )
                              }
                              className="h-9 rounded-lg px-3 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              Adicionar link
                            </button>

                            <button
                              type="button"
                              onMouseDown={(
                                event
                              ) => {
                                event.preventDefault();
                                saveSelection();
                              }}
                              onClick={
                                handleMediaButtonClick
                              }
                              className="h-9 rounded-lg px-3 text-xs text-gray-300 hover:bg-white/[0.08] hover:text-white transition"
                            >
                              Imagem / GIF
                            </button>

                            <input
                              ref={
                                mediaInputRef
                              }
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              multiple
                              onChange={
                                handleMediaSelect
                              }
                              className="hidden"
                            />

                            <span className="ml-auto text-[11px] text-gray-600">
                              {
                                chapterMedia.length
                              }
                              /{MAX_MEDIA}{' '}
                              mídias
                            </span>
                          </div>

                          {showLinkBox && (
                            <div className="border-t border-white/10 p-2">
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                  ref={
                                    linkInputRef
                                  }
                                  value={
                                    linkValue
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setLinkValue(
                                      event.target.value
                                    )
                                  }
                                  onKeyDown={(
                                    event
                                  ) => {
                                    if (
                                      event.key ===
                                      'Enter'
                                    ) {
                                      event.preventDefault();
                                      addLink();
                                    }

                                    if (
                                      event.key ===
                                      'Escape'
                                    ) {
                                      event.preventDefault();
                                      setShowLinkBox(
                                        false
                                      );
                                      setLinkValue(
                                        ''
                                      );
                                    }
                                  }}
                                  placeholder="https://exemplo.com"
                                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-pink-400/40"
                                />

                                <button
                                  type="button"
                                  onMouseDown={(
                                    event
                                  ) => {
                                    event.preventDefault();
                                    saveSelection();
                                  }}
                                  onClick={
                                    addLink
                                  }
                                  className="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium hover:bg-pink-400 transition"
                                >
                                  Inserir
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          ref={
                            editorRef
                          }
                          contentEditable
                          suppressContentEditableWarning
                          onInput={
                            handleEditorInput
                          }
                          onPaste={
                            handleEditorPaste
                          }
                          onKeyDown={
                            handleEditorKeyDown
                          }
                          onMouseUp={
                            saveSelection
                          }
                          onKeyUp={
                            saveSelection
                          }
                          onFocus={
                            saveSelection
                          }
                          className="chapter-editor mt-2 px-2 sm:px-8 py-8 text-[17px] leading-8 text-gray-200"
                          spellCheck
                        />
                      </>
                    )}
                  </div>

                  {chapterMedia.length >
                    0 && (
                    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h2 className="text-sm font-medium">
                            Mídias do capítulo
                          </h2>

                          <p className="mt-1 text-xs text-gray-600">
                            Máximo de 25 arquivos. Cada arquivo pode ter até 5 MB.
                          </p>
                        </div>

                        <span className="text-xs text-gray-500">
                          {
                            chapterMedia.length
                          }
                          /{MAX_MEDIA}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {chapterMedia.map(
                          (media: EditorMedia) => (
                            <div
                              key={
                                media.id
                              }
                              className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
                            >
                              <div className="aspect-video">
                                <img
                                  src={
                                    media.url
                                  }
                                  alt="Mídia do capítulo"
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeMedia(
                                    media.id
                                  )
                                }
                                disabled={
                                  savingChapter
                                }
                                className="absolute right-2 top-2 rounded-lg border border-white/10 bg-black/70 px-2 py-1 text-xs text-gray-300 hover:bg-red-500/80 hover:text-white disabled:opacity-50 transition"
                              >
                                Remover
                              </button>

                              <div className="border-t border-white/10 px-3 py-2 text-[10px] uppercase tracking-wide text-gray-600">
                                {media.type ===
                                'gif'
                                  ? 'GIF'
                                  : 'IMAGEM'}

                                {!media.existing &&
                                  ' · NÃO SALVA'}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </section>
                  )}

                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-base font-medium">
                          NOTAS DO AUTOR
                        </h2>

                        <p className="mt-1 text-xs text-gray-600">
                          Uma mensagem opcional para seus leitores no final do capítulo.
                        </p>
                      </div>

                      <span className="text-xs text-gray-600">
                        {
                          authorNotes.length
                        }
                        /5000
                      </span>
                    </div>

                    <textarea
                      value={
                        authorNotes
                      }
                      onChange={(event) =>
                        setAuthorNotes(
                          event.target.value
                        )
                      }
                      maxLength={5000}
                      rows={6}
                      placeholder="Escreva uma mensagem para seus leitores..."
                      className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-gray-700 focus:border-pink-400/40"
                    />
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h2 className="text-base font-medium">
                          Publicação
                        </h2>

                        <p className="mt-1 text-xs text-gray-600">
                          Salve como rascunho, publique agora ou escolha uma data para liberar o capítulo.
                        </p>
                      </div>

                      <select
                        value={
                          chapterStatus
                        }
                        onChange={(event) => {
                          const nextStatus =
                            event.target
                              .value as Chapter['publication_status'];

                          setChapterStatus(
                            nextStatus
                          );

                          if (
                            nextStatus !==
                            'scheduled'
                          ) {
                            setScheduledFor(
                              ''
                            );
                          }
                        }}
                        className="rounded-xl border border-white/10 bg-[#110e12] px-4 py-3 text-sm text-white outline-none focus:border-pink-400/40"
                      >
                        <option value="draft">
                          Rascunho privado
                        </option>

                        <option value="published">
                          Publicar agora
                        </option>

                        <option value="scheduled">
                          Agendar publicação
                        </option>

                        <option value="unpublished">
                          Retirar do ar
                        </option>
                      </select>
                    </div>

                    {chapterStatus ===
                      'scheduled' && (
                      <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-500/[0.05] p-4">
                        <label className="mb-2 block text-sm text-violet-200">
                          Data e horário da publicação
                        </label>

                        <input
                          type="datetime-local"
                          value={
                            scheduledFor
                          }
                          onChange={
                            handleScheduleChange
                          }
                          min={getLocalDateTimeInputMin()}
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40"
                        />

                        <p className="mt-2 text-xs text-violet-200/50">
                          O capítulo ficará privado até a data escolhida.
                        </p>
                      </div>
                    )}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          void saveChapter(
                            'draft'
                          )
                        }
                        disabled={
                          savingChapter ||
                          mediaUploading
                        }
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-gray-300 hover:bg-white/[0.08] hover:text-white disabled:opacity-50 transition"
                      >
                        {savingChapter
                          ? 'Salvando...'
                          : 'Salvar rascunho'}
                      </button>

                      <button
                        type="submit"
                        disabled={
                          savingChapter ||
                          mediaUploading
                        }
                        className="rounded-xl bg-pink-500 px-5 py-3 text-sm font-medium text-white hover:bg-pink-400 disabled:opacity-50 transition"
                      >
                        {savingChapter
                          ? 'Salvando...'
                          : chapterStatus ===
                              'scheduled'
                            ? 'Agendar capítulo'
                            : chapterStatus ===
                                'published'
                              ? 'Publicar capítulo'
                              : chapterStatus ===
                                  'unpublished'
                                ? 'Retirar do ar'
                                : 'Salvar capítulo'}
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <h2 className="text-base font-medium">
                      Histórico de publicação
                    </h2>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Criado em
                        </p>

                        <p className="mt-2 text-sm text-gray-300">
                          {formatDate(
                            chapter.created_at
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Publicação original
                        </p>

                        <p className="mt-2 text-sm text-gray-300">
                          {formatDate(
                            chapter.original_published_at
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-gray-600">
                          Republicação
                        </p>

                        <p className="mt-2 text-sm text-gray-300">
                          {formatDate(
                            chapter.republished_at
                          )}
                        </p>
                      </div>
                    </div>
                  </section>
                </form>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
