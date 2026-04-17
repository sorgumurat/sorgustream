import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { searchTMDB, getTrending } from './tmdb.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// LİNKLERİNİZİ BURAYA YAPIŞTIRIN
const M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/canl%C4%B1%20tv.m3u';
const RADIO_M3U_URL = 'https://raw.githubusercontent.com/sorgumurat/sorguportal/refs/heads/main/RadyoSeytan.m3u'; 

async function parseM3U(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split('\n');
    const playlist = [];

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#EXTINF:')) {
        const name = lines[i].split(',')[1]?.trim() || "Kanal";
        const logo = lines[i].match(/tvg-logo="([^"]+)"/)?.[1] || null;
        const group = lines[i].match(/group-title="([^"]+)"/)?.[1] || "Genel";
        let streamUrl = lines[i + 1]?.trim();

        if (streamUrl && !streamUrl.startsWith('#')) {
          // VLC MANTIĞI: .pls uzantılı dosyaları doğrudan akışa çevirir
          if (streamUrl.includes('listen.pls')) {
              // Shoutcast/Icecast için klasik çözüm: sonuna ';' eklemek tarayıcıyı zorlar
              streamUrl = streamUrl.replace('listen.pls', ';');
          }
          playlist.push({ name, url: streamUrl, logo, group });
        }
      }
    }
    return playlist;
  } catch (e) { return []; }
}

app.get('/api/m3u-list', async (req, res) => res.json(await parseM3U(M3U_URL)));
app.get('/api/radio-list', async (req, res) => res.json(await parseM3U(RADIO_M3U_URL)));

app.get('/api/trending', async (req, res) => {
  const data = await getTrending('all', 'week', 'tr-TR');
  res.json(data);
});

app.get('/api/search', async (req, res) => {
  const results = await searchTMDB(req.query.q, 'tr-TR');
  res.json(results);
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.listen(PORT, () => console.log(`Sunucu aktif: ${PORT}`));
