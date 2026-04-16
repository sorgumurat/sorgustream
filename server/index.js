import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchTMDB, getMovieDetails, getTVDetails, getTrending, getPopular } from './tmdb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── LİNKLER ──────────────────────────────────────────────────
const M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/recFilmlerkategori.m3u';
const RADIO_M3U_URL = 'BURAYA_RADYO_M3U_LINKINI_YAPISTIR.m3u'; // <--- Radyo linkini buraya koy

// ── ORTAK M3U PARÇALAYICI FONKSİYON ──────────────────────────
async function parseM3U(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const playlist = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const namePart = lines[i].split(',')[1];
        const name = namePart ? namePart.trim() : "Kanal";
        
        const logoMatch = lines[i].match(/tvg-logo="([^"]+)"/);
        const groupMatch = lines[i].match(/group-title="([^"]+)"/);
        
        const logo = logoMatch ? logoMatch[1] : null;
        const group = groupMatch ? groupMatch[1] : "Genel";
        const streamUrl = lines[i + 1] ? lines[i + 1].trim() : null;

        if (streamUrl && !streamUrl.startsWith('#')) {
          playlist.push({ name, url: streamUrl, logo, group });
        }
      }
    }
    return playlist;
  } catch (e) {
    return [];
  }
}

// ── API ENDPOINTLERİ ─────────────────────────────────────────

// 1. Canlı TV Listesi
app.get('/api/m3u-list', async (req, res) => {
  const data = await parseM3U(M3U_URL);
  res.json(data);
});

// 2. Radyo Listesi (YENİ EKLENDİ)
app.get('/api/radio-list', async (req, res) => {
  const data = await parseM3U(RADIO_M3U_URL);
  res.json(data);
});

// 3. Trendler ve TMDB Diğerleri
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

// Catch-all: index.html'e yönlendir
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => console.log(`Sunucu aktif: ${PORT}`));
