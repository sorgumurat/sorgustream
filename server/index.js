import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchTMDB, getMovieDetails, getTVDetails, getTrending, getPopular } from './tmdb.js';
import { getEmbedSources } from './sources.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Senin M3U dosyanın adresi
const M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/recFilmlerkategori.m3u';

app.use(cors());
app.use(express.json());
// Statik dosyaları (index.html) public klasöründen servis et
app.use(express.static(path.join(__dirname, '../public')));

// ── M3U Listesi Çekme (Yeni Eklenen) ──────────────────────────
app.get('/api/m3u-list', async (req, res) => {
  try {
    const response = await fetch(M3U_URL);
    if (!response.ok) throw new Error('M3U dosyası indirilemedi');
    
    const text = await response.text();
    const lines = text.split('\n');
    const playlist = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        // İsim ayıklama
        const namePart = lines[i].split(',')[1];
        const name = namePart ? namePart.trim() : "Bilinmeyen Kanal";
        
        // Logo ayıklama (tvg-logo="...")
        const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : null;

        // Bir sonraki satır URL olmalı
        const url = lines[i + 1] ? lines[i + 1].trim() : null;

        if (url && !url.startsWith('#')) {
          playlist.push({ name, url, logo });
        }
      }
    }
    res.json(playlist);
  } catch (e) {
    console.error('M3U Hatası:', e.message);
    res.status(500).json({ error: 'M3U listesi hazırlanamadı' });
  }
});

// ── Film/Dizi Arama ──────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q, lang = 'tr-TR' } = req.query;
    if (!q) return res.status(400).json({ error: 'Arama terimi gerekli' });
    const results = await searchTMDB(q, lang);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Trend içerikler ─────────────────────────────────────────────
app.get('/api/trending', async (req, res) => {
  try {
    const { type = 'all', period = 'week', lang = 'tr-TR' } = req.query;
    const data = await getTrending(type, period, lang);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
} );

// ── Popüler içerikler ────────────────────────────────────────────
app.get('/api/popular', async (req, res) => {
  try {
    const { type = 'movie', lang = 'tr-TR', page = 1 } = req.query;
    const data = await getPopular(type, lang, page);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Film detayları ───────────────────────────────────────────────
app.get('/api/movie/:id', async (req, res) => {
  try {
    const data = await getMovieDetails(req.params.id, req.query.lang || 'tr-TR');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Dizi detayları ───────────────────────────────────────────────
app.get('/api/tv/:id', async (req, res) => {
  try {
    const data = await getTVDetails(req.params.id, req.query.lang || 'tr-TR');
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Embed kaynakları (film) ──────────────────────────────────────
app.get('/api/sources/movie/:id', async (req, res) => {
  try {
    const sources = await getEmbedSources('movie', req.params.id);
    res.json(sources);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Embed kaynakları (dizi bölüm) ───────────────────────────────
app.get('/api/sources/tv/:id/:season/:episode', async (req, res) => {
  try {
    const { id, season, episode } = req.params;
    const sources = await getEmbedSources('tv', id, season, episode);
    res.json(sources);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
