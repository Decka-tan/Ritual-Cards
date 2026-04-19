export default async function handler(req, res) {
  const { username } = req.query;
  const cleanUsername = username.replace('@', '').trim();

  let displayName = cleanUsername;
  let avatarBase64 = null;

  // ── Primary: Twitter's public Follow Button API (no auth required) ──
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const twRes = await fetch(
      `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${cleanUsername}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: ctrl.signal }
    );
    clearTimeout(t);
    if (twRes.ok) {
      const data = await twRes.json();
      if (Array.isArray(data) && data[0]?.name) {
        displayName = data[0].name;
      }
    }
  } catch (_) {}

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

      // Only scrape display name from nitter if Twitter API didn't get it
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
              break;
            }
          }
        }
      }

      // Extract Avatar URL from Nitter HTML
      const avatarMatch = html.match(/<img[^>]+class="profile-card-avatar"[^>]+src="([^"]+)"/i)
                       || html.match(/<a class="profile-card-avatar"[^>]*>\s*<img[^>]+src="([^"]+)"/i);

      if (avatarMatch && avatarMatch[1]) {
        const rawAvatarUrl = `${instance}${avatarMatch[1]}`;

        // DOWNLOAD the image immediately on the server so Nitter cannot block the frontend browser with hotlink protection!
        try {
           const imgCtrl = new AbortController();
           const imgT = setTimeout(() => imgCtrl.abort(), 6000);
           const imgRes = await fetch(rawAvatarUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': instance },
              signal: imgCtrl.signal
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

  // Helper function to validate image response
  const isValidImage = (contentType, buffer) => {
    if (!contentType || !contentType.startsWith('image/')) return false;

    // Check for valid image signatures (magic numbers)
    const firstBytes = buffer.slice(0, 4);
    const hex = firstBytes.toString('hex');

    // PNG: 89 50 4E 47
    // JPEG: FF D8 FF
    // GIF: 47 49 46 38
    // WebP: 52 49 46 46
    const validSignatures = [
      '89504e47', // PNG
      'ffd8',     // JPEG
      '47494638', // GIF
      '52494646'  // WebP
    ];

    return validSignatures.some(sig => hex.startsWith(sig));
  };

  // Try multiple avatar services with better fallback logic
  if (!avatarBase64) {
    const avatarServices = [
      {
        url: `https://unavatar.io/twitter/${cleanUsername}`,
        name: 'unavatar-twitter'
      },
      {
        url: `https://i.pravatar.cc/150?u=${cleanUsername}`,
        name: 'pravatar-placeholder'
      },
      {
        url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        name: 'dicebear-avatar'
      }
    ];

    for (const service of avatarServices) {
      try {
        console.log(`Trying ${service.name}...`);

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
          const arrayBuffer = await avatarRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // For non-image content types (like SVG), still use them
          if (contentType.startsWith('image/') || contentType.includes('svg')) {
            avatarBase64 = `data:${contentType};base64,${buffer.toString('base64')}`;
            console.log(`✓ Avatar fetched from ${service.name}`);
            break;
          } else {
            console.log(`✗ ${service.name} returned non-image content: ${contentType}`);
          }
        } else {
          console.log(`✗ ${service.name} returned status: ${avatarRes.status}`);
        }
      } catch (error) {
        console.log(`✗ ${service.name} failed:`, error.message);
      }
    }
  }

  res.status(200).json({
    avatar: avatarBase64,
    displayName,
    username: cleanUsername
  });
}