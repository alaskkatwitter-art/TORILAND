"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type StoryTag = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  category_slug: string | null;
};

type Story = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: string | null;
  rating: string | null;
  tags: StoryTag[];
};

const genres = [
  "Romance",
  "Fantasia",
  "Drama",
  "Aventura",
  "Terror",
  "Mistério",
  "Ficção científica",
  "Fanfic",
];

const ratings = ["Livre", "12+", "14+", "16+", "18+"];

export default function EscreverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const storyId = searchParams.get("id");
  const isEditing = Boolean(storyId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [rating, setRating] = useState("Livre");
  const [tags, setTags] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [loadingStory, setLoadingStory] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storyId) {
      setLoadingStory(false);
      return;
    }

    async function loadStory() {
      try {
        setLoadingStory(true);
        setError("");

        const response = await fetch(`/api/stories/${storyId}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar a história.");
        }

        const story: Story = data.story;

        setTitle(story.title || "");
        setDescription(story.description || "");
        setRating(
          story.rating && story.rating !== ""
            ? `${story.rating}`.endsWith("+")
              ? `${story.rating}`
              : `${story.rating}+`
            : "Livre"
        );

        const storyTags = Array.isArray(story.tags) ? story.tags : [];

        const genreTag = storyTags.find(
          (tag) =>
            tag.category_slug === "genre" ||
            tag.category === "genre" ||
            tag.category === "Gênero" ||
            tag.category === "genero"
        );

        if (genreTag) {
          setGenre(genreTag.name);
        }

        const normalTags = storyTags
          .filter(
            (tag) =>
              tag !== genreTag &&
              tag.category_slug !== "genre" &&
              tag.category !== "genre" &&
              tag.category !== "Gênero" &&
              tag.category !== "genero"
          )
          .map((tag) => tag.name);

        setTags(normalTags.join(", "));

        if (story.cover_url) {
          setCoverPreview(story.cover_url);
        }
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar a história."
        );
      } finally {
        setLoadingStory(false);
      }
    }

    loadStory();
  }, [storyId]);

  function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("A capa precisa estar em JPG, PNG, WEBP ou GIF.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("A capa pode ter no máximo 10 MB.");
      return;
    }

    setError("");
    setCoverFile(file);

    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError("Digite um título para sua história.");
      return;
    }

    if (description.length > 5000) {
      setError("A descrição pode ter no máximo 5000 caracteres.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());

      formData.append("status", "Em andamento");

      formData.append(
        "rating",
        rating === "12+"
          ? "12"
          : rating === "14+"
          ? "14"
          : rating === "16+"
          ? "16"
          : rating === "18+"
          ? "18"
          : rating === "Livre"
          ? "Livre"
          : ""
      );

      formData.append("genre", genre);

      const cleanedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .join(",");

      formData.append("tags", cleanedTags);

      if (coverFile) {
        formData.append("cover", coverFile);
      }

      const endpoint = isEditing
        ? `/api/stories/${storyId}`
        : "/api/stories/create";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            "Não foi possível salvar a história."
        );
      }

      setSaved(true);

      const savedStoryId = data.story?.id || storyId;

      if (savedStoryId) {
        router.push(`/historia/${savedStoryId}`);
      } else {
        router.push("/perfil");
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao salvar a história."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (storyId) {
      router.push(`/historia/${storyId}`);
    } else {
      router.back();
    }
  }

  if (loadingStory) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#0d0910",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p style={{ color: "#c9bfc9" }}>Carregando história...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0d0910",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        paddingBottom: "80px",
      }}
    >
      <header
        style={{
          height: "72px",
          borderBottom: "1px solid #241b28",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 7%",
          background: "#100b13",
        }}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            fontSize: "24px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          ☁ NOOKLIE
        </button>

        <button
          type="button"
          onClick={handleCancel}
          style={{
            border: "1px solid #34283a",
            background: "#171019",
            color: "#d8ccd9",
            borderRadius: "10px",
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </header>

      <section
        style={{
          width: "min(900px, 90%)",
          margin: "50px auto 0",
        }}
      >
        <div style={{ marginBottom: "35px" }}>
          <p
            style={{
              color: "#d96bd8",
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "8px",
            }}
          >
            {isEditing ? "Editar obra" : "Nova história"}
          </p>

          <h1
            style={{
              fontSize: "42px",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {isEditing ? "Edite sua história" : "Conte uma história"}
          </h1>

          <p
            style={{
              color: "#a99eaa",
              marginTop: "12px",
              fontSize: "16px",
            }}
          >
            {isEditing
              ? "Atualize os detalhes da sua obra."
              : "Crie um cantinho para sua história existir."}
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#32151d",
              border: "1px solid #713344",
              color: "#ffb9c8",
              padding: "14px 16px",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: "28px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: 700,
              }}
            >
              Título
            </label>

            <input
              type="text"
              value={title}
              maxLength={150}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="O nome da sua história"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#151016",
                border: "1px solid #34283a",
                borderRadius: "10px",
                padding: "15px",
                color: "#fff",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <div
              style={{
                textAlign: "right",
                color: "#746b76",
                fontSize: "12px",
                marginTop: "6px",
              }}
            >
              {title.length}/150
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: 700,
              }}
            >
              Descrição
            </label>

            <textarea
              value={description}
              maxLength={5000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Sobre o que é sua história?"
              rows={7}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#151016",
                border: "1px solid #34283a",
                borderRadius: "10px",
                padding: "15px",
                color: "#fff",
                fontSize: "16px",
                resize: "vertical",
                outline: "none",
                fontFamily: "inherit",
              }}
            />

            <div
              style={{
                textAlign: "right",
                color: "#746b76",
                fontSize: "12px",
                marginTop: "6px",
              }}
            >
              {description.length}/5000
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontWeight: 700,
                }}
              >
                Gênero
              </label>

              <select
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#151016",
                  border: "1px solid #34283a",
                  borderRadius: "10px",
                  padding: "15px",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                }}
              >
                <option value="">Selecione um gênero</option>

                {genres.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "9px",
                  fontWeight: 700,
                }}
              >
                Classificação
              </label>

              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "#151016",
                  border: "1px solid #34283a",
                  borderRadius: "10px",
                  padding: "15px",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                }}
              >
                {ratings.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: 700,
              }}
            >
              Tags
            </label>

            <input
              type="text"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="ex: enemies to lovers, fantasia, slow burn"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#151016",
                border: "1px solid #34283a",
                borderRadius: "10px",
                padding: "15px",
                color: "#fff",
                fontSize: "16px",
                outline: "none",
              }}
            />

            <p
              style={{
                color: "#746b76",
                fontSize: "12px",
                marginTop: "7px",
              }}
            >
              Separe as tags por vírgula.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "9px",
                fontWeight: 700,
              }}
            >
              Capa
            </label>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "20px",
                alignItems: "start",
              }}
            >
              <label
                style={{
                  minHeight: "280px",
                  border: "1px dashed #514254",
                  background: "#151016",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: "25px",
                  boxSizing: "border-box",
                  textAlign: "center",
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverChange}
                  style={{ display: "none" }}
                />

                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "12px",
                  }}
                >
                  🖼️
                </div>

                <strong>Escolher imagem</strong>

                <span
                  style={{
                    color: "#827784",
                    fontSize: "13px",
                    marginTop: "8px",
                  }}
                >
                  JPG, PNG, WEBP ou GIF
                  <br />
                  até 10 MB
                </span>
              </label>

              {coverPreview && (
                <div>
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "2 / 3",
                      maxWidth: "260px",
                      overflow: "hidden",
                      borderRadius: "14px",
                      background: "#1a131c",
                      border: "1px solid #34283a",
                    }}
                  >
                    <img
                      src={coverPreview}
                      alt="Pré-visualização da capa"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      color: "#827784",
                      fontSize: "12px",
                      marginTop: "8px",
                    }}
                  >
                    Pré-visualização da capa
                  </p>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "15px",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              style={{
                border: "1px solid #34283a",
                background: "transparent",
                color: "#d8ccd9",
                borderRadius: "10px",
                padding: "14px 22px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                border: "none",
                background: "linear-gradient(135deg, #d95fd4, #a94dbb)",
                color: "#fff",
                borderRadius: "10px",
                padding: "14px 26px",
                fontWeight: 800,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                boxShadow: "0 8px 25px rgba(180, 75, 190, 0.2)",
              }}
            >
              {saving
                ? "Salvando..."
                : isEditing
                ? "Salvar alterações"
                : "Criar história"}
            </button>
          </div>

          {saved && (
            <div
              style={{
                textAlign: "center",
                color: "#9ee6b5",
                fontSize: "14px",
              }}
            >
              História salva com sucesso!
            </div>
          )}
        </div>
      </section>

      <footer
        style={{
          width: "min(900px, 90%)",
          margin: "70px auto 0",
          paddingTop: "25px",
          borderTop: "1px solid #241b28",
          color: "#665d68",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        feito por escritores nooklie! para escritores
      </footer>
    </main>
  );
}
