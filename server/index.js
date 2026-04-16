import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchTMDB, getMovieDetails, getTVDetails, getTrending, getPopular } from './tmdb.js';
import { getEmbedSources } from './sources.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, '../public')));
// Radyo M3U URL'si
const RADIO_M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/RadyoSeytan.m3u';

app.get('/api/radio-list', async (req, res) => {
  // m3u-list ile aynı mantıkta RADIO_M3U_URL'yi fetch et
});
// ── M3U LİSTESİ ÇEKME (SENİN GITHUB LİNKİN) ───────────────────
const M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/canl%C4%B1%20tv.m3u';

app.get('/api/m3u-list', async (req, res) => {
  try {
    const response = await fetch(M3U_URL);
    const text = await response.text();
    const lines = text.split('\n');
    const playlist = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const namePart = lines[i].split(',')[1];
        const name = namePart ? namePart.trim() : "Kanal";
        
        const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
        const logo = logoMatch ? logoMatch[1] : null;
        
        const url = lines[i + 1] ? lines[i + 1].trim() : null;

        if (url && !url.startsWith('#')) {
          playlist.push({ name, url, logo });
        }
      }
    }
    res.json(playlist);
  } catch (e) {
    res.status(500).json({ error: "M3U listesi çekilemedi: " + e.message });
  }
});

// ── TRENDLER (ANA SAYFA İÇİN) ──────────────────────────────
app.get('/api/trending', async (req, res) => {
  try {
    const { type = 'all', period = 'week', lang = 'tr-TR' } = req.query;
    const data = await getTrending(type, period, lang);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── ARAMA ────────────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const { q, lang = 'tr-TR' } = req.query;
    if (!q) return res.json({ results: [] });
    const results = await searchTMDB(q, lang);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── FİLM VE DİZİ DETAY ───────────────────────────────────────
app.get('/api/movie/:id', async (req, res) => {
  try {
    const data = await getMovieDetails(req.params.id, 'tr-TR');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tv/:id', async (req, res) => {
  try {
    const data = await getTVDetails(req.params.id, 'tr-TR');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Herhangi bir hata durumunda veya doğrudan erişimde index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda hazır.`);
});
