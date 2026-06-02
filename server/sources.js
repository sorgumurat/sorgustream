// ─────────────────────────────────────────────────────────────
//  Embed Kaynak Toplayıcı
//  Her provider TMDB ID ile embed URL üretir
//  Film: getEmbedSources('movie', tmdbId)
//  Dizi: getEmbedSources('tv', tmdbId, season, episode)
// ─────────────────────────────────────────────────────────────

// ── Provider tanımları ───────────────────────────────────────
// urlFn: embed iframe URL üretici
// langs: desteklenen diller
// qualities: sunduğu kalite seçenekleri
// hasDub: Türkçe dublaj desteği
// hasSub: altyazı desteği

const MOVIE_PROVIDERS = [
  {
    id: 'vidsrc_xyz',
    name: 'VidSrc',
    icon: '🎬',
    qualities: ['1080p', '720p', '480p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en'],
    urlFn: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
  },
  {
    id: 'vidsrc_me',
    name: 'VidSrc.me',
    icon: '📺',
    qualities: ['720p', '480p'],
    hasDub: false,
    hasSub: true,
    langs: ['en'],
    urlFn: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
  },
  {
    id: 'embedsu',
    name: 'EmbedSU',
    icon: '🌐',
    qualities: ['1080p', '720p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en', 'de'],
    urlFn: (id) => `https://embed.su/embed/movie/${id}`,
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    icon: '⚡',
    qualities: ['1080p', '720p', '480p'],
    hasDub: false,
    hasSub: true,
    langs: ['en'],
    urlFn: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    icon: '🔄',
    qualities: ['720p', '480p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en'],
    urlFn: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
  },
  {
    id: '2embed',
    name: '2Embed',
    icon: '🎥',
    qualities: ['1080p', '720p'],
    hasDub: false,
    hasSub: true,
    langs: ['en'],
    urlFn: (id) => `https://www.2embed.cc/embed/${id}`,
  },
];

const TV_PROVIDERS = [
  {
    id: 'vidsrc_xyz',
    name: 'VidSrc',
    icon: '🎬',
    qualities: ['1080p', '720p', '480p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en'],
    urlFn: (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'vidsrc_me',
    name: 'VidSrc.me',
    icon: '📺',
    qualities: ['720p', '480p'],
    hasDub: false,
    hasSub: true,
    langs: ['en'],
    urlFn: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    id: 'embedsu',
    name: 'EmbedSU',
    icon: '🌐',
    qualities: ['1080p', '720p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en', 'de'],
    urlFn: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    icon: '⚡',
    qualities: ['1080p', '720p', '480p'],
    hasDub: false,
    hasSub: true,
    langs: ['en'],
    urlFn: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    icon: '🔄',
    qualities: ['720p', '480p'],
    hasDub: true,
    hasSub: true,
    langs: ['tr', 'en'],
    urlFn: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
];

// ── TMDB-Embed-API entegrasyonu (sorgumurat/TMDB-Embed-API) ───
// Bu API kendi sunucunuzda çalışır ve ek kaynaklar sağlar
// .env'e TMDB_EMBED_API_URL=http://localhost:4000 yazın
async function fetchTMDBEmbedAPI(type, id, season, episode) {
  const base = process.env.TMDB_EMBED_API_URL;
  if (!base) return [];

  try {
    let url;
    if (type === 'movie') {
      url = `${base}/movie?id=${id}`;
    } else {
      url = `${base}/tv?id=${id}&s=${season}&e=${episode}`;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();

    // TMDB-Embed-API formatını normalize et
    return (data.sources || data || []).map(s => ({
      id: `tmdb_embed_${s.provider || s.name}`.toLowerCase().replace(/\s/g, '_'),
      name: s.provider || s.name || 'TMDB Embed',
      icon: '🔗',
      embedUrl: s.url || s.embed_url || s.link,
      qualities: s.qualities || [s.quality || '720p'],
      hasDub: s.dubbed ?? false,
      hasSub: s.subtitles ?? true,
      langs: s.langs || ['en'],
      source: 'tmdb-embed-api',
    }));
  } catch {
    return [];
  }
}

// ── Tüm kaynakları topla ve döndür ───────────────────────────
export async function getEmbedSources(type, id, season = 1, episode = 1) {
  const providers = type === 'movie' ? MOVIE_PROVIDERS : TV_PROVIDERS;

  // Statik provider URL'leri oluştur
  const staticSources = providers.map(p => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    embedUrl: type === 'movie' ? p.urlFn(id) : p.urlFn(id, season, episode),
    qualities: p.qualities,
    hasDub: p.hasDub,
    hasSub: p.hasSub,
    langs: p.langs,
    source: 'static',
  }));

  // TMDB-Embed-API'den ek kaynaklar getir (async, hata verirse boş döner)
  const dynamicSources = await fetchTMDBEmbedAPI(type, id, season, episode);

  // Birleştir, önce dinamik kaynaklar (daha güncel)
  const all = [...dynamicSources, ...staticSources];

  return {
    type,
    id,
    ...(type === 'tv' ? { season: Number(season), episode: Number(episode) } : {}),
    sources: all,
    count: all.length,
  };
}
