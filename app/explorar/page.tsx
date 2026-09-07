"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import AuthStatus from "../../components/AuthStatus";

const fandoms = [
  "Todos",
  "House of the Dragon",
  "Game of Thrones",
  "Harry Potter",
  "Marvel",
  "DC",
  "K-pop",
];

const genres = [
  "Todos",
  "Romance",
  "Fantasia",
  "Drama",
  "Aventura",
  "Mistério",
  "Terror",
  "Comédia",
  "Ficção",
];

const menu = [
  { label: "Início", href: "/" },
  { label: "Explorar", href: "/explorar" },
  { label: "Escrever", href: "/escrever" },
  { label: "Fandoms", href: "/fandoms" },
  { label: "Notícias", href: "/noticias" },
];

const examples = [
  {
    title: "Histórias em destaque",
    description:
      "Descubra novas histórias e encontre universos para acompanhar.",
    category: "Destaques",
  },
  {
    title: "Romance",
    description:
      "Histórias para quem gosta de relações, sentimentos e tensão romântica.",
    category: "Gênero",
  },
  {
    title: "Fantasia",
    description:
      "Dragões, magia, reinos e mundos completamente novos.",
    category: "Gênero",
  },
  {
    title: "House of the Dragon",
    description:
      "Explore histórias inspiradas no universo de Westeros.",
    category: "Fandom",
  },
  {
    title: "Game of Thrones",
    description:
      "Encontre novas histórias ambientadas em Westeros.",
    category: "Fandom",
  },
  {
    title: "Harry Potter",
    description:
      "Entre novamente no mundo bruxo através de novas histórias.",
    category: "Fandom",
  },
];

export default function ExplorarPage() {
  const searchParams = useSearchParams();

  const initialGenre = searchParams.get("genre") || "Todos";

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState(initialGenre);

  const filtered = useMemo(() => {
    return examples.filter((item) => {
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());

      const matchesGenre =
        genre === "Todos" ||
        item.title === genre ||
        item.category === genre;

      return matchesSearch && matchesGenre;
    });
  }, [search, genre]);

  return (
    <main className="min-h-screen bg-[#100b12] text-white">
      <Header />

      <div className="mx-auto max-w-7xl px-5 py-12 md:py-16">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#ff78b9]/15 bg-gradient-to-br from-[#291522] via-[#21131e] to-[#171018] p-8 md:p-12">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ff78b9]/10 blur-[100px]" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ff78b9]">
              Descobrir
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-5xl">
              Explore o Nooklie.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">
              Encontre histórias, autores, fandoms e gêneros que combinam
              com o que você quer ler.
            </p>

            <div className="mt-8 flex items-center rounded-2xl border border-white/10 bg-[#100b12]/60 px-5 py-4 backdrop-blur">
              <SearchIcon />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar histórias ou autores..."
                className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
              />
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ff78b9]">
              Filtros
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Gêneros
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {genres.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setGenre(item)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  genre === item
                    ? "border-[#ff78b9]/40 bg-[#ff78b9]/15 text-[#ff9bca]"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-[#ff78b9]/25 hover:text-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-black">
              Histórias para descobrir
            </h2>

            <p className="mt-1 text-sm text-white/35">
              {filtered.length} resultados encontrados.
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
              <h3 className="text-lg font-semibold text-white/70">
                Nenhum resultado encontrado.
              </h3>

              <p className="mt-2 text-sm text-white/35">
                Tente outro termo ou remova os filtros.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="group rounded-2xl border border-white/10 bg-[#171018] p-6 transition hover:-translate-y-1 hover:border-[#ff78b9]/25 hover:bg-[#1d141c]"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#ff78b9]/70">
                    {item.category}
                  </span>

                  <h3 className="mt-3 text-xl font-bold transition group-hover:text-[#ff9bca]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-white/40">
                    {item.description}
                  </p>

                  <button
                    type="button"
                    className="mt-6 text-sm font-semibold text-[#ff78b9] transition hover:text-[#ff9bca]"
                  >
                    Explorar →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100b12]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2"
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
                item.href === "/explorar"
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
  );
}

function Footer() {
  return (
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

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 text-white/35"
      aria-hidden="true"
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
