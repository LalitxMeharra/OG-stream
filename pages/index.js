import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function Player() {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Aap yahan apna fresh signed URL paste karein
  // (Jab token expire ho jaye, toh yahan naya URL daal dena)
  const DEFAULT_URL = "https://in-mc-flive.fancode.com/mumbai/4250526_english_hls_d3c070eb3076082_1ta-di_h264/index.m3u8?hdnea=exp=1793258164~acl=/mumbai/4250526_english_hls_d3c070eb3076082_1ta-di_h264/*~SessionID=2402:8100:2d60:9c14:ab9d:cb8d:a896:da03_4250526_fc-web_4216e7bb-32f3-41~data=2402:8100:2d60:9c14:ab9d:cb8d:a896:da03_4250526_free_160~hmac=9e738777c06d3962f68ff4a3cb20d6d4212a8783e0530300bb4e85dc8364b983&deviceId=undefined&advertiserId=undefined&ft_type=c1";

  const loadStream = (url) => {
    if (!videoRef.current) return;
    
    setLoading(true);
    setError('');
    const video = videoRef.current;
    
    // Hum apne Next.js backend proxy ke through request bhej rahe hain
    const proxiedUrl = `/api/fetch-stream?url=${encodeURIComponent(url)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: true,
      });

      hls.loadSource(proxiedUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(e => console.log("Autoplay blocked:", e));
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          setLoading(false);
          setError('Failed to load stream. Token expired ya link invalid hai. Fresh URL capture karein.');
          console.error(data);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = proxiedUrl;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play();
      });
    } else {
      setError('Aapka browser HLS support nahi karta.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center' }}>Fancode Live Stream Player</h1>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Paste fresh signed .m3u8 URL here..."
            defaultValue={DEFAULT_URL}
            onChange={(e) => setStreamUrl(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '16px', borderRadius: '4px', border: 'none', color: 'black' }}
          />
          <button 
            onClick={() => loadStream(streamUrl || DEFAULT_URL)}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#ff5722', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Play Stream
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#d32f2f', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <div style={{ position: 'relative', paddingTop: '56.25%', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
          {loading && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontWeight: 'bold' }}>
              Stream Loading... (Backend proxy se fetch ho raha hai)
            </div>
          )}
          <video 
            ref={videoRef} 
            controls 
            muted
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
              }
