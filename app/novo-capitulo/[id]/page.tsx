'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type PublicationStatus =
  | 'draft'
  | 'published'
  | 'scheduled';

export default function NovoCapituloPage() {
  const params = useParams();
  const router = useRouter();

  const storyId = params.id as string;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorNotes, setAuthorNotes] = useState('');

  const [publicationStatus, setPublicationStatus] =
    useState<PublicationStatus>('published');

  const [scheduledDate, setScheduledDate] =
    useState('');

  const [scheduledTime, setScheduledTime] =
    useState('19:00');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function getTodayDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
      now.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      now.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function getScheduledDateTime() {
    if (!scheduledDate) {
      return null;
    }

    return `${scheduledDate}T${
      scheduledTime || '19:00'
    }:00`;
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError('');

    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const cleanAuthorNotes =
      authorNotes.trim();

    if (!cleanTitle) {
      setError(
        'Digite um título para o capítulo.'
      );
      return;
    }

    if (cleanTitle.length > 150) {
      setError(
        'O título pode ter no máximo 150 caracteres.'
      );
      return;
    }

    if (!cleanBody) {
      setError(
        'Escreva o conteúdo do capítulo.'
      );
      return;
    }

    if (cleanAuthorNotes.length > 5000) {
      setError(
        'As notas do autor podem ter no máximo 5000 caracteres.'
      );
      return;
    }

    let scheduledFor: string | null =
      null;

    if (
      publicationStatus === 'scheduled'
    ) {
      if (!scheduledDate) {
        setError(
          'Escolha a data de publicação.'
        );
        return;
      }

      scheduledFor =
        getScheduledDateTime();

      if (!scheduledFor) {
        setError(
          'Escolha a data e o horário de publicação.'
        );
        return;
      }

      const selectedDate =
        new Date(scheduledFor);

      if (
        Number.isNaN(
          selectedDate.getTime()
        )
      ) {
        setError(
          'A data escolhida é inválida.'
        );
        return;
      }

      if (
        selectedDate <= new Date()
      ) {
        setError(
          'A data de publicação precisa estar no futuro.'
        );
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(
        '/api/chapters/create',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            story_id: storyId,
            title: cleanTitle,
            body: cleanBody,
            author_notes:
              cleanAuthorNotes || null,
            publication_status:
              publicationStatus,
            scheduled_for:
              scheduledFor,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível criar o capítulo.'
        );
        setSaving(false);
        return;
      }

      router.push(
        `/historia/${storyId}`
      );
    } catch (error) {
      console.error(
        'Erro ao criar capítulo:',
        error
      );

      setError(
        'Erro de conexão. Tente novamente.'
      );

      setSaving(false);
    }
  }

  function handleStatusChange(
    status: PublicationStatus
  ) {
    setPublicationStatus(status);

    if (status !== 'scheduled') {
      setScheduledDate('');
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0f',
        color: '#f5f5f5',
        padding:
          '40px 20px 80px',
        fontFamily:
          'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              `/historia/${storyId}`
            )
          }
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ff4fa3',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '25px',
            padding: 0,
          }}
        >
          ← Voltar para a história
        </button>

        <div
          style={{
            marginBottom: '35px',
          }}
        >
          <h1
            style={{
              fontSize:
                'clamp(28px, 5vw, 40px)',
              margin:
                '0 0 10px',
              letterSpacing:
                '-0.5px',
            }}
          >
            Novo capítulo
          </h1>

          <p
            style={{
              color: '#999',
              margin: 0,
              fontSize: '15px',
            }}
          >
            Escreva mais um capítulo
            da sua história.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
        >
          {/* TÍTULO */}

          <section
            style={{
              marginBottom: '25px',
            }}
          >
            <label
              htmlFor="chapter-title"
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 'bold',
                fontSize: '15px',
              }}
            >
              Título do capítulo
            </label>

            <input
              id="chapter-title"
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder="Ex.: Capítulo 1 — O começo"
              maxLength={150}
              disabled={saving}
              style={{
                width: '100%',
                boxSizing:
                  'border-box',
                padding:
                  '16px 17px',
                borderRadius: '12px',
                border:
                  '1px solid #333',
                background:
                  '#15151b',
                color: '#fff',
                fontSize: '17px',
                outline: 'none',
              }}
            />

            <div
              style={{
                textAlign: 'right',
                marginTop: '6px',
                color:
                  title.length >= 150
                    ? '#ff5c8a'
                    : '#666',
                fontSize: '12px',
              }}
            >
              {title.length}/150
            </div>
          </section>

          {/* CONTEÚDO */}

          <section
            style={{
              marginBottom: '28px',
            }}
          >
            <label
              htmlFor="chapter-body"
              style={{
                display: 'block',
                marginBottom: '9px',
                fontWeight: 'bold',
                fontSize: '15px',
              }}
            >
              Conteúdo
            </label>

            <textarea
              id="chapter-body"
              value={body}
              onChange={(e) =>
                setBody(
                  e.target.value
                )
              }
              placeholder="Comece a escrever seu capítulo..."
              disabled={saving}
              style={{
                width: '100%',
                minHeight: '650px',
                boxSizing:
                  'border-box',
                padding:
                  '24px 26px',
                borderRadius: '14px',
                border:
                  '1px solid #333',
                background:
                  '#15151b',
                color: '#f5f5f5',
                fontSize: '18px',
                lineHeight: '1.85',
                resize: 'vertical',
                outline: 'none',
                fontFamily:
                  'Georgia, serif',
              }}
            />
          </section>

          {/* NOTAS DO AUTOR */}

          <section
            style={{
              marginBottom: '28px',
              padding: '22px',
              borderRadius: '14px',
              border:
                '1px solid #2d2830',
              background:
                '#111116',
            }}
          >
            <h2
              style={{
                fontSize: '19px',
                margin:
                  '0 0 7px',
              }}
            >
              Notas do autor
            </h2>

            <p
              style={{
                color: '#888',
                fontSize: '14px',
                lineHeight: 1.5,
                margin:
                  '0 0 16px',
              }}
            >
              Adicione uma mensagem
              que aparecerá no final
              do capítulo.
            </p>

            <textarea
              value={authorNotes}
              onChange={(e) =>
                setAuthorNotes(
                  e.target.value
                )
              }
              maxLength={5000}
              disabled={saving}
              placeholder="Escreva suas notas para os leitores..."
              style={{
                width: '100%',
                minHeight: '130px',
                boxSizing:
                  'border-box',
                padding: '15px',
                borderRadius: '10px',
                border:
                  '1px solid #333',
                background:
                  '#15151b',
                color: '#fff',
                fontSize: '15px',
                lineHeight: 1.6,
                resize: 'vertical',
                outline: 'none',
              }}
            />

            <div
              style={{
                textAlign: 'right',
                marginTop: '6px',
                color: '#666',
                fontSize: '12px',
              }}
            >
              {authorNotes.length}/5000
            </div>
          </section>

          {/* PUBLICAÇÃO */}

          <section
            style={{
              marginBottom: '25px',
              padding: '22px',
              borderRadius: '14px',
              border:
                '1px solid #2d2830',
              background:
                '#111116',
            }}
          >
            <h2
              style={{
                fontSize: '19px',
                margin:
                  '0 0 7px',
              }}
            >
              Publicação
            </h2>

            <p
              style={{
                color: '#888',
                fontSize: '14px',
                lineHeight: 1.5,
                margin:
                  '0 0 18px',
              }}
            >
              Escolha o que fazer
              com este capítulo.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: '12px',
              }}
            >
              {/* RASCUNHO */}

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatusChange(
                    'draft'
                  )
                }
                style={{
                  padding: '18px',
                  minHeight:
                    '125px',
                  borderRadius: '12px',
                  border:
                    publicationStatus ===
                    'draft'
                      ? '2px solid #ff4fa3'
                      : '1px solid #333',
                  background:
                    publicationStatus ===
                    'draft'
                      ? 'rgba(255,79,163,0.10)'
                      : '#15151b',
                  color: '#fff',
                  cursor: saving
                    ? 'default'
                    : 'pointer',
                  textAlign:
                    'left',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',
                    fontSize:
                      '15px',
                    marginBottom:
                      '7px',
                  }}
                >
                  Salvar como rascunho
                </div>

                <div
                  style={{
                    color: '#888',
                    fontSize:
                      '13px',
                    lineHeight:
                      1.5,
                  }}
                >
                  Apenas você poderá
                  acessar o capítulo
                  enquanto ele estiver
                  em rascunho.
                </div>
              </button>

              {/* PUBLICAR AGORA */}

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatusChange(
                    'published'
                  )
                }
                style={{
                  padding: '18px',
                  minHeight:
                    '125px',
                  borderRadius: '12px',
                  border:
                    publicationStatus ===
                    'published'
                      ? '2px solid #ff4fa3'
                      : '1px solid #333',
                  background:
                    publicationStatus ===
                    'published'
                      ? 'rgba(255,79,163,0.10)'
                      : '#15151b',
                  color: '#fff',
                  cursor: saving
                    ? 'default'
                    : 'pointer',
                  textAlign:
                    'left',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',
                    fontSize:
                      '15px',
                    marginBottom:
                      '7px',
                  }}
                >
                  Publicar agora
                </div>

                <div
                  style={{
                    color: '#888',
                    fontSize:
                      '13px',
                    lineHeight:
                      1.5,
                  }}
                >
                  O capítulo ficará
                  disponível para os
                  leitores imediatamente.
                </div>
              </button>

              {/* AGENDAR */}

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleStatusChange(
                    'scheduled'
                  )
                }
                style={{
                  padding: '18px',
                  minHeight:
                    '125px',
                  borderRadius: '12px',
                  border:
                    publicationStatus ===
                    'scheduled'
                      ? '2px solid #ff4fa3'
                      : '1px solid #333',
                  background:
                    publicationStatus ===
                    'scheduled'
                      ? 'rgba(255,79,163,0.10)'
                      : '#15151b',
                  color: '#fff',
                  cursor: saving
                    ? 'default'
                    : 'pointer',
                  textAlign:
                    'left',
                }}
              >
                <div
                  style={{
                    fontWeight:
                      'bold',
                    fontSize:
                      '15px',
                    marginBottom:
                      '7px',
                  }}
                >
                  Agendar publicação
                </div>

                <div
                  style={{
                    color: '#888',
                    fontSize:
                      '13px',
                    lineHeight:
                      1.5,
                  }}
                >
                  Escolha o dia e horário
                  em que o capítulo será
                  liberado.
                </div>
              </button>
            </div>

            {/* DATA DO AGENDAMENTO */}

            {publicationStatus ===
              'scheduled' && (
              <div
                style={{
                  marginTop: '18px',
                  padding:
                    '18px',
                  borderRadius:
                    '12px',
                  background:
                    '#15151b',
                  border:
                    '1px solid #29252b',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '14px',
                  }}
                >
                  <div>
                    <label
                      htmlFor="scheduled-date"
                      style={{
                        display:
                          'block',
                        marginBottom:
                          '7px',
                        color:
                          '#ccc',
                        fontSize:
                          '14px',
                      }}
                    >
                      Data
                    </label>

                    <input
                      id="scheduled-date"
                      type="date"
                      value={
                        scheduledDate
                      }
                      onChange={(e) =>
                        setScheduledDate(
                          e.target.value
                        )
                      }
                      min={
                        getTodayDate()
                      }
                      disabled={saving}
                      style={{
                        width:
                          '100%',
                        boxSizing:
                          'border-box',
                        padding:
                          '13px',
                        borderRadius:
                          '10px',
                        border:
                          '1px solid #333',
                        background:
                          '#111116',
                        color:
                          '#fff',
                        fontSize:
                          '15px',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="scheduled-time"
                      style={{
                        display:
                          'block',
                        marginBottom:
                          '7px',
                        color:
                          '#ccc',
                        fontSize:
                          '14px',
                      }}
                    >
                      Horário
                    </label>

                    <input
                      id="scheduled-time"
                      type="time"
                      value={
                        scheduledTime
                      }
                      onChange={(e) =>
                        setScheduledTime(
                          e.target.value
                        )
                      }
                      disabled={saving}
                      style={{
                        width:
                          '100%',
                        boxSizing:
                          'border-box',
                        padding:
                          '13px',
                        borderRadius:
                          '10px',
                        border:
                          '1px solid #333',
                        background:
                          '#111116',
                        color:
                          '#fff',
                        fontSize:
                          '15px',
                      }}
                    />
                  </div>
                </div>

                <p
                  style={{
                    color: '#777',
                    fontSize:
                      '12px',
                    margin:
                      '12px 0 0',
                  }}
                >
                  O capítulo será
                  liberado automaticamente
                  na data e horário
                  escolhidos.
                </p>
              </div>
            )}
          </section>

          {/* ERRO */}

          {error && (
            <div
              role="alert"
              style={{
                padding:
                  '13px 15px',
                borderRadius:
                  '10px',
                background:
                  'rgba(255,92,138,0.08)',
                border:
                  '1px solid rgba(255,92,138,0.25)',
                color:
                  '#ff5c8a',
                marginBottom:
                  '18px',
                fontSize:
                  '14px',
                lineHeight:
                  1.5,
              }}
            >
              {error}
            </div>
          )}

          {/* BOTÃO */}

          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%',
              padding: '17px',
              borderRadius: '12px',
              border: 'none',
              background: saving
                ? '#7a2850'
                : '#ff4fa3',
              color: '#fff',
              fontSize: '17px',
              fontWeight: 'bold',
              cursor: saving
                ? 'default'
                : 'pointer',
              transition:
                'opacity 0.2s',
            }}
          >
            {saving
              ? publicationStatus ===
                'draft'
                ? 'Salvando rascunho...'
                : publicationStatus ===
                  'scheduled'
                ? 'Agendando capítulo...'
                : 'Publicando capítulo...'
              : publicationStatus ===
                'draft'
              ? 'Salvar rascunho'
              : publicationStatus ===
                'scheduled'
              ? 'Agendar capítulo'
              : 'Publicar capítulo'}
          </button>
        </form>
      </div>
    </main>
  );
}
