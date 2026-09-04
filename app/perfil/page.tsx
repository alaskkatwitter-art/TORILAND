'use client';

import { useEffect, useRef, useState } from 'react';
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
};

export default function PerfilPage() {
  const router = useRouter();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [nookPosts, setNookPosts] = useState<NookPost[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [loadingNook, setLoadingNook] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const [newPost, setNewPost] = useState('');
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  const [editingNookPost, setEditingNookPost] =
    useState<NookPost | null>(null);
  const [editNookBody, setEditNookBody] = useState('');
  const [editNookStoryId, setEditNookStoryId] =
    useState('');
  const [savingNookPost, setSavingNookPost] =
    useState(false);

  const [openPostMenu, setOpenPostMenu] =
    useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] =
    useState<string | null>(null);
  const [updatingPostId, setUpdatingPostId] =
    useState<string | null>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();

        if (data.authenticated && data.user) {
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

  useEffect(() => {
    async function loadStories() {
      setLoadingStories(true);

      try {
        const response = await fetch('/api/profile/stories', {
          cache: 'no-store',
        });

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

  useEffect(() => {
    async function loadNookPosts() {
      setLoadingNook(true);

      try {
        const response = await fetch('/api/nook-posts', {
          cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(
            'Erro ao carregar posts do Meu Nook:',
            data.error,
            data.details
          );

          setNookPosts([]);
          return;
        }

        setNookPosts(
          Array.isArray(data.posts)
            ? data.posts
            : []
        );
      } catch (error) {
        console.error(
          'Erro ao carregar posts do Meu Nook:',
          error
        );

        setNookPosts([]);
      } finally {
        setLoadingNook(false);
      }
    }

    loadNookPosts();
  }, []);

  function sortNookPosts(posts: NookPost[]) {
    return [...posts].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    });
  }

  function openEditor() {
    if (!user) return;

    setEditDisplayName(user.display_name || '');
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
      const response = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: editDisplayName,
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível salvar as alterações.'
        );
        return;
      }

      setUser(data.user);
      setSuccess('Perfil atualizado com sucesso.');

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

  function openAvatarPicker() {
    if (uploadingAvatar) return;

    setError('');
    setSuccess('');

    avatarInputRef.current?.click();
  }

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingAvatar(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível atualizar sua foto de perfil.'
        );
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              avatar_url: data.avatar_url,
            }
          : currentUser
      );

      setSuccess('Foto de perfil atualizada.');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível enviar a foto. Tente novamente.'
      );
    } finally {
      setUploadingAvatar(false);

      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  }

  function openCoverPicker() {
    if (uploadingCover) return;

    setError('');
    setSuccess('');

    coverInputRef.current?.click();
  }

  async function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingCover(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/cover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível atualizar sua capa.'
        );
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              cover_url: data.cover_url,
            }
          : currentUser
      );

      setSuccess('Capa atualizada com sucesso.');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível enviar a capa. Tente novamente.'
      );
    } finally {
      setUploadingCover(false);

      if (coverInputRef.current) {
        coverInputRef.current.value = '';
      }
    }
  }

  async function handleCreateNookPost() {
    const text = newPost.trim();

    if (!text) {
      setError(
        'Escreva alguma coisa antes de publicar.'
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
      const response = await fetch('/api/nook-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: text,
          image_url: null,
          story_id: selectedStoryId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível publicar o post.'
        );
        return;
      }

      if (data.post) {
        setNookPosts((currentPosts) =>
          sortNookPosts([
            data.post,
            ...currentPosts,
          ])
        );
      }

      setNewPost('');
      setSelectedStoryId('');

      setSuccess('Post publicado no seu Nook!');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível publicar o post. Tente novamente.'
      );
    } finally {
      setCreatingPost(false);
    }
  }

  function openNookPostEditor(post: NookPost) {
    setEditingNookPost(post);
    setEditNookBody(post.body);
    setEditNookStoryId(post.story_id || '');
    setOpenPostMenu(null);
    setError('');
  }

  function closeNookPostEditor() {
    if (savingNookPost) return;

    setEditingNookPost(null);
    setEditNookBody('');
    setEditNookStoryId('');
  }

  async function handleSaveNookPost() {
    if (!editingNookPost) return;

    const text = editNookBody.trim();

    if (!text) {
      setError(
        'O post precisa ter algum conteúdo.'
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
      const response = await fetch(
        `/api/nook-posts/${editingNookPost.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            body: text,
            story_id: editNookStoryId || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível editar o post.'
        );
        return;
      }

      if (data.post) {
        setNookPosts((currentPosts) =>
          sortNookPosts(
            currentPosts.map((post) =>
              post.id === data.post.id
                ? data.post
                : post
            )
          )
        );
      }

      setEditingNookPost(null);
      setEditNookBody('');
      setEditNookStoryId('');

      setSuccess('Post atualizado.');

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

  async function handleTogglePin(post: NookPost) {
    setOpenPostMenu(null);
    setUpdatingPostId(post.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/nook-posts/${post.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pinned: !post.pinned,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível alterar o destaque do post.'
        );
        return;
      }

      if (data.post) {
        setNookPosts((currentPosts) =>
          sortNookPosts(
            currentPosts.map((currentPost) =>
              currentPost.id === data.post.id
                ? data.post
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
    } finally {
      setUpdatingPostId(null);
    }
  }

  async function handleDeleteNookPost(post: NookPost) {
    setOpenPostMenu(null);

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este post? Essa ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    setDeletingPostId(post.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `/api/nook-posts/${post.id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível excluir o post.'
        );
        return;
      }

      setNookPosts((currentPosts) =>
        currentPosts.filter(
          (currentPost) =>
            currentPost.id !== post.id
        )
      );

      setSuccess('Post excluído.');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch {
      setError(
        'Não foi possível excluir o post. Tente novamente.'
      );
    } finally {
      setDeletingPostId(null);
    }
  }

  function getStoryTitle(storyId: string | null) {
    if (!storyId) return null;

    const story = stories.find(
      (item) => item.id === storyId
    );

    return story?.title || null;
  }

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
    user.display_name || user.username;

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
              NOOKLIE
            </span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/60 transition hover:border-[#ff78b9]/40 hover:text-white"
          >
            Voltar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8">
        {/* PERFIL */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#191219]">
          <button
            type="button"
            onClick={openCoverPicker}
            disabled={uploadingCover}
            className="group relative block h-48 w-full overflow-hidden bg-gradient-to-r from-[#3b1b30] via-[#572544] to-[#241322]"
          >
            {user.cover_url && (
              <img
                src={user.cover_url}
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
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleCoverChange}
            className="hidden"
          />

          <div className="relative px-6 pb-8 md:px-10">
            <div className="-mt-14 flex flex-col items-start gap-5 md:flex-row md:items-end">
              <button
                type="button"
                onClick={openAvatarPicker}
                disabled={uploadingAvatar}
                className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#191219] bg-[#ff78b9] text-4xl font-black text-[#180d15] disabled:cursor-wait"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`Foto de perfil de ${displayName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}

                <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100">
                  {uploadingAvatar
                    ? 'Enviando...'
                    : 'Alterar foto'}
                </span>
              </button>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="pb-1">
                <h1 className="text-3xl font-black">
                  {displayName}
                </h1>

                <p className="mt-1 text-sm text-[#ff78b9]">
                  @{user.username}
                </p>
              </div>

              <button
                onClick={openEditor}
                className="md:ml-auto rounded-full bg-[#ff78b9] px-6 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110"
              >
                Editar perfil
              </button>
            </div>

            <div className="mt-7 max-w-2xl">
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

            <div className="mt-8 flex gap-8 border-t border-white/5 pt-6">
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

        {/* MEU NOOK */}
        <section className="relative mt-10 overflow-hidden rounded-3xl border border-[#ff78b9]/15 bg-[#191219]">
          <div className="pointer-events-none absolute -right-8 -top-10 text-8xl opacity-[0.06]">
            ☁
          </div>

          <div className="pointer-events-none absolute -bottom-10 -left-8 text-8xl opacity-[0.04]">
            ☁
          </div>

          <div className="relative p-6 md:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  ☁️
                </span>

                <div>
                  <h2 className="text-2xl font-black">
                    Meu Nook
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    Um cantinho para compartilhar seus pensamentos como escritor.
                  </p>
                </div>
              </div>
            </div>

            {/* NOVO POST */}
            <div className="rounded-3xl border border-white/10 bg-[#100b12] p-4 md:p-5">
              <textarea
                value={newPost}
                onChange={(event) =>
                  setNewPost(event.target.value)
                }
                maxLength={5000}
                rows={5}
                placeholder="O que está passando pela sua cabeça?"
                className="w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-white/20"
              />

              <div className="mt-4 flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-3">
                  <select
                    value={selectedStoryId}
                    onChange={(event) =>
                      setSelectedStoryId(event.target.value)
                    }
                    className="max-w-full rounded-full border border-white/10 bg-[#191219] px-4 py-2.5 text-xs font-semibold text-white/60 outline-none transition focus:border-[#ff78b9]/50"
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

                  <span className="text-xs text-white/25">
                    {newPost.length}/5000
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNookPost}
                  disabled={
                    creatingPost ||
                    !newPost.trim()
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
                    Carregando seu Nook...
                  </p>
                </div>
              ) : nookPosts.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-[#100b12] px-6 py-12 text-center">
                  <div className="text-4xl opacity-40">
                    ☁️
                  </div>

                  <p className="mt-3 text-sm font-semibold text-white/50">
                    Seu Nook ainda está vazio.
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Escreva alguma coisa acima para começar.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {nookPosts.map((post) => {
                    const storyTitle =
                      getStoryTitle(post.story_id);

                    const isDeleting =
                      deletingPostId === post.id;

                    const isUpdating =
                      updatingPostId === post.id;

                    return (
                      <article
                        key={post.id}
                        className="relative rounded-3xl border border-white/5 bg-[#100b12] p-5 transition hover:border-[#ff78b9]/15"
                      >
                        {/* CABEÇALHO DO POST */}
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            {post.pinned && (
                              <div className="flex items-center gap-2 text-xs font-bold text-[#ff78b9]">
                                <span>📌</span>

                                <span>
                                  Post fixado
                                </span>
                              </div>
                            )}
                          </div>

                          {/* MENU */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenPostMenu(
                                  openPostMenu ===
                                    post.id
                                    ? null
                                    : post.id
                                )
                              }
                              disabled={
                                isDeleting ||
                                isUpdating
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-white/30 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                              aria-label="Opções do post"
                            >
                              ⋯
                            </button>

                            {openPostMenu ===
                              post.id && (
                              <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#191219] p-1.5 shadow-2xl">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openNookPostEditor(
                                      post
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
                                >
                                  <span>✏️</span>
                                  <span>
                                    Editar
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTogglePin(
                                      post
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
                                >
                                  <span>
                                    {post.pinned
                                      ? '📍'
                                      : '📌'}
                                  </span>

                                  <span>
                                    {post.pinned
                                      ? 'Desafixar'
                                      : 'Fixar no Nook'}
                                  </span>
                                </button>

                                <div className="my-1 border-t border-white/5" />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteNookPost(
                                      post
                                    )
                                  }
                                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-red-300 transition hover:bg-red-400/10"
                                >
                                  <span>🗑️</span>

                                  <span>
                                    Excluir
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CONTEÚDO */}
                        <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                          {post.body}
                        </p>

                        {post.image_url && (
                          <div className="mt-4 overflow-hidden rounded-2xl">
                            <img
                              src={post.image_url}
                              alt=""
                              className="max-h-[500px] w-full object-cover"
                            />
                          </div>
                        )}

                        {storyTitle && (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/historia/${post.story_id}`
                              )
                            }
                            className="mt-4 flex items-center gap-2 rounded-full border border-[#ff78b9]/15 bg-[#ff78b9]/5 px-4 py-2 text-xs font-semibold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
                          >
                            <span>📖</span>

                            <span>
                              {storyTitle}
                            </span>
                          </button>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                          <span className="text-xs text-white/25">
                            {new Date(
                              post.created_at
                            ).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            )}
                          </span>

                          {isDeleting && (
                            <span className="text-xs text-white/30">
                              Excluindo...
                            </span>
                          )}

                          {isUpdating && (
                            <span className="text-xs text-white/30">
                              Atualizando...
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* HISTÓRIAS */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-black">
              Histórias de {displayName}
            </h2>

            <p className="mt-1 text-sm text-white/40">
              As histórias criadas por este autor aparecerão aqui.
            </p>
          </div>

          {loadingStories ? (
            <div className="rounded-3xl border border-white/10 bg-[#191219] px-6 py-14 text-center">
              <p className="text-sm text-white/35">
                Carregando histórias...
              </p>
            </div>
          ) : stories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#191219] px-6 py-14 text-center">
              <p className="text-sm text-white/35">
                Este autor ainda não criou nenhuma história.
              </p>

              <button
                onClick={() => router.push('/')}
                className="mt-5 rounded-full border border-[#ff78b9]/30 px-5 py-2.5 text-sm font-semibold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
              >
                Voltar ao início
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() =>
                    router.push(`/historia/${story.id}`)
                  }
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-[#191219] text-left transition hover:-translate-y-1 hover:border-[#ff78b9]/30"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#241722]">
                    {story.cover_url ? (
                      <img
                        src={story.cover_url}
                        alt={`Capa de ${story.title}`}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#3b1b30] to-[#241322] px-6 text-center">
                        <span className="text-2xl font-black text-[#ff78b9]/70">
                          {story.title}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent" />

                    {story.status && (
                      <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                        {story.status}
                      </span>
                    )}

                    {story.rating && (
                      <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                        {story.rating}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="line-clamp-2 text-lg font-black text-white transition group-hover:text-[#ff78b9]">
                      {story.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/40">
                      {story.description ||
                        'Esta história ainda não possui uma sinopse.'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
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
                onClick={closeEditor}
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
                    {editDisplayName.length}/50
                  </span>
                </div>

                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(event) =>
                    setEditDisplayName(event.target.value)
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
                  onChange={(event) =>
                    setBio(event.target.value)
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
                  onClick={closeEditor}
                  disabled={saving}
                  className="flex-1 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
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

      {/* EDITOR DO POST DO NOOK */}
      {editingNookPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#191219] p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  Editar post
                </h2>

                <p className="mt-1 text-sm text-white/40">
                  Altere o que você compartilhou no seu Nook.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNookPostEditor}
                disabled={savingNookPost}
                className="text-2xl leading-none text-white/40 transition hover:text-white disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-white/80">
                    Conteúdo
                  </label>

                  <span className="text-xs text-white/30">
                    {editNookBody.length}/5000
                  </span>
                </div>

                <textarea
                  value={editNookBody}
                  onChange={(event) =>
                    setEditNookBody(event.target.value)
                  }
                  maxLength={5000}
                  rows={7}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/20 focus:border-[#ff78b9]/60"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-white/80">
                  História vinculada
                </label>

                <select
                  value={editNookStoryId}
                  onChange={(event) =>
                    setEditNookStoryId(event.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3 text-sm text-white/60 outline-none transition focus:border-[#ff78b9]/60"
                >
                  <option value="">
                    Nenhuma história
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

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeNookPostEditor}
                  disabled={savingNookPost}
                  className="flex-1 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveNookPost}
                  disabled={
                    savingNookPost ||
                    !editNookBody.trim()
                  }
                  className="flex-1 rounded-full bg-[#ff78b9] px-5 py-3 text-sm font-bold text-[#180d15] transition hover:brightness-110 disabled:opacity-50"
                >
                  {savingNookPost
                    ? 'Salvando...'
                    : 'Salvar post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
