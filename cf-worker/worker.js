// Cloudflare Worker — Twitter Profile Proxy
// Deploy: npx wrangler deploy

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Route: /api/twitter/:username
    const match = url.pathname.match(/^\/api\/twitter\/([^\/]+)$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    const cleanUsername = match[1].replace('@', '').trim();
    let displayName = cleanUsername;
    let avatarBase64 = null;

    console.log(`[cf-worker] Fetching: ${cleanUsername}`);

    // Helper: arrayBuffer → base64 (no Buffer in CF Workers)
    const toBase64 = (buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    };

    const nitterInstances = [
      'https://nitter.poast.org',
      'https://nitter.privacydev.net',
      'https://nitter.net',
      'https://nitter.cz',
    ];

    // ── 1. Nitter Mastodon-compatible JSON API ──
    for (const instance of nitterInstances) {
      if (displayName !== cleanUsername) break;
      try {
        const r = await fetch(`${instance}/api/v1/accounts/lookup?acct=${cleanUsername}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000),
        });
        console.log(`[cf-worker] Mastodon ${instance}: ${r.status}`);
        if (r.ok) {
          const data = await r.json();
          if (data?.display_name && data.display_name !== cleanUsername) {
            displayName = data.display_name;
            console.log(`[cf-worker] displayName from Mastodon: ${displayName}`);
            break;
          }
        }
      } catch (e) { console.log(`[cf-worker] Mastodon ${instance} failed: ${e.message}`); }
    }

    // ── 2. Twitter Follow Button CDN API ──
    if (displayName === cleanUsername) {
      try {
        const r = await fetch(
          `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${cleanUsername}`,
          {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'identity' },
            signal: AbortSignal.timeout(5000),
          }
        );
        console.log(`[cf-worker] CDN API: ${r.status}`);
        if (r.ok) {
          const text = await r.text();
          console.log(`[cf-worker] CDN body (${text.length} chars): ${text.slice(0, 100)}`);
          if (text.trim().length > 0) {
            const data = JSON.parse(text);
            const user = Array.isArray(data) ? data[0] : Object.values(data || {})[0];
            if (user?.name && user.name !== cleanUsername) {
              displayName = user.name;
              console.log(`[cf-worker] displayName from CDN: ${displayName}`);
            }
          }
        }
      } catch (e) { console.log(`[cf-worker] CDN API failed: ${e.message}`); }
    }

    // ── 3. Nitter RSS ──
    if (displayName === cleanUsername) {
      for (const instance of nitterInstances) {
        try {
          const r = await fetch(`${instance}/${cleanUsername}/rss`, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, text/xml' },
            signal: AbortSignal.timeout(6000),
          });
          console.log(`[cf-worker] RSS ${instance}: ${r.status}`);
          if (r.ok) {
            const xml = await r.text();
            const m = xml.match(/<title><!\[CDATA\[(.+?)\s*\/\s*[^<\]]+\]\]><\/title>/)
                    || xml.match(/<title>([^<\/]+?)\s*\/\s*[^<]+<\/title>/);
            if (m?.[1] && m[1].trim() !== cleanUsername) {
              displayName = m[1].trim();
              console.log(`[cf-worker] displayName from RSS: ${displayName}`);
              break;
            }
          }
        } catch (e) { console.log(`[cf-worker] RSS ${instance} failed: ${e.message}`); }
      }
    }

    // ── 4. Nitter HTML scraping (avatar + name fallback) ──
    for (const instance of nitterInstances) {
      try {
        const r = await fetch(`${instance}/${cleanUsername}`, {
          headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US' },
          signal: AbortSignal.timeout(8000),
        });
        console.log(`[cf-worker] HTML ${instance}: ${r.status}`);
        if (!r.ok) continue;

        const html = await r.text();
        if (html.length < 500) continue;

        if (displayName === cleanUsername) {
          const patterns = [
            /<title[^>]*>(.+?)\s*\(@[^)]+\)/,
            /<a class="profile-card-fullname"[^>]*>([^<]+)<\/a>/,
          ];
          for (const p of patterns) {
            const m = html.match(p);
            if (m?.[1]) {
              const name = m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
              if (name && name !== cleanUsername) { displayName = name; break; }
            }
          }
        }

        // Avatar
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
              const ct = imgR.headers.get('content-type') || 'image/jpeg';
              avatarBase64 = `data:${ct};base64,${toBase64(buf)}`;
              console.log(`[cf-worker] Avatar from Nitter HTML`);
            }
          } catch (e) {}
        }

        if (displayName !== cleanUsername || avatarBase64) break;
      } catch (e) { console.log(`[cf-worker] HTML ${instance} failed: ${e.message}`); }
    }

    // ── 5. Avatar fallback — unavatar.io ──
    if (!avatarBase64) {
      try {
        const r = await fetch(`https://unavatar.io/twitter/${cleanUsername}`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' },
          signal: AbortSignal.timeout(5000),
          redirect: 'follow',
        });
        if (r.ok) {
          const ct = r.headers.get('content-type') || '';
          if (ct.startsWith('image/') || ct.includes('svg')) {
            const buf = await r.arrayBuffer();
            avatarBase64 = `data:${ct};base64,${toBase64(buf)}`;
            console.log(`[cf-worker] Avatar from unavatar`);
          }
        }
      } catch (e) { console.log(`[cf-worker] unavatar failed: ${e.message}`); }
    }

    console.log(`[cf-worker] Final → displayName: ${displayName}, avatar: ${avatarBase64 ? 'yes' : 'no'}`);

    return new Response(JSON.stringify({ avatar: avatarBase64, displayName, username: cleanUsername }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
