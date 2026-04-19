export default async function handler(req, res) {
  const { username } = req.query;
  const cleanUsername = username.replace('@', '').trim();

  let displayName = cleanUsername;
  let avatarBase64 = null;

  console.log(`[twitter] Fetching profile for: ${cleanUsername}`);

  const nitterInstances = [
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
    'https://nitter.net',
    'https://nitter.cz',
    'https://nitter.1d4.us',
  ];

  // ── 1. Nitter Mastodon-compatible JSON API (structured, no HTML parsing) ──
  for (const instance of nitterInstances) {
    if (displayName !== cleanUsername) break;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`${instance}/api/v1/accounts/lookup?acct=${cleanUsername}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: ctrl.signal,
      });
      clearTimeout(t);
      console.log(`[twitter] Mastodon API ${instance}: ${r.status}`);
      if (r.ok) {
        const data = await r.json();
        if (data?.display_name && data.display_name !== cleanUsername) {
          displayName = data.display_name;
          console.log(`[twitter] displayName from Mastodon API: ${displayName}`);
          break;
        }
      }
    } catch (e) { console.log(`[twitter] Mastodon API ${instance} failed: ${e.message}`); }
  }

  // ── 2. Twitter Follow Button CDN API (direct + via proxy if blocked) ──
  if (displayName === cleanUsername) {
    const cdnUrl = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${cleanUsername}`;
    const attempts = [
      // Direct call
      { url: cdnUrl, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'identity' } },
      // Via AllOrigins proxy (different IP, bypasses Vercel block)
      { url: `https://api.allorigins.win/raw?url=${encodeURIComponent(cdnUrl)}`, headers: { 'User-Agent': 'Mozilla/5.0' } },
    ];
    for (const attempt of attempts) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(attempt.url, { headers: attempt.headers, signal: ctrl.signal });
        clearTimeout(t);
        console.log(`[twitter] CDN attempt ${attempt.url.slice(0,40)}: ${r.status}`);
        if (r.ok) {
          const text = await r.text();
          console.log(`[twitter] CDN body (${text.length} chars): ${text.slice(0, 100)}`);
          if (text.trim().length > 0) {
            const data = JSON.parse(text);
            const user = Array.isArray(data) ? data[0] : Object.values(data || {})[0];
            if (user?.name && user.name !== cleanUsername) {
              displayName = user.name;
              console.log(`[twitter] displayName from CDN: ${displayName}`);
              break;
            }
          }
        }
      } catch (e) { console.log(`[twitter] CDN attempt failed: ${e.message}`); }
    }
  }

  // ── 3. Nitter RSS (structured, lighter than HTML) ──
  if (displayName === cleanUsername) {
    for (const instance of nitterInstances) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 6000);
        const r = await fetch(`${instance}/${cleanUsername}/rss`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, text/xml' },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        console.log(`[twitter] RSS ${instance}: ${r.status}`);
        if (r.ok) {
          const xml = await r.text();
          const match = xml.match(/<title><!\[CDATA\[(.+?)\s*\/\s*[^<\]]+\]\]><\/title>/)
                     || xml.match(/<title>([^<\/]+?)\s*\/\s*[^<]+<\/title>/);
          if (match?.[1] && match[1].trim() !== cleanUsername) {
            displayName = match[1].trim();
            console.log(`[twitter] displayName from RSS: ${displayName}`);
            break;
          }
        }
      } catch (e) { console.log(`[twitter] RSS ${instance} failed: ${e.message}`); }
    }
  }

  // ── 4. Nitter scraping (for avatar + fallback) ──
  for (const instance of nitterInstances) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);

      const response = await fetch(`${instance}/${cleanUsername}`, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Accept-Language': 'en-US',
        },
        signal: ctrl.signal,
      });
      clearTimeout(t);

      console.log(`[twitter] Nitter ${instance} status: ${response.status}`);
      if (!response.ok) continue;

      const html = await response.text();
      if (html.length < 500) { console.log(`[twitter] Nitter HTML too short`); continue; }

      // Only grab displayName from nitter if Twitter CDN API didn't get it
      if (displayName === cleanUsername) {
        const namePatterns = [
          /<title[^>]*>(.+?)\s*\(@[^)]+\)/,
          /<a class="profile-card-fullname"[^>]*>([^<]+)<\/a>/,
          /<span class="profile-name"[^>]*>([^<]+)<\/span>/,
        ];

        for (const pattern of namePatterns) {
          const match = html.match(pattern);
          if (match?.[1]) {
            const name = match[1]
              .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
            if (name && name !== cleanUsername) {
              displayName = name;
              console.log(`[twitter] displayName from Nitter: ${displayName}`);
              break;
            }
          }
        }
      }

      // Extract Avatar from Nitter HTML
      const avatarMatch = html.match(/<img[^>]+class="profile-card-avatar"[^>]+src="([^"]+)"/i)
                       || html.match(/<a class="profile-card-avatar"[^>]*>\s*<img[^>]+src="([^"]+)"/i);

      if (avatarMatch?.[1]) {
        const rawAvatarUrl = `${instance}${avatarMatch[1]}`;
        try {
          const imgCtrl = new AbortController();
          const imgT = setTimeout(() => imgCtrl.abort(), 6000);
          const imgRes = await fetch(rawAvatarUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': instance },
            signal: imgCtrl.signal,
          });
          clearTimeout(imgT);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
            avatarBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
            console.log(`[twitter] Avatar fetched from Nitter (${buffer.length} bytes)`);
          }
        } catch (e) {
          console.log(`[twitter] Avatar download failed: ${e.message}`);
        }
      }

      if (displayName !== cleanUsername || avatarBase64) break;
    } catch (err) {
      console.log(`[twitter] Nitter instance error: ${err.message}`);
      continue;
    }
  }

  // ── 3. Avatar fallback services ──
  if (!avatarBase64) {
    const avatarServices = [
      { url: `https://unavatar.io/twitter/${cleanUsername}`, name: 'unavatar' },
      { url: `https://i.pravatar.cc/150?u=${cleanUsername}`, name: 'pravatar' },
    ];

    for (const service of avatarServices) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const avatarRes = await fetch(service.url, {
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' },
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (avatarRes.ok) {
          const contentType = avatarRes.headers.get('content-type') || '';
          if (contentType.startsWith('image/') || contentType.includes('svg')) {
            const arrayBuffer = await avatarRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            avatarBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
            console.log(`[twitter] Avatar from ${service.name}`);
            break;
          }
        }
      } catch (e) {
        console.log(`[twitter] ${service.name} failed: ${e.message}`);
      }
    }
  }

  console.log(`[twitter] Final → displayName: ${displayName}, avatar: ${avatarBase64 ? 'yes' : 'no'}`);

  res.status(200).json({
    avatar: avatarBase64,
    displayName,
    username: cleanUsername,
  });
}