<div align="center">
  <img width="120-0" height="auto" alt="Ritual Cards Banner" src="public/Logo_RItual_White.png" style="max-width: 150px; margin-bottom: 20px;" />
  <br/>
  <h1>🔮 Ritual Cards</h1>
  <p><strong>A premium, 3D interactive community card generator built for the Ritual ecosystem.</strong></p>
</div>

<br/>

## 🌟 Overview
Ritual Cards is an interactive web experience allowing users to generate a personalized "Ritual Card". The system dynamically identifies the user's Twitter/X archetype, matches them with a mystical "wave", and applies beautiful holographic rendering, 3D mouse tracking, and downloadable trading card features.

## 🛠️ Architecture
The project is built around two key pillars focusing on high aesthetic value and system reliability:

1. **Frontend (Vite + React.js)**: Handles the 3D rendering (`framer-motion`) and capturing logic (`html-to-image`). Tailwind CSS V4 provides utilities for glassmorphism and geometric gradients.
2. **Backend Proxy (Cloudflare Workers)**: Operates an ultra-fast proxy API targeting Twitter profiling and the high-reliability `VxTwitter` API for pristine avatar rendering without CORS and rate limits.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Wrangler CLI (for Cloudflare Deployment) 

### Local Development
To run the front-end interface on your machine:
```bash
npm install
npm run dev
```

During local development, the application points to `server.js` (`localhost:3001`) as a local proxy to mimic the behavior of the Cloudflare Serverless setup without spamming production endpoints.

## 📦 Deployment Guides

### Frontend (Vercel)
The UI is hosted natively on Vercel and is optimized to run statics without a backend instance, preserving massive performance overhead. Push your code to the `main` branch to trigger an automatic deployment.

### Backend Proxy (Cloudflare)
The critical Twitter Proxy used to scrape user information and fetch PFP buffers is housed inside the `cf-worker` directory.

To push updates for the proxy logic:
```bash
cd cf-worker
npx wrangler deploy
```
*(Ensure you are logged into Wrangler via `npx wrangler login` before running).*

## 🐞 Recent Fixes
- **iOS Safari Reliability**: Swapped data-url fetching mechanics and re-architected CSS backgrounds to fully support `html-to-image` rendering on strict WebKit bounds (fixing iPhone "blank/black screen" phenomena).
- **Hardened Avatars**: Scaled down PFP fetching limits (`_200x200`) explicitly optimizing heavy memory loads for smartphone download bounds.
- **Dead Code Cleanup**: Purged redundant Vercel Serverless configurations in favor of pure Cloudflare execution.

---
<div align="center">
<p className="text-sm">Built with 💚 for the Ritual Community</p>
</div>
