'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function NovoCapituloPage() {
  const params = useParams();
  const router = useRouter();

  const storyId = params.id as string;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');

    if (!title.trim()) {
      setError('Digite um título para o capítulo.');
      return;
    }

    if (!body.trim()) {
      setError('Escreva o conteúdo do capítulo.');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/chapters/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: storyId,
          title: title.trim(),
          body: body.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            'Não foi possível criar o capítulo.'
        );
        setSaving(false);
        return;
      }

      router.push(`/historia/${storyId}`);
    } catch {
      setError('Erro de conexão. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0b0b0f',
        color: '#f5f5f5',
        padding: '40px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
        }}
      >
        <button
          onClick={() =>
            router.push(`/historia/${storyId}`)
          }
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ff4fa3',
            fontSize: '15px',
            cursor: 'pointer',
            marginBottom: '25px',
          }}
        >
          ← Voltar para a história
        </button>

        <h1
          style={{
            fontSize: '32px',
            marginBottom: '8px',
          }}
        >
          Novo capítulo
        </h1>

        <p
          style={{
            color: '#999',
            marginBottom: '30px',
          }}
        >
          Escreva mais um capítulo da sua história.
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            Título do capítulo
          </label>

          <input
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Ex.: Capítulo 1 — O começo"
            maxLength={150}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '15px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: '#15151b',
              color: '#fff',
              fontSize: '16px',
              marginBottom: '25px',
              outline: 'none',
            }}
          />

          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: 'bold',
            }}
          >
            Conteúdo
          </label>

          <textarea
            value={body}
            onChange={(e) =>
              setBody(e.target.value)
            }
            placeholder="Comece a escrever seu capítulo..."
            style={{
              width: '100%',
              minHeight: '500px',
              boxSizing: 'border-box',
              padding: '18px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: '#15151b',
              color: '#fff',
              fontSize: '17px',
              lineHeight: '1.7',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'Georgia, serif',
            }}
          />

          {error && (
            <p
              style={{
                color: '#ff5c8a',
                marginTop: '15px',
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: '25px',
              width: '100%',
              padding: '16px',
              borderRadius: '10px',
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
            }}
          >
            {saving
              ? 'Publicando...'
              : 'Publicar capítulo'}
          </button>
        </form>
      </div>
    </main>
  );
}
