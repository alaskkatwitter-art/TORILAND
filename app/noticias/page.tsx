"use client";

import Link from "next/link";
import AuthStatus from "../../components/AuthStatus";

const menu = [
  { label: "Início", href: "/" },
  { label: "Explorar", href: "/explorar" },
  { label: "Escrever", href: "/escrever" },
  { label: "Fandoms", href: "/fandoms" },
  { label: "Notícias", href: "/noticias" },
];

const news = [
  {
    category: "Nooklie",
    title: "Bem-vindo ao Nooklie",
    description:
      "Um novo espaço para leitores e escritores descobrirem histórias, criarem universos e encontrarem suas comunidades.",
  },
  {
    category: "Plataforma",
    title: "Novas ferramentas para escritores",
    description:
      "O Nooklie está construindo uma experiência de escrita cada vez mais completa para quem publica histórias e capítulos.",
  },
  {
    category: "Comunidade",
    title: "Encontre novos fandoms",
    description:
      "Explore comunidades diferentes, conheça novos autores e descubra histórias que talvez você nunca encontrasse sozinho.",
  },
];

export default function NoticiasPage() {
  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100b12]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
          >
            <CloudLogo />

            <span className="text-xl font-black tracking-[0.18em] text-[#ff78b9]">
              NOOKLIE
            </span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {menu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  item.href === "/noticias"
                    ? "bg-gradient-to-r from-[#ff5fab] to-[#ff8fc5] text-[#180d15]"
                    : "text-white/60 hover:bg-[#ff78b9]/10 hover:text-[#ff9bca]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto">
            <AuthStatus />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#ff78b9]/15 bg-gradient-to-br from-[#291522] via-[#21131e] to-[#171018] p-8 md:p-12">
          <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#ff78b9]/10 blur-[110px]" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Nooklie
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-5xl">
              Notícias e novidades.
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-white/50">
              Acompanhe novidades da plataforma, atualizações e tudo o que
              está acontecendo dentro do Nooklie.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <div className="grid gap-5 lg:grid-cols-3">
            {news.map((item, index) => (
              <article
                key={item.title}
                className={`group rounded-[1.5rem] border border-white/10 bg-[#171018] p-7 transition duration-300 hover:-translate-y-1 hover:border-[#ff78b9]/25 ${
                  index === 0
                    ? "lg:col-span-2 lg:row-span-2"
                    : ""
                }`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="rounded-full border border-[#ff78b9]/20 bg-[#ff78b9]/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#ff9bca]">
                    {item.category}
                  </span>

                  <span className="text-xs text-white/20">
                    Nooklie
                  </span>
                </div>

                <h2
                  className={`font-black transition group-hover:text-[#ff9bca] ${
                    index === 0
                      ? "text-3xl md:text-4xl"
                      : "text-2xl"
                  }`}
                >
                  {item.title}
                </h2>

                <p className="mt-4 max-w-xl leading-7 text-white/40">
                  {item.description}
                </p>

                <div className="mt-8 text-sm font-semibold text-[#ff78b9] transition group-hover:text-[#ff9bca]">
                  Leia mais →
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-white/10 bg-[#171018] p-8 text-center md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
            Fique por dentro
          </p>

          <h2 className="mt-3 text-2xl font-black md:text-3xl">
            O Nooklie está apenas começando.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/40">
            Novas ferramentas, comunidades e experiências serão adicionadas
            conforme a plataforma crescer.
          </p>

          <Link
            href="/explorar"
            className="mt-7 inline-flex rounded-full bg-gradient-to-r from-[#ff68ae] to-[#ff91c4] px-7 py-3.5 font-bold text-[#180d15] transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Explorar o Nooklie
          </Link>
        </section>
      </div>

      <footer className="border-t border-white/10 bg-[#0b080d]">
        <div className="mx-auto max-w-7xl px-5 py-10 text-center">
          <p className="text-sm text-white/30">
            De escritor para escritor.
          </p>

          <p className="mt-2 text-xs text-white/15">
            © {new Date().getFullYear()} Nooklie
          </p>
        </div>
      </footer>
    </main>
  );
}

function CloudLogo() {
  return (
    <svg
      width="44"
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
