import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchTMDB, getMovieDetails, getTVDetails, getTrending, getPopular } from './tmdb.js';
import { getEmbedSources } from './sources.js';

// Vercel/Node 18+ ortamında fetch yerleşiktir. Değilse diye kontrol:
const fetch = globalThis.fetch;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Statik dosyaların yolu (Vercel için kritik)
app.use(express.static(path.join(__dirname, '../public')));

// ── M3U KATEGORİ LİSTESİ (SENİN LİNKİN) ───────────────────────
const M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/recFilmlerkategori.m3u';

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
    res.status(500).json({ error: "M3U verisi çekilemedi" });
  }
});

// ── STANDART TMDB VE KAYNAK ENDPOINTLERİ ───────────────────────

app.get('/api/trending', async (req, res) => {
  try {
    const data = await getTrending('all', 'week', 'tr-TR');
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
  try {
    const results = await searchTMDB(req.query.q, 'tr-TR');
    res.json(results);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

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

// Catch-all: Diğer tüm istekleri index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => console.log(`Sunucu aktif: ${PORT}`));
