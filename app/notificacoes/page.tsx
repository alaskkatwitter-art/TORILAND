'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSignup = mode === 'signup';

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
  }

  return (
    <main className="flex min-h-screen bg-[#100b12] text-white">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">

        <section className="relative hidden overflow-hidden lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff78b9]/20 via-[#191219] to-[#100b12]" />

          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-[#ff78b9]/10 blur-3xl" />

          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-[#ff78b9]/5 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-20">

            <Link href="/" className="w-fit">
              <CloudLogo />

              <span className="mt-1 block text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
                TORILAND
              </span>
            </Link>

            <div className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff78b9]">
                Seu lugar para histórias
              </p>

              <h1 className="mt-5 text-5xl font-black leading-tight xl:text-6xl">
                Onde histórias
                <br />
                encontram leitores.
              </h1>

              <p className="mt-6 max-w-md text-base leading-8 text-white/40">
                Descubra novos mundos, acompanhe seus autores favoritos e
                transforme suas próprias ideias em histórias.
              </p>
            </div>

            <p className="text-xs text-white/20">
              TORILAND — Um lar para histórias.
            </p>
          </div>
        </section>

        <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">

            <div className="mb-10 text-center lg:hidden">
              <Link href="/" className="inline-flex flex-col items-center">
                <CloudLogo />

                <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
                  TORILAND
                </span>
              </Link>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#191219] p-6 shadow-2xl shadow-black/20 sm:p-8">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
                  {isSignup ? 'Bem-vindo' : 'Que bom ver você'}
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  {isSignup ? 'Crie sua conta.' : 'Entre no Toriland.'}
                </h2>

                <p className="mt-3 text-sm leading-6 text-white/35">
                  {isSignup
                    ? 'Crie seu espaço no Toriland usando apenas um nome de usuário e uma senha.'
                    : 'Entre para continuar suas histórias e acompanhar seus autores.'}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-2 rounded-2xl bg-[#100b12] p-1">

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === 'login'
                      ? 'bg-[#ff78b9] text-[#180d15]'
                      : 'text-white/35 hover:text-white'
                  }`}
                >
                  Entrar
                </button>

                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    mode === 'signup'
                      ? 'bg-[#ff78b9] text-[#180d15]'
                      : 'text-white/35 hover:text-white'
                  }`}
                >
                  Criar conta
                </button>

              </div>

              <form onSubmit={handleSubmit} className="mt-8">

                <div className="mb-5">
                  <label className="text-sm font-semibold text-white/70">
                    Nome de usuário
                  </label>

                  <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-[#100b12] px-4 focus-within:border-[#ff78b9]/50">

                    <span className="text-white/25">
                      @
                    </span>

                    <input
                      value={username}
                      onChange={(event) =>
                        setUsername(event.target.value)
                      }
                      placeholder="seuusuario"
                      autoComplete="username"
                      className="w-full bg-transparent px-2 py-3.5 text-sm outline-none placeholder:text-white/20"
                    />

                  </div>

                  {isSignup && (
                    <p className="mt-2 text-xs text-white/25">
                      Escolha um nome único. Ele será usado para encontrar seu perfil.
                    </p>
                  )}
                </div>

                <div className="mb-5">

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-white/70">
                      Senha
                    </label>

                    {!isSignup && (
                      <span className="text-xs text-white/20">
                        Sem recuperação por e-mail
                      </span>
                    )}
                  </div>

                  <input
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Sua senha"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm outline-none placeholder:text-white/20 focus:border-[#ff78b9]/50"
                  />

                </div>

                {isSignup && (
                  <div className="mb-5">

                    <label className="text-sm font-semibold text-white/70">
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
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-[#100b12] px-4 py-3.5 text-sm outline-none placeholder:text-white/20 focus:border-[#ff78b9]/50"
                    />

                  </div>
                )}

                {isSignup && (
                  <div className="rounded-2xl border border-[#ff78b9]/10 bg-[#ff78b9]/5 p-4">
                    <p className="text-xs leading-5 text-white/40">
                      O Toriland não precisa do seu nome real, e-mail ou
                      telefone para criar uma conta.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-6 w-full rounded-full bg-[#ff78b9] px-6 py-3.5 text-sm font-bold text-[#180d15] transition hover:brightness-110"
                >
                  {isSignup ? 'Criar minha conta' : 'Entrar'}
                </button>

              </form>

              <div className="mt-7 text-center">

                <p className="text-sm text-white/30">
                  {isSignup
                    ? 'Já tem uma conta?'
                    : 'Ainda não tem uma conta?'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setMode(isSignup ? 'login' : 'signup')
                  }
                  className="mt-2 text-sm font-semibold text-[#ff78b9] hover:underline"
                >
                  {isSignup
                    ? 'Entrar no Toriland'
                    : 'Criar uma conta'}
                </button>

              </div>

            </div>

            <p className="mt-6 text-center text-xs leading-5 text-white/20">
              Sua conta do Toriland não precisa de informações pessoais.
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
      width="82"
      height="48"
      viewBox="0 0 180 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
