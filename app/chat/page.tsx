'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Conversation = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string | null;
  unread: number;
};

type Message = {
  id: string;
  sender: 'me' | 'other';
  content: string;
  createdAt: string;
};

function CloudIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.5 18.5H17C19.4853 18.5 21.5 16.4853 21.5 14C21.5 11.6304 19.6685 9.68907 17.3445 9.51352C16.6917 6.90473 14.3338 5 11.5 5C8.35051 5 5.7974 7.35271 5.48042 10.4199C3.20692 10.918 1.5 12.9488 1.5 15.25C1.5 17.0459 2.95406 18.5 4.75 18.5H7.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 12H5M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M21 3L10.8 13.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 3L14.5 21L10.8 13.2L3 9.5L21 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MessageCircleIcon() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 11.5C20 15.6421 16.4183 19 12 19C10.8442 19 9.75264 18.7662 8.78125 18.3457L4 20L5.46387 15.998C4.54661 14.7429 4 13.1859 4 11.5C4 7.35786 7.58172 4 12 4C16.4183 4 20 7.35786 20 11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatTime(date: string | null) {
  if (!date) return '';

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return '';

  return value.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Avatar({
  name,
  src,
  size = 'normal',
}: {
  name: string;
  src: string | null;
  size?: 'small' | 'normal' | 'large';
}) {
  const dimensions =
    size === 'small'
      ? 'h-10 w-10'
      : size === 'large'
        ? 'h-14 w-14'
        : 'h-12 w-12';

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${dimensions} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff68ae] to-[#ff91c4] font-black text-[#180b12]`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    loadChat();
  }, []);

  async function loadChat() {
    try {
      setLoading(true);

      const response = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok || !data.authenticated) {
        window.location.href = '/login';
        return;
      }

      /*
       * O backend de conversas/mensagens será conectado depois.
       * Por enquanto deixamos a estrutura pronta sem inventar
       * tabelas ou endpoints que ainda não existem no projeto.
       */
      setConversations([]);
      setMessages({});
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.username.toLowerCase().includes(query) ||
        conversation.displayName.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedId
  );

  const selectedMessages = selectedId ? messages[selectedId] || [] : [];

  function handleSendMessage() {
    const text = messageText.trim();

    if (!text || !selectedId) return;

    const newMessage: Message = {
      id: `local-${Date.now()}`,
      sender: 'me',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => ({
      ...current,
      [selectedId]: [...(current[selectedId] || []), newMessage],
    }));

    setMessageText('');
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080609] text-white">
      <header className="border-b border-white/8 bg-[#0c090d]/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link
            href="/feed"
            className="flex items-center gap-3 text-white transition hover:opacity-80"
          >
            <span className="text-[#ff78b9]">
              <CloudIcon />
            </span>

            <span className="text-xl font-black tracking-tight">
              nooklie
            </span>
          </Link>

          <Link
            href="/feed"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
          >
            <ArrowLeftIcon />
            Voltar para o feed
          </Link>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-10">
        <div className="pointer-events-none absolute -left-40 top-0 h-[32rem] w-[32rem] rounded-full bg-[#ff4fa3]/10 blur-3xl" />

        <div className="pointer-events-none absolute -right-40 top-40 h-[30rem] w-[30rem] rounded-full bg-[#ff78b9]/8 blur-3xl" />

        <section className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[#0d0a0f] shadow-2xl">
          <div className="grid min-h-[calc(100vh-170px)] md:grid-cols-[330px_1fr]">
            <aside className="border-b border-white/8 bg-[#0a080b] md:border-b-0 md:border-r">
              <div className="border-b border-white/8 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black">
                      Mensagens
                    </h1>

                    <p className="mt-1 text-xs text-white/35">
                      Converse com a comunidade
                    </p>
                  </div>
                </div>

                <div className="relative mt-5">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                    <SearchIcon />
                  </span>

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar conversa..."
                    className="h-11 w-full rounded-2xl border border-white/8 bg-white/[0.035] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ff78b9]/40"
                  />
                </div>
              </div>

              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-16 animate-pulse rounded-2xl bg-white/[0.035]"
                      />
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff78b9]/8 text-[#ff78b9]">
                      <MessageCircleIcon />
                    </div>

                    <h2 className="text-sm font-bold">
                      Nenhuma conversa
                    </h2>

                    <p className="mt-2 text-xs leading-5 text-white/35">
                      Quando você começar a conversar com alguém, suas
                      mensagens aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="p-3">
                    {filteredConversations.map((conversation) => {
                      const selected =
                        conversation.id === selectedId;

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() =>
                            setSelectedId(conversation.id)
                          }
                          className={`mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                            selected
                              ? 'bg-[#ff78b9]/10'
                              : 'hover:bg-white/[0.035]'
                          }`}
                        >
                          <Avatar
                            name={
                              conversation.displayName ||
                              conversation.username
                            }
                            src={conversation.avatarUrl}
                            size="normal"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-bold">
                                {conversation.displayName}
                              </p>

                              <span className="shrink-0 text-[10px] text-white/25">
                                {formatTime(
                                  conversation.lastMessageAt
                                )}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-white/35">
                                {conversation.lastMessage}
                              </p>

                              {conversation.unread > 0 && (
                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#ff68ae] px-1.5 text-[10px] font-black text-[#180b12]">
                                  {conversation.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-[600px] flex-col bg-[#0e0b10]">
              {!selectedConversation ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[#ff78b9]/8 text-[#ff78b9]">
                    <MessageCircleIcon />
                  </div>

                  <h2 className="text-2xl font-black">
                    Suas mensagens
                  </h2>

                  <p className="mt-3 max-w-sm text-sm leading-6 text-white/35">
                    Escolha uma conversa para começar a trocar mensagens
                    com outros leitores e escritores do Nooklie.
                  </p>
                </div>
              ) : (
                <>
                  <header className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
                    <Avatar
                      name={
                        selectedConversation.displayName ||
                        selectedConversation.username
                      }
                      src={selectedConversation.avatarUrl}
                      size="normal"
                    />

                    <div>
                      <h2 className="text-sm font-bold">
                        {selectedConversation.displayName}
                      </h2>

                      <p className="text-xs text-white/35">
                        @{selectedConversation.username}
                      </p>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto px-5 py-6">
                    {selectedMessages.length === 0 ? (
                      <div className="flex h-full min-h-[350px] items-center justify-center text-center">
                        <div>
                          <p className="text-sm font-semibold text-white/50">
                            Ainda não há mensagens.
                          </p>

                          <p className="mt-2 text-xs text-white/25">
                            Envie a primeira mensagem.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto flex max-w-3xl flex-col gap-3">
                        {selectedMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender === 'me'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                                message.sender === 'me'
                                  ? 'rounded-br-md bg-gradient-to-r from-[#ff68ae] to-[#ff91c4] text-[#180b12]'
                                  : 'rounded-bl-md bg-white/[0.06] text-white/80'
                              }`}
                            >
                              <p>{message.content}</p>

                              <p
                                className={`mt-1 text-[10px] ${
                                  message.sender === 'me'
                                    ? 'text-[#180b12]/50'
                                    : 'text-white/25'
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-white/8 p-4">
                    <div className="mx-auto flex max-w-3xl items-end gap-3">
                      <textarea
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(event.target.value)
                        }
                        onKeyDown={handleComposerKeyDown}
                        rows={1}
                        placeholder="Escreva uma mensagem..."
                        className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#ff78b9]/40"
                      />

                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff68ae] to-[#ff91c4] text-[#180b12] transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Enviar mensagem"
                      >
                        <SendIcon />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
