export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Fancode CDN ko lagta hai request unki site se aa rahi hai
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.fancode.com/',
        'Origin': 'https://www.fancode.com'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
    }

    // Playlist files text hoti hain
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/vnd.apple.mpegurl') || url.includes('.m3u8')) {
      let text = await response.text();
      
      // Agar m3u8 ke andar relative URLs hain, toh unhe proxy ke through route karo
      // (Yeh step zaruri hai warna chunks load nahi honge)
      const baseUrl = new URL(url);
      text = text.replace(/^(?!#)(.*\.ts)$/gm, (match) => {
        const chunkUrl = new URL(match, baseUrl).toString();
        return `/api/fetch-stream?url=${encodeURIComponent(chunkUrl)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(text);
    }

    // Agar .ts chunk hai
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', contentType || 'video/MP2T');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  }
