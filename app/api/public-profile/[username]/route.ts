import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Variáveis do Supabase não configuradas.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username não informado." },
        { status: 400 }
      );
    }

    const decodedUsername = decodeURIComponent(username).trim();

    if (!decodedUsername) {
      return NextResponse.json(
        { error: "Username inválido." },
        { status: 400 }
      );
    }

    // =========================================================
    // 1. BUSCAR PERFIL
    // =========================================================

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        display_name,
        bio,
        avatar_url,
        cover_url,
        theme_color
        `
      )
      .eq("username", decodedUsername)
      .maybeSingle();

    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);

      return NextResponse.json(
        { error: "Erro ao buscar perfil." },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil não encontrado." },
        { status: 404 }
      );
    }

    // =========================================================
    // 2. BUSCAR HISTÓRIAS DO USUÁRIO
    // =========================================================

    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("*")
      .eq("author_id", profile.id)
      .order("updated_at", { ascending: false });

    if (storiesError) {
      console.error("Erro ao buscar histórias:", storiesError);

      return NextResponse.json(
        { error: "Erro ao buscar histórias." },
        { status: 500 }
      );
    }

    // =========================================================
    // 3. BUSCAR POSTS DO MURAL
    // =========================================================

    const { data: posts, error: postsError } = await supabase
      .from("nook_posts")
      .select(
        `
        id,
        user_id,
        body,
        image_url,
        story_id,
        pinned,
        created_at,
        updated_at
        `
      )
      .eq("user_id", profile.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (postsError) {
      console.error("Erro ao buscar posts:", postsError);

      return NextResponse.json(
        { error: "Erro ao buscar posts." },
        { status: 500 }
      );
    }

    // =========================================================
    // 4. BUSCAR MÍDIAS DOS POSTS
    // =========================================================

    const postIds = (posts || []).map((post) => post.id);

    let media: any[] = [];

    if (postIds.length > 0) {
      const { data: mediaData, error: mediaError } = await supabase
        .from("nook_post_media")
        .select("*")
        .in("post_id", postIds)
        .order("position", { ascending: true });

      if (mediaError) {
        console.error("Erro ao buscar mídias:", mediaError);

        return NextResponse.json(
          { error: "Erro ao buscar mídias dos posts." },
          { status: 500 }
        );
      }

      media = mediaData || [];
    }

    // =========================================================
    // 5. ANEXAR MÍDIAS A CADA POST
    // =========================================================

    const postsWithMedia = (posts || []).map((post) => {
      const postMedia = media
        .filter((item) => item.post_id === post.id)
        .slice(0, 4);

      return {
        ...post,
        media: postMedia,
      };
    });

    // =========================================================
    // 6. RESPOSTA FINAL
    // =========================================================

    return NextResponse.json({
      user: profile,
      stories: stories || [],
      posts: postsWithMedia,
    });
  } catch (error) {
    console.error("Erro inesperado no perfil público:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
