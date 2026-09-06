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
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug: string | null;
};

type StoryChapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  published: boolean;
  created_at: string;
  scheduled_for?: string | null;
  is_scheduled?: boolean;
};

type Story = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  tags: Tag[];
  chapters: StoryChapter[];
};

type ChapterMedia = {
  id: string;
  chapter_id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  position: number;
  created_at: string;
};

type Chapter = {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  author_notes: string | null;
  original_published_at: string | null;
  republished_at: string | null;
  updated_at: string | null;
  publication_status:
    | 'draft'
    | 'scheduled'
    | 'published'
    | 'unpublished';
};

type ChapterResponse = {
  chapter: Chapter;
  media: ChapterMedia[];
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
    return 'Não disponível';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Não disponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getStatusLabel(
  status: Chapter['publication_status'],
  published: boolean
) {
  if (status === 'scheduled') {
    return 'AGENDADO';
  }

  if (published || status === 'published') {
    return 'PUBLICADO';
  }

  if (status === 'unpublished') {
    return 'RETIRADO';
  }

  return 'RASCUNHO';
}

function getStatusClass(
  status: Chapter['publication_status'],
  published: boolean
) {
  if (status === 'scheduled') {
    return 'border-violet-400/30 bg-violet-500/10 text-violet-200';
  }

  if (published || status === 'published') {
    return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }

  if (status === 'unpublished') {
    return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
  }

  return 'border-white/10 bg-white/[0.04] text-gray-400';
}

function sanitizeHtml(html: string) {
  if (!html) {
    return '';
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
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
            /^javascript:/i.test(value)
          ) {
            element.removeAttribute(attribute.name);
          }
        }
      );
    });

  documentNode
    .querySelectorAll('a')
    .forEach((anchor) => {
      anchor.setAttribute(
        'target',
        '_blank'
      );
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

  const id = params?.id as string;

  const editorRef = useRef<HTMLDivElement | null>(null);
  const mediaInputRef =
    useRef<HTMLInputElement | null>(null);
  const linkInputRef =
    useRef<HTMLInputElement | null>(null);

  const [story, setStory] =
    useState<Story | null>(null);

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

  const [coverFile, setCoverFile] =
    useState<File | null>(null);
  const [coverPreview, setCoverPreview] =
    useState<string | null>(null);

  const [
    selectedChapterId,
    setSelectedChapterId,
  ] = useState<string | null>(
    searchParams.get('chapter')
  );

  const [chapter, setChapter] =
    useState<Chapter | null>(null);

  const [chapterTitle, setChapterTitle] =
    useState('');
  const [chapterBody, setChapterBody] =
    useState('');
  const [authorNotes, setAuthorNotes] =
    useState('');

  const [
    chapterStatus,
    setChapterStatus,
  ] = useState<Chapter['publication_status']>(
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

  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');

  const [linkValue, setLinkValue] =
    useState('');
  const [showLinkBox, setShowLinkBox] =
    useState(false);

  const [mediaUploading, setMediaUploading] =
    useState(false);

  const [showSchedule, setShowSchedule] =
    useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

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
            .map(
              (tag) => tag.name
            )
        );

        const chapters =
          loadedStory.chapters || [];

        if (
          selectedChapterId &&
          chapters.some(
            (item) =>
              item.id ===
              selectedChapterId
          )
        ) {
          return;
        }

        if (chapters.length > 0) {
          setSelectedChapterId(
            chapters[0].id
          );
        }
      } catch (err: unknown) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível carregar a história.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadStory();
  }, [id]);

  useEffect(() => {
    if (!selectedChapterId) {
      setChapter(null);
      setChapterMedia([]);
      return;
    }

    async function loadChapter() {
      try {
        setLoadingChapter(true);
        setError('');
        setSuccess('');

        const response = await fetch(
          `/api/chapters/${selectedChapterId}`,
          {
            cache: 'no-store',
          }
        );

        const data =
          (await response.json()) as
            | (Partial<ChapterResponse> & {
                error?: string;
              })
            | undefined;

        if (
          !response.ok ||
          !data?.chapter
        ) {
          throw new Error(
            data?.error ||
              'Não foi possível carregar o capítulo.'
          );
        }

        const loadedChapter =
          data.chapter;

        setChapter(
          loadedChapter
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

        if (
          loadedChapter.publication_status ===
          'scheduled'
        ) {
          const matchingStoryChapter =
            story?.chapters?.find(
              (item) =>
                item.id ===
                loadedChapter.id
            );

          if (
            matchingStoryChapter?.scheduled_for
          ) {
            const date =
              new Date(
                matchingStoryChapter.scheduled_for
              );

            if (
              !Number.isNaN(
                date.getTime()
              )
            ) {
              setScheduledFor(
                date
                  .toISOString()
                  .slice(0, 16)
              );
            }
          }
        } else {
          setScheduledFor('');
        }

        const loadedMedia =
          data.media || [];

        setChapterMedia(
          loadedMedia.map(
            (media) => ({
              id: media.id,
              url: media.media_url,
              type: media.media_type,
              existing: true,
            })
          )
        );
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

    loadChapter();
  }, [selectedChapterId]);

  useEffect(() => {
    if (
      !editorRef.current ||
      previewMode
    ) {
      return;
    }

    if (
      editorRef.current.innerHTML !==
      chapterBody
    ) {
      editorRef.current.innerHTML =
        chapterBody;
    }
  }, [chapter, previewMode]);

  function selectChapter(
    chapterId: string
  ) {
    if (savingChapter) {
      return;
    }

    setSelectedChapterId(
      chapterId
    );

    setPreviewMode(false);

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.set(
      'chapter',
      chapterId
    );

    router.replace(
      `/editar-historia/${id}?${params.toString()}`
    );
  }

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
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

    setCoverFile(file);

    setCoverPreview(
      URL.createObjectURL(file)
    );

    setError('');
  }

  function addTag() {
    const newTag =
      tagInput.trim();

    if (!newTag) {
      return;
    }

    if (
      newTag.length > 50
    ) {
      setError(
        'Cada tag pode ter no máximo 50 caracteres.'
      );
      return;
    }

    const exists =
      tags.some(
        (tag) =>
          tag.toLowerCase() ===
          newTag.toLowerCase()
      );

    if (exists) {
      setTagInput('');
      return;
    }

    if (
      tags.length >= 30
    ) {
      setError(
        'Você pode adicionar no máximo 30 tags.'
      );
      return;
    }

    setTags(
      (current) => [
        ...current,
        newTag,
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
          (_, i) =>
            i !== index
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
      event.key ===
        'Backspace' &&
      !tagInput &&
      tags.length > 0
    ) {
      removeTag(
        tags.length - 1
      );
    }
  }

  async function handleSaveStory(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    setSavingStory(true);
    setError('');
    setSuccess('');

    try {
      const finalTags = [
        ...tags,
      ];

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
        finalTags.push(
          pendingTag
        );
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
        'Informações da obra salvas.'
      );

      if (data.story) {
        setStory(
          (current) =>
            current
              ? {
                  ...current,
                  ...data.story,
                }
              : current
        );

        if (
          data.story.cover_url
        ) {
          setCoverPreview(
            data.story.cover_url
          );
        }

        setCoverFile(null);
      }
    } catch (err: unknown) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as alterações.'
      );
    } finally {
      setSavingStory(false);
    }
  }

  function syncEditorBody() {
    if (!editorRef.current) {
      return chapterBody;
    }

    const html =
      editorRef.current.innerHTML;

    setChapterBody(html);

    return html;
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function executeCommand(
    command: string,
    value?: string
  ) {
    focusEditor();

    document.execCommand(
      command,
      false,
      value
    );

    syncEditorBody();
  }

  function addLink() {
    focusEditor();

    const url =
      linkValue.trim();

    if (!url) {
      setError(
        'Digite o endereço do link.'
      );
      return;
    }

    let normalizedUrl = url;

    if (
      !/^https?:\/\//i.test(
        normalizedUrl
      )
    ) {
      normalizedUrl =
        `https://${normalizedUrl}`;
    }

    document.execCommand(
      'createLink',
      false,
      normalizedUrl
    );

    syncEditorBody();

    setLinkValue('');
    setShowLinkBox(false);
    setError('');
  }

  function createPendingMediaMarker(
    media: EditorMedia
  ) {
    const wrapper =
      document.createElement(
        'span'
      );

    wrapper.setAttribute(
      'data-pending-media',
      media.id
    );

    wrapper.setAttribute(
      'data-media-type',
      media.type
    );

    wrapper.contentEditable =
      'false';

    wrapper.className =
      'chapter-media-placeholder';

    const image =
      document.createElement(
        'img'
      );

    image.src = media.url;
    image.alt =
      'Mídia adicionada ao capítulo';

    const label =
      document.createElement(
        'span'
      );

    label.textContent =
      media.type === 'gif'
        ? 'GIF adicionado'
        : 'Imagem adicionada';

    wrapper.appendChild(
      image
    );

    wrapper.appendChild(
      label
    );

    return wrapper;
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

    editorRef.current.focus();

    const selection =
      window.getSelection();

    let range: Range | null =
      null;

    if (
      selection &&
      selection.rangeCount > 0
    ) {
      const possibleRange =
        selection.getRangeAt(0);

      if (
        editorRef.current.contains(
          possibleRange.commonAncestorContainer
        )
      ) {
        range =
          possibleRange.cloneRange();
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
      (media) => {
        const marker =
          createPendingMediaMarker(
            media
          );

        fragment.appendChild(
          marker
        );

        const paragraph =
          document.createElement(
            'p'
          );

        paragraph.innerHTML =
          '<br>';

        fragment.appendChild(
          paragraph
        );
      }
    );

    range.insertNode(
      fragment
    );

    if (selection) {
      selection.removeAllRanges();

      const finalRange =
        document.createRange();

      finalRange.selectNodeContents(
        editorRef.current
      );

      finalRange.collapse(false);

      selection.addRange(
        finalRange
      );
    }

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

    const currentCount =
      chapterMedia.length;

    if (
      currentCount +
        files.length >
      MAX_MEDIA
    ) {
      setError(
        `Um capítulo pode ter no máximo ${MAX_MEDIA} imagens ou GIFs.`
      );

      event.target.value = '';
      return;
    }

    const validFiles: File[] =
      [];

    for (
      const file of files
    ) {
      if (
        !ALLOWED_MEDIA_TYPES.includes(
          file.type
        )
      ) {
        setError(
          `O arquivo "${file.name}" não é JPG, PNG, WEBP ou GIF.`
        );
        continue;
      }

      if (
        file.size >
        MAX_MEDIA_SIZE
      ) {
        setError(
          `O arquivo "${file.name}" ultrapassa o limite de 5 MB.`
        );
        continue;
      }

      validFiles.push(
        file
      );
    }

    if (
      validFiles.length === 0
    ) {
      event.target.value = '';
      return;
    }

    const timestamp =
      Date.now();

    const newMedia =
      validFiles.map(
        (file, index) => ({
          id: `pending-${timestamp}-${index}`,
          url: URL.createObjectURL(
            file
          ),
          type:
            file.type ===
            'image/gif'
              ? ('gif' as const)
              : ('image' as const),
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

    setTimeout(() => {
      insertPendingMediaBatch(
        newMedia
      );
    }, 0);

    setError('');
    event.target.value = '';
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
      media.url.startsWith(
        'blob:'
      )
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
      const pending =
        editorRef.current.querySelector(
          `[data-pending-media="${CSS.escape(
            mediaId
          )}"]`
        );

      pending?.remove();

      const existing =
        editorRef.current.querySelector(
          `[data-media-id="${CSS.escape(
            mediaId
          )}"]`
        );

      existing?.remove();

      syncEditorBody();
    }
  }

  function replacePendingMediaWithRealUrls(
    html: string,
    pendingMedia: EditorMedia[],
    uploaded: ChapterMedia[]
  ) {
    if (
      !html ||
      pendingMedia.length === 0 ||
      uploaded.length === 0
    ) {
      return html;
    }

    const parser =
      new DOMParser();

    const documentNode =
      parser.parseFromString(
        html,
        'text/html'
      );

    const uploadedByPendingId =
      new Map<string, ChapterMedia>();

    pendingMedia.forEach(
      (pending, index) => {
        const uploadedMedia =
          uploaded[index];

        if (uploadedMedia) {
          uploadedByPendingId.set(
            pending.id,
            uploadedMedia
          );
        }
      }
    );

    documentNode
      .querySelectorAll(
        '[data-pending-media]'
      )
      .forEach(
        (element) => {
          const pendingId =
            element.getAttribute(
              'data-pending-media'
            );

          if (!pendingId) {
            return;
          }

          const uploadedMedia =
            uploadedByPendingId.get(
              pendingId
            );

          if (!uploadedMedia) {
            return;
          }

          const image =
            documentNode.createElement(
              'img'
            );

          image.src =
            uploadedMedia.media_url;

          image.alt =
            'Imagem do capítulo';

          image.setAttribute(
            'data-media-id',
            uploadedMedia.id
          );

          element.replaceWith(
            image
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
      setShowSchedule(true);

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

    const plainText =
      body
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
      !body ||
      body === '<br>' ||
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

    try {
      setSavingChapter(true);
      setError('');
      setSuccess('');

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

      let workingBody =
        body;

      let finalMediaIds =
        existing.map(
          (media) =>
            media.id
        );

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
          await uploadResponse.json();

        if (
          !uploadResponse.ok
        ) {
          throw new Error(
            uploadResult?.error ||
              'Não foi possível enviar as mídias.'
          );
        }

        const returnedMedia =
          (uploadResult.media ||
            []) as ChapterMedia[];

        const newMedia =
          returnedMedia.filter(
            (media) =>
              !existing.some(
                (item) =>
                  item.id ===
                  media.id
              )
          );

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
            (media) => ({
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
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            'Não foi possível salvar o capítulo.'
        );
      }

      const savedChapter =
        data.chapter as Chapter;

      setChapter(
        savedChapter
      );

      setChapterStatus(
        savedChapter.publication_status
      );

      setChapterBody(
        savedChapter.body ||
          workingBody
      );

      if (
        data.media
      ) {
        setChapterMedia(
          (
            data.media as ChapterMedia[]
          ).map(
            (media) => ({
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
                            scheduled_for:
                              data.scheduled_for ||
                              null,
                            is_scheduled:
                              Boolean(
                                data.scheduled
                              ),
                          }
                        : item
                  ),
              }
            : current
      );

      setChapterStatus(
        savedChapter.publication_status
      );
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
    }
  }

  function handleEditorInput() {
    if (!editorRef.current) {
      return;
    }

    setChapterBody(
      editorRef.current.innerHTML
    );
  }

  function handleEditorPaste(
    event: React.ClipboardEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const text =
      event.clipboardData.getData(
        'text/plain'
      );

    document.execCommand(
      'insertText',
      false,
      text
    );

    syncEditorBody();
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

      saveChapter('draft');
    }
  }

  function handleChapterFormSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    saveChapter(
      chapterStatus
    );
  }

  function addHorizontalRule() {
    focusEditor();

    document.execCommand(
      'insertHorizontalRule',
      false
    );

    syncEditorBody();
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

    setShowSchedule(true);
  }

  function openMediaPicker() {
    mediaInputRef.current?.click();
  }

  function handleMediaButtonClick(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    openMediaPicker();
  }

  function formatDateForInput(
    value: string | null
  ) {
    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return date
      .toISOString()
      .slice(0, 16);
  }

  function clearChapterSelection() {
    setSelectedChapterId(null);
    setChapter(null);
    setPreviewMode(false);
    setChapterMedia([]);

    const params =
      new URLSearchParams(
        searchParams.toString()
      );

    params.delete(
      'chapter'
    );

    const query =
      params.toString();

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
                                  : item.published
                                    ? 'published'
                                    : 'draft',
                                item.published
                              )}`}
                            >
                              {item.is_scheduled
                                ? 'AGENDADO'
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
                                : item.published
                                  ? 'published'
                                  : 'draft',
                              item.published
                            )}`}
                          >
                            {item.is_scheduled
                              ? 'AGENDADO'
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
                          saveChapter(
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
                          saveChapter(
                            'published'
                          )
                        }
                        disabled={
                          savingChapter ||
                          mediaUploading
                        }
                        className="rounded-xl bg-pink-500 px-4 py-2.5 text-sm font-medium hover:bg-pink-400 disabled:opacity-50 transition"
                      >
                        Publicar
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              ) =>
                                event.preventDefault()
                              }
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
                              /
                              {
                                MAX_MEDIA
                              }{' '}
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
                                  }}
                                  placeholder="https://exemplo.com"
                                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-pink-400/40"
                                />

                                <button
                                  type="button"
                                  onMouseDown={(
                                    event
                                  ) =>
                                    event.preventDefault()
                                  }
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
                          /
                          {
                            MAX_MEDIA
                          }
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {chapterMedia.map(
                          (media) => (
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
                        onChange={(event) =>
                          setChapterStatus(
                            event.target
                              .value as Chapter['publication_status']
                          )
                        }
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
                            scheduledFor ||
                            ''
                          }
                          onChange={
                            handleScheduleChange
                          }
                          min={new Date()
                            .toISOString()
                            .slice(
                              0,
                              16
                            )}
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
                          saveChapter(
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
