export function normalizeYouTubeUrl(value) {
  const parsed = parseYouTubeUrl(value);
  return parsed?.url.href ?? null;
}

export function getYouTubeEmbedUrl(value) {
  const parsed = parseYouTubeUrl(value);
  return parsed ? `https://www.youtube-nocookie.com/embed/${parsed.videoId}?autoplay=1&rel=0` : null;
}

function parseYouTubeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;

  try {
    const url = new URL(value.trim());
    const hostname = url.hostname.toLowerCase();
    const isYouTubeHost = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be']
      .includes(hostname);

    if (url.protocol !== 'https:' || !isYouTubeHost || url.username || url.password) {
      return null;
    }

    const videoId = hostname.endsWith('youtu.be')
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.pathname === '/watch'
        ? url.searchParams.get('v')
        : url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1];

    return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? { url, videoId } : null;
  } catch {
    return null;
  }
}
