// Cloudflare Worker — Twitter Profile Proxy + Ritual PFP Generator
// Deploy: npx wrangler deploy
// Set secret: npx wrangler secret put XAI_API_KEY

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Helper: arrayBuffer → base64
    const toBase64 = (buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    // ── Route: POST /api/ritual-pfp ──
    if (request.method === 'POST' && url.pathname === '/api/ritual-pfp') {
      try {
        const { username, displayName } = await request.json();
        if (!env.XAI_API_KEY) {
          return new Response(JSON.stringify({ error: 'XAI_API_KEY not configured' }), {
            status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const prompt = `Ritual card profile picture for crypto twitter user "@${username}" (${displayName}). Dark mystical background #060b08, vivid glowing emerald green sparks and particles #40FFAF floating around. Ethereal ritual energy, geometric sigils, premium TCG card character portrait, anime-inspired, cinematic lighting, highly detailed, square format.`;

        const r = await fetch('https://api.x.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.XAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'grok-2-image-1212',
            prompt,
            n: 1,
            response_format: 'b64_json',
          }),
          signal: AbortSignal.timeout(60000),
        });

        if (!r.ok) {
          const err = await r.text();
          return new Response(JSON.stringify({ error: err }), {
            status: r.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const data = await r.json();
        const b64 = data?.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image returned');

        return new Response(JSON.stringify({ avatar: `data:image/png;base64,${b64}` }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // ── Route: GET /api/twitter/:username ──
    const match = url.pathname.match(/^\/api\/twitter\/([^\/]+)$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const cleanUsername = match[1].replace('@', '').trim();
    let displayName = cleanUsername;
    let avatarBase64 = null;

    console.log(`[cf-worker] Fetching: ${cleanUsername}`);
    
    // ── 0. High-Reliability VxTwitter API ──
    try {
      const vxReq = await fetch(`https://api.vxtwitter.com/${cleanUsername}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(5000),
      });
      if (vxReq.ok) {
        const vxData = await vxReq.json();
        if (vxData?.name) {
          displayName = vxData.name;
        }
        if (vxData?.profile_image_url) {
          // Fetch the image from twimg to get base64
          const imgUrl = vxData.profile_image_url.replace('_normal', '_400x400'); // get better quality
          const imgR = await fetch(imgUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (imgR.ok) {
            const buf = await imgR.arrayBuffer();
            avatarBase64 = `data:${imgR.headers.get('content-type') || 'image/jpeg'};base64,${toBase64(buf)}`;
          }
        }
      }
    } catch (e) {
      console.log(`[cf-worker] VxTwitter failed: ${e.message}`);
    }

    // Short-circuit if vxtwitter got everything
    if (avatarBase64 && displayName !== cleanUsername) {
      return new Response(JSON.stringify({ avatar: avatarBase64, displayName, username: cleanUsername }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const nitterInstances = [
      'https://nitter.poast.org',
      'https://nitter.moomoo.me',
      'https://nitter.projectsegfau.lt',
      'https://nitter.privacydev.net',
      'https://nitter.perennialte.ch',
      'https://nitter.mint.lgbt',
      'https://nitter.rocks',
      'https://nitter.no-logs.com',
    ];

    // ── 1. Nitter Mastodon-compatible JSON API ──
    for (const instance of nitterInstances) {
      if (displayName !== cleanUsername) break;
      try {
        const r = await fetch(`${instance}/api/v1/accounts/lookup?acct=${cleanUsername}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        });
        if (r.ok) {
          const data = await r.json();
          if (data?.display_name && data.display_name !== cleanUsername) {
            displayName = data.display_name;
            break;
          }
        }
      } catch (e) {}
    }

    // ── 2. Twitter Follow Button CDN API ──
    if (displayName === cleanUsername) {
      try {
        const r = await fetch(
          `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${cleanUsername}`,
          { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'identity' }, signal: AbortSignal.timeout(5000) }
        );
        if (r.ok) {
          const text = await r.text();
          if (text.trim().length > 0) {
            const data = JSON.parse(text);
            const user = Array.isArray(data) ? data[0] : Object.values(data || {})[0];
            if (user?.name && user.name !== cleanUsername) displayName = user.name;
          }
        }
      } catch (e) {}
    }

    // ── 3. Nitter RSS ──
    if (displayName === cleanUsername) {
      for (const instance of nitterInstances) {
        try {
          const r = await fetch(`${instance}/${cleanUsername}/rss`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, text/xml' },
            signal: AbortSignal.timeout(6000),
          });
          if (r.ok) {
            const xml = await r.text();
            const m = xml.match(/<title><!\[CDATA\[(.+?)\s*\/\s*[^<\]]+\]\]><\/title>/)
                    || xml.match(/<title>([^<\/]+?)\s*\/\s*[^<]+<\/title>/);
            if (m?.[1] && m[1].trim() !== cleanUsername) { displayName = m[1].trim(); break; }
          }
        } catch (e) {}
      }
    }

    // ── 4. Nitter HTML (avatar + name fallback) ──
    for (const instance of nitterInstances) {
      try {
        const r = await fetch(`${instance}/${cleanUsername}`, {
          headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US' },
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) continue;
        const html = await r.text();
        if (html.length < 500) continue;

        if (displayName === cleanUsername) {
          for (const p of [/<title[^>]*>(.+?)\s*\(@[^)]+\)/, /<a class="profile-card-fullname"[^>]*>([^<]+)<\/a>/]) {
            const m = html.match(p);
            if (m?.[1]) {
              const name = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
              if (name && name !== cleanUsername) { displayName = name; break; }
            }
          }
        }

        const avatarMatch = html.match(/<img[^>]+class="profile-card-avatar"[^>]+src="([^"]+)"/i)
                         || html.match(/<a class="profile-card-avatar"[^>]*>\s*<img[^>]+src="([^"]+)"/i);
        if (avatarMatch?.[1]) {
          try {
            const imgR = await fetch(`${instance}${avatarMatch[1]}`, {
              headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': instance },
              signal: AbortSignal.timeout(6000),
            });
            if (imgR.ok) {
              const buf = await imgR.arrayBuffer();
              avatarBase64 = `data:${imgR.headers.get('content-type') || 'image/jpeg'};base64,${toBase64(buf)}`;
            }
          } catch (e) {}
        }

        if (displayName !== cleanUsername || avatarBase64) break;
      } catch (e) {}
    }

    // ── 5. Avatar fallback ──
    if (!avatarBase64) {
      try {
        const r = await fetch(`https://unavatar.io/twitter/${cleanUsername}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(8000), redirect: 'follow',
        });
        if (r.ok) {
          const ct = r.headers.get('content-type') || '';
          if (ct.startsWith('image/') || ct.includes('svg')) {
            avatarBase64 = `data:${ct};base64,${toBase64(await r.arrayBuffer())}`;
          }
        }
      } catch (e) {
        console.error(`[cf-worker] Fallback failed: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ avatar: avatarBase64, displayName, username: cleanUsername }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};
