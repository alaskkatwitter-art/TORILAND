'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import NookPostComposer from '@/components/NookPostComposer';

type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

type Media = {
  id: string;
  post_id: string;
  media_url: string;
  media_type: 'image' | 'gif';
  created_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author: Profile | null;
};

type Post = {
  id: string;
  user_id: string;
  body: string | null;
  image_url: string | null;
  story_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;

  author: Profile | null;

  media: Media[];

  reaction_counts: Record<string, number>;

  user_reactions: string[];

  comments_count: number;

  saved: boolean;
};

const LIKE_REACTION = '❤️';

const SPOTIFY_URL_REGEX =
  /https?:\/\/(?:open\.)?spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(?:track|album|playlist|artist|episode|show)\/[A-Za-z0-9]+(?:\?[^\s]+)?/g;

/* =========================================================
   ÍCONES
========================================================= */

function CloudIcon({
  filled = false,
}: {
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M7.2 18.2h10.1a4.1 4.1 0 0 0 .5-8.17A6.1 6.1 0 0 0 6 11.1a3.6 3.6 0 0 0 1.2 7.1Z" />

      {filled && (
        <path
          d="M8.2 14.2c.8.9 1.7 1.5 2.8 1.9.7.3 1.4.7 2 1.3.6-.6 1.3-1 2-1.3 1.1-.4 2-1 2.8-1.9"
          fill="none"
        />
      )}
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 11.2a7.2 7.2 0 0 1-7.2 7.2H8.5L4 21v-4.2a7.1 7.1 0 0 1-1.2-3.9A7.2 7.2 0 0 1 10 5.8h2.8A7.2 7.2 0 0 1 20 11.2Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M21 3 10.5 13.5" />
      <path d="m21 3-6.7 18-3.8-7.5L3 9.7 21 3Z" />
    </svg>
  );
}

function BookmarkIcon({
  filled = false,
}: {
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21l-5.5-3-5.5 3V4.5Z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m21 3-7.2 18-3.1-7.7L3 10.2 21 3Z" />
      <path d="m10.7 13.3 4.5-4.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 0 0-14.9-3" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 14.9 3" />
      <path d="M20 20v-4h-4" />
    </svg>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatPostDateTime(date: string) {
  const value = new Date(date);

  return `${value.toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  )} • ${value.toLocaleTimeString(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }
  )}`;
}

function getInitial(profile: Profile | null) {
  if (!profile) {
    return '?';
  }

  return (
    profile.display_name ||
    profile.username ||
    '?'
  )
    .charAt(0)
    .toUpperCase();
}

function getPostMedia(post: Post): Media[] {
  if (post.media?.length) {
    return post.media;
  }

  if (post.image_url) {
    return [
      {
        id: 'legacy',
        post_id: post.id,
        media_url: post.image_url,
        media_type: 'image',
        created_at: post.created_at,
      },
    ];
  }

  return [];
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
  profile,
  size = 'normal',
}: {
  profile: Profile | null;
  size?: 'small' | 'normal';
}) {
  const sizeClass =
    size === 'small'
      ? 'h-9 w-9'
      : 'h-11 w-11';

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#ff78b9] font-black text-[#190d16]`}
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(profile)
      )}
    </div>
  );
}

/* =========================================================
   SPOTIFY
========================================================= */

function SpotifyPreview({
  url,
}: {
  url: string;
}) {
  const [data, setData] =
    useState<{
      title?: string;
      thumbnail_url?: string;
      author_name?: string;
    } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response =
          await fetch(
            `/api/spotify/oembed?url=${encodeURIComponent(
              url
            )}`,
            {
              cache: 'no-store',
            }
          );

        if (!response.ok) {
          return;
        }

        const result =
          await response.json();

        if (active) {
          setData(result);
        }
      } catch {
        // preview opcional
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [url]);

  if (!data) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 block rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-[#ff9aca] transition hover:bg-white/[0.07]"
      >
        Abrir no Spotify
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-3 flex overflow-hidden rounded-2xl border border-white/10 bg-[#101010] transition hover:border-[#ff78b9]/40"
    >
      {data.thumbnail_url ? (
        <img
          src={data.thumbnail_url}
          alt=""
          className="h-24 w-24 shrink-0 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#191919] text-xs text-white/40">
          Spotify
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8fe36b]">
          Spotify
        </span>

        <p className="mt-1 truncate text-sm font-bold text-white">
          {data.title ||
            'Música no Spotify'}
        </p>

        {data.author_name && (
          <p className="mt-1 truncate text-xs text-white/45">
            {data.author_name}
          </p>
        )}
      </div>
    </a>
  );
}

/* =========================================================
   POST BODY
========================================================= */

function PostBody({
  body,
}: {
  body: string | null;
}) {
  if (!body) {
    return null;
  }

  const pieces =
    body.split(SPOTIFY_URL_REGEX);

  const urls =
    body.match(SPOTIFY_URL_REGEX) || [];

  return (
    <div className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/85">
      {pieces.map(
        (piece, index) => (
          <span key={index}>
            {piece}

            {index <
              pieces.length - 1 &&
              urls[index] && (
                <SpotifyPreview
                  url={urls[index]}
                />
              )}
          </span>
        )
      )}
    </div>
  );
}

/* =========================================================
   MEDIA
========================================================= */

function PostMedia({
  post,
}: {
  post: Post;
}) {
  const media =
    getPostMedia(post);

  if (!media.length) {
    return null;
  }

  if (media.length === 1) {
    const item = media[0];

    return (
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <img
          src={item.media_url}
          alt=""
          className="max-h-[620px] w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-1 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      {media.map((item) => (
        <div
          key={item.id}
          className="aspect-square overflow-hidden bg-black/40"
        >
          <img
            src={item.media_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   COMMENTS
========================================================= */

function CommentItem({
  comment,
  replies,
  onReply,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (
    comment: Comment
  ) => void;
}) {
  return (
    <div>
      <div className="flex gap-3">
        <Avatar
          profile={comment.author}
          size="small"
        />

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white/[0.045] px-4 py-3">
            <Link
              href={
                comment.author
                  ? `/profile/${comment.author.username}`
                  : '#'
              }
              className="text-sm font-bold text-white transition hover:text-[#ff78b9]"
            >
              {comment.author
                ?.display_name ||
                comment.author
                  ?.username ||
                'Usuário'}
            </Link>

            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
              {comment.content}
            </p>
          </div>

          <div className="mt-1 flex items-center gap-3 px-2 text-[11px] text-white/35">
            <span>
              {formatPostDateTime(
                comment.created_at
              )}
            </span>

            <button
              type="button"
              onClick={() =>
                onReply(comment)
              }
              className="font-semibold transition hover:text-[#ff78b9]"
            >
              Responder
            </button>
          </div>

          {replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l border-white/10 pl-4">
              {replies.map(
                (reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    replies={[]}
                    onReply={
                      onReply
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   POST CARD
========================================================= */

function FeedPost({
  post,
  onPostUpdated,
}: {
  post: Post;
  onPostUpdated: (
    postId: string,
    changes: Partial<Post>
  ) => void;
}) {
  const [
    commentsOpen,
    setCommentsOpen,
  ] = useState(false);

  const [
    comments,
    setComments,
  ] = useState<Comment[]>([]);

  const [
    commentsLoading,
    setCommentsLoading,
  ] = useState(false);

  const [
    commentText,
    setCommentText,
  ] = useState('');

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<Comment | null>(null);

  const [
    sendingComment,
    setSendingComment,
  ] = useState(false);

  const [
    liking,
    setLiking,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    shareMessage,
    setShareMessage,
  ] = useState('');

  const liked =
    post.user_reactions.includes(
      LIKE_REACTION
    );

  const likeCount =
    post.reaction_counts[
      LIKE_REACTION
    ] || 0;

  const loadComments =
    useCallback(async () => {
      setCommentsLoading(true);

      try {
        const response =
          await fetch(
            `/api/nook-comments?post_id=${encodeURIComponent(
              post.id
            )}`,
            {
              cache: 'no-store',
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível carregar os comentários.'
          );
        }

        setComments(
          data.comments || []
        );
      } catch (error) {
        console.error(error);
      } finally {
        setCommentsLoading(false);
      }
    }, [post.id]);

  useEffect(() => {
    if (commentsOpen) {
      loadComments();
    }
  }, [
    commentsOpen,
    loadComments,
  ]);

  async function toggleLike() {
    if (liking) {
      return;
    }

    setLiking(true);

    const previousLiked =
      liked;

    const previousCount =
      likeCount;

    onPostUpdated(post.id, {
      user_reactions:
        previousLiked
          ? post.user_reactions.filter(
              (reaction) =>
                reaction !==
                LIKE_REACTION
            )
          : [
              ...post.user_reactions,
              LIKE_REACTION,
            ],
      reaction_counts: {
        ...post.reaction_counts,
        [LIKE_REACTION]:
          Math.max(
            0,
            previousCount +
              (previousLiked
                ? -1
                : 1)
          ),
      },
    });

    try {
      const response =
        await fetch(
          '/api/nook-posts/reactions',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              post_id: post.id,
              emoji:
                LIKE_REACTION,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível alterar a curtida.'
        );
      }

      if (
        typeof data.reacted ===
        'boolean'
      ) {
        onPostUpdated(
          post.id,
          {
            user_reactions:
              data.reacted
                ? Array.from(
                    new Set([
                      ...post.user_reactions,
                      LIKE_REACTION,
                    ])
                  )
                : post.user_reactions.filter(
                    (reaction) =>
                      reaction !==
                      LIKE_REACTION
                  ),
          }
        );
      }
    } catch (error) {
      console.error(error);

      onPostUpdated(post.id, {
        user_reactions:
          previousLiked
            ? [
                ...post.user_reactions,
                LIKE_REACTION,
              ]
            : post.user_reactions.filter(
                (reaction) =>
                  reaction !==
                  LIKE_REACTION
              ),
        reaction_counts: {
          ...post.reaction_counts,
          [LIKE_REACTION]:
            previousCount,
        },
      });
    } finally {
      setLiking(false);
    }
  }

  async function toggleSave() {
    if (saving) {
      return;
    }

    setSaving(true);

    const previousSaved =
      post.saved;

    onPostUpdated(post.id, {
      saved: !previousSaved,
    });

    try {
      const response =
        await fetch(
          '/api/nook-posts/save',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              post_id: post.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível salvar o post.'
        );
      }

      onPostUpdated(post.id, {
        saved:
          Boolean(data.saved),
      });
    } catch (error) {
      console.error(error);

      onPostUpdated(post.id, {
        saved: previousSaved,
      });
    } finally {
      setSaving(false);
    }
  }

  async function sharePost() {
    const url =
      `${window.location.origin}/feed?post=${post.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title:
            post.author?.display_name ||
            post.author?.username ||
            'Post no Nooklie',
          text:
            post.body?.slice(
              0,
              120
            ) ||
            'Confira este post no Nooklie.',
          url,
        });

        setShareMessage(
          'Compartilhado!'
        );
      } else {
        await navigator.clipboard.writeText(
          url
        );

        setShareMessage(
          'Link copiado!'
        );
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.name ===
          'AbortError'
      ) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          url
        );

        setShareMessage(
          'Link copiado!'
        );
      } catch {
        setShareMessage(
          'Não foi possível compartilhar.'
        );
      }
    }

    setTimeout(() => {
      setShareMessage('');
    }, 2200);
  }

  async function submitComment() {
    const content =
      commentText.trim();

    if (
      !content ||
      sendingComment
    ) {
      return;
    }

    setSendingComment(true);

    try {
      const response =
        await fetch(
          '/api/nook-comments',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              post_id: post.id,
              content,
              parent_id:
                replyingTo?.id ||
                null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            'Não foi possível comentar.'
        );
      }

      if (data.comment) {
        setComments(
          (current) => [
            ...current,
            data.comment,
          ]
        );

        onPostUpdated(
          post.id,
          {
            comments_count:
              post.comments_count +
              1,
          }
        );
      }

      setCommentText('');
      setReplyingTo(null);
      setCommentsOpen(true);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível comentar.'
      );
    } finally {
      setSendingComment(false);
    }
  }

  const commentsByParent =
    useMemo(() => {
      const map =
        new Map<
          string | null,
          Comment[]
        >();

      for (const comment of comments) {
        const key =
          comment.parent_id;

        if (!map.has(key)) {
          map.set(key, []);
        }

        map
          .get(key)!
          .push(comment);
      }

      return map;
    }, [comments]);

  const mainComments =
    commentsByParent.get(
      null
    ) || [];

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#100c11]/90 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="p-5 sm:p-6">

        {/* AUTHOR */}

        <div className="flex items-start gap-3">
          <Link
            href={
              post.author
                ? `/profile/${post.author.username}`
                : '#'
            }
          >
            <Avatar
              profile={post.author}
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={
                    post.author
                      ? `/profile/${post.author.username}`
                      : '#'
                  }
                  className="block truncate text-sm font-bold text-white transition hover:text-[#ff78b9]"
                >
                  {post.author
                    ?.display_name ||
                    post.author
                      ?.username ||
                    'Usuário'}
                </Link>

                <Link
                  href={
                    post.author
                      ? `/profile/${post.author.username}`
                      : '#'
                  }
                  className="block truncate text-xs text-[#ff78b9]/80 transition hover:text-[#ff78b9]"
                >
                  @
                  {post.author
                    ?.username ||
                    'usuario'}
                </Link>
              </div>

              <span className="shrink-0 text-[10px] text-white/30 sm:text-xs">
                {formatPostDateTime(
                  post.created_at
                )}
              </span>
            </div>
          </div>
        </div>

        {/* BODY */}

        <PostBody
          body={post.body}
        />

        {/* MEDIA */}

        <PostMedia
          post={post}
        />

        {/* ACTIONS */}

        <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-3">

          {/* LIKE */}

          <button
            type="button"
            onClick={toggleLike}
            disabled={liking}
            aria-label="Curtir"
            title="Curtir"
            className={`group flex h-11 min-w-[64px] items-center justify-center gap-1.5 rounded-xl px-3 transition active:scale-95 ${
              liked
                ? 'text-[#ff78b9]'
                : 'text-white/45 hover:bg-white/[0.04] hover:text-[#ff78b9]'
            }`}
          >
            <span
              className={`transition-transform ${
                liked
                  ? 'scale-110'
                  : 'group-hover:scale-110'
              }`}
            >
              <CloudIcon
                filled={liked}
              />
            </span>

            {likeCount > 0 && (
              <span className="text-[11px] font-semibold text-current">
                {likeCount}
              </span>
            )}
          </button>

          {/* COMMENT */}

          <button
            type="button"
            onClick={() =>
              setCommentsOpen(
                (value) => !value
              )
            }
            aria-label="Comentar"
            title="Comentar"
            className="group flex h-11 min-w-[64px] items-center justify-center gap-1.5 rounded-xl px-3 text-white/45 transition hover:bg-white/[0.04] hover:text-[#ff78b9] active:scale-95"
          >
            <span className="transition-transform group-hover:scale-110">
              <CommentIcon />
            </span>

            {post.comments_count > 0 && (
              <span className="text-[11px] font-semibold text-current">
                {post.comments_count}
              </span>
            )}
          </button>

          {/* SHARE */}

          <button
            type="button"
            onClick={sharePost}
            aria-label="Compartilhar"
            title="Compartilhar"
            className="group relative flex h-11 min-w-[64px] items-center justify-center rounded-xl px-3 text-white/45 transition hover:bg-white/[0.04] hover:text-[#ff78b9] active:scale-95"
          >
            <span className="transition-transform group-hover:scale-110">
              <ShareIcon />
            </span>

            {shareMessage && (
              <span className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#ff78b9] px-3 py-1.5 text-[10px] font-bold text-[#190d16] shadow-xl">
                {shareMessage}
              </span>
            )}
          </button>

          {/* SAVE */}

          <button
            type="button"
            onClick={toggleSave}
            disabled={saving}
            aria-label={
              post.saved
                ? 'Remover dos salvos'
                : 'Salvar'
            }
            title={
              post.saved
                ? 'Remover dos salvos'
                : 'Salvar'
            }
            className={`group flex h-11 min-w-[64px] items-center justify-center rounded-xl px-3 transition active:scale-95 ${
              post.saved
                ? 'text-[#ff78b9]'
                : 'text-white/45 hover:bg-white/[0.04] hover:text-[#ff78b9]'
            }`}
          >
            <span className="transition-transform group-hover:scale-110">
              <BookmarkIcon
                filled={post.saved}
              />
            </span>
          </button>
        </div>
      </div>

      {/* COMMENTS */}

      {commentsOpen && (
        <div className="border-t border-white/[0.06] bg-black/10 px-5 py-5 sm:px-6">

          {replyingTo && (
            <div className="mb-3 flex items-center justify-between rounded-xl border border-[#ff78b9]/15 bg-[#ff78b9]/[0.05] px-3 py-2">
              <span className="text-xs text-white/50">
                Respondendo a{' '}
                <strong className="text-[#ff78b9]">
                  @
                  {replyingTo.author
                    ?.username ||
                    'usuario'}
                </strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  setReplyingTo(
                    null
                  )
                }
                className="text-xs font-bold text-white/40 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="mb-5 flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff78b9]/20 text-xs font-black text-[#ff78b9]">
              N
            </div>

            <div className="flex min-w-0 flex-1 items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-2">
              <textarea
                value={commentText}
                onChange={(event) =>
                  setCommentText(
                    event.target.value.slice(
                      0,
                      2000
                    )
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key ===
                      'Enter' &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    submitComment();
                  }
                }}
                placeholder={
                  replyingTo
                    ? 'Escreva sua resposta...'
                    : 'Escreva um comentário...'
                }
                rows={1}
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-sm text-white outline-none placeholder:text-white/25"
              />

              <button
                type="button"
                onClick={submitComment}
                disabled={
                  !commentText.trim() ||
                  sendingComment
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff78b9] text-[#190d16] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Enviar comentário"
              >
                <SendIcon />
              </button>
            </div>
          </div>

          {commentsLoading ? (
            <div className="py-6 text-center text-xs text-white/30">
              Carregando comentários...
            </div>
          ) : mainComments.length ===
            0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-semibold text-white/45">
                Ainda não há comentários.
              </p>

              <p className="mt-1 text-xs text-white/25">
                Seja a primeira pessoa a
                comentar.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {mainComments.map(
                (comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    replies={
                      commentsByParent.get(
                        comment.id
                      ) || []
                    }
                    onReply={
                      setReplyingTo
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   FEED PAGE
========================================================= */

export default function FeedPage() {
  const [posts, setPosts] =
    useState<Post[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  /* =======================================================
     COMPOSITOR DE PUBLICAÇÃO
  ======================================================= */

  const [
    composerOpen,
    setComposerOpen,
  ] = useState(false);

  const loadFeed =
    useCallback(
      async (
        showRefresh = false
      ) => {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          const response =
            await fetch(
              '/api/feed',
              {
                cache: 'no-store',
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                'Não foi possível carregar o Feed.'
            );
          }

          setPosts(
            data.posts || []
          );
        } catch (err) {
          console.error(err);

          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível carregar o Feed.'
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  function updatePost(
    postId: string,
    changes: Partial<Post>
  ) {
    setPosts(
      (current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...changes,
              }
            : post
        )
    );
  }

  return (
    <main className="min-h-screen bg-[#080609] text-white">

      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-180px] h-[500px] w-[500px] rounded-full bg-[#ff4d9d]/[0.08] blur-[130px]" />

        <div className="absolute right-[-180px] top-[25%] h-[500px] w-[500px] rounded-full bg-[#c63dff]/[0.045] blur-[140px]" />

        <div className="absolute bottom-[-200px] left-[35%] h-[450px] w-[450px] rounded-full bg-[#ff78b9]/[0.035] blur-[130px]" />
      </div>

      <div className="relative mx-auto min-h-screen w-full max-w-5xl px-4 pb-20 pt-5 sm:px-6 lg:px-8">

        {/* HEADER */}

        <header className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#ff78b9]/15 bg-[#ff78b9]/[0.06] text-[#ff78b9]">
              <CloudIcon />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff78b9]/70">
                Nooklie
              </p>

              <p className="mt-0.5 text-sm font-semibold text-white/65">
                Entre escritores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadFeed(true)
            }
            disabled={refreshing}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-[#ff78b9]/30 hover:bg-[#ff78b9]/[0.06] hover:text-[#ff78b9] disabled:opacity-40"
            aria-label="Atualizar Feed"
            title="Atualizar"
          >
            <span
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            >
              <RefreshIcon />
            </span>
          </button>
        </header>

        {/* CREATE POST */}

        <div className="mx-auto mb-6 w-full max-w-[680px]">
          <button
            type="button"
            onClick={() =>
              setComposerOpen(true)
            }
            className="group flex w-full items-center gap-4 rounded-[22px] border border-white/[0.08] bg-white/[0.025] p-3 text-left shadow-[0_15px_50px_rgba(0,0,0,0.16)] transition hover:border-[#ff78b9]/25 hover:bg-[#ff78b9]/[0.035]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#ff78b9]/20 bg-[#ff78b9]/[0.08] text-2xl font-light text-[#ff78b9] transition-transform group-hover:scale-105">
              +
            </span>

            <span className="min-w-0">
              <span className="block text-sm font-bold text-white/75">
                Compartilhe alguma coisa
              </span>

              <span className="mt-0.5 block text-xs text-white/30">
                Uma ideia, uma descoberta, uma história...
              </span>
            </span>
          </button>
        </div>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-5 py-4">
            <p className="text-sm font-semibold text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadFeed()
              }
              className="mt-2 text-xs font-bold text-red-300 underline underline-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="mx-auto w-full max-w-[680px] space-y-5">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-[26px] border border-white/[0.06] bg-white/[0.025] p-6"
                >
                  <div className="flex gap-3">
                    <div className="h-11 w-11 rounded-full bg-white/[0.06]" />

                    <div className="flex-1">
                      <div className="h-3 w-32 rounded bg-white/[0.06]" />

                      <div className="mt-2 h-2 w-20 rounded bg-white/[0.04]" />
                    </div>
                  </div>

                  <div className="mt-5 h-4 w-4/5 rounded bg-white/[0.05]" />

                  <div className="mt-3 h-4 w-3/5 rounded bg-white/[0.04]" />

                  <div className="mt-5 h-32 rounded-2xl bg-white/[0.04]" />
                </div>
              )
            )}
          </div>
        ) : posts.length ===
          0 ? (
          /* EMPTY */

          <div className="flex min-h-[55vh] items-center justify-center">
            <div className="max-w-md text-center">

              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#ff78b9]/15 bg-[#ff78b9]/[0.05]">
                <CloudIcon />
              </div>

              <h2 className="mt-6 text-xl font-black text-white">
                O Feed está quieto.
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/35">
                Ainda não há publicações por
                aqui. Quando os escritores
                começarem a postar, elas
                aparecerão aqui.
              </p>
            </div>
          </div>
        ) : (
          /* POSTS */

          <div className="mx-auto w-full max-w-[680px] space-y-5">
            {posts.map((post) => (
              <FeedPost
                key={post.id}
                post={post}
                onPostUpdated={
                  updatePost
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          NOVA PUBLICAÇÃO
      ===================================================== */}

      <NookPostComposer
        open={composerOpen}
        onClose={() =>
          setComposerOpen(false)
        }
        onPublished={() => {
          setComposerOpen(false);
          loadFeed(true);
        }}
      />
    </main>
  );
}
