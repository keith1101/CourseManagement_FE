const YOUTUBE_EMBED_BASE_URL = 'https://www.youtube.com/embed';
const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOST_PATTERN = /(^|\.)youtube(?:-nocookie)?\.com$/i;
const YOUTUBE_SHORT_HOST_PATTERN = /(^|\.)youtu\.be$/i;
const YOUTUBE_VIDEO_PATHS = new Set(['embed', 'e', 'v', 'shorts', 'live']);
const YOUTUBE_NESTED_URL_PARAMS = ['u', 'q', 'url'] as const;
const YOUTUBE_VIDEO_QUERY_PARAMS = new Set(['v', 'video_id', 'videoid']);

/**
 * Converts supported YouTube URL variants to an iframe-compatible URL.
 * Non-YouTube URLs are returned unchanged for Google Drive and other embeds.
 */
export const normalizeYoutubeEmbedUrl = (value?: string) => {
  if (value === undefined) return value;

  const input = value.trim();
  if (!input) return input;

  if (isYoutubeVideoId(input)) {
    return `${YOUTUBE_EMBED_BASE_URL}/${input}`;
  }

  const url = parseUrl(input);
  if (!url || !isYoutubeHost(url.hostname)) return input;

  const videoId = extractYoutubeVideoId(url);
  return videoId ? `${YOUTUBE_EMBED_BASE_URL}/${videoId}` : input;
};

const parseUrl = (value: string, baseUrl = 'https://www.youtube.com') => {
  const candidate = value.startsWith('//')
    ? `https:${value}`
    : /^https?:\/\//i.test(value)
      ? value
      : value.startsWith('/')
        ? value
        : `https://${value}`;

  try {
    return new URL(candidate, baseUrl);
  } catch {
    return null;
  }
};

const isYoutubeHost = (hostname: string) => {
  const normalizedHostname = hostname.replace(/\.$/, '');
  return (
    YOUTUBE_HOST_PATTERN.test(normalizedHostname) ||
    YOUTUBE_SHORT_HOST_PATTERN.test(normalizedHostname)
  );
};

const extractYoutubeVideoId = (url: URL, depth = 0): string | null => {
  if (depth > 3) return null;

  const hostname = url.hostname.replace(/\.$/, '').toLowerCase();
  const pathSegments = url.pathname
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponentSafely);

  if (YOUTUBE_SHORT_HOST_PATTERN.test(hostname)) {
    return toYoutubeVideoId(pathSegments[0]) ?? getQueryVideoId(url);
  }

  const firstPathSegment = pathSegments[0]?.toLowerCase();
  if (firstPathSegment === 'watch') {
    return getQueryVideoId(url) ?? toYoutubeVideoId(pathSegments[1]);
  }

  if (firstPathSegment && YOUTUBE_VIDEO_PATHS.has(firstPathSegment)) {
    return toYoutubeVideoId(pathSegments[1]) ?? getQueryVideoId(url);
  }

  if (firstPathSegment === 'attribution_link' || firstPathSegment === 'redirect') {
    for (const parameter of YOUTUBE_NESTED_URL_PARAMS) {
      const nestedValue = url.searchParams.get(parameter);
      if (!nestedValue) continue;

      const nestedUrl = parseUrl(decodeURIComponentSafely(nestedValue));
      if (!nestedUrl || !isYoutubeHost(nestedUrl.hostname)) continue;

      const videoId = extractYoutubeVideoId(nestedUrl, depth + 1);
      if (videoId) return videoId;
    }
  }

  return getQueryVideoId(url);
};

const getQueryVideoId = (url: URL) => {
  for (const [parameter, value] of url.searchParams.entries()) {
    if (!YOUTUBE_VIDEO_QUERY_PARAMS.has(parameter.toLowerCase())) continue;

    const videoId = toYoutubeVideoId(value);
    if (videoId) return videoId;
  }

  return null;
};

const toYoutubeVideoId = (value: string | null | undefined) => {
  if (!value) return null;

  const decodedValue = decodeURIComponentSafely(value).trim();
  return isYoutubeVideoId(decodedValue) ? decodedValue : null;
};

const isYoutubeVideoId = (value: string | null | undefined): value is string =>
  Boolean(value && YOUTUBE_VIDEO_ID_PATTERN.test(value));

const decodeURIComponentSafely = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
