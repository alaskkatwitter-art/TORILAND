'use client';

import { useEffect, useState } from 'react';
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

export default function PerfilPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
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

  function openEditor() {
    if (!user) return;

    setDisplayName(user.display_name || '');
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
          display_name: displayName,
          bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || 'Não foi possível salvar as alterações.'
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
              TORILAND
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
          <div className="relative h-48 bg-gradient-to-r from-[#3b1b30] via-[#572544] to-[#241322]">
            <div className="absolute inset-0 bg-[#ff78b9]/5" />
          </div>

          <div className="relative px-6 pb-8 md:px-10">
            <div className="-mt-14 flex flex-col items-start gap-5 md:flex-row md:items-end">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-[#191219] bg-[#ff78b9] text-4xl font-black text-[#180d15]">
                {user.username.charAt(0).toUpperCase()}
              </div>

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

            <div className="mt-8 flex gap-8 border-t border-white/5 pt-6">
              <div>
                <p className="text-xl font-black">
                  0
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
              As histórias publicadas por este autor aparecerão aqui.
            </p>
          </div>

          <div className="rounded-3xl border border-dashed border-white/10 bg-[#191219] px-6 py-14 text-center">
            <p className="text-sm text-white/35">
              Este autor ainda não publicou nenhuma história.
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-5 rounded-full border border-[#ff78b9]/30 px-5 py-2.5 text-sm font-semibold text-[#ff78b9] transition hover:bg-[#ff78b9]/10"
            >
              Voltar ao início
            </button>
          </div>
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
                    {displayName.length}/50
                  </span>
                </div>

                <input
                  type="text"
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(event.target.value)
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
                  {saving ? 'Salvando...' : 'Salvar alterações'}
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
      aria-label="Logo Toriland"
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
