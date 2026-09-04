import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest
) {
  const url =
    request.nextUrl.searchParams.get(
      'url'
    );

  if (!url) {
    return NextResponse.json(
      {
        error:
          'URL do Spotify não informada.',
      },
      { status: 400 }
    );
  }

  try {
    const spotifyUrl =
      new URL(url);

    if (
      spotifyUrl.hostname !==
        'open.spotify.com' &&
      spotifyUrl.hostname !==
        'spotify.com'
    ) {
      return NextResponse.json(
        {
          error:
            'URL do Spotify inválida.',
        },
        { status: 400 }
      );
    }

    const response =
      await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(
          spotifyUrl.toString()
        )}`,
        {
          headers: {
            Accept:
              'application/json',
          },

          cache: 'no-store',
        }
      );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            'Não foi possível obter a prévia do Spotify.',
        },
        { status: 502 }
      );
    }

    const data =
      await response.json();

    return NextResponse.json({
      title:
        data.title ||
        'Spotify',

      thumbnail_url:
        data.thumbnail_url ||
        null,

      author_name:
        data.author_name ||
        null,

      provider_name:
        data.provider_name ||
        'Spotify',
    });
  } catch (error) {
    console.error(
      'Erro ao carregar prévia do Spotify:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Não foi possível carregar a prévia do Spotify.',
      },
      { status: 500 }
    );
  }
}
