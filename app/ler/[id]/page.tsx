'use client';

import Link from 'next/link';

export default function ReaderPage() {
  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100b12]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/historia/1"
            className="text-sm font-medium text-white/50 hover:text-white"
          >
            Voltar
          </Link>

          <div className="text-center">
            <p className="text-sm font-bold text-white">
              Entre Dois Mundos
            </p>
            <p className="mt-0.5 text-xs text-white/30">
              Capítulo 1
            </p>
          </div>

          <button className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/50 hover:border-[#ff78b9]/30 hover:text-[#ff78b9]">
            Configurações
          </button>
        </div>

        <div className="h-[2px] bg-[#ff78b9]" style={{ width: '8%' }} />
      </header>

      <article className="mx-auto max-w-3xl px-6 py-14 md:px-8 md:py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#ff78b9]">
            Capítulo 1
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
            O começo de tudo
          </h1>

          <p className="mt-4 text-sm text-white/30">
            Entre Dois Mundos
          </p>
        </div>

        <div className="space-y-7 text-[17px] leading-[2] text-white/75 md:text-[18px]">
          <p>
            Algumas histórias começam muito antes de seus personagens
            perceberem que estão vivendo uma.
          </p>

          <p>
            Naquela manhã, ela acordou acreditando que seria apenas mais um
            dia. O mesmo quarto, a mesma rotina e os mesmos pensamentos que
            costumavam ocupar sua cabeça antes mesmo de colocar os pés no
            chão.
          </p>

          <p>
            Ela não sabia que, antes do fim daquele dia, conheceria alguém que
            mudaria completamente a maneira como enxergava o próprio mundo.
          </p>

          <p>
            O caminho até a universidade estava mais movimentado do que o
            normal. Pessoas atravessavam os corredores apressadas, algumas
            carregando livros, outras conversando enquanto tentavam não se
            atrasar.
          </p>

          <p>
            Ela segurou a alça da bolsa e respirou fundo.
          </p>

          <p>
            Era apenas o primeiro dia.
          </p>

          <p>
            Pelo menos era isso que ela pensava.
          </p>

          <p>
            Ao virar o corredor, porém, seus olhos encontraram os de um
            desconhecido.
          </p>

          <p>
            Por alguns segundos, nenhum dos dois disse nada.
          </p>

          <p>
            E foi justamente naquele silêncio que alguma coisa começou.
          </p>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Capítulo 1 de 24</span>
            <span>8% concluído</span>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[#ff78b9]"
              style={{ width: '8%' }}
            />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <button
            disabled
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/20"
          >
            Capítulo anterior
          </button>

          <button className="rounded-full bg-[#ff78b9] px-5 py-3 text-sm font-bold text-[#180d15] hover:brightness-110">
            Próximo capítulo
          </button>
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-[#191219] p-6 text-center">
          <p className="text-sm font-semibold">
            Gostou da história?
          </p>

          <p className="mt-2 text-sm text-white/35">
            Continue lendo para acompanhar os próximos acontecimentos.
          </p>

          <Link
            href="/historia/1"
            className="mt-5 inline-block rounded-full border border-white/10 px-5 py-2.5 text-xs font-semibold text-white/50 hover:border-[#ff78b9]/30 hover:text-[#ff78b9]"
          >
            Ver história
          </Link>
        </div>
      </article>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-5xl px-5 py-8 text-center text-sm text-white/30">
          TORILAND — Um lar para histórias.
        </div>
      </footer>
    </main>
  );
}
