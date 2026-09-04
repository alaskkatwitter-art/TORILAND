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

export default function PerfilPage() {
  const router = useRouter();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

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

  /*
   * A API /api/profile/stories já identifica o usuário
   * através da sessão. Portanto, não precisamos esperar
   * o estado "user" para carregar as histórias.
   */
  useEffect(() => {
    async function loadStories() {
      setLoadingStories(true);

      try {
        const response = await fetch('/api/profile/stories', {
          cache: 'no-store',
        });

        const data = await response.json();

        console.log('RESPOSTA DAS HISTÓRIAS:', data);

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

  const displayName = user.display_name || user.username;

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
                {user.bio || 'Ainda não há uma bio por aqui.'}
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
