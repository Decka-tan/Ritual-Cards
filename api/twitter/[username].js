export default async function handler(req, res) {
  const { username } = req.query;
  const cleanUsername = username.replace('@', '').trim();

  let displayName = cleanUsername;
  let avatarBase64 = null;

  console.log(`[twitter] Fetching profile for: ${cleanUsername}`);

  // ── 1. Twitter's public Follow Button info API ──
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const twRes = await fetch(
      `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${cleanUsername}`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RitualCards/1.0)' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    console.log(`[twitter] CDN API status: ${twRes.status}`);
    if (twRes.ok) {
      const text = await twRes.text();
      console.log(`[twitter] CDN API raw response: ${text.slice(0, 200)}`);
      const data = JSON.parse(text);
      // Response can be array or object keyed by screen_name
      if (Array.isArray(data) && data[0]?.name) {
        displayName = data[0].name;
        console.log(`[twitter] displayName from CDN API (array): ${displayName}`);
      } else if (data && typeof data === 'object') {
        const user = Object.values(data)[0];
        if (user?.name) {
          displayName = user.name;
          console.log(`[twitter] displayName from CDN API (object): ${displayName}`);
        }
      }
    }
  } catch (e) {
    console.log(`[twitter] CDN API failed: ${e.message}`);
  }

  // ── 2. Nitter scraping (for avatar + displayName fallback) ──
  const nitterInstances = [
    'https://nitter.net',
    'https://nitter.poast.org',
    'https://nitter.privacydev.net',
  ];

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