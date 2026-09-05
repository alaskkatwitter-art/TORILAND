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

type CurrentUser = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  theme_color: string | null;
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
  className = 'h-5 w-5',
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
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

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
      <path d="M4 5.5V21" />
      <path d="M8 7h8" />
      <path d="M8 10h8" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M7.5 3v4" />
      <path d="M16.5 3v4" />
      <path d="M3.5 9h17" />
      <path d="M8 13h.01" />
      <path d="M12 13h.01" />
      <path d="M16 13h.01" />
      <path d="M8 17h.01" />
      <path d="M12 17h.01" />
      <path d="M16 17h.01" />
    </svg>
  );
}

function BookmarkMenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M6.5 4.5A1.5 1.5 0 0 1 8 3h8a1.5 1.5 0 0 1 1.5 1.5V21l-5.5-3-5.5 3V4.5Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.46 15a1.7 1.7 0 0 0-1.56-1.03H6.7v-2.4h.2A1.7 1.7 0 0 0 8.46 10a1.7 1.7 0 0 0-.34-1.88l-.06-.06 1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.73 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M14 8l4 4-4 4" />
      <path d="M18 12H9" />
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

function getInitial(
  profile: Profile | CurrentUser | null
) {
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
  profile: Profile | CurrentUser | null;
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
   PRÓXIMAS ATUALIZAÇÕES
========================================================= */

type ApiUpcomingUpdate = {
  id: string;
  chapter_id: string;
  story_id: string;
  chapter_number: number;
  chapter_title: string;
  story_title: string;
  story_cover_url: string | null;
  scheduled_for: string;
  author: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

type UpcomingUpdate = ApiUpcomingUpdate & {
  color: string;
};

const UPDATE_COLORS = [
  '#ff78b9',
  '#b88cff',
  '#7ddcff',
  '#ffd36e',
  '#8ee39a',
  '#ff9c7d',
  '#c7a6ff',
  '#72e0c1',
];

function getAuthorColor(
  authorId: string,
  authorIds: string[]
) {
  const index = authorIds.indexOf(authorId);

  if (index === -1) {
    return UPDATE_COLORS[0];
  }

  return UPDATE_COLORS[
    index % UPDATE_COLORS.length
  ];
}

function getCalendarDays(
  year: number,
  month: number
) {
  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const days: (
    | number
    | null
  )[] = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    days.push(day);
  }

  return days;
}

function formatScheduledTime(
  date: string
) {
  return new Date(
    date
  ).toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatScheduledDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );
}

function UpcomingUpdatesContent({
  updates,
  onClose,
  mobile = false,
}: {
  updates: UpcomingUpdate[];
  onClose?: () => void;
  mobile?: boolean;
}) {
  const now = new Date();

  const [
    calendarDate,
    setCalendarDate,
  ] = useState(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
  );

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  const monthName =
    calendarDate.toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
      }
    );

  const calendarDays =
    useMemo(
      () =>
        getCalendarDays(
          year,
          month
        ),
      [year, month]
    );

  const updatesForMonth =
    useMemo(() => {
      return updates
        .filter((update) => {
          const date = new Date(
            update.scheduled_for
          );

          return (
            date.getFullYear() ===
              year &&
            date.getMonth() === month
          );
        })
        .sort(
          (a, b) =>
            new Date(
              a.scheduled_for
            ).getTime() -
            new Date(
              b.scheduled_for
            ).getTime()
        );
    }, [
      updates,
      year,
      month,
    ]);

  function goPreviousMonth() {
    setCalendarDate(
      new Date(
        year,
        month - 1,
        1
      )
    );
  }

  function goNextMonth() {
    setCalendarDate(
      new Date(
        year,
        month + 1,
        1
      )
    );
  }

  function getUpdatesForDay(
    day: number
  ) {
    return updatesForMonth.filter(
      (update) => {
        const date = new Date(
          update.scheduled_for
        );

        return (
          date.getDate() === day
        );
      }
    );
  }

  return (
    <div
      className={
        mobile
          ? 'flex h-full min-h-0 flex-col'
          : ''
      }
    >
      <div className="border-b border-white/[0.06] px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CloudIcon
                className="h-5 w-5 text-[#ff78b9]"
              />

              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-white">
                Próximas ATTs
              </h2>
            </div>

            <p className="mt-1.5 text-[11px] leading-4 text-white/35">
              Acompanhe as próximas
              atualizações.
            </p>
          </div>

          {mobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Fechar calendário"
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.05] hover:text-[#ff78b9]"
            aria-label="Mês anterior"
          >
            <ChevronLeftIcon />
          </button>

          <p className="text-xs font-black capitalize text-white">
            {monthName}{' '}
            <span className="text-white/35">
              {year}
            </span>
          </p>

          <button
            type="button"
            onClick={goNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/30 transition hover:bg-white/[0.05] hover:text-[#ff78b9]"
            aria-label="Próximo mês"
          >
            <ChevronRightIcon />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {[
            'D',
            'S',
            'T',
            'Q',
            'Q',
            'S',
            'S',
          ].map(
            (
              day,
              index
            ) => (
              <div
                key={`${day}-${index}`}
                className="flex h-7 items-center justify-center text-[9px] font-bold text-white/20"
              >
                {day}
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(
            (
              day,
              index
            ) => {
              if (
                day === null
              ) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="h-10"
                  />
                );
              }

              const dayUpdates =
                getUpdatesForDay(
                  day
                );

              const today =
                new Date();

              const isToday =
                today.getFullYear() ===
                  year &&
                today.getMonth() ===
                  month &&
                today.getDate() ===
                  day;

              return (
                <div
                  key={day}
                  className={`relative flex h-10 items-center justify-center rounded-xl text-[10px] transition ${
                    isToday
                      ? 'bg-[#ff78b9]/[0.09] font-black text-[#ff78b9]'
                      : 'text-white/45 hover:bg-white/[0.025]'
                  }`}
                >
                  <span
                    className={
                      dayUpdates.length
                        ? 'relative z-10'
                        : ''
                    }
                  >
                    {day}
                  </span>

                  {dayUpdates.length >
                    0 && (
                    <div className="absolute bottom-0.5 left-1/2 flex -translate-x-1/2 items-center gap-[2px]">
                      {dayUpdates
                        .slice(
                          0,
                          3
                        )
                        .map(
                          (
                            update
                          ) => (
                            <span
                              key={
                                update.id
                              }
                              className="relative block h-[6px] w-[9px]"
                              style={{
                                color:
                                  update.color,
                                filter: `drop-shadow(0 0 4px ${update.color})`,
                              }}
                              title={`${update.author.display_name || update.author.username} — ${update.chapter_title}`}
                            >
                              <CloudIcon
                                className="h-[7px] w-[10px]"
                              />
                            </span>
                          )
                        )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      </div>

      <div
        className={`border-t border-white/[0.06] px-4 py-4 ${
          mobile
            ? 'min-h-0 flex-1 overflow-y-auto'
            : ''
        }`}
      >
        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-white/20">
          Próximas atualizações
        </p>

        <div className="space-y-3">
          {updatesForMonth.length >
          0 ? (
            updatesForMonth
              .slice(0, 8)
              .map(
                (update) => {
                  const date =
                    new Date(
                      update.scheduled_for
                    );

                  const day =
                    date.getDate();

                  return (
                    <Link
                      key={
                        update.id
                      }
                      href={`/historia/${update.story_id}`}
                      onClick={
                        onClose
                      }
                      className="group flex items-start gap-2.5 rounded-xl p-1.5 -mx-1.5 transition hover:bg-white/[0.035]"
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.035]"
                        style={{
                          color:
                            update.color,
                          filter: `drop-shadow(0 0 5px ${update.color}55)`,
                        }}
                      >
                        <CloudIcon
                          className="h-4 w-4"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[11px] font-bold text-white transition group-hover:text-[#ff78b9]">
                            @
                            {
                              update
                                .author
                                .username
                            }
                          </p>

                          <span
                            className="shrink-0 text-[9px] font-bold"
                            style={{
                              color:
                                update.color,
                            }}
                          >
                            {day}{' '}
                            {date.toLocaleDateString(
                              'pt-BR',
                              {
                                month:
                                  'short',
                              }
                            )}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[10px] text-white/45">
                          {update.story_title}
                          {' · '}
                          Cap.{' '}
                          {
                            update.chapter_number
                          }
                        </p>

                        <p className="mt-0.5 text-[9px] text-white/25">
                          {
                            update.chapter_title
                          }{' '}
                          ·{' '}
                          {formatScheduledTime(
                            update.scheduled_for
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                }
              )
          ) : (
            <div className="py-5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.035] text-white/20">
                <CloudIcon />
              </div>

              <p className="mt-3 text-[10px] text-white/25">
                Nenhuma atualização
                programada para este
                mês.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-5 py-3">
        <p className="text-center text-[9px] leading-4 text-white/20">
          As nuvens mostram quando
          suas autoras vão atualizar.
        </p>
      </div>
    </div>
  );
}

function UpcomingUpdatesCard({
  updates,
}: {
  updates: UpcomingUpdate[];
}) {
  return (
    <aside className="hidden w-[270px] shrink-0 lg:block">
      <div className="sticky top-6 overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#100c11]/90 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <UpcomingUpdatesContent
          updates={updates}
        />
      </div>
    </aside>
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
                  ? `/perfil/${encodeURIComponent(comment.author.username)}`
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
                ? `/perfil/${encodeURIComponent(post.author.username)}`
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
                      ? `/perfil/${encodeURIComponent(post.author.username)}`
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
                      ? `/perfil/${encodeURIComponent(post.author.username)}`
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
   MENU MOBILE
========================================================= */

function MobileDrawer({
  open,
  onClose,
  currentUser,
  onOpenCalendar,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  onOpenCalendar: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar menu"
        className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-[2px] lg:hidden"
      />

      <aside className="fixed left-0 top-0 z-[90] flex h-screen w-[84%] max-w-[360px] flex-col overflow-hidden rounded-r-[30px] border-r border-white/[0.08] bg-[#100c11] shadow-[20px_0_80px_rgba(0,0,0,0.45)] lg:hidden">

        <div className="border-b border-white/[0.06] px-5 pb-5 pt-6">
          <div className="flex items-center justify-between">
            <Link
              href="/feed"
              onClick={onClose}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ff78b9]/15 bg-[#ff78b9]/[0.06] text-[#ff78b9]">
                <CloudIcon />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff78b9]/70">
                  Nooklie
                </p>

                <p className="mt-0.5 text-xs font-semibold text-white/45">
                  Entre escritores
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/35 transition hover:bg-white/[0.05] hover:text-white"
              aria-label="Fechar menu"
            >
              <CloseIcon />
            </button>
          </div>

          {/* USER */}

          <Link
            href="/perfil"
            onClick={onClose}
            className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:border-[#ff78b9]/20 hover:bg-white/[0.04]"
          >
            <Avatar
              profile={currentUser}
              size="normal"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {currentUser?.display_name ||
                  currentUser?.username ||
                  'Usuário'}
              </p>

              <p className="mt-0.5 truncate text-xs text-[#ff78b9]/70">
                @
                {currentUser?.username ||
                  'usuario'}
              </p>
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <Link
              href="/feed"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <HomeIcon />
              <span>Início</span>
            </Link>

            <Link
              href="/perfil"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white/65 transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <UserIcon />
              <span>Meu perfil</span>
            </Link>

            <Link
              href="/minhas-historias"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white/65 transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <BookIcon />
              <span>Minhas histórias</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCalendar();
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold text-white/65 transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <CalendarIcon />
              <span>Próximas atualizações</span>
            </button>

            <Link
              href="/salvos"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white/65 transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <BookmarkMenuIcon />
              <span>Salvos</span>
            </Link>

            <Link
              href="/configuracoes"
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white/65 transition hover:bg-[#ff78b9]/[0.07] hover:text-[#ff78b9]"
            >
              <SettingsIcon />
              <span>Configurações</span>
            </Link>
          </div>
        </nav>

        {/* LOGOUT */}

        <div className="border-t border-white/[0.06] p-3">
          <Link
            href="/logout"
            onClick={onClose}
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white/40 transition hover:bg-red-400/[0.05] hover:text-red-300"
          >
            <LogoutIcon />
            <span>Sair</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

/* =========================================================
   CALENDÁRIO MOBILE
========================================================= */

function MobileCalendarModal({
  open,
  updates,
  onClose,
}: {
  open: boolean;
  updates: UpcomingUpdate[];
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 p-3 backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex h-full max-w-[520px] flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#100c11] shadow-[0_25px_100px_rgba(0,0,0,0.5)]">
        <UpcomingUpdatesContent
          updates={updates}
          onClose={onClose}
          mobile
        />
      </div>
    </div>
  );
}

/* =========================================================
   FEED PAGE
========================================================= */

export default function FeedPage() {
  const [posts, setPosts] =
    useState<Post[]>([]);

  const [
    currentUser,
    setCurrentUser,
  ] = useState<CurrentUser | null>(
    null
  );

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

  const [
    composerOpen,
    setComposerOpen,
  ] = useState(false);

  const [
    upcomingUpdates,
    setUpcomingUpdates,
  ] = useState<
    UpcomingUpdate[]
  >([]);

  const [
    drawerOpen,
    setDrawerOpen,
  ] = useState(false);

  const [
    calendarOpen,
    setCalendarOpen,
  ] = useState(false);

  /* =======================================================
     USUÁRIO LOGADO
  ======================================================= */

  const loadCurrentUser =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            '/api/auth/me',
            {
              cache: 'no-store',
            }
          );

        const data =
          await response.json();

        if (
          response.ok &&
          data.authenticated &&
          data.user
        ) {
          setCurrentUser(
            data.user
          );
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error(
          'Erro ao carregar usuário:',
          error
        );

        setCurrentUser(null);
      }
    }, []);

  /* =======================================================
     CARREGAR FEED
  ======================================================= */

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

  /* =======================================================
     CARREGAR PRÓXIMAS ATUALIZAÇÕES
  ======================================================= */

  const loadUpcomingUpdates =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            '/api/upcoming-updates',
            {
              cache: 'no-store',
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              'Não foi possível carregar as próximas atualizações.'
          );
        }

        const rawUpdates: ApiUpcomingUpdate[] =
          data.updates || [];

        const authorIds =
          Array.from(
            new Set(
              rawUpdates.map(
                (update) =>
                  update.author.id
              )
            )
          );

        const coloredUpdates =
          rawUpdates.map(
            (update) => ({
              ...update,
              color:
                getAuthorColor(
                  update.author.id,
                  authorIds
                ),
            })
          );

        setUpcomingUpdates(
          coloredUpdates
        );
      } catch (error) {
        console.error(
          'Erro ao carregar próximas atualizações:',
          error
        );

        setUpcomingUpdates([]);
      }
    }, []);

  useEffect(() => {
    loadCurrentUser();
    loadFeed();
    loadUpcomingUpdates();
  }, [
    loadCurrentUser,
    loadFeed,
    loadUpcomingUpdates,
  ]);

  useEffect(() => {
    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          loadUpcomingUpdates();
        }
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibility
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibility
      );
    };
  }, [
    loadUpcomingUpdates,
  ]);

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

      {/* MOBILE DRAWER */}

      <MobileDrawer
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
        currentUser={
          currentUser
        }
        onOpenCalendar={() =>
          setCalendarOpen(true)
        }
      />

      {/* MOBILE CALENDAR */}

      <MobileCalendarModal
        open={calendarOpen}
        updates={
          upcomingUpdates
        }
        onClose={() =>
          setCalendarOpen(false)
        }
      />

      <div className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8 lg:pt-5">

        {/* HEADER */}

        <header className="mb-6 flex items-center justify-between">

          {/* MOBILE AVATAR */}

          <button
            type="button"
            onClick={() =>
              setDrawerOpen(true)
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ff78b9]/20 bg-[#ff78b9]/[0.06] p-[2px] lg:hidden"
            aria-label="Abrir menu"
          >
            <Avatar
              profile={currentUser}
              size="small"
            />
          </button>

          {/* BRAND */}

          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[#ff78b9]/15 bg-[#ff78b9]/[0.06] text-[#ff78b9] sm:flex">
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

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => {
              loadFeed(true);
              loadUpcomingUpdates();
            }}
            disabled={refreshing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-[#ff78b9]/30 hover:bg-[#ff78b9]/[0.06] hover:text-[#ff78b9] disabled:opacity-40 sm:h-11 sm:w-11"
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

        {/* =================================================
            LAYOUT PRINCIPAL
        ================================================= */}

        <div className="flex items-start justify-center gap-7">

          {/* COLUNA CENTRAL */}

          <div className="w-full max-w-[680px]">

            {/* CREATE POST */}

            <div className="mb-7 w-full">
              <button
                type="button"
                onClick={() =>
                  setComposerOpen(true)
                }
                className="group w-full overflow-hidden rounded-[26px] border border-[#ff78b9]/15 bg-gradient-to-br from-[#ff78b9]/[0.09] via-white/[0.035] to-[#c63dff]/[0.05] p-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition duration-300 hover:border-[#ff78b9]/35 hover:shadow-[0_20px_70px_rgba(255,120,185,0.08)] sm:p-6"
              >
                <div className="flex items-center gap-4">

                  {/* AVATAR */}

                  <div className="relative shrink-0">
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-[#ff78b9]/30 bg-[#ff78b9] font-black text-lg text-[#190d16] shadow-[0_0_25px_rgba(255,120,185,0.12)] sm:h-16 sm:w-16">
                      {currentUser?.avatar_url ? (
                        <img
                          src={
                            currentUser.avatar_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          {getInitial(
                            currentUser
                          )}
                        </div>
                      )}
                    </div>

                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#100c11] bg-[#ff78b9] text-[#190d16]">
                      <span className="text-base leading-none">
                        +
                      </span>
                    </span>
                  </div>

                  {/* TEXTO */}

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-black text-white sm:text-lg">
                      Compartilhe alguma coisa
                    </p>

                    <p className="mt-1 text-sm leading-5 text-white/40">
                      Uma ideia, uma descoberta,
                      uma história...
                    </p>
                  </div>

                  {/* INDICADOR */}

                  <div className="hidden shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/45 transition group-hover:border-[#ff78b9]/25 group-hover:bg-[#ff78b9]/[0.08] group-hover:text-[#ff78b9] sm:flex">
                    Publicar
                  </div>
                </div>

                {/* LINHA INFERIOR */}

                <div className="mt-5 border-t border-white/[0.07] pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/25">
                      O que está passando pela sua
                      cabeça?
                    </span>

                    <span className="text-xs font-semibold text-[#ff78b9]/50 transition group-hover:text-[#ff78b9]">
                      Criar publicação →
                    </span>
                  </div>
                </div>
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
              <div className="w-full space-y-5">
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
              <div className="w-full space-y-5">
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

          {/* =================================================
              PRÓXIMAS ATUALIZAÇÕES DESKTOP
          ================================================= */}

          <UpcomingUpdatesCard
            updates={
              upcomingUpdates
            }
          />
        </div>
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
          loadUpcomingUpdates();
        }}
      />
    </main>
  );
}
