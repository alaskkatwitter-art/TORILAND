'use client';

import { useState } from 'react';
import Link from 'next/link';

const notifications = [
  {
    type: 'like',
    title: 'Lia curtiu sua história',
    description: 'Entre Dois Mundos',
    time: 'há 5 minutos',
    category: 'Histórias',
    unread: true,
  },
  {
    type: 'comment',
    title: 'Noah comentou na sua história',
    description: '"Esse capítulo acabou comigo. Preciso do próximo!"',
    time: 'há 18 minutos',
    category: 'Histórias',
    unread: true,
  },
  {
    type: 'follow',
    title: 'Maya começou a seguir você',
    description: '@mayawrites',
    time: 'há 1 hora',
    category: 'Social',
    unread: true,
  },
  {
    type: 'update',
    title: 'Uma história que você acompanha foi atualizada',
    description: 'As Cinzas do Reino · Capítulo 9',
    time: 'há 3 horas',
    category: 'Histórias',
    unread: false,
  },
  {
    type: 'like',
    title: 'Alex curtiu seu capítulo',
    description: 'Depois da Meia-Noite · Capítulo 7',
    time: 'ontem',
    category: 'Histórias',
    unread: false,
  },
  {
    type: 'follow',
    title: 'Clara começou a seguir você',
    description: '@clarawrites',
    time: 'ontem',
    category: 'Social',
    unread: false,
  },
];

export default function NotificationsPage() {
  const [filter, setFilter] = useState('Todas');
  const [items, setItems] = useState(notifications);

  const filtered =
    filter === 'Todas'
      ? items
      : items.filter((item) => item.category === filter);

  function markAllAsRead() {
    setItems((current) =>
      current.map((item) => ({
        ...item,
        unread: false,
      }))
    );
  }

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="border-b border-white/10 bg-[#100b12]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-5 pt-5">
          <Link href="/" className="flex flex-col items-center">
            <CloudLogo />

            <span className="mt-1 text-2xl font-bold tracking-[0.18em] text-[#ff78b9]">
              TORILAND
            </span>
          </Link>

          <nav className="mt-6 flex w-full items-center justify-center gap-1 overflow-x-auto border-t border-white/5 py-3">
            <NavLink href="/">Início</NavLink>

            <NavLink href="/explorar">Explorar</NavLink>

            <NavLink href="/escrever">Escrever</NavLink>

            <NavLink href="/notificacoes" active>
              Notificações
            </NavLink>

            <NavLink href="/perfil">Perfil</NavLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-12">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Sua atividade
            </p>

            <h1 className="mt-2 text-4xl font-black md:text-5xl">
              Notificações
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/40">
              Acompanhe tudo o que acontece com suas histórias e seu perfil.
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="w-fit rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/50 hover:border-[#ff78b9]/30 hover:text-[#ff78b9]"
          >
            Marcar todas como lidas
          </button>
        </div>

        <div className="mt-10 flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
          {['Todas', 'Histórias', 'Social'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                filter === item
                  ? 'bg-[#ff78b9] text-[#180d15]'
                  : 'text-white/40 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-[#191219]">
          {filtered.length > 0 ? (
            filtered.map((notification, index) => (
              <Notification
                key={`${notification.title}-${index}`}
                {...notification}
              />
            ))
          ) : (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff78b9]/10 text-2xl font-light text-[#ff78b9]">
                —
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Nada por aqui
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/30">
                Quando houver novas atividades, elas aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center text-sm text-white/30">
          TORILAND — Um lar para histórias.
        </div>
      </footer>
    </main>
  );
}

function Notification({
  type,
  title,
  description,
  time,
  unread,
}: {
  type: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
}) {
  return (
    <div
      className={`flex gap-4 border-b border-white/5 px-5 py-5 last:border-b-0 ${
        unread ? 'bg-[#ff78b9]/[0.025]' : ''
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ff78b9]/10 text-sm font-bold text-[#ff78b9]">
        {type === 'like' && 'L'}
        {type === 'comment' && 'C'}
        {type === 'follow' && 'S'}
        {type === 'update' && 'N'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-white/85">
            {title}
          </p>

          <span className="text-xs text-white/25">
            {time}
          </span>
        </div>

        <p className="mt-1 text-sm leading-6 text-white/40">
          {description}
        </p>
      </div>

      {unread && (
        <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff78b9]" />
      )}
    </div>
  );
}

function NavLink({
  href,
  children,
  active = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium ${
        active
          ? 'bg-[#ff78b9] text-[#180d15]'
          : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`}
    >
      {children}
    </Link>
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
