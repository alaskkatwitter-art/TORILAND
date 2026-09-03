'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>('signup');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  async function handleRecovery(event: React.FormEvent) {
  event.preventDefault();

  setError('');
  setLoading(true);

  const form = event.currentTarget;
  const formData = new FormData(form);

  const recoveryKey = formData.get('recoveryKey');
  const newPassword = formData.get('newPassword');
  const confirmNewPassword = formData.get('confirmNewPassword');

  if (newPassword !== confirmNewPassword) {
    setError('As senhas não coincidem.');
    setLoading(false);
    return;
  }

  try {
    const response = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        recoveryKey,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(
        data.error || 'Não foi possível recuperar sua conta.'
      );
      return;
    }

    setMode('login');
    setPassword('');
    setConfirmPassword('');
    setError('Senha alterada com sucesso. Agora você pode entrar.');
  } catch {
    setError('Não foi possível conectar ao Toriland.');
  } finally {
    setLoading(false);
  }

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();

    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Não foi possível criar a conta.');
        return;
      }

      setRecoveryKey(data.recoveryKey);
    } catch {
      setError('Não foi possível conectar ao Toriland.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: React.FormEvent) {
  event.preventDefault();

  setError('');
  setLoading(true);

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || 'Username ou senha incorretos.');
      return;
    }

    router.push('/');
    router.refresh();
  } catch {
    setError('Não foi possível conectar ao Toriland.');
  } finally {
    setLoading(false);
  }
  }

  if (recoveryKey) {
    return (
      <main className="min-h-screen bg-[#100b12] px-5 py-10 text-white">
        <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
          <section className="w-full rounded-3xl border border-white/10 bg-[#191219] p-7 shadow-2xl">
            <div className="mb-8 text-center">
              <CloudLogo />

              <h1 className="mt-4 text-2xl font-black">
                Sua conta foi criada
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Antes de continuar, guarde sua chave de recuperação.
              </p>
            </div>

            <div className="rounded-2xl border border-[#ff78b9]/20 bg-[#100b12] p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
                Chave de recuperação
              </p>

              <p className="break-all font-mono text-sm leading-6 text-white/80">
                {recoveryKey}
              </p>
            </div>

            <p className="mt-4 text-xs leading-5 text-white/35">
              Essa chave é necessária caso você esqueça sua senha.
              O Toriland não envia essa chave por e-mail.
            </p>

            <button
              onClick={() => router.push('/')}
              className="mt-7 w-full rounded-full bg-[#ff78b9] px-6 py-3.5 font-bold text-[#180d15] transition hover:brightness-110"
            >
              Continuar para o Toriland
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#100b12] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-white/10 bg-[#191219] p-7 shadow-2xl">
          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="inline-flex flex-col items-center"
            >
              <CloudLogo />

              <span className="mt-1 text-2xl font-black tracking-[0.18em] text-[#ff78b9]">
                TORILAND
              </span>
            </button>

            <h1 className="mt-8 text-2xl font-black">
              {mode === 'signup'
                ? 'Crie sua conta'
                : 'Bem-vindo de volta'}
            </h1>

            <p className="mt-2 text-sm text-white/40">
              {mode === 'signup'
                ? 'Entre no Toriland usando apenas um username e uma senha.'
                : 'Entre na sua conta do Toriland.'}
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 rounded-full bg-[#100b12] p-1">
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`rounded-full py-2.5 text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-[#ff78b9] text-[#180d15]'
                  : 'text-white/45'
              }`}
            >
              Criar conta
            </button>

            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`rounded-full py-2.5 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-[#ff78b9] text-[#180d15]'
                  : 'text-white/45'
              }`}
            >
              Entrar
            </button>
          </div>

          <form
            onSubmit={
              mode === 'signup'
                ? handleSignup
                : handleLogin
            }
            className="mt-7 space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Username
              </label>

              <input
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="seu_username"
                autoComplete="username"
                maxLength={30}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/50"
              />

              {mode === 'signup' && (
                <p className="mt-2 text-xs text-white/30">
                  3–30 caracteres. Use apenas letras, números e _.
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Sua senha"
                autoComplete={
                  mode === 'signup'
                    ? 'new-password'
                    : 'current-password'
                }
                minLength={8}
                required
                className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/50"
              />

              {mode === 'signup' && (
                <p className="mt-2 text-xs text-white/30">
                  A senha precisa ter pelo menos 8 caracteres.
                </p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Confirmar senha
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/50"
                />
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm leading-5 text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#ff78b9] px-6 py-3.5 font-bold text-[#180d15] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? 'Aguarde...'
                : mode === 'signup'
                  ? 'Criar minha conta'
                  : 'Entrar'}
            </button>
          </form>

          <div className="mt-7 border-t border-white/5 pt-5 text-center">
            <p className="text-xs leading-5 text-white/25">
              O Toriland não precisa do seu e-mail, nome real,
              telefone ou qualquer outro dado pessoal para criar
              uma conta.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function CloudLogo() {
  return (
    <svg
      width="72"
      height="42"
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
