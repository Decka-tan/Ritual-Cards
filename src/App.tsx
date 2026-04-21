import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles, ArrowRight, Twitter, Loader2, Clipboard, Download, ImageDown, Share2, Github, LayoutGrid, ArrowLeft } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { LOGO_BASE64 } from './logoBase64';

// Fetch profile from API (works with both local server and Vercel serverless)
const fetchTwitterProfile = async (username: string) => {
  try {
    const cleanUsername = username.replace('@', '');
    const apiUrl = import.meta.env.DEV
      ? `http://localhost:3001/api/twitter/${cleanUsername}?t=${Date.now()}`
      : `https://ritual-twitter-proxy.artelamon.workers.dev/api/twitter/${cleanUsername}?t=${Date.now()}`;

    const res = await fetch(apiUrl);
    if (res.ok) {
      const data = await res.json();
      return {
        avatar: data?.avatar || null,
        displayName: data?.displayName || cleanUsername,
        username: cleanUsername
      };
    }
  } catch (error) {
    console.warn('Profile fetch failed:', error);
  }

  // Absolute fallback
  const cleanUsername = username.replace('@', '');
  return {
    avatar: null,
    displayName: cleanUsername,
    username: cleanUsername
  };
};

const RitualLogo = ({ className }: { className?: string }) => (
  <img src={LOGO_BASE64} alt="Ritual Logo" className={className} />
);

const RitualCard = React.forwardRef<HTMLDivElement, { profile: TwitterProfile | null }>(({ profile }, ref) => (
  <div ref={ref} className="w-[310px] h-[430px] sm:w-[360px] sm:h-[500px] rounded-[24px] shadow-[0_0_70px_rgba(64,255,175,0.3)] overflow-hidden relative">
     {/* TCG Border with X pattern White to Dark Green progression (80% thickness) */}
     <div className="absolute inset-0 rounded-[24px] p-[16px]" style={{
       background: 'conic-gradient(from 45deg at 50% 50%, #FFFFFF 0deg, #40FFAF 45deg, #077345 90deg, #FFFFFF 180deg, #40FFAF 225deg, #077345 270deg, #FFFFFF 360deg)'
     }} />

     {/* Inner card area with padding */}
     <div className="absolute inset-[16px] rounded-[20px] overflow-hidden">
       {/* Black to Green gradient background (more pronounced green) */}
       <div className="absolute inset-0 bg-gradient-to-b from-[#0A1215] via-[#1a3d30] to-[#0A1215]" />
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,255,175,0.25)_0%,transparent_100%)]" />

       {/* Content Layout */}
       <div className="p-3 h-full flex flex-col relative z-20">
       {/* Top Bar */}
       <div className="bg-[#111A15] mt-1 mb-1 mr-3 ml-3 p-3 sm:p-5 rounded-t-xl rounded-b-xl flex items-center justify-between border-[#40FFAF]/30 border-2 relative overflow-hidden gap-x-2">
         <div className="absolute inset-0 bg-gradient-to-r from-ritual/20 to-transparent" />
         <span className="flex-1 min-w-0 font-bold text-md sm:text-lg text-white truncate relative z-10">{profile?.displayName || profile?.username || 'Your Username'}</span>
         <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-ritual shrink-0 relative z-10" />
       </div>

       {/* Main Character Art Space - Profile Avatar with Card Border (84% size, 20% bigger) */}
        <div className="flex-1 mt-2 ml-6 mr-6 rounded-xl overflow-visible relative flex items-start justify-center min-h-[220px] sm:min-h-[280px]">
          <div className="w-[100%] h-[90%] rounded-xl overflow-hidden relative bg-[#091510] group perspective-1000">
            {/* Same border as card */}
            <div className="absolute inset-0 rounded-xl p-[8px]" style={{
              background: 'conic-gradient(from 45deg at 50% 50%, #FFFFFF 0deg, #40FFAF 45deg, #077345 90deg, #FFFFFF 180deg, #40FFAF 225deg, #077345 270deg, #FFFFFF 360deg)'
            }} />
            <div className="absolute inset-[8px] rounded-[8px] overflow-hidden bg-[#091510]">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            {profile?.avatar ? (
              <img src={profile.avatar} alt={profile?.username || 'avatar'} className="w-full h-full object-cover" crossOrigin="anonymous" />
            ) : (
              <img src="/blank-avatar.png" alt="blank avatar" className="w-full h-full object-cover" />
            )}
              </div>
            </div>
          </div>
       </div>

       {/* Bottom Bar */}
       <div className="p-0 m-3 mt-0 pb-8 sm:pb-10 rounded-b-xl rounded-t flex items-center gap-3 relative z-20">
         <div className="w-14 h-14 rounded-lg bg-black/60 border border-ritual/20 flex flex-col items-center justify-center shrink-0">
           <RitualLogo className="w-10 h-10 text-ritual" />
         </div>
         <div className="flex-1 pb-2 min-w-0">
           <div className="font-bold text-md sm:text-lg text-gray-100 truncate pb-0.5 sm:pb-1 leading-tight">{getArchetype(profile?.username || '').title}</div>
           <div className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 leading-tight">{getArchetype(profile?.username || '').subtitle}</div>
         </div>
       </div>
       <div className="absolute bottom-3 left-4 text-[7px] font-italic text-white/80 tracking-wider z-30">RITUAL CARD</div>
       <div className="absolute bottom-2 right-2 z-10 bg-[#E2E8F0] text-[#0F172A] rounded-full px-2 py-[6px] flex flex-col items-center justify-center border-[2px] border-[#111A15]">
         <span className="text-[6px] font-black leading-none uppercase tracking-widest">Wave</span>
         <span className="text-l font-black leading-none border-t border-black/10 text-center mt-0.5">1</span>
       </div>
       </div>
     </div>
  </div>
));

const Footer = () => (
  <div className="mt-24 text-center pb-8 border-t border-white/10 pt-8 flex flex-col items-center">
    <RitualLogo className="w-8 h-8 text-gray-500 mb-4" />
    <p className="text-gray-500 text-sm mt-3">&copy; {new Date().getFullYear()} Ritual Cards.</p>
    <p className="text-gray-600 text-xs mt-1 flex items-center gap-2">
      Built by Decka-chan
      <a href="https://x.com/decka_chan" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" title="Twitter / X">
        <Twitter className="w-3.5 h-3.5" />
      </a>
      <a href="https://github.com/Decka-tan" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors" title="GitHub">
        <Github className="w-3.5 h-3.5" />
      </a>
    </p>
    <p className="text-gray-700 text-xs mt-1 tracking-widest uppercase">Just For Fun</p>
  </div>
);

const ARCHETYPES = [
  { title: 'Ritualized',   subtitle: 'People ascended to ritual forge' },
  { title: 'The Forged',   subtitle: 'People shaped by the fire' },
  { title: 'Summoned',     subtitle: 'People called before they knew' },
  { title: 'Cursed',       subtitle: 'People marked by the ritual' },
  { title: 'Blessed',      subtitle: 'People the cosmos chose' },
  { title: 'Forerunner',   subtitle: 'People who crossed early' },
  { title: 'Architect',    subtitle: 'People still in the forge' },
  { title: 'Soulsmith',    subtitle: "People building what's next" },
  { title: 'Kindred',      subtitle: 'People bound by the signal' },
];

// Deterministic per username Ã¢â‚¬â€ same user always gets same archetype
const getArchetype = (username: string) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) >>> 0;
  }
  return ARCHETYPES[hash % ARCHETYPES.length];
};

const RitualCardInteractive = React.forwardRef<HTMLDivElement, { 
  profile: TwitterProfile | null, 
  isRevealed?: boolean,
  initialFlipped?: boolean,
  frontRef?: React.Ref<HTMLDivElement>
}>(({ profile, isRevealed = true, initialFlipped = false, frontRef }, ref) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1 });
  const [glare, setGlare] = useState({ x: 50, y: 50, alpha: 0 });
  const [isFlipped, setIsFlipped] = useState(initialFlipped);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRevealed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;

    setTilt({ x: rotateX, y: rotateY, scale: 1.05 });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      alpha: 1
    });
  };

  const handleMouseLeave = () => {
    if (!isRevealed) return;
    setTilt({ x: 0, y: 0, scale: 1 });
    setGlare({ x: 50, y: 50, alpha: 0 });
  };

  const handleClick = () => {
    if (isRevealed) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="perspective-1000 w-[310px] h-[430px] sm:w-[360px] sm:h-[500px]">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        animate={isRevealed ? {
          rotateX: tilt.x,
          rotateY: tilt.y + (isFlipped ? 360 : 180),
          scale: tilt.scale
        } : { rotateX: [0, 0, 8, -4, 0, 0], rotateY: [0, 360, 350, 370, 360, 720], y: [0, 0, -12, -8, 0, 0] }}
        transition={isRevealed ? { type: 'spring', stiffness: 300, damping: 20 } : { repeat: Infinity, duration: 3, times: [0, 0.1, 0.35, 0.65, 0.9, 1], ease: ["easeIn", "easeOut", "easeInOut", "easeIn", "linear"] }}
        className="w-full h-full transform-3d cursor-pointer relative"
      >
        <div className="w-full h-full relative transform-3d">
          {/* Card Back */}
          <div className="absolute inset-0 backface-hidden rounded-[24px] shadow-[0_0_50px_rgba(64,255,175,0.2)] border-2 border-ritual/30 overflow-hidden bg-[#0A1215] flex flex-col items-center justify-center" style={{ transform: 'translateZ(-1px)' }}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,255,175,0.15)_0%,transparent_70%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin-slow">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(64,255,175,0.3),transparent,rgba(7,115,69,0.3),transparent)] blur-xl" />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <RitualLogo className="w-50 h-50 text-ritual drop-shadow-[0_0_20px_rgba(64,255,175,0.8)]" />
            </div>
            <div className="absolute bottom-6 right-6">
               <div className="px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-xs font-bold tracking-[0.2em]">
                 RITUAL CARDS
              </div>
            </div>
          </div>

          {/* Card Front */}
          <div className="absolute inset-0 backface-hidden" style={{ transform: 'rotateY(180deg) translateZ(1px)' }}>
            <RitualCard ref={frontRef} profile={profile} />
          </div>

          {/* Dynamic Glare Overlay */}
          <div
            className="absolute inset-0 mix-blend-color-dodge opacity-60 pointer-events-none z-30 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6) 0%, transparent 50%)`,
              opacity: glare.alpha
            }}
          />

          {/* Holographic Shine & Pattern Layer */}
          <div
            className="absolute inset-0 mix-blend-screen pointer-events-none z-40 transition-opacity duration-300"
            style={{
              backgroundImage: `linear-gradient(115deg, transparent 20%, rgba(64,255,175,0.4) 30%, rgba(255,255,255,0.7) 40%, transparent 50%)`,
              backgroundSize: '200% 200%',
              backgroundPosition: `${glare.x}% ${glare.y}%`,
              opacity: glare.alpha * 0.8
            }}
          />
        </div>
      </motion.div>
    </div>
  );
});


const Card3D = ({ step, profile, onReset, triggerDownload, triggerCopy }: { step: 'input' | 'eligible' | 'card', profile: TwitterProfile | null, onReset?: () => void, triggerDownload?: number, triggerCopy?: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const cardFrontRef = useRef<HTMLDivElement>(null);
  const flatCardRef = useRef<HTMLDivElement>(null);
  const screenshotWrapperRef = useRef<HTMLDivElement>(null);
  const isRevealed = step === 'card';

  const captureCardFront = async (): Promise<string | null> => {
    if (!flatCardRef.current) return null;
    const images = flatCardRef.current.getElementsByTagName('img');
    await Promise.all(
      Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
    await document.fonts.ready;
    void flatCardRef.current.offsetHeight;
    await new Promise(r => setTimeout(r, 1000));
    await toBlob(flatCardRef.current, { pixelRatio: 1, cacheBust: true });
    const blob = await toBlob(flatCardRef.current, { pixelRatio: 2, cacheBust: true });
    if (!blob) return null;
    return URL.createObjectURL(blob);
  };

  const handleDownloadImage = async () => {
    try {
      const url = await captureCardFront();
      if (!url) return;
      const link = document.createElement('a');
      link.download = `ritual-card-${profile?.username || 'wave1'}.png`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download card image. Please try again.');
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const url = await captureCardFront();
      if (!url) return;
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      URL.revokeObjectURL(url);
      alert('Card copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy image:', error);
      alert('Copy failed — try the download button instead.');
    }
  };

  useEffect(() => {
    if (triggerDownload && triggerDownload > 0) handleDownloadImage();
  }, [triggerDownload]);

  useEffect(() => {
    if (triggerCopy && triggerCopy > 0) handleCopyToClipboard();
  }, [triggerCopy]);

  return (
    <div ref={screenshotWrapperRef} className="relative inline-block">
      <RitualCardInteractive 
        ref={cardRef} 
        profile={profile} 
        isRevealed={isRevealed} 
        frontRef={cardFrontRef} 
      />
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', width: '360px', height: '500px', overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
        <RitualCard ref={flatCardRef} profile={profile} />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/collection" element={<CollectionPage />} />
      </Routes>
    </Router>
  );
}

function CollectionPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const res = await fetch('https://ritual-twitter-proxy.artelamon.workers.dev/api/collection');
        if (res.ok) {
          const data = await res.json();
          setCards(data);
        }
      } catch (e) {
        console.error('Failed to fetch collection', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollection();
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-white font-sans overflow-x-hidden selection:bg-ritual/30">
      <div className="absolute top-0 left-0 right-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(64,255,175,0.06)_0%,transparent_80%)] pointer-events-none z-0" />
      
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 group text-gray-400 hover:text-ritual transition-colors">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold">Back to Forge</span>
        </Link>
        <img src="/ritual-wordmark.png" alt="RITUAL" className="h-12 select-none" draggable={false} />
        <div className="w-24 hidden sm:block"></div> {/* Spacer */}
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            Community <span className="text-ritual">Collection</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
            A mystical wall of contributors who have forged their cards in Wave 1.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <Loader2 className="w-10 h-10 text-ritual animate-spin" />
            <p className="text-gray-500 font-medium">Summoning the gallery...</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-gray-500 text-xl font-medium">The vault is currently empty. Be the first to forge a card!</p>
            <Link to="/" className="mt-6 inline-block px-6 py-3 bg-ritual text-background font-bold rounded-xl hover:bg-white transition-colors">
              Go to Forge
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-20">
            {cards.map((card, idx) => (
              <motion.div
                key={`${card.username}-${idx}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Interactive TCG Card Component */}
                <div className="w-full flex justify-center h-[300px] sm:h-[420px] items-center overflow-visible">
                  <div className="scale-[0.55] sm:scale-[0.75] origin-center flex-shrink-0 relative z-30 hover:z-50 transition-[z-index]">
                    <RitualCardInteractive profile={card} isRevealed={true} initialFlipped={false} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

interface TwitterProfile {
  avatar: string | null;
  displayName: string;
  username: string;
}

function HomePage() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState('');
  const [step, setStep] = useState<'input' | 'eligible' | 'card'>('input');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [profile, setProfile] = useState<TwitterProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerDownload, setTriggerDownload] = useState(0);
  const [triggerCopy, setTriggerCopy] = useState(0);
  const formSectionRef = useRef<HTMLDivElement>(null);
 
  const handleTwitterShare = () => {
    const text = `This is my Ritual Cards made by @decka_chan\n\nTry yours: https://cards.decka.my.id/`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim().length > 0) {
      setIsLoading(true);
      const fetchedProfile = await fetchTwitterProfile(handle.trim());
      setProfile(fetchedProfile);
      setIsLoading(false);
      setStep('eligible');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleReveal = () => {
    setStep('card');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-background text-white font-sans overflow-x-hidden selection:bg-ritual/30">
      {/* Background Ambience Ã¢â‚¬â€ absolute so grid scrolls away with page */}
      <div className="absolute top-0 left-0 right-0 h-[90vh] bg-pattern z-0" />
      <div className="absolute top-0 left-0 right-0 h-[70vh] bg-[radial-gradient(ellipse_at_top,rgba(64,255,175,0.06)_0%,transparent_80%)] pointer-events-none z-0" />

      {/* Sparkle Background (when card revealed) */}
      {step === 'card' && (
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-ritual rounded-full animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Navbar */}
      <nav className="relative z-10 max-w-6xl mx-auto my-0 px-5 pt-8 pb-0 flex items-center justify-between">
        <div className="w-32 hidden sm:block"></div> {/* Spacer to center logo */}
        <img src="/ritual-wordmark.png" alt="RITUAL" className="h-16 select-none" draggable={false} />
        <Link to="/collection" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-ritual/10 border border-white/10 hover:border-ritual/30 transition-all group">
          <LayoutGrid className="w-4 h-4 text-gray-400 group-hover:text-ritual" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-white">Collection</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 pt-5 pb-24 flex flex-col items-center justify-center min-h-[70vh]">

        {/* Floating Ambient Light Orbs */}
        <div className="absolute top-1/4 left-[10%] w-3 h-3 bg-white shadow-[0_0_20px_#FFF] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-[15%] w-4 h-4 bg-ritual shadow-[0_0_30px_#40FFAF] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Card + Action Buttons Container */}
        {/* Mobile: flex-col (buttons below card). Desktop: relative (buttons absolute right) */}
        <div className="flex flex-col items-center gap-4 sm:relative sm:block">
          {/* The Card Hero Model View - Always centered */}
          <div className="flex justify-center perspective-1000 z-20">
            <Card3D
              step={step}
              profile={profile}
              onReset={() => { setStep('input'); setHandle(''); setProfile(null); }}
              triggerDownload={triggerDownload}
              triggerCopy={triggerCopy}
            />
          </div>

          {/* Action Icons Ã¢â‚¬â€ horizontal row on mobile, vertical column on desktop (right of card) */}
          {step === 'card' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-row gap-3 sm:flex-col sm:absolute sm:top-1/2 sm:-translate-y-1/2 sm:left-1/2 sm:translate-x-[200px]"
            >
              <button
                onClick={handleTwitterShare}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-ritual/20 border border-white/10 hover:border-ritual/40 flex items-center justify-center transition-all group"
                title="Share to Twitter"
              >
                <Share2 className="w-5 h-5 text-gray-300 group-hover:text-ritual" />
              </button>
              <button
                onClick={() => setTriggerCopy(prev => prev + 1)}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-ritual/20 border border-white/10 hover:border-ritual/40 flex items-center justify-center transition-all group"
                title="Copy Card Image"
              >
                <Clipboard className="w-5 h-5 text-gray-300 group-hover:text-ritual" />
              </button>
              <button
                onClick={() => setTriggerDownload(prev => prev + 1)}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-ritual/20 border border-white/10 hover:border-ritual/40 flex items-center justify-center transition-all group"
                title="Download Card Image"
              >
                <Download className="w-5 h-5 text-gray-300 group-hover:text-ritual" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Persistent Title Section - Logo Image, Always Below Card */}
        <div className="mt-6 mb-3 flex flex-col items-center">
          <img
            src="/ritual-cards-logo.png"
            alt="RITUAL CARDS WAVE Ã¢â‚¬Â¢ 1"
            className="w-full max-w-[450px] select-none mb-2"
            style={{ mixBlendMode: 'screen' }}
            draggable={false}
          />
          {/* Quote */}
          <p className="text-[#DDDDDD] italic text-xl tracking-wide">
            "A token of appreciation for Ritual Contributor"
          </p>
        </div>

        {/* View Your Card CTA Ã¢â‚¬â€ shown only on input step */}
        {step === 'input' && (
          <div className="flex flex-col items-center gap-4 mb-10">
            <button
              onClick={() => formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="px-6 bg-ritual text-background font-black text-[1.1rem] tracking-wide py-4 rounded-2xl hover:bg-white shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(64,255,175,0.3)] transition-all transform active:scale-[0.98]"
            >
              View Your Card
            </button>
            <p className="text-gray-400 text-xl">Check your eligibility below! Account linking not required.</p>
          </div>
        )}

        {/* Text and Form Area */}
        <div ref={formSectionRef} className="text-center w-full max-w-[28rem] mx-auto relative z-10 scroll-mt-8">
          <AnimatePresence mode="wait">

            {/* Main Form - Shown on Input AND Card steps */}
            {(step === 'input' || step === 'card') && (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Status text if mapped */}
                {step === 'card' && (
                  <div className="text-gray-400 text-md sm:text-lg mb-1">
                    Signed in as <span className="text-ritual font-bold">@{profile?.username || handle}</span>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Click card to flip | Use icons to share</p>
                  </div>
                )}

                {/* Check Eligibility heading */}
                <h2 className="text-3xl font-black tracking-tight text-white">
                  Check Eligibility
                </h2>

                <form onSubmit={handleSubmit} className="w-full relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">@</span>
                  </div>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter your handle"
                    disabled={isLoading}
                    className="w-full bg-[#111A15] border border-white/10 rounded-2xl py-4 flex-1 pl-12 pr-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-ritual focus:ring-1 focus:ring-ritual transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:border-white/20 font-medium disabled:opacity-50"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !handle.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-ritual text-background rounded-xl flex items-center justify-center hover:bg-white transition-colors duration-300 shadow-md disabled:opacity-50 disabled:hover:bg-white"
                  >
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 stroke-[3px] animate-spin" />
                    ) : (
                      <ArrowRight className="w-6 h-6 stroke-[3px]" />
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2: Eligible Phase */}
            {step === 'eligible' && (
              <motion.div
                key="eligible"
                initial={{ opacity: 0, y: 20, filter: 'blur(5px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="text-2xl font-medium tracking-wide">
                  <span className="text-ritual font-bold drop-shadow-[0_0_10px_rgba(64,255,175,0.8)]">
                    {profile?.displayName || `@${handle}`}
                  </span> is eligible!
                </div>
                <button
                  onClick={handleReveal}
                  className="px-6 bg-ritual text-background font-black text-[1.1rem] tracking-wide py-4 rounded-2xl hover:bg-ritual shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(64,255,175,0.3)] transition-all transform active:scale-[0.98]"
                >
                  View Your Card
                </button>
                <button
                  onClick={() => { setStep('input'); setHandle(''); setProfile(null); }}
                  className="text-gray-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-0.5"
                >
                  Clear and check another handle
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FAQ Section */}
        <section className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-black tracking-wide mb-10 text-center text-gray-200">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "What are Ritual Cards?", a: "Ritual Cards are a token of appreciation for active members of the community, presented as a highly interactive digital collectible in Wave 1." },
            { q: "Who is eligible for Wave 1?", a: "Active participants, early contributors, and the long-term believers who have engaged with the ecosystem continually on Ritual Forge." },
            { q: "How do I claim my card?", a: "Simply enter your handle above to check eligibility. If eligible, your unique card will be revealed instantly in your browser." }
          ].map((faq, i) => (
            <div 
              key={i} 
              className="bg-[#111A15]/80 backdrop-blur-md border border-white/5 px-8 py-6 rounded-3xl hover:border-ritual/30 transition-colors cursor-pointer group overflow-hidden"
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="flex justify-between items-center text-lg font-bold text-gray-200">
                {faq.q}
                <motion.div
                  animate={{ rotate: openFaq === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6 text-gray-600 group-hover:text-ritual transition-colors transform group-hover:-translate-y-0.5" />
                </motion.div>
              </div>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="text-gray-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <Footer />
      </section>
      </main>
    </div>
  );
}


