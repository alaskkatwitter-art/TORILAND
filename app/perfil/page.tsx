'use client';

import {
  ChangeEvent,
  TouchEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme_color: string | null;
};

type Story = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  created_at: string;
  updated_at: string;
};

type NookPost = {
  id: string;
  user_id: string;
  body: string;
  image_url: string | null;
  story_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  media?: PostMedia[];
};

type PostMedia = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  position: number;
  created_at?: string;
};

type NookComment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type ReactionSummary = {
  counts: Record<string, number>;
  user_reactions: string[];
  comments_count: number;
};

type ProfileTab = 'stories' | 'nook';

const REACTIONS = [
  '❤️',
  '😂',
  '😭',
  '😱',
  '👀',
  '🔥',
];

const MAX_MEDIA = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function PerfilPage() {
  const router = useRouter();

  const avatarInputRef =
    useRef<HTMLInputElement | null>(null);

  const coverInputRef =
    useRef<HTMLInputElement | null>(null);

  const mediaInputRef =
    useRef<HTMLInputElement | null>(null);

  const tabsContainerRef =
    useRef<HTMLDivElement | null>(null);

  const swipeStartX =
    useRef<number | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [stories, setStories] =
    useState<Story[]>([]);

  const [nookPosts, setNookPosts] =
    useState<NookPost[]>([]);

  const [activeTab, setActiveTab] =
    useState<ProfileTab>('stories');

  const [loading, setLoading] =
    useState(true);

  const [loadingStories, setLoadingStories] =
    useState(true);

  const [loadingNook, setLoadingNook] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

  const [editDisplayName, setEditDisplayName] =
    useState('');

  const [bio, setBio] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  /* =========================
     NOVO POST
  ========================= */

  const [newPost, setNewPost] =
    useState('');

  const [selectedStoryId, setSelectedStoryId] =
    useState('');

  const [creatingPost, setCreatingPost] =
    useState(false);

  const [mediaFiles, setMediaFiles] =
    useState<File[]>([]);

  const [mediaPreviews, setMediaPreviews] =
    useState<string[]>([]);

  /* =========================
     EDIÇÃO DE POST
  ========================= */

  const [editingNookPostId, setEditingNookPostId] =
    useState<string | null>(null);

  const [editNookBody, setEditNookBody] =
    useState('');

  const [editNookStoryId, setEditNookStoryId] =
    useState('');

  const [savingNookPost, setSavingNookPost] =
    useState(false);

  const [deletingNookPostId, setDeletingNookPostId] =
    useState<string | null>(null);

  const [menuOpenPostId, setMenuOpenPostId] =
    useState<string | null>(null);

  /* =========================
     SOCIAL
  ========================= */

  const [reactionData, setReactionData] =
    useState<Record<string, ReactionSummary>>(
      {}
    );

  const [commentsByPost, setCommentsByPost] =
    useState<Record<string, NookComment[]>>(
      {}
    );

  const [commentsOpen, setCommentsOpen] =
    useState<Record<string, boolean>>({});

  const [loadingComments, setLoadingComments] =
    useState<Record<string, boolean>>({});

  const [commentDrafts, setCommentDrafts] =
    useState<Record<string, string>>({});

  const [replyDrafts, setReplyDrafts] =
    useState<Record<string, string>>({});

  const [replyingTo, setReplyingTo] =
    useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] =
    useState<string | null>(null);

  const [editingCommentBody, setEditingCommentBody] =
    useState('');

  const [savingComment, setSavingComment] =
    useState(false);

  const [deletingCommentId, setDeletingCommentId] =
    useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  /* =========================
     CARREGAR USUÁRIO
  ========================= */

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(
          '/api/auth/me',
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();

        if (
          data.authenticated &&
          data.user
        ) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  /* =========================
     CARREGAR HISTÓRIAS
  ========================= */

  useEffect(() => {
    async function loadStories() {
      setLoadingStories(true);

      try {
        const response = await fetch(
          '/api/profile/stories',
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            'Erro ao carregar histórias:',
            data.error,
            data.details
          );

          setStories([]);
          return;
        }

        setStories(
          Array.isArray(data.stories)
            ? data.stories
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar histórias:',
          error
        );

        setStories([]);
      } finally {
        setLoadingStories(false);
      }
    }

    loadStories();
  }, []);

  /* =========================
     CARREGAR MURAL
  ========================= */

  useEffect(() => {
    async function loadNookPosts() {
      setLoadingNook(true);

      try {
        const response = await fetch(
          '/api/nook-posts',
          {
            cache: 'no-store',
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(
            'Erro ao carregar posts:',
            data.error,
            data.details
          );

          setNookPosts([]);
          return;
        }

        const posts: NookPost[] =
          Array.isArray(data.posts)
            ? data.posts
            : [];

        setNookPosts(
          sortNookPosts(posts)
        );

        await loadReactionSummaries(posts);
      } catch (error) {
        console.error(
          'Erro ao carregar Mural:',
          error
        );

        setNookPosts([]);
      } finally {
        setLoadingNook(false);
      }
    }

    loadNookPosts();
  }, []);

  /* =========================
     REAÇÕES
  ========================= */

  async function loadReactionSummary(
    postId: string
  ) {
    try {
      const response = await fetch(
        `/api/nook-posts/reactions?post_id=${encodeURIComponent(
          postId
        )}`,
        {
          cache: 'no-store',
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setReactionData((current) => ({
        ...current,
        [postId]: {
          counts:
            data.counts || emptyReactionCounts(),
          user_reactions:
            data.user_reactions || [],
          comments_count:
            data.comments_count || 0,
        },
      }));
    } catch {
      // Silencioso para não quebrar o Mural.
    }
  }

  async function loadReactionSummaries(
    posts: NookPost[]
  ) {
    const results =
      await Promise.all(
        posts.map(async (post) => {
          try {
            const response = await fetch(
              `/api/nook-posts/reactions?post_id=${encodeURIComponent(
                post.id
              )}`,
              {
                cache: 'no-store',
              }
            );

            if (!response.ok) {
              return null;
            }

            const data =
              await response.json();

            return {
              postId: post.id,
              summary: {
                counts:
                  data.counts ||
                  emptyReactionCounts(),
                user_reactions:
                  data.user_reactions || [],
                comments_count:
                  data.comments_count || 0,
              },
            };
          } catch {
            return null;
          }
        })
      );

    const summaries: Record<
      string,
      ReactionSummary
    > = {};

    for (const result of results) {
      if (result) {
        summaries[result.postId] =
          result.summary;
      }
    }

    setReactionData(summaries);
  }

  function emptyReactionCounts() {
    return REACTIONS.reduce(
      (result, emoji) => {
        result[emoji] = 0;
        return result;
      },
      {} as Record<string, number>
    );
  }

  async function handleReaction(
    postId: string,
    emoji: string
  ) {
    const current =
      reactionData[postId] || {
        counts: emptyReactionCounts(),
        user_reactions: [],
        comments_count: 0,
      };

    const reacted =
      current.user_reactions.includes(
        emoji
      );

    setReactionData((previous) => ({
      ...previous,
      [postId]: {
        ...current,
        counts: {
          ...current.counts,
          [emoji]: Math.max(
            0,
            (current.counts[emoji] || 0) +
              (reacted ? -1 : 1)
          ),
        },
        user_reactions: reacted
          ? current.user_reactions.filter(
              (item) => item !== emoji
            )
          : [
              ...current.user_reactions,
              emoji,
            ],
      },
    }));

    try {
      const response = await fetch(
        '/api/nook-posts/reactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_id: postId,
            emoji,
          }),
        }
      );

      if (!response.ok) {
        await loadReactionSummary(postId);
      }
    } catch {
      await loadReactionSummary(postId);
    }
  }

  /* =========================
     COMENTÁRIOS
  ========================= */

  async function loadComments(
    postId: string
  ) {
    setLoadingComments((current) => ({
      ...current,
      [postId]: true,
    }));

    try {
      const response = await fetch(
        `/api/nook-posts/comments?post_id=${encodeURIComponent(
          postId
        )}`,
        {
          cache: 'no-store',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível carregar os comentários.'
        );
        return;
      }

      const comments: NookComment[] =
        Array.isArray(data.comments)
          ? data.comments
          : [];

      setCommentsByPost((current) => ({
        ...current,
        [postId]: comments,
      }));

      setReactionData((current) => ({
        ...current,
        [postId]: {
          ...(current[postId] || {
            counts: emptyReactionCounts(),
            user_reactions: [],
            comments_count: 0,
          }),
          comments_count: comments.length,
        },
      }));
    } catch {
      setError(
        'Não foi possível carregar os comentários.'
      );
    } finally {
      setLoadingComments((current) => ({
        ...current,
        [postId]: false,
      }));
    }
  }

  async function toggleComments(
    postId: string
  ) {
    const isOpen =
      commentsOpen[postId] || false;

    setCommentsOpen((current) => ({
      ...current,
      [postId]: !isOpen,
    }));

    if (
      !isOpen &&
      !commentsByPost[postId]
    ) {
      await loadComments(postId);
    }
  }

  async function handleCreateComment(
    postId: string,
    parentId?: string | null
  ) {
    const value = parentId
      ? (
          replyDrafts[parentId] || ''
        ).trim()
      : (
          commentDrafts[postId] || ''
        ).trim();

    if (!value) return;

    if (value.length > 2000) {
      setError(
        'O comentário pode ter no máximo 2000 caracteres.'
      );
      return;
    }

    setSavingComment(true);
    setError('');

    try {
      const response = await fetch(
        '/api/nook-posts/comments',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            post_id: postId,
            content: value,
            parent_id:
              parentId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível publicar o comentário.'
        );
        return;
      }

      if (parentId) {
        setReplyDrafts((current) => ({
          ...current,
          [parentId]: '',
        }));

        setReplyingTo(null);
      } else {
        setCommentDrafts((current) => ({
          ...current,
          [postId]: '',
        }));
      }

      await loadComments(postId);
    } catch {
      setError(
        'Não foi possível publicar o comentário.'
      );
    } finally {
      setSavingComment(false);
    }
  }

  function startEditComment(
    comment: NookComment
  ) {
    setEditingCommentId(comment.id);
    setEditingCommentBody(
      comment.content
    );
    setError('');
  }

  function cancelEditComment() {
    if (savingComment) return;

    setEditingCommentId(null);
    setEditingCommentBody('');
  }

  async function handleSaveComment() {
    if (!editingCommentId) return;

    const content =
      editingCommentBody.trim();

    if (!content) {
      setError(
        'O comentário não pode ficar vazio.'
      );
      return;
    }

    if (content.length > 2000) {
      setError(
        'O comentário pode ter no máximo 2000 caracteres.'
      );
      return;
    }

    setSavingComment(true);
    setError('');

    try {
      const response = await fetch(
        `/api/nook-posts/comments/${editingCommentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            content,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível editar o comentário.'
        );
        return;
      }

      const comment =
        data.comment;

      if (comment?.post_id) {
        await loadComments(
          comment.post_id
        );
      } else {
        for (const post of nookPosts) {
          if (
            commentsByPost[post.id]?.some(
              (item) =>
                item.id ===
                editingCommentId
            )
          ) {
            await loadComments(post.id);
            break;
          }
        }
      }

      setEditingCommentId(null);
      setEditingCommentBody('');
    } catch {
      setError(
        'Não foi possível editar o comentário.'
      );
    } finally {
      setSavingComment(false);
    }
  }

  async function handleDeleteComment(
    comment: NookComment
  ) {
    setDeletingCommentId(comment.id);
    setError('');

    try {
      const response = await fetch(
        `/api/nook-posts/comments/${comment.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível excluir o comentário.'
        );
        return;
      }

      await loadComments(
        comment.post_id
      );
    } catch {
      setError(
        'Não foi possível excluir o comentário.'
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  /* =========================
     ORDENAÇÃO
  ========================= */

  function sortNookPosts(
    posts: NookPost[]
  ) {
    return [...posts].sort(
      (a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1;
        }

        return (
          new Date(
            b.created_at
          ).getTime() -
          new Date(
            a.created_at
          ).getTime()
        );
      }
    );
  }

  /* =========================
     ABAS
  ========================= */

  function changeTab(
    tab: ProfileTab
  ) {
    setActiveTab(tab);

    requestAnimationFrame(() => {
      const container =
        tabsContainerRef.current;

      if (!container) return;

      container.scrollTo({
        left:
          tab === 'stories'
            ? 0
            : container.clientWidth,
        behavior: 'smooth',
      });
    });
  }

  function handleTabSwipeStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    swipeStartX.current =
      event.touches[0]?.clientX ??
      null;
  }

  function handleTabSwipeEnd(
    event: TouchEvent<HTMLDivElement>
  ) {
    if (
      swipeStartX.current === null
    ) {
      return;
    }

    const endX =
      event.changedTouches[0]
        ?.clientX ?? null;

    if (endX === null) {
      swipeStartX.current = null;
      return;
    }

    const distance =
      endX - swipeStartX.current;

    swipeStartX.current = null;

    if (Math.abs(distance) < 50) {
      return;
    }

    if (distance < 0) {
      changeTab('nook');
    } else {
      changeTab('stories');
    }
  }

  /* =========================
     EDITOR DE PERFIL
  ========================= */

  function openEditor() {
    if (!user) return;

    setEditDisplayName(
      user.display_name || ''
    );

    setBio(user.bio || '');
    setError('');
    setSuccess('');
    setEditing(true);
  }

  function closeEditor() {
    if (saving) return;

    setEditing(false);
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        '/api/profile/update',
        {
          method: 'PATCH',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            display_name:
              editDisplayName,
            bio,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível salvar as alterações.'
        );
        return;
      }

      setUser(data.user);

      setSuccess(
        'Perfil atualizado com sucesso.'
      );

      setTimeout(() => {
        setEditing(false);
        setSuccess('');
      }, 900);
    } catch {
      setError(
        'Não foi possível salvar as alterações. Tente novamente.'
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================
     AVATAR
  ========================= */

  function openAvatarPicker() {
    if (uploadingAvatar) return;

    setError('');
    setSuccess('');

    avatarInputRef.current?.click();
  }

  async function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    try {
      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/profile/avatar',
          {
            method: 'POST',
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível atualizar sua foto de perfil.'
        );
        return;
      }

      setUser(
        (currentUser) =>
          currentUser
            ? {
                ...currentUser,
                avatar_url:
                  data.avatar_url,
              }
            : currentUser
      );

      setSuccess(
        'Foto de perfil atualizada.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível enviar a foto. Tente novamente.'
      );
    } finally {
      setUploadingAvatar(false);

      if (
        avatarInputRef.current
      ) {
        avatarInputRef.current.value =
          '';
      }
    }
  }

  /* =========================
     CAPA
  ========================= */

  function openCoverPicker() {
    if (uploadingCover) return;

    setError('');
    setSuccess('');

    coverInputRef.current?.click();
  }

  async function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setUploadingCover(true);
    setError('');
    setSuccess('');

    try {
      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      const response =
        await fetch(
          '/api/profile/cover',
          {
            method: 'POST',
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível atualizar sua capa.'
        );
        return;
      }

      setUser(
        (currentUser) =>
          currentUser
            ? {
                ...currentUser,
                cover_url:
                  data.cover_url,
              }
            : currentUser
      );

      setSuccess(
        'Capa atualizada com sucesso.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível enviar a capa. Tente novamente.'
      );
    } finally {
      setUploadingCover(false);

      if (
        coverInputRef.current
      ) {
        coverInputRef.current.value =
          '';
      }
    }
  }

  /* =========================
     MÍDIAS DO POST
  ========================= */

  function handleMediaSelection(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected =
      Array.from(
        event.target.files || []
      );

    if (!selected.length) return;

    setError('');

    const validFiles: File[] = [];

    for (const file of selected) {
      if (
        ![
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ].includes(file.type)
      ) {
        setError(
          'Use apenas JPG, PNG, WEBP ou GIF.'
        );
        continue;
      }

      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        setError(
          'Cada imagem pode ter no máximo 10 MB.'
        );
        continue;
      }

      validFiles.push(file);
    }

    setMediaFiles(
      (current) => {
        const combined = [
          ...current,
          ...validFiles,
        ];

        return combined.slice(
          0,
          MAX_MEDIA
        );
      }
    );

    if (
      mediaInputRef.current
    ) {
      mediaInputRef.current.value =
        '';
    }
  }

  function removeMedia(
    index: number
  ) {
    setMediaFiles(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );

    setMediaPreviews(
      (current) =>
        current.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  }

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

  async function uploadPostMedia(
    postId: string
  ) {
    const uploaded: PostMedia[] = [];

    for (
      let index = 0;
      index < mediaFiles.length;
      index++
    ) {
      const file =
        mediaFiles[index];

      const formData =
        new FormData();

      formData.append(
        'file',
        file
      );

      formData.append(
        'post_id',
        postId
      );

      formData.append(
        'position',
        String(index)
      );

      const response =
        await fetch(
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
        uploaded.push(
          data.media
        );
      }
    }

    return uploaded;
  }

  /* =========================
     CRIAR POST
  ========================= */

  async function handleCreateNookPost() {
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
        'O post pode ter no máximo 5000 caracteres.'
      );
      return;
    }

    setCreatingPost(true);
    setError('');
    setSuccess('');

    try {
      const response =
        await fetch(
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
                selectedStoryId ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível publicar o post.'
        );
        return;
      }

      let createdPost =
        data.post as NookPost;

      if (mediaFiles.length > 0) {
        try {
          const uploaded =
            await uploadPostMedia(
              createdPost.id
            );

          createdPost = {
            ...createdPost,
            media: uploaded,
          };
        } catch (mediaError) {
          console.error(
            mediaError
          );

          setError(
            'O post foi criado, mas não foi possível enviar todas as mídias.'
          );
        }
      }

      setNookPosts(
        (currentPosts) =>
          sortNookPosts([
            createdPost,
            ...currentPosts,
          ])
      );

      setReactionData(
        (current) => ({
          ...current,
          [createdPost.id]: {
            counts:
              emptyReactionCounts(),
            user_reactions: [],
            comments_count: 0,
          },
        })
      );

      setNewPost('');
      setSelectedStoryId('');
      setMediaFiles([]);
      setMediaPreviews([]);

      setSuccess(
        'Post publicado no seu Nook!'
      );

      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 2500);
    } catch (error) {
      console.error(error);

      setError(
        'Não foi possível publicar o post. Tente novamente.'
      );
    } finally {
      setCreatingPost(false);
    }
  }

  /* =========================
     HISTÓRIA DO POST
  ========================= */

  function getStoryTitle(
    storyId: string | null
  ) {
    if (!storyId) return null;

    const story =
      stories.find(
        (item) =>
          item.id === storyId
      );

    return story?.title || null;
  }

  /* =========================
     EDITAR POST
  ========================= */

  function startEditNookPost(
    post: NookPost
  ) {
    setEditingNookPostId(
      post.id
    );

    setEditNookBody(
      post.body
    );

    setEditNookStoryId(
      post.story_id || ''
    );

    setMenuOpenPostId(null);
    setError('');
    setSuccess('');
  }

  function cancelEditNookPost() {
    if (savingNookPost) return;

    setEditingNookPostId(null);
    setEditNookBody('');
    setEditNookStoryId('');
  }

  async function handleSaveNookPostEdit() {
    if (!editingNookPostId) {
      return;
    }

    const post =
      nookPosts.find(
        (item) =>
          item.id ===
          editingNookPostId
      );

    const text =
      editNookBody.trim();

    if (
      !text &&
      !post?.image_url &&
      !(post?.media?.length)
    ) {
      setError(
        'O post não pode ficar vazio.'
      );
      return;
    }

    if (text.length > 5000) {
      setError(
        'O post pode ter no máximo 5000 caracteres.'
      );
      return;
    }

    setSavingNookPost(true);
    setError('');
    setSuccess('');

    try {
      const response =
        await fetch(
          `/api/nook-posts/${editingNookPostId}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              body: text,
              story_id:
                editNookStoryId ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível editar o post.'
        );
        return;
      }

      if (data.post) {
        setNookPosts(
          (currentPosts) =>
            sortNookPosts(
              currentPosts.map(
                (currentPost) =>
                  currentPost.id ===
                  data.post.id
                    ? {
                        ...data.post,
                        media:
                          currentPost.media,
                      }
                    : currentPost
              )
            )
        );
      }

      setEditingNookPostId(null);
      setEditNookBody('');
      setEditNookStoryId('');

      setSuccess(
        'Post atualizado com sucesso.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível editar o post. Tente novamente.'
      );
    } finally {
      setSavingNookPost(false);
    }
  }

  /* =========================
     FIXAR
  ========================= */

  async function handleTogglePinNookPost(
    post: NookPost
  ) {
    setMenuOpenPostId(null);
    setError('');
    setSuccess('');

    try {
      const response =
        await fetch(
          `/api/nook-posts/${post.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              pinned:
                !post.pinned,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível alterar o post.'
        );
        return;
      }

      if (data.post) {
        setNookPosts(
          (currentPosts) =>
            sortNookPosts(
              currentPosts.map(
                (currentPost) =>
                  currentPost.id ===
                  data.post.id
                    ? {
                        ...data.post,
                        media:
                          currentPost.media,
                      }
                    : currentPost
              )
            )
        );
      }

      setSuccess(
        post.pinned
          ? 'Post desafixado.'
          : 'Post fixado no seu Nook.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível alterar o post. Tente novamente.'
      );
    }
  }

  /* =========================
     EXCLUIR POST
  ========================= */

  async function handleDeleteNookPost(
    postId: string
  ) {
    setMenuOpenPostId(null);

    setDeletingNookPostId(
      postId
    );

    setError('');
    setSuccess('');

    try {
      const response =
        await fetch(
          `/api/nook-posts/${postId}`,
          {
            method: 'DELETE',
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível excluir o post.'
        );
        return;
      }

      setNookPosts(
        (currentPosts) =>
          currentPosts.filter(
            (post) =>
              post.id !== postId
          )
      );

      setReactionData(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[postId];

          return copy;
        }
      );

      setCommentsByPost(
        (current) => {
          const copy = {
            ...current,
          };

          delete copy[postId];

          return copy;
        }
      );

      setSuccess(
        'Post excluído com sucesso.'
      );

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível excluir o post. Tente novamente.'
      );
    } finally {
      setDeletingNookPostId(
        null
      );
    }
  }

  /* =========================
     RENDER DE MÍDIAS
  ========================= */

  function renderPostMedia(
    post: NookPost
  ) {
    const media =
      post.media &&
      post.media.length > 0
        ? [...post.media].sort(
            (a, b) =>
              a.position -
              b.position
          )
        : post.image_url
        ? [
            {
              id: `legacy-${post.id}`,
              post_id: post.id,
              media_url:
                post.image_url,
              media_type:
                'image' as const,
              position: 0,
            },
          ]
        : [];

    if (!media.length) {
      return null;
    }

    const count =
      Math.min(
        media.length,
        4
      );

    return (
      <div
        className={`mt-4 overflow-hidden rounded-2xl ${
          count === 1
            ? ''
            : 'grid gap-1'
        } ${
          count === 2
            ? 'grid-cols-2'
            : ''
        } ${
          count === 3
            ? 'grid-cols-2'
            : ''
        } ${
          count === 4
            ? 'grid-cols-2'
            : ''
        }`}
      >
        {media
          .slice(0, 4)
          .map(
            (item, index) => (
              <div
                key={item.id}
                className={`relative overflow-hidden bg-[#191219] ${
                  count === 1
                    ? 'max-h-[600px]'
                    : count === 3 &&
                      index === 0
                    ? 'row-span-2 aspect-square'
                    : 'aspect-square'
                }`}
              >
                <img
                  src={
                    item.media_url
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            )
          )}
      </div>
    );
  }

  /* =========================
     COMENTÁRIO RECURSIVO
  ========================= */

  function renderComment(
    comment: NookComment,
    allComments: NookComment[],
    depth = 0
  ): ReactNode {
    const replies =
      allComments.filter(
        (item) =>
          item.parent_id ===
          comment.id
      );

    const isOwn =
      comment.author_id ===
      user?.id;

    const author =
      comment.author;

    const authorName =
      author?.display_name ||
      author?.username ||
      'Escritor';

    const isEditing =
      editingCommentId ===
      comment.id;

    return (
      <div
        key={comment.id}
        className={`${
          depth > 0
            ? 'ml-5 border-l border-white/5 pl-4 sm:ml-8'
            : ''
        }`}
      >
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff78b9] text-xs font-black text-[#180d15]">
            {author?.avatar_url ? (
              <img
                src={
                  author.avatar_url
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              authorName
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="rounded-2xl bg-[#191219] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-white/80">
                  {authorName}
                </span>

                {isOwn &&
                  !isEditing && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEditComment(
                            comment
                          )
                        }
                        className="text-[10px] font-semibold text-white/30 transition hover:text-[#ff78b9]"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteComment(
                            comment
                          )
                        }
                        disabled={
                          deletingCommentId ===
                          comment.id
                        }
                        className="text-[10px] font-semibold text-red-300/50 transition hover:text-red-300 disabled:opacity-30"
                      >
                        {deletingCommentId ===
                        comment.id
                          ? '...'
                          : 'Excluir'}
                      </button>
                    </div>
                  )}
              </div>

              {isEditing ? (
                <div className="mt-3">
                  <textarea
                    value={
                      editingCommentBody
                    }
                    onChange={(
                      event
                    ) =>
                      setEditingCommentBody(
                        event.target.value
                      )
                    }
                    maxLength={2000}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#100b12] px-3 py-2 text-xs leading-6 text-white outline-none focus:border-[#ff78b9]/50"
                  />

                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={
                        cancelEditComment
                      }
                      className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-semibold text-white/40"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSaveComment
                      }
                      disabled={
                        savingComment
                      }
                      className="rounded-full bg-[#ff78b9] px-3 py-1.5 text-[10px] font-bold text-[#180d15] disabled:opacity-40"
                    >
                      {savingComment
                        ? 'Salvando...'
                        : 'Salvar'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-6 text-white/65">
                  {comment.content}
                </p>
              )}
            </div>

            {!isEditing && (
              <div className="mt-1.5 flex items-center gap-4 px-2">
                <span className="text-[10px] text-white/20">
                  {formatDate(
                    comment.created_at
                  )}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(
                      replyingTo ===
                        comment.id
                        ? null
                        : comment.id
                    )
                  }
                  className="text-[10px] font-semibold text-white/30 transition hover:text-[#ff78b9]"
                >
                  Responder
                </button>
              </div>
            )}

            {replyingTo ===
              comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={
                    replyDrafts[
                      comment.id
                    ] || ''
                  }
                  onChange={(event) =>
                    setReplyDrafts(
                      (current) => ({
                        ...current,
                        [comment.id]:
                          event.target
                            .value,
                      })
                    )
                  }
                  maxLength={2000}
                  placeholder={`Responder ${authorName}...`}
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#191219] px-4 py-2 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#ff78b9]/50"
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      handleCreateComment(
                        comment.post_id,
                        comment.id
                      );
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    handleCreateComment(
                      comment.post_id,
                      comment.id
                    )
                  }
                  disabled={
                    savingComment ||
                    !(
                      replyDrafts[
                        comment.id
                      ] || ''
                    ).trim()
                  }
                  className="rounded-full bg-[#ff78b9] px-4 py-2 text-[10px] font-bold text-[#180d15] disabled:opacity-30"
                >
                  Enviar
                </button>
              </div>
            )}

            {replies.length >
              0 && (
              <div className="mt-3 space-y-3">
                {replies.map(
                  (reply) =>
                    renderComment(
                      reply,
                      allComments,
                      Math.min(
                        depth + 1,
                        4
                      )
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#100b12] text-white">
        <p className="text-sm text-white/40">
          Carregando perfil...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const displayName =
    user.display_name ||
    user.username;

  return (
    <main
      className="min-h-screen bg-[#100b12] text-white"
      onClick={() => {
        if (menuOpenPostId) {
          setMenuOpenPostId(
            null
          );
        }
      }}
    >
      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              router.push('/');
            }}
            className="flex items-center gap-3"
          >
            <CloudLogo />

            <span className="text-xl font-bold tracking-[0.15em] text-[#ff78b9]">
              NOOKLIE
            </span>
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              router.push('/');
            }}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
          >
            Voltar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">
        {/* PERFIL */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#191219]">
          {/* CAPA */}

          <button
            type="button"
            onClick={
              openCoverPicker
            }
            disabled={
              uploadingCover
            }
            className="group relative block h-36 w-full overflow-hidden bg-gradient-to-r from-[#3b1b30] via-[#572544] to-[#241322] sm:h-44 md:h-48"
          >
            {user.cover_url && (
              <img
                src={
                  user.cover_url
                }
                alt="Capa do perfil"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/40" />

            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/60 px-5 py-2.5 text-sm font-bold text-white opacity-0 transition group-hover:opacity-100">
                {uploadingCover
                  ? 'Enviando...'
                  : 'Alterar capa'}
              </span>
            </div>
          </button>

          <input
            ref={
              coverInputRef
            }
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={
              handleCoverChange
            }
            className="hidden"
          />

          {/* DADOS */}

          <div className="relative px-5 pb-7 sm:px-7 md:px-10 md:pb-8">
            <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 md:flex-row md:items-end">
              <button
                type="button"
                onClick={
                  openAvatarPicker
                }
                disabled={
                  uploadingAvatar
                }
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#191219] bg-[#ff78b9] text-3xl font-black text-[#180d15] sm:h-28 sm:w-28 sm:text-4xl"
              >
                {user.avatar_url ? (
                  <img
                    src={
                      user.avatar_url
                    }
                    alt={`Foto de perfil de ${displayName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.username
                    .charAt(0)
                    .toUpperCase()
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {uploadingAvatar
                    ? 'Enviando...'
                    : 'Alterar foto'}
                </span>
              </button>

              <input
                ref={
                  avatarInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleAvatarChange
                }
                className="hidden"
              />

              <div className="min-w-0 pb-1">
                <h1 className="break-words text-2xl font-black sm:text-3xl">
                  {displayName}
                </h1>

                <p className="mt-1 text-sm text-[#ff78b9]">
                  @{user.username}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openEditor
                }
                className="rounded-full bg-[#ff78b9] px-6 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110 md:ml-auto md:shrink-0"
              >
                Editar perfil
              </button>
            </div>

            <div className="mt-6 max-w-2xl">
              <p className="text-sm leading-7 text-white/50">
                {user.bio ||
                  'Ainda não há uma bio por aqui.'}
              </p>
            </div>

            {error && (
              <div className="mt-5 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-5 max-w-2xl rounded-2xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm text-green-300">
                {success}
              </div>
            )}

            <div className="mt-7 flex gap-7 border-t border-white/5 pt-5 sm:gap-10">
              <div>
                <p className="text-xl font-black">
                  {stories.length}
                </p>

                <p className="text-xs text-white/35">
                  Histórias
                </p>
              </div>

              <div>
                <p className="text-xl font-black">
                  0
                </p>

                <p className="text-xs text-white/35">
                  Seguidores
                </p>
              </div>

              <div>
                <p className="text-xl font-black">
                  0
                </p>

                <p className="text-xs text-white/35">
                  Seguindo
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ABAS */}

        <section className="mt-6">
          <div className="relative flex border-b border-white/10">
            <button
              type="button"
              onClick={() =>
                changeTab(
                  'stories'
                )
              }
              className={`relative flex-1 py-4 text-sm font-bold transition sm:flex-none sm:px-10 ${
                activeTab ===
                'stories'
                  ? 'text-[#ff78b9]'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              Histórias

              {activeTab ===
                'stories' && (
                <span className="absolute bottom-[-1px] left-0 h-0.5 w-full rounded-full bg-[#ff78b9]" />
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                changeTab('nook')
              }
              className={`relative flex-1 py-4 text-sm font-bold transition sm:flex-none sm:px-10 ${
                activeTab ===
                'nook'
                  ? 'text-[#ff78b9]'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              Mural

              {activeTab ===
                'nook' && (
                <span className="absolute bottom-[-1px] left-0 h-0.5 w-full rounded-full bg-[#ff78b9]" />
              )}
            </button>
          </div>

          {/* CONTEÚDO */}

          <div
            ref={
              tabsContainerRef
            }
            className="mt-6 flex w-full snap-x snap-mandatory overflow-x-hidden"
            onTouchStart={
              handleTabSwipeStart
            }
            onTouchEnd={
              handleTabSwipeEnd
            }
          >
            {/* HISTÓRIAS */}

            <div
              className={`w-full shrink-0 snap-start transition-opacity duration-200 ${
                activeTab ===
                'stories'
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            >
              <div className="mb-5">
                <h2 className="text-xl font-black sm:text-2xl">
                  Histórias de{' '}
                  {displayName}
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  As histórias criadas por este autor.
                </p>
              </div>

              {loadingStories ? (
                <div className="rounded-3xl border border-white/10 bg-[#191219] px-6 py-14 text-center">
                  <p className="text-sm text-white/35">
                    Carregando histórias...
                  </p>
                </div>
              ) : stories.length ===
                0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#191219] px-6 py-14 text-center">
                  <p className="text-sm text-white/35">
                    Este autor ainda não criou nenhuma história.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        '/'
                      )
                    }
                    className="mt-5 rounded-full border border-[#ff78b9]/30 px-5 py-2.5 text-sm font-semibold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
                  >
                    Voltar ao início
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                  {stories.map(
                    (story) => (
                      <button
                        key={
                          story.id
                        }
                        type="button"
                        onClick={() =>
                          router.push(
                            `/historia/${story.id}`
                          )
                        }
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-[#191219] text-left transition hover:-translate-y-1 hover:border-[#ff78b9]/30 sm:rounded-3xl"
                      >
                        <div className="relative aspect-[2/3] overflow-hidden bg-[#241722]">
                          {story.cover_url ? (
                            <img
                              src={
                                story.cover_url
                              }
                              alt={`Capa de ${story.title}`}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3b1b30] to-[#241322] p-4 text-center">
                              <span className="text-sm font-black text-[#ff78b9]/70 sm:text-lg">
                                {
                                  story.title
                                }
                              </span>
                            </div>
                          )}

                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />

                          {story.status && (
                            <span className="absolute left-2 top-2 max-w-[75%] truncate rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">
                              {
                                story.status
                              }
                            </span>
                          )}

                          {story.rating && (
                            <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm sm:right-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-xs">
                              {
                                story.rating
                              }
                            </span>
                          )}
                        </div>

                        <div className="p-3 sm:p-4">
                          <h3 className="line-clamp-2 text-sm font-black text-white transition group-hover:text-[#ff78b9] sm:text-base">
                            {
                              story.title
                            }
                          </h3>

                          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/35 sm:mt-2 sm:text-sm sm:leading-6">
                            {story.description ||
                              'Esta história ainda não possui uma sinopse.'}
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* MURAL */}

            <div
              className={`w-full shrink-0 snap-start transition-opacity duration-200 ${
                activeTab ===
                'nook'
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            >
              <section className="relative overflow-hidden rounded-3xl border border-[#ff78b9]/15 bg-[#191219]">
                <div className="relative p-4 sm:p-6 md:p-8">
                  <div className="mb-5">
                    <h2 className="text-xl font-black sm:text-2xl">
                      Mural
                    </h2>

                    <p className="mt-1 text-sm text-white/40">
                      Um cantinho para compartilhar seus pensamentos como escritor.
                    </p>
                  </div>

                  {/* NOVO POST */}

                  <div className="rounded-3xl border border-white/10 bg-[#100b12] p-4 sm:p-5">
                    <textarea
                      value={newPost}
                      onChange={(
                        event
                      ) =>
                        setNewPost(
                          event.target
                            .value
                        )
                      }
                      maxLength={5000}
                      rows={4}
                      placeholder="O que está passando pela sua cabeça?"
                      className="w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/20"
                    />

                    {/* PREVIEWS */}

                    {mediaPreviews.length >
                      0 && (
                      <div
                        className={`mt-4 grid gap-2 ${
                          mediaPreviews.length ===
                          1
                            ? 'grid-cols-1'
                            : 'grid-cols-2'
                        }`}
                      >
                        {mediaPreviews.map(
                          (
                            preview,
                            index
                          ) => (
                            <div
                              key={
                                preview
                              }
                              className="group relative aspect-square overflow-hidden rounded-2xl bg-[#191219]"
                            >
                              <img
                                src={
                                  preview
                                }
                                alt={`Prévia ${index + 1}`}
                                className="h-full w-full object-cover"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  removeMedia(
                                    index
                                  )
                                }
                                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg text-white transition hover:bg-black"
                              >
                                ×
                              </button>

                              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white">
                                {index +
                                  1}{' '}
                                / 4
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            mediaInputRef.current?.click()
                          }
                          disabled={
                            mediaFiles.length >=
                            MAX_MEDIA
                          }
                          className="shrink-0 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/50 transition hover:border-[#ff78b9]/40 hover:text-[#ff78b9] disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          🖼️{' '}
                          {mediaFiles.length
                            ? `${mediaFiles.length}/4`
                            : 'Imagem/GIF'}
                        </button>

                        <input
                          ref={
                            mediaInputRef
                          }
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={
                            handleMediaSelection
                          }
                          className="hidden"
                        />

                        <select
                          value={
                            selectedStoryId
                          }
                          onChange={(
                            event
                          ) =>
                            setSelectedStoryId(
                              event.target
                                .value
                            )
                          }
                          className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#191219] px-4 py-2.5 text-xs font-semibold text-white/60 outline-none transition focus:border-[#ff78b9]/50"
                        >
                          <option value="">
                            Vincular uma história
                          </option>

                          {stories.map(
                            (
                              story
                            ) => (
                              <option
                                key={
                                  story.id
                                }
                                value={
                                  story.id
                                }
                              >
                                {
                                  story.title
                                }
                              </option>
                            )
                          )}
                        </select>

                        <span className="hidden shrink-0 text-xs text-white/25 sm:block">
                          {
                            newPost.length
                          }
                          /5000
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleCreateNookPost
                        }
                        disabled={
                          creatingPost ||
                          (
                            !newPost.trim() &&
                            mediaFiles.length ===
                              0
                          )
                        }
                        className="rounded-full bg-[#ff78b9] px-6 py-2.5 text-sm font-bold text-[#180d15] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {creatingPost
                          ? 'Publicando...'
                          : 'Publicar'}
                      </button>
                    </div>
                  </div>

                  {/* POSTS */}

                  <div className="mt-6">
                    {loadingNook ? (
                      <div className="rounded-3xl border border-white/5 bg-[#100b12] px-6 py-12 text-center">
                        <p className="text-sm text-white/30">
                          Carregando seu Mural...
                        </p>
                      </div>
                    ) : nookPosts.length ===
                      0 ? (
                      <div className="rounded-3xl border border-dashed border-white/10 bg-[#100b12] px-6 py-12 text-center">
                        <p className="text-sm font-semibold text-white/50">
                          Seu Mural ainda está vazio.
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          Escreva alguma coisa acima para começar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {nookPosts.map(
                          (post) => {
                            const storyTitle =
                              getStoryTitle(
                                post.story_id
                              );

                            const isEditing =
                              editingNookPostId ===
                              post.id;

                            const isDeleting =
                              deletingNookPostId ===
                              post.id;

                            const social =
                              reactionData[
                                post.id
                              ] || {
                                counts:
                                  emptyReactionCounts(),
                                user_reactions:
                                  [],
                                comments_count: 0,
                              };

                            const comments =
                              commentsByPost[
                                post.id
                              ] || [];

                            const topLevelComments =
                              comments.filter(
                                (
                                  comment
                                ) =>
                                  !comment.parent_id
                              );

                            return (
                              <article
                                key={
                                  post.id
                                }
                                className="relative rounded-3xl border border-white/5 bg-[#100b12] p-4 transition hover:border-[#ff78b9]/15 sm:p-5"
                              >
                                {post.pinned && (
                                  <div className="mb-3 text-xs font-bold text-[#ff78b9]">
                                    📌 Post fixado
                                  </div>
                                )}

                                {/* MENU */}

                                {!isEditing && (
                                  <div
                                    className="absolute right-3 top-3 sm:right-4 sm:top-4"
                                    onClick={(
                                      event
                                    ) =>
                                      event.stopPropagation()
                                    }
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMenuOpenPostId(
                                          menuOpenPostId ===
                                            post.id
                                            ? null
                                            : post.id
                                        )
                                      }
                                      className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold text-white/35 transition hover:bg-white/5 hover:text-white"
                                    >
                                      ⋯
                                    </button>

                                    {menuOpenPostId ===
                                      post.id && (
                                      <div className="absolute right-0 top-11 z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#191219] p-1.5 shadow-2xl">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleTogglePinNookPost(
                                              post
                                            )
                                          }
                                          className="block w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-white/65 transition hover:bg-white/5 hover:text-white"
                                        >
                                          {post.pinned
                                            ? 'Desafixar post'
                                            : 'Fixar post'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            startEditNookPost(
                                              post
                                            )
                                          }
                                          className="block w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-white/65 transition hover:bg-white/5 hover:text-white"
                                        >
                                          Editar
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeleteNookPost(
                                              post.id
                                            )
                                          }
                                          disabled={
                                            isDeleting
                                          }
                                          className="block w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold text-red-300 transition hover:bg-red-400/5 disabled:opacity-40"
                                        >
                                          {isDeleting
                                            ? 'Excluindo...'
                                            : 'Excluir'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isEditing ? (
                                  <div className="pr-0">
                                    <textarea
                                      value={
                                        editNookBody
                                      }
                                      onChange={(
                                        event
                                      ) =>
                                        setEditNookBody(
                                          event.target
                                            .value
                                        )
                                      }
                                      maxLength={5000}
                                      rows={6}
                                      className="w-full resize-none rounded-2xl border border-white/10 bg-[#191219] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/50"
                                    />

                                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                                      <select
                                        value={
                                          editNookStoryId
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          setEditNookStoryId(
                                            event.target
                                              .value
                                          )
                                        }
                                        className="flex-1 rounded-full border border-white/10 bg-[#191219] px-4 py-2.5 text-xs font-semibold text-white/60 outline-none transition focus:border-[#ff78b9]/50"
                                      >
                                        <option value="">
                                          Sem história vinculada
                                        </option>

                                        {stories.map(
                                          (
                                            story
                                          ) => (
                                            <option
                                              key={
                                                story.id
                                              }
                                              value={
                                                story.id
                                              }
                                            >
                                              {
                                                story.title
                                              }
                                            </option>
                                          )
                                        )}
                                      </select>

                                      <span className="text-xs text-white/25">
                                        {
                                          editNookBody.length
                                        }
                                        /5000
                                      </span>
                                    </div>

                                    {renderPostMedia(
                                      post
                                    )}

                                    <div className="mt-4 flex gap-3">
                                      <button
                                        type="button"
                                        onClick={
                                          cancelEditNookPost
                                        }
                                        disabled={
                                          savingNookPost
                                        }
                                        className="rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/50 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                                      >
                                        Cancelar
                                      </button>

                                      <button
                                        type="button"
                                        onClick={
                                          handleSaveNookPostEdit
                                        }
                                        disabled={
                                          savingNookPost
                                        }
                                        className="rounded-full bg-[#ff78b9] px-5 py-2.5 text-xs font-bold text-[#180d15] transition hover:brightness-110 disabled:opacity-40"
                                      >
                                        {savingNookPost
                                          ? 'Salvando...'
                                          : 'Salvar'}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    {/* TEXTO */}

                                    {post.body && (
                                      <p className="whitespace-pre-wrap pr-8 text-sm leading-7 text-white/75">
                                        {
                                          post.body
                                        }
                                      </p>
                                    )}

                                    {/* MÍDIAS */}

                                    {renderPostMedia(
                                      post
                                    )}

                                    {/* HISTÓRIA */}

                                    {storyTitle && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          router.push(
                                            `/historia/${post.story_id}`
                                          )
                                        }
                                        className="mt-4 max-w-full truncate rounded-full border border-[#ff78b9]/15 bg-[#ff78b9]/5 px-4 py-2 text-xs font-semibold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
                                      >
                                        📖{' '}
                                        {
                                          storyTitle
                                        }
                                      </button>
                                    )}

                                    {/* REAÇÕES */}

                                    <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-3">
                                      {REACTIONS.map(
                                        (
                                          emoji
                                        ) => {
                                          const count =
                                            social.counts[
                                              emoji
                                            ] ||
                                            0;

                                          const active =
                                            social.user_reactions.includes(
                                              emoji
                                            );

                                          return (
                                            <button
                                              key={
                                                emoji
                                              }
                                              type="button"
                                              onClick={() =>
                                                handleReaction(
                                                  post.id,
                                                  emoji
                                                )
                                              }
                                              className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition ${
                                                active
                                                  ? 'border-[#ff78b9]/50 bg-[#ff78b9]/10'
                                                  : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                                              }`}
                                            >
                                              <span>
                                                {
                                                  emoji
                                                }
                                              </span>

                                              {count >
                                                0 && (
                                                <span className="text-[10px] font-bold text-white/50">
                                                  {
                                                    count
                                                  }
                                                </span>
                                              )}
                                            </button>
                                          );
                                        }
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleComments(
                                            post.id
                                          )
                                        }
                                        className="ml-auto flex items-center gap-1.5 rounded-full border border-white/5 px-3 py-1.5 text-xs font-semibold text-white/40 transition hover:border-[#ff78b9]/30 hover:text-[#ff78b9]"
                                      >
                                        💬

                                        <span>
                                          {
                                            social.comments_count
                                          }
                                        </span>
                                      </button>
                                    </div>

                                    {/* DATA */}

                                    <div className="mt-3 flex items-center justify-between">
                                      <span className="text-xs text-white/25">
                                        {formatDate(
                                          post.created_at
                                        )}
                                      </span>
                                    </div>

                                    {/* COMENTÁRIOS */}

                                    {commentsOpen[
                                      post.id
                                    ] && (
                                      <div className="mt-4 border-t border-white/5 pt-4">
                                        <div className="mb-4 flex gap-2">
                                          <input
                                            type="text"
                                            value={
                                              commentDrafts[
                                                post.id
                                              ] ||
                                              ''
                                            }
                                            onChange={(
                                              event
                                            ) =>
                                              setCommentDrafts(
                                                (
                                                  current
                                                ) => ({
                                                  ...current,
                                                  [post.id]:
                                                    event
                                                      .target
                                                      .value,
                                                })
                                              )
                                            }
                                            maxLength={
                                              2000
                                            }
                                            placeholder="Escreva um comentário..."
                                            className="min-w-0 flex-1 rounded-full border border-white/10 bg-[#191219] px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 focus:border-[#ff78b9]/50"
                                            onKeyDown={(
                                              event
                                            ) => {
                                              if (
                                                event.key ===
                                                'Enter'
                                              ) {
                                                handleCreateComment(
                                                  post.id
                                                );
                                              }
                                            }}
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleCreateComment(
                                                post.id
                                              )
                                            }
                                            disabled={
                                              savingComment ||
                                              !(
                                                commentDrafts[
                                                  post.id
                                                ] ||
                                                ''
                                              ).trim()
                                            }
                                            className="rounded-full bg-[#ff78b9] px-4 py-2 text-[10px] font-bold text-[#180d15] disabled:opacity-30"
                                          >
                                            Enviar
                                          </button>
                                        </div>

                                        {loadingComments[
                                          post.id
                                        ] ? (
                                          <p className="py-5 text-center text-xs text-white/25">
                                            Carregando comentários...
                                          </p>
                                        ) : topLevelComments.length ===
                                          0 ? (
                                          <p className="py-5 text-center text-xs text-white/25">
                                            Ainda não há comentários. Seja o primeiro.
                                          </p>
                                        ) : (
                                          <div className="space-y-4">
                                            {topLevelComments.map(
                                              (
                                                comment
                                              ) =>
                                                renderComment(
                                                  comment,
                                                  comments
                                                )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </>
                                )}
                              </article>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </div>

      {/* EDITOR DO PERFIL */}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#191219] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Editar perfil
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Atualize as informações que aparecem no seu perfil.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditor
                }
                disabled={saving}
                className="text-2xl leading-none text-white/40 transition hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-white/80">
                    Nome de exibição
                  </label>

                  <span className="text-xs text-white/30">
                    {
                      editDisplayName.length
                    }
                    /50
                  </span>
                </div>

                <input
                  type="text"
                  value={
                    editDisplayName
                  }
                  onChange={(
                    event
                  ) =>
                    setEditDisplayName(
                      event.target
                        .value
                    )
                  }
                  maxLength={50}
                  placeholder="Como você quer ser chamado?"
                  className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-white/80">
                    Bio
                  </label>

                  <span className="text-xs text-white/30">
                    {bio.length}/500
                  </span>
                </div>

                <textarea
                  value={bio}
                  onChange={(
                    event
                  ) =>
                    setBio(
                      event.target
                        .value
                    )
                  }
                  maxLength={500}
                  rows={5}
                  placeholder="Conte um pouco sobre você..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm text-green-300">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    closeEditor
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving
                  }
                  className="flex-1 rounded-full bg-[#ff78b9] px-5 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving
                    ? 'Salvando...'
                    : 'Salvar alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================
   HELPERS
========================= */

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
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
      aria-label="Logo Nooklie"
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
