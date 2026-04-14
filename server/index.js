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
app.use(express.static(path.join(__dirname, '../public')));

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
});

// ── Popüler filmler ──────────────────────────────────────────────
app.get('/api/popular', async (req, res) => {
  try {
    const { type = 'movie', lang = 'tr-TR' } = req.query;
    const data = await getPopular(type, lang);
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

// ── SPA fallback ─────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🎬 StreamHub API → http://localhost:${PORT}`);
});
