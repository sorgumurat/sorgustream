# 🎬 StreamHub

TMDB tabanlı, çoklu embed kaynaklı film & dizi izleme platformu.

## Özellikler

- **TMDB Entegrasyonu** — Film/dizi veritabanı, posterler, oyuncu bilgileri, benzerler
- **Çoklu Kaynak** — VidSrc, VidSrc.me, EmbedSU, SuperEmbed, AutoEmbed, 2Embed
- **TMDB-Embed-API** — sorgumurat/TMDB-Embed-API ile ek dinamik kaynaklar
- **Dual Ses** — Dublaj destekleyen kaynaklarda Türkçe/İngilizce
- **Altyazı** — Türkçe, İngilizce, Almanca
- **Arama** — Anlık TMDB film & dizi arama
- **Trend & Popüler** — Haftalık trend ve kategoriye göre popüler içerikler
- **Dizi Desteği** — Sezon/bölüm seçimi
- **Çoklu API Key** — TMDB rate limit aşımında otomatik key rotasyonu

---

## Kurulum

### 1. Gereksinimler

- Node.js 18+
- TMDB API anahtarı → https://www.themoviedb.org/settings/api

### 2. Klonla ve kur

```bash
git clone <repo>
cd streamhub
npm install
```

### 3. Ortam değişkenlerini ayarla

```bash
cp .env.example .env
nano .env
```

`.env` içeriği:
```
TMDB_API_KEYS=your_key_1,your_key_2
TMDB_EMBED_API_URL=http://localhost:4000   # opsiyonel
PORT=3000
```

### 4. Çalıştır

```bash
# Geliştirme (hot-reload)
npm run dev

# Prodüksiyon
npm start
```

Tarayıcıda açın: **http://localhost:3000**

---

## TMDB-Embed-API Entegrasyonu (Opsiyonel)

sorgumurat/TMDB-Embed-API'yi ayrı çalıştırın:

```bash
git clone https://github.com/sorgumurat/TMDB-Embed-API
cd TMDB-Embed-API
cp .env.example .env  # TMDB_API_KEY ekle
npm install && npm start  # varsayılan port: 4000
```

StreamHub `.env`'ine ekleyin:
```
TMDB_EMBED_API_URL=http://localhost:4000
```

StreamHub otomatik olarak bu API'dan ek kaynaklar çekecektir.

---

## Docker ile Çalıştırma

```bash
cp .env.example .env
# .env'i düzenle

docker compose up -d
```

---

## API Endpoints

| Endpoint | Açıklama |
|---|---|
| `GET /api/trending` | Trend içerikler |
| `GET /api/popular?type=movie\|tv` | Popüler içerikler |
| `GET /api/search?q=...` | Film/dizi arama |
| `GET /api/movie/:id` | Film detayı |
| `GET /api/tv/:id` | Dizi detayı |
| `GET /api/sources/movie/:id` | Film embed kaynakları |
| `GET /api/sources/tv/:id/:s/:e` | Dizi bölüm embed kaynakları |

---

## Yeni Kaynak Ekleme

`server/sources.js` dosyasındaki `MOVIE_PROVIDERS` veya `TV_PROVIDERS` dizisine ekleyin:

```js
{
  id: 'yeni_kaynak',
  name: 'Yeni Kaynak',
  icon: '🎯',
  qualities: ['1080p', '720p'],
  hasDub: true,
  hasSub: true,
  langs: ['tr', 'en'],
  urlFn: (id) => `https://orneksite.com/embed/movie/${id}`,
}
```

---

## Lisans

MIT
