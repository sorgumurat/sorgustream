// ─────────────────────────────────────────────────────────────
//  TMDB API Wrapper
//  Çoklu API key desteği + otomatik rotasyon
//  https://developers.themoviedb.org/3
// ─────────────────────────────────────────────────────────────

const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

// .env'den veya çevre değişkenlerinden API key'leri al
// Birden fazla key virgülle ayırarak yazabilirsin: KEY1,KEY2,KEY3
const RAW_KEYS = (process.env.TMDB_API_KEYS || process.env.TMDB_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
let keyIndex = 0;

function getKey() {
  if (!RAW_KEYS.length) throw new Error('TMDB_API_KEY env değişkeni tanımlı değil!');
  const key = RAW_KEYS[keyIndex % RAW_KEYS.length];
  keyIndex++;
  return key;
}

async function tmdbFetch(endpoint, params = {}, lang = 'tr-TR') {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', getKey());
  url.searchParams.set('language', lang);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${res.statusText}`);
  return res.json();
}

// Görsel URL yardımcısı
export function imgUrl(path, size = 'w500') {
  if (!path) return null;
  return `${IMAGE_BASE}/${size}${path}`;
}

// Arama (film + dizi birlikte)
export async function searchTMDB(query, lang = 'tr-TR') {
  const data = await tmdbFetch('/search/multi', { query, include_adult: false }, lang);
  return {
    results: data.results
      .filter(r => r.media_type !== 'person')
      .map(normalizeItem),
    total: data.total_results,
  };
}

// Trend içerikler: type = all|movie|tv, period = day|week
export async function getTrending(type = 'all', period = 'week', lang = 'tr-TR') {
  const data = await tmdbFetch(`/trending/${type}/${period}`, {}, lang);
  return data.results.map(normalizeItem);
}

// Popüler: type = movie|tv
export async function getPopular(type = 'movie', lang = 'tr-TR') {
  const data = await tmdbFetch(`/${type}/popular`, { page: 1 }, lang);
  return data.results.map(r => normalizeItem({ ...r, media_type: type }));
}

// Film detay (cast, trailer, benzerler dahil)
export async function getMovieDetails(id, lang = 'tr-TR') {
  const [detail, credits, videos, similar] = await Promise.all([
    tmdbFetch(`/movie/${id}`, {}, lang),
    tmdbFetch(`/movie/${id}/credits`, {}, lang),
    tmdbFetch(`/movie/${id}/videos`, {}, lang),
    tmdbFetch(`/movie/${id}/similar`, {}, lang),
  ]);

  return {
    ...normalizeItem({ ...detail, media_type: 'movie' }),
    cast: credits.cast.slice(0, 12).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      photo: imgUrl(c.profile_path, 'w185'),
    })),
    trailer: videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
    similar: similar.results.slice(0, 8).map(r => normalizeItem({ ...r, media_type: 'movie' })),
  };
}

// Dizi detay (sezonlar + cast dahil)
export async function getTVDetails(id, lang = 'tr-TR') {
  const [detail, credits, videos, similar] = await Promise.all([
    tmdbFetch(`/tv/${id}`, {}, lang),
    tmdbFetch(`/tv/${id}/credits`, {}, lang),
    tmdbFetch(`/tv/${id}/videos`, {}, lang),
    tmdbFetch(`/tv/${id}/similar`, {}, lang),
  ]);

  return {
    ...normalizeItem({ ...detail, media_type: 'tv' }),
    seasons: detail.seasons
      .filter(s => s.season_number > 0)
      .map(s => ({
        number: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        poster: imgUrl(s.poster_path, 'w300'),
        airDate: s.air_date,
      })),
    cast: credits.cast.slice(0, 12).map(c => ({
      id: c.id,
      name: c.name,
      character: c.character,
      photo: imgUrl(c.profile_path, 'w185'),
    })),
    trailer: videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key || null,
    similar: similar.results.slice(0, 8).map(r => normalizeItem({ ...r, media_type: 'tv' })),
  };
}

// Normalize: farklı endpoint formatlarını birleştir
function normalizeItem(item) {
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  return {
    id: item.id,
    type,
    title: item.title || item.name,
    originalTitle: item.original_title || item.original_name,
    overview: item.overview,
    poster: imgUrl(item.poster_path, 'w500'),
    backdrop: imgUrl(item.backdrop_path, 'w1280'),
    rating: Math.round((item.vote_average || 0) * 10) / 10,
    votes: item.vote_count,
    year: (item.release_date || item.first_air_date || '').slice(0, 4),
    genres: (item.genres || item.genre_ids || []).map(g =>
      typeof g === 'object' ? g.name : GENRE_MAP[g] || g
    ),
    runtime: item.runtime || null,
    status: item.status || null,
    language: item.original_language,
  };
}

// TMDB genre id → isim (arama sonuçlarında genres array of id gelir)
const GENRE_MAP = {
  28: 'Aksiyon', 12: 'Macera', 16: 'Animasyon', 35: 'Komedi',
  80: 'Suç', 99: 'Belgesel', 18: 'Drama', 10751: 'Aile',
  14: 'Fantezi', 36: 'Tarih', 27: 'Korku', 10402: 'Müzik',
  9648: 'Gizem', 10749: 'Romantik', 878: 'Bilim Kurgu',
  10770: 'TV Filmi', 53: 'Gerilim', 10752: 'Savaş', 37: 'Western',
  10759: 'Aksiyon & Macera', 10762: 'Çocuk', 10763: 'Haber',
  10764: 'Gerçeklik', 10765: 'Sci-Fi & Fantezi', 10766: 'Soap',
  10767: 'Talk Show', 10768: 'Savaş & Politika',
};
