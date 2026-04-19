// Exact same logic as server.js — only difference is Vercel handler vs Express

export default async function handler(req, res) {
  const { username } = req.query;
  const cleanUsername = username.replace('@', '').trim();

  let displayName = cleanUsername;
  let avatarBase64 = null;

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

      if (!response.ok) continue;

      const html = await response.text();
      if (html.length < 500) continue;

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
            break;
          }
        }
      }

      const avatarMatch = html.match(/<img[^>]+class="profile-card-avatar"[^>]+src="([^"]+)"/i)
                       || html.match(/<a class="profile-card-avatar"[^>]*>\s*<img[^>]+src="([^"]+)"/i);

      if (avatarMatch && avatarMatch[1]) {
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
          }
        } catch(e) {}
      }

      if (displayName !== cleanUsername || avatarBase64) break;
    } catch (err) { continue; }
  }

  if (!avatarBase64) {
    const avatarServices = [
      { url: `https://unavatar.io/twitter/${cleanUsername}`, name: 'unavatar-twitter' },
      { url: `https://i.pravatar.cc/150?u=${cleanUsername}`, name: 'pravatar-placeholder' },
    ];

    for (const service of avatarServices) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5000);
        const avatarRes = await fetch(service.url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/*'
          },
          signal: ctrl.signal
        });
        clearTimeout(t);
        if (avatarRes.ok) {
          const contentType = avatarRes.headers.get('content-type') || '';
          if (contentType.startsWith('image/') || contentType.includes('svg')) {
            const arrayBuffer = await avatarRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            avatarBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
            break;
          }
        }
      } catch (error) {}
    }
  }

  res.status(200).json({
    avatar: avatarBase64,
    displayName,
    username: cleanUsername
  });
}