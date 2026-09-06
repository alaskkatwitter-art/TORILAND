'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type User = {
id: string;
username: string;
display_name: string | null;
bio: string | null;
avatar_url: string | null;
cover_url: string | null;
theme_color: string | null;
};

type Profile = {
id: string;
username: string;
display_name: string | null;
avatar_url: string | null;
};

type Story = {
id: string;
title: string;
description: string | null;
cover_url: string | null;
status: string | null;
rating: string | null;
created_at: string;
updated_at: string;
};

type PostMedia = {
id: string;
post_id: string;
media_url: string;
media_type: 'image' | 'gif';
created_at?: string;
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

type NookPost = {
id: string;
user_id: string;
body: string | null;
image_url: string | null;
story_id: string | null;
pinned: boolean;
created_at: string;
updated_at: string;
author: Profile | null;
media: PostMedia[];
reaction_counts: Record<string, number>;
user_reactions: string[];
comments_count: number;
};

type ProfileResponse = {
user?: User;
stories?: Story[];
posts?: NookPost[];
error?: string;
};

type FollowResponse = {
followers_count?: number;
is_following?: boolean;
is_self?: boolean;
following?: boolean;
error?: string;
};

type Tab = 'stories' | 'nook';

const LIKE_REACTION = '❤️';

const URL_REGEX =
/https?://[^\s<]+/g;

const SPOTIFY_URL_REGEX =
/https?://(?:open.)?spotify.com/(?:intl-[a-zA-Z-]+/)?(?:track|album|playlist|artist|episode|show)/[A-Za-z0-9]+(?:?[^\s<]+)?/g;

function formatDate(value: string) {
try {
return new Date(value).toLocaleDateString(
'pt-BR',
{
day: '2-digit',
month: 'short',
year: 'numeric',
}
);
} catch {
return '';
}
}

function formatDateTime(value: string) {
try {
const date = new Date(value);

```
const datePart = date.toLocaleDateString(
  'pt-BR',
  {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
);

const timePart = date.toLocaleTimeString(
  'en-US',
  {
    hour: 'numeric',
    minute: '2-digit',
  }
);

return `${datePart} • ${timePart}`;
```

} catch {
return '';
}
}

function getDisplayName(user: User) {
return (
user.display_name?.trim() ||
user.username
);
}

function getInitial(
profile: Profile | User | null
) {
if (!profile) return '?';

return (
profile.display_name?.trim() ||
profile.username
)
.charAt(0)
.toUpperCase();
}

function cleanUrl(url: string) {
return url.replace(/[.,!?;:)]}]+$/g, '');
}

function isSpotifyUrl(url: string) {
SPOTIFY_URL_REGEX.lastIndex = 0;
return SPOTIFY_URL_REGEX.test(url);
}

function CloudIcon({
filled = false,
}: {
filled?: boolean;
}) {
return (
<svg
viewBox="0 0 24 24"
className="h-5 w-5"
fill={filled ? 'currentColor' : 'none'}
stroke="currentColor"
strokeWidth="1.8"
aria-hidden="true"
> <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M7.5 19.5h9a4 4 0 0 0 .4-7.98A6 6 0 0 0 5.3 9.8 4.5 4.5 0 0 0 7.5 19.5Z"
   /> </svg>
);
}

function CommentIcon() {
return ( <svg
   viewBox="0 0 24 24"
   className="h-5 w-5"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   aria-hidden="true"
 > <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H8l-4 2v-5.2A7.5 7.5 0 1 1 20 11.5Z"
   /> </svg>
);
}

function ShareIcon() {
return ( <svg
   viewBox="0 0 24 24"
   className="h-5 w-5"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   aria-hidden="true"
 > <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M8 12h8"
   /> <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="m13 7 5 5-5 5"
   /> <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M18 12H7a3 3 0 0 0-3 3v1"
   /> </svg>
);
}

function SendIcon() {
return ( <svg
   viewBox="0 0 24 24"
   className="h-5 w-5"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   aria-hidden="true"
 > <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="m21 3-7.5 18-3.5-7-7-3.5L21 3Z"
   /> <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M10 14 21 3"
   /> </svg>
);
}

function CloseIcon() {
return ( <svg
   viewBox="0 0 24 24"
   className="h-4 w-4"
   fill="none"
   stroke="currentColor"
   strokeWidth="2"
   aria-hidden="true"
 > <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="m6 6 12 12M18 6 6 18"
   /> </svg>
);
}

function FollowIcon({
following = false,
}: {
following?: boolean;
}) {
if (following) {
return ( <svg
     viewBox="0 0 24 24"
     className="h-4 w-4"
     fill="none"
     stroke="currentColor"
     strokeWidth="2"
     aria-hidden="true"
   > <path
       strokeLinecap="round"
       strokeLinejoin="round"
       d="m5 12 4 4L19 6"
     /> </svg>
);
}

return ( <svg
   viewBox="0 0 24 24"
   className="h-4 w-4"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   aria-hidden="true"
 > <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M15 19a6 6 0 0 0-12 0"
   /> <circle
     cx="9"
     cy="7"
     r="3"
   /> <path
     strokeLinecap="round"
     strokeLinejoin="round"
     d="M19 8v6M16 11h6"
   /> </svg>
);
}

function SpotifyPreview({
url,
}: {
url: string;
}) {
const [data, setData] = useState<{
title?: string;
thumbnail_url?: string;
author_name?: string;
} | null>(null);

useEffect(() => {
let active = true;

```
async function load() {
  try {
    const response = await fetch(
      `/api/spotify/oembed?url=${encodeURIComponent(
        url
      )}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) return;

    const result = await response.json();

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
```

}, [url]);

if (!data) {
return ( <a
     href={url}
     target="_blank"
     rel="noreferrer noopener"
     className="mt-3 block rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-[#ff9aca] transition hover:bg-white/[0.07]"
   >
Abrir no Spotify </a>
);
}

return ( <a
   href={url}
   target="_blank"
   rel="noreferrer noopener"
   className="mt-3 flex overflow-hidden rounded-2xl border border-white/10 bg-[#101010] transition hover:border-[#ff78b9]/40"
 >
{data.thumbnail_url ? ( <img
       src={data.thumbnail_url}
       alt=""
       className="h-24 w-24 shrink-0 object-cover"
     />
) : ( <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#191919] text-xs text-white/40">
Spotify </div>
)}

```
  <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3">
    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8fe36b]">
      Spotify
    </span>

    <p className="mt-1 truncate text-sm font-bold text-white">
      {data.title || 'Música no Spotify'}
    </p>

    {data.author_name && (
      <p className="mt-1 truncate text-xs text-white/45">
        {data.author_name}
      </p>
    )}
  </div>
</a>
```

);
}

function PostBody({
body,
}: {
body: string | null;
}) {
if (!body) return null;

const matches = Array.from(
body.matchAll(URL_REGEX)
);

if (matches.length === 0) {
return ( <div className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/85">
{body} </div>
);
}

const elements: React.ReactNode[] = [];

let lastIndex = 0;

matches.forEach((match, index) => {
const rawUrl = match[0];
const url = cleanUrl(rawUrl);
const start = match.index ?? 0;

```
if (start > lastIndex) {
  elements.push(
    <span key={`text-${index}`}>
      {body.slice(lastIndex, start)}
    </span>
  );
}

if (isSpotifyUrl(url)) {
  elements.push(
    <span
      key={`spotify-${index}`}
      className="block"
    >
      <SpotifyPreview url={url} />
    </span>
  );
} else {
  elements.push(
    <a
      key={`url-${index}`}
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="break-all text-[#ff9aca] underline decoration-[#ff9aca]/40 underline-offset-2 transition hover:text-[#ffb2d3]"
    >
      {url}
    </a>
  );
}

lastIndex =
  start + rawUrl.length;
```

});

if (lastIndex < body.length) {
elements.push( <span key="text-final">
{body.slice(lastIndex)} </span>
);
}

return ( <div className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/85">
{elements} </div>
);
}

function Avatar({
profile,
size = 'md',
}: {
profile: Profile | User | null;
size?: 'sm' | 'md';
}) {
const classes =
size === 'sm'
? 'h-9 w-9'
: 'h-11 w-11';

if (profile?.avatar_url) {
return (
<img
src={profile.avatar_url}
alt=""
className={`${classes} shrink-0 rounded-full object-cover`}
/>
);
}

return (
<div
className={`${classes} flex shrink-0 items-center justify-center rounded-full bg-[#241c24] font-black text-white/40`}
>
{getInitial(profile)} </div>
);
}

function CommentItem({
comment,
replies,
onReply,
}: {
comment: Comment;
replies: Comment[];
onReply: (comment: Comment) => void;
}) {
return ( <div> <div className="flex gap-3"> <Avatar
       profile={comment.author}
       size="sm"
     />

```
    <div className="min-w-0 flex-1">
      <div className="rounded-2xl bg-white/[0.04] px-4 py-3">
        <p className="text-sm font-bold text-white">
          {comment.author?.display_name ||
            comment.author?.username ||
            'Usuário'}
        </p>

        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
          {comment.content}
        </p>
      </div>

      <div className="mt-1 flex items-center gap-3 px-1">
        <span className="text-[11px] text-white/25">
          {formatDateTime(comment.created_at)}
        </span>

        <button
          type="button"
          onClick={() => onReply(comment)}
          className="text-[11px] font-bold text-white/40 transition hover:text-[#ff78b9]"
        >
          Responder
        </button>
      </div>
    </div>
  </div>

  {replies.length > 0 && (
    <div className="ml-12 mt-3 space-y-3 border-l border-white/10 pl-4">
      {replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          replies={[]}
          onReply={onReply}
        />
      ))}
    </div>
  )}
</div>
```

);
}

function PublicPost({
post,
owner,
onUpdate,
}: {
post: NookPost;
owner: User;
onUpdate: (
postId: string,
changes: Partial<NookPost>
) => void;
}) {
const [commentsOpen, setCommentsOpen] =
useState(false);

const [comments, setComments] =
useState<Comment[]>([]);

const [commentsLoading, setCommentsLoading] =
useState(false);

const [commentText, setCommentText] =
useState('');

const [replyingTo, setReplyingTo] =
useState<Comment | null>(null);

const [sendingComment, setSendingComment] =
useState(false);

const [liking, setLiking] =
useState(false);

const [shareMessage, setShareMessage] =
useState('');

const liked =
post.user_reactions?.includes(
LIKE_REACTION
) || false;

const likeCount =
post.reaction_counts?.[
LIKE_REACTION
] || 0;

async function loadComments() {
setCommentsLoading(true);

```
try {
  const response = await fetch(
    `/api/nook-comments?post_id=${encodeURIComponent(
      post.id
    )}`,
    {
      cache: 'no-store',
    }
  );

  const data = await response.json();

  if (response.ok) {
    setComments(
      Array.isArray(data.comments)
        ? data.comments
        : []
    );
  }
} catch (error) {
  console.error(
    'Erro ao carregar comentários:',
    error
  );
} finally {
  setCommentsLoading(false);
}
```

}

useEffect(() => {
if (commentsOpen) {
loadComments();
}
}, [commentsOpen, post.id]);

async function toggleLike() {
if (liking) return;

```
setLiking(true);

const previousLiked = liked;
const previousCount = likeCount;

const nextLiked = !liked;
const nextCount = nextLiked
  ? likeCount + 1
  : Math.max(0, likeCount - 1);

onUpdate(post.id, {
  user_reactions: nextLiked
    ? Array.from(
        new Set([
          ...(post.user_reactions || []),
          LIKE_REACTION,
        ])
      )
    : (post.user_reactions || []).filter(
        (reaction) =>
          reaction !== LIKE_REACTION
      ),

  reaction_counts: {
    ...(post.reaction_counts || {}),
    [LIKE_REACTION]: nextCount,
  },
});

try {
  const response = await fetch(
    '/api/nook-posts/reactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_id: post.id,
        emoji: LIKE_REACTION,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Não foi possível alterar a reação.'
    );
  }

  if (typeof data.reacted === 'boolean') {
    onUpdate(post.id, {
      user_reactions: data.reacted
        ? Array.from(
            new Set([
              ...(post.user_reactions || []).filter(
                (reaction) =>
                  reaction !== LIKE_REACTION
              ),
              LIKE_REACTION,
            ])
          )
        : (post.user_reactions || []).filter(
            (reaction) =>
              reaction !== LIKE_REACTION
          ),

      reaction_counts: {
        ...(post.reaction_counts || {}),
        [LIKE_REACTION]:
          typeof data.count === 'number'
            ? data.count
            : nextCount,
      },
    });
  }
} catch (error) {
  console.error(
    'Erro ao curtir post:',
    error
  );

  onUpdate(post.id, {
    user_reactions: previousLiked
      ? Array.from(
          new Set([
            ...(post.user_reactions || []).filter(
              (reaction) =>
                reaction !== LIKE_REACTION
            ),
            LIKE_REACTION,
          ])
        )
      : (post.user_reactions || []).filter(
          (reaction) =>
            reaction !== LIKE_REACTION
        ),

    reaction_counts: {
      ...(post.reaction_counts || {}),
      [LIKE_REACTION]: previousCount,
    },
  });
} finally {
  setLiking(false);
}
```

}

async function submitComment() {
const content = commentText.trim();

```
if (!content || sendingComment) {
  return;
}

if (content.length > 2000) {
  alert(
    'O comentário pode ter no máximo 2000 caracteres.'
  );
  return;
}

setSendingComment(true);

try {
  const response = await fetch(
    '/api/nook-comments',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_id: post.id,
        content,
        parent_id:
          replyingTo?.id || null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Não foi possível publicar o comentário.'
    );
  }

  if (data.comment) {
    setComments((current) => [
      ...current,
      data.comment,
    ]);

    onUpdate(post.id, {
      comments_count:
        (post.comments_count || 0) + 1,
    });
  }

  setCommentText('');
  setReplyingTo(null);
  setCommentsOpen(true);
} catch (error) {
  console.error(
    'Erro ao enviar comentário:',
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : 'Não foi possível publicar o comentário.'
  );
} finally {
  setSendingComment(false);
}
```

}

async function sharePost() {
const url = `${window.location.origin}/perfil/${encodeURIComponent(
      owner.username
    )}`;

```
try {
  if (
    navigator.share &&
    typeof navigator.share === 'function'
  ) {
    await navigator.share({
      title: `Publicação de ${owner.display_name || owner.username}`,
      url,
    });

    return;
  }

  await navigator.clipboard.writeText(url);

  setShareMessage('Link copiado.');

  setTimeout(() => {
    setShareMessage('');
  }, 2000);
} catch {
  // compartilhamento cancelado
}
```

}

const commentsByParent =
new Map<string | null, Comment[]>();

for (const comment of comments) {
const key = comment.parent_id || null;

```
if (!commentsByParent.has(key)) {
  commentsByParent.set(key, []);
}

commentsByParent
  .get(key)!
  .push(comment);
```

}

const rootComments =
commentsByParent.get(null) || [];

return ( <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015]"> <div className="p-5 sm:p-6"> <div className="flex items-center gap-3"> <Avatar profile={owner} />

```
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">
          {getDisplayName(owner)}
        </p>

        <p className="text-xs text-white/35">
          @{owner.username}
          {' · '}
          {formatDateTime(post.created_at)}
        </p>
      </div>

      {post.pinned && (
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/35">
          Fixada
        </span>
      )}
    </div>

    <PostBody body={post.body} />

    {post.image_url && (
      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
        <img
          src={post.image_url}
          alt=""
          className="max-h-[600px] w-full object-cover"
        />
      </div>
    )}

    {post.media &&
      post.media.length > 0 && (
        <div
          className={`mt-5 grid gap-2 ${
            post.media.length === 1
              ? 'grid-cols-1'
              : 'grid-cols-2'
          }`}
        >
          {post.media
            .slice(0, 4)
            .map((media) => (
              <div
                key={media.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black"
              >
                <img
                  src={media.media_url}
                  alt=""
                  className="max-h-[500px] min-h-[180px] w-full object-cover"
                />
              </div>
            ))}
        </div>
      )}

    <div className="mt-5 flex items-center border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={toggleLike}
        disabled={liking}
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          liked
            ? 'text-[#ff78b9]'
            : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
      >
        <CloudIcon filled={liked} />

        <span>{likeCount}</span>
      </button>

      <button
        type="button"
        onClick={() =>
          setCommentsOpen(
            (current) => !current
          )
        }
        className={`ml-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
          commentsOpen
            ? 'text-white'
            : 'text-white/40 hover:bg-white/5 hover:text-white'
        }`}
      >
        <CommentIcon />

        <span>
          {post.comments_count || 0}
        </span>
      </button>

      <button
        type="button"
        onClick={sharePost}
        className="ml-1 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/40 transition hover:bg-white/5 hover:text-white"
      >
        <ShareIcon />

        <span className="hidden sm:inline">
          Compartilhar
        </span>
      </button>

      {shareMessage && (
        <span className="ml-2 text-xs text-[#ff9aca]">
          {shareMessage}
        </span>
      )}
    </div>

    {commentsOpen && (
      <div className="mt-3 border-t border-white/10 pt-4">
        {replyingTo && (
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                Respondendo a
              </p>

              <p className="mt-1 truncate text-sm text-white/60">
                {replyingTo.author
                  ?.display_name ||
                  replyingTo.author
                    ?.username ||
                  'Usuário'}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setReplyingTo(null)
              }
              className="rounded-full p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Cancelar resposta"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="flex gap-3">
          <Avatar
            profile={null}
            size="sm"
          />

          <div className="min-w-0 flex-1">
            <textarea
              value={commentText}
              onChange={(event) =>
                setCommentText(
                  event.target.value
                )
              }
              placeholder={
                replyingTo
                  ? 'Escreva sua resposta...'
                  : 'Escreva um comentário...'
              }
              maxLength={2000}
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#ff78b9]/40"
            />

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-white/25">
                {commentText.length}/2000
              </span>

              <button
                type="button"
                onClick={submitComment}
                disabled={
                  sendingComment ||
                  !commentText.trim()
                }
                className="flex items-center gap-2 rounded-xl bg-[#ff78b9] px-4 py-2 text-xs font-black text-[#180d15] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon />

                {sendingComment
                  ? 'Enviando...'
                  : 'Enviar'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {commentsLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 text-center text-sm text-white/35">
              Carregando comentários...
            </div>
          ) : rootComments.length ===
            0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 text-center text-sm text-white/35">
              Ainda não há comentários.
            </div>
          ) : (
            rootComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={
                  commentsByParent.get(
                    comment.id
                  ) || []
                }
                onReply={setReplyingTo}
              />
            ))
          )}
        </div>
      </div>
    )}
  </div>
</article>
```

);
}

export default function PublicProfilePage() {
const params = useParams();
const router = useRouter();

const usernameParam = params?.username;

const username =
typeof usernameParam === 'string'
? usernameParam
: Array.isArray(usernameParam)
? usernameParam[0]
: undefined;

const [user, setUser] =
useState<User | null>(null);

const [stories, setStories] =
useState<Story[]>([]);

const [posts, setPosts] =
useState<NookPost[]>([]);

const [activeTab, setActiveTab] =
useState<Tab>('stories');

const [loading, setLoading] =
useState(true);

const [error, setError] =
useState('');

const [followersCount, setFollowersCount] =
useState(0);

const [isFollowing, setIsFollowing] =
useState(false);

const [isSelf, setIsSelf] =
useState(false);

const [followLoading, setFollowLoading] =
useState(false);

useEffect(() => {
if (!username) {
setLoading(false);
setError('Perfil não encontrado.');
return;
}

```
async function loadProfile() {
  setLoading(true);
  setError('');

  try {
    const encodedUsername =
      encodeURIComponent(username!);

    const response = await fetch(
      `/api/public-profile/${encodedUsername}`,
      {
        cache: 'no-store',
      }
    );

    const data: ProfileResponse =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ||
          'Perfil não encontrado.'
      );
      return;
    }

    if (!data.user) {
      setError('Perfil não encontrado.');
      return;
    }

    setUser(data.user);

    setStories(
      Array.isArray(data.stories)
        ? data.stories
        : []
    );

    setPosts(
      Array.isArray(data.posts)
        ? data.posts
        : []
    );

    try {
      const followResponse = await fetch(
        `/api/follows?user_id=${encodeURIComponent(
          data.user.id
        )}`,
        {
          cache: 'no-store',
        }
      );

      const followData: FollowResponse =
        await followResponse.json();

      if (followResponse.ok) {
        setFollowersCount(
          typeof followData.followers_count ===
            'number'
            ? followData.followers_count
            : 0
        );

        setIsFollowing(
          followData.is_following === true
        );

        setIsSelf(
          followData.is_self === true
        );
      }
    } catch (followError) {
      console.error(
        'Erro ao carregar seguidores:',
        followError
      );
    }
  } catch (err) {
    console.error(
      'Erro ao carregar perfil público:',
      err
    );

    setError(
      'Não foi possível carregar este perfil.'
    );
  } finally {
    setLoading(false);
  }
}

loadProfile();
```

}, [username]);

async function toggleFollow() {
if (!user || followLoading || isSelf) {
return;
}

```
const previousFollowing =
  isFollowing;

const previousFollowers =
  followersCount;

const nextFollowing =
  !previousFollowing;

const nextFollowers =
  nextFollowing
    ? previousFollowers + 1
    : Math.max(
        0,
        previousFollowers - 1
      );

setIsFollowing(nextFollowing);
setFollowersCount(nextFollowers);
setFollowLoading(true);

try {
  const response = await fetch(
    '/api/follows',
    {
      method: nextFollowing
        ? 'POST'
        : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        following_id: user.id,
      }),
    }
  );

  const data: FollowResponse =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        'Não foi possível alterar o follow.'
    );
  }

  if (
    typeof data.following ===
    'boolean'
  ) {
    setIsFollowing(data.following);
  }

  if (
    typeof data.followers_count ===
    'number'
  ) {
    setFollowersCount(
      data.followers_count
    );
  }
} catch (error) {
  console.error(
    'Erro ao seguir usuário:',
    error
  );

  setIsFollowing(
    previousFollowing
  );

  setFollowersCount(
    previousFollowers
  );

  alert(
    error instanceof Error
      ? error.message
      : 'Não foi possível alterar o follow.'
  );
} finally {
  setFollowLoading(false);
}
```

}

function updatePost(
postId: string,
changes: Partial<NookPost>
) {
setPosts((current) =>
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

if (loading) {
return ( <main className="min-h-screen bg-[#0d0a0d] text-white"> <div className="mx-auto w-full max-w-5xl px-4 py-8"> <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015]"> <div className="h-48 animate-pulse bg-white/5" />

```
        <div className="px-6 pb-7">
          <div className="-mt-14 h-28 w-28 animate-pulse rounded-full border-4 border-[#151015] bg-white/10" />

          <div className="mt-5 h-7 w-48 animate-pulse rounded bg-white/10" />

          <div className="mt-3 h-4 w-32 animate-pulse rounded bg-white/5" />

          <div className="mt-5 h-16 max-w-xl animate-pulse rounded bg-white/5" />
        </div>
      </div>
    </div>
  </main>
);
```

}

if (error || !user) {
return ( <main className="flex min-h-screen items-center justify-center bg-[#0d0a0d] px-5 text-white"> <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151015] p-8 text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"> <CommentIcon /> </div>

```
      <h1 className="mt-5 text-2xl font-black">
        Perfil não encontrado
      </h1>

      <p className="mt-3 text-sm leading-6 text-white/50">
        {error ||
          'Este usuário não existe ou o perfil não está disponível.'}
      </p>

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-7 rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-white/90"
      >
        Voltar
      </button>
    </div>
  </main>
);
```

}

return ( <main className="min-h-screen bg-[#0d0a0d] text-white"> <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-5 sm:py-8">
<button
type="button"
onClick={() => router.back()}
className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
> <span className="text-lg">
← </span>

```
      Voltar
    </button>

    <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#151015] shadow-2xl">
      <div
        className="relative h-44 overflow-hidden sm:h-60"
        style={{
          backgroundColor:
            user.theme_color ||
            '#241924',
        }}
      >
        {user.cover_url ? (
          <img
            src={user.cover_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_35%)]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#151015] via-transparent to-black/10" />
      </div>

      <div className="relative px-5 pb-7 sm:px-8">
        <div className="-mt-14 flex items-end justify-between gap-4">
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={getDisplayName(user)}
                className="h-28 w-28 rounded-full border-4 border-[#151015] bg-[#211a21] object-cover shadow-xl sm:h-32 sm:w-32"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-[#151015] bg-[#211a21] text-4xl font-black text-white/40 shadow-xl sm:h-32 sm:w-32">
                {getDisplayName(user)
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>

          {isSelf ? (
            <button
              type="button"
              onClick={() =>
                router.push('/perfil')
              }
              className="mb-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Meu perfil
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followLoading}
              className={`mb-2 flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isFollowing
                  ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              <FollowIcon
                following={isFollowing}
              />

              {followLoading
                ? 'Aguarde...'
                : isFollowing
                  ? 'Seguindo'
                  : 'Seguir'}
            </button>
          )}
        </div>

        <div className="mt-5">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {getDisplayName(user)}
          </h1>

          <p className="mt-1 text-sm font-semibold text-white/40">
            @{user.username}
          </p>

          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="font-bold text-white">
              {followersCount}
            </span>

            <span className="text-white/40">
              {followersCount === 1
                ? 'seguidor'
                : 'seguidores'}
            </span>
          </div>

          {user.bio ? (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-7 text-white/70">
              {user.bio}
            </p>
          ) : (
            <p className="mt-5 text-sm italic text-white/30">
              Este usuário ainda não adicionou uma bio.
            </p>
          )}
        </div>
      </div>
    </section>

    <div className="mt-5 rounded-2xl border border-white/10 bg-[#151015] p-1.5">
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() =>
            setActiveTab('stories')
          }
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'stories'
              ? 'bg-white text-black'
              : 'text-white/45 hover:bg-white/5 hover:text-white'
          }`}
        >
          Histórias
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveTab('nook')
          }
          className={`rounded-xl px-4 py-3 text-sm font-black transition ${
            activeTab === 'nook'
              ? 'bg-white text-black'
              : 'text-white/45 hover:bg-white/5 hover:text-white'
          }`}
        >
          Mural
        </button>
      </div>
    </div>

    <section className="mt-5">
      {activeTab === 'stories' && (
        <>
          {stories.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-[#151015] px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <span className="text-lg font-black text-white/40">
                  +
                </span>
              </div>

              <h2 className="mt-4 text-lg font-black">
                Nenhuma história ainda
              </h2>

              <p className="mt-2 text-sm text-white/40">
                {getDisplayName(user)} ainda não publicou nenhuma história.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-3xl space-y-3">
              {stories.map((story) => (
                <button
                  type="button"
                  key={story.id}
                  onClick={() =>
                    router.push(
                      `/historia/${story.id}`
                    )
                  }
                  className="group flex w-full overflow-hidden rounded-2xl border border-white/10 bg-[#151015] text-left transition hover:border-white/20 hover:bg-[#191419]"
                >
                  <div className="relative h-32 w-24 shrink-0 overflow-hidden bg-[#211a21] sm:h-36 sm:w-28">
                    {story.cover_url ? (
                      <img
                        src={story.cover_url}
                        alt=""
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white/20">
                        +
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-base font-black text-white sm:text-lg">
                        {story.title}
                      </h3>

                      {story.status && (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                            story.status
                              .toUpperCase()
                              .includes(
                                'ANDAMENTO'
                              )
                              ? 'bg-[#ff78b9] text-[#180d15]'
                              : 'border border-white/10 bg-white/5 text-white/45'
                          }`}
                        >
                          {story.status}
                        </span>
                      )}
                    </div>

                    {story.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/45">
                        {story.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/30">
                      <span>
                        {story.rating
                          ? `Classificação ${story.rating}`
                          : 'História'}
                      </span>

                      <span>
                        {formatDate(
                          story.updated_at ||
                            story.created_at
                        )}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'nook' && (
        <>
          {posts.length === 0 ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[#151015] px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                <span className="text-lg font-black text-white/40">
                  +
                </span>
              </div>

              <h2 className="mt-4 text-lg font-black">
                Nenhuma publicação ainda
              </h2>

              <p className="mt-2 text-sm text-white/40">
                {getDisplayName(user)} ainda não publicou nada no Mural.
              </p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-2xl space-y-4">
              {posts.map((post) => (
                <PublicPost
                  key={post.id}
                  post={post}
                  owner={user}
                  onUpdate={updatePost}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  </div>
</main>
```

);
}
