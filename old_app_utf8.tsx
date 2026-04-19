import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Sparkles, ArrowRight, Twitter } from 'lucide-react';

const RitualLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="currentColor" className={className}>
    <g transform="translate(50, 50) rotate(45) translate(-50, -50)">
      <path d="M25 25h15v35h-15zM60 40h15v35h-15zM25 25h50v15h-50zM25 60h50v15h-50z" />
      <rect x="37" y="37" width="26" height="26" fill="var(--color-surface, #111A15)" />
      <rect x="42" y="42" width="16" height="16" fill="currentColor" />
    </g>
  </svg>
);

const Card3D = ({ step, handle }: { step: 'input' | 'eligible' | 'card', handle: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, scale: 1 });
  const [glare, setGlare] = useState({ x: 50, y: 50, alpha: 0 });
  const isRevealed = step === 'card';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRevealed) return;
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
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

  const holographicPattern = `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg transform='translate(50, 50) rotate(45) translate(-50, -50)'%3E%3Cpath d='M25 25h15v35h-15zM60 40h15v35h-15zM25 25h50v15h-50zM25 60h50v15h-50z' fill='white' opacity='0.5'/%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div className="perspective-1000 w-[300px] h-[420px] sm:w-[340px] sm:h-[480px]">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={isRevealed ? { 
          rotateX: tilt.x, 
          rotateY: tilt.y, 
          scale: tilt.scale 
        } : { rotateX: [10, -5, 10], rotateY: [-10, 5, -10], y: [0, -15, 0] }}
        transition={isRevealed ? { type: 'spring', stiffness: 300, damping: 20 } : { repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="w-full h-full transform-3d cursor-pointer"
      >
        <motion.div 
          initial={false}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 100, damping: 15 }}
          className="w-full h-full relative transform-3d"
        >
          {/* Card Back (Not Revealed) */}
          <div className="absolute inset-0 backface-hidden rounded-[24px] shadow-[0_0_50px_rgba(64,255,175,0.2)] border border-white/10 overflow-hidden bg-[#0A1215]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(64,255,175,0.15)_0%,transparent_70%)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] animate-spin-slow">
              <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent,rgba(64,255,175,0.3),transparent,rgba(7,115,69,0.3),transparent)] blur-xl" />
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <RitualLogo className="w-24 h-24 text-ritual drop-shadow-[0_0_20px_rgba(64,255,175,0.8)]" />
            </div>
            
            <div className="absolute bottom-6 inset-x-0 flex justify-center">
               <div className="px-4 py-1.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-xs font-bold tracking-[0.2em]">
                 RITUAL CARDS
              </div>
            </div>
          </div>

          {/* Card Front (Revealed) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-[24px] shadow-[0_0_70px_rgba(64,255,175,0.3)] border border-ritual/30 overflow-hidden bg-[#050C09]">
             {/* Base Background */}
             <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#0F2018,#060D0A)]" />

             {/* Content Layout */}
             <div className="p-3 h-full flex flex-col relative z-20">
               {/* Top Bar */}
               <div className="bg-[#111A15] p-3 rounded-t-xl rounded-b flex items-center justify-between border border-white/5 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-ritual/5 to-transparent" />
                 <span className="font-bold text-gray-200 truncate pr-4 relative z-10">{handle || 'Real One'}</span>
                 <Sparkles className="w-5 h-5 text-ritual shrink-0 relative z-10" />
               </div>

               {/* Main Character Art Space - CSS Generated Sci-Fi Core */}
               <div className="flex-1 mt-2 mb-2 rounded-xl overflow-hidden relative border border-white/10 bg-[#091510] group perspective-1000">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(64,255,175,0.05)_100%)]" />
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden transition-transform duration-1000 ease-out group-hover:scale-105 transform-3d">
                    {/* Glowing Cosmos Orbs */}
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-ritual/30 rounded-full blur-3xl mix-blend-screen" />
                    <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl mix-blend-screen" />
                    
                    {/* Floating Core */}
                    <motion.div 
                      animate={{ rotateY: 360, rotateX: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="relative w-32 h-32 transform-3d"
                    >
                      <div className="absolute inset-0 border-2 border-ritual/40 rounded-xl backdrop-blur-md rotate-45 shadow-[0_0_30px_rgba(64,255,175,0.3)]" />
                      <div className="absolute inset-2 border border-white/30 rounded-full border-dashed animate-spin-slow" style={{ animationDirection: 'reverse' }} />
                      <div className="absolute inset-6 bg-gradient-to-tr from-ritual to-purple-500 rounded-lg mix-blend-overlay shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]" />
                      <div className="absolute inset-4 border border-ritual/60 rounded-full rotate-[60deg] skew-x-12" />
                      <div className="absolute inset-4 border border-purple-500/60 rounded-full -rotate-[60deg] skew-y-12" />
                    </motion.div>
                    
                    {/* Ground Reflector */}
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-[#091510] via-[#091510]/80 to-transparent" />
                  </div>
               </div>

               {/* Bottom Bar */}
               <div className="bg-[#111A15] p-3 rounded-b-xl rounded-t flex items-center gap-3 border border-white/5 relative z-20">
                 <div className="w-10 h-10 rounded-lg bg-black/60 border border-ritual/20 flex flex-col items-center justify-center shrink-0">
                   <RitualLogo className="w-6 h-6 text-ritual" />
                 </div>
                 <div className="flex-1">
                   <div className="font-bold text-sm text-gray-100">Real Ones</div>
                   <div className="text-[10px] text-gray-400">People playing the long game.</div>
                 </div>
                 <div className="text-[8px] font-mono tracking-widest text-right opacity-60">
                   WAVE<br/><span className="text-ritual text-xs">1</span>
                 </div>
               </div>
             </div>

             {/* Dynamic Glare Overlay */}
             <div 
               className="absolute inset-0 mix-blend-color-dodge opacity-60 pointer-events-none z-30 transition-opacity duration-300"
               style={{
                 background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.6) 0%, transparent 50%)`,
                 opacity: isRevealed ? glare.alpha : 0
               }}
             />

             {/* Holographic Shine & Pattern Layer */}
             <div 
               className="absolute inset-0 mix-blend-screen pointer-events-none z-40 transition-opacity duration-300"
               style={{
                 backgroundImage: `linear-gradient(115deg, transparent 20%, rgba(64,255,175,0.4) 30%, rgba(255,255,255,0.7) 40%, transparent 50%)`,
                 backgroundSize: '200% 200%',
                 backgroundPosition: `${glare.x}% ${glare.y}%`,
                 opacity: isRevealed ? glare.alpha * 0.8 : 0
               }}
             />
             
             {/* Repeating Foil Foil Pattern */}
             <div 
                className="absolute inset-0 pointer-events-none z-30 opacity-[0.05] mix-blend-plus-lighter"
                style={{
                  backgroundImage: holographicPattern,
                  backgroundPosition: `${glare.x / 4}% ${glare.y / 4}%`
                }}
             />

             {/* Wave 1 Golden/Metallic Seal overlapping bottom right */}
             <div className="absolute -bottom-3 -right-3 z-50 bg-[#E2E8F0] text-[#0F172A] rounded-full w-14 h-14 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.6),inset_0_2px_4px_white] border-[3px] border-[#111A15] transform rotate-12">
                <span className="text-[9px] font-black leading-none mt-1 uppercase tracking-widest">Wave</span>
                <span className="text-2xl font-black leading-none pb-0.5 border-t border-black/10 w-10 text-center mt-0.5">1</span>
             </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [handle, setHandle] = useState('');
  const [step, setStep] = useState<'input' | 'eligible' | 'card'>('input');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim().length > 0) {
      setStep('eligible');
    }
  };

  const handleReveal = () => {
    setStep('card');
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans overflow-x-hidden selection:bg-ritual/30">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-pattern z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(64,255,175,0.06)_0%,transparent_70%)] pointer-events-none z-0" />
      
      {/* Navbar */}
      <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RitualLogo className="w-7 h-7 text-ritual" />
          <span className="text-xl font-bold tracking-[0.2em] uppercase">RITUAL</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 pt-10 pb-16 flex flex-col items-center justify-center min-h-[85vh]">
        
        {/* Floating Ambient Light Orbs */}
        <div className="absolute top-1/4 left-[10%] w-3 h-3 bg-white shadow-[0_0_20px_#FFF] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-[15%] w-4 h-4 bg-ritual shadow-[0_0_30px_#40FFAF] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* The Card Hero Model View */}
        <div className="mb-10 lg:my-10 perspective-1000 z-20">
          <Card3D step={step} handle={handle} />
        </div>

        {/* Text and Form Area */}
        <div className="text-center w-full max-w-[28rem] mx-auto relative h-[250px] z-10">
          <AnimatePresence mode="wait">
            
            {/* Step 1: Input */}
            {step === 'input' && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, filter: 'blur(5px)' }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex flex-col items-center"
              >
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative">
                    <h1 className="text-4xl sm:text-[3.2rem] font-black uppercase tracking-[0.08em] leading-none mb-1 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-[#64748B] drop-shadow-2xl text-stroke relative z-10 pb-1">
                      RITUAL CARDS
                    </h1>
                    <div className="absolute inset-0 bg-ritual/20 blur-3xl z-0" />
                  </div>
                  <div className="text-sm font-black tracking-[0.4em] px-6 py-1 rounded-full border border-white/20 bg-black/40 backdrop-blur-md relative z-10 shadow-[0_0_20px_rgba(64,255,175,0.15)] text-gray-200">
                    WAVE ΓÇó 1
                  </div>
                </div>
                
                <p className="text-[#94A3B8] mb-8 italic sm:text-lg">"A token of appreciation for Crypto Twitter"</p>
                
                <form onSubmit={handleSubmit} className="w-full relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold">@</span>
                  </div>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter your handle"
                    className="w-full bg-[#111A15] border border-white/10 rounded-2xl py-4 flex-1 pl-12 pr-16 text-white placeholder:text-gray-600 focus:outline-none focus:border-ritual focus:ring-1 focus:ring-ritual transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:border-white/20 font-medium"
                    autoComplete="off"
                    spellCheck="false"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-white text-background rounded-xl flex items-center justify-center hover:bg-ritual transition-colors duration-300 shadow-md"
                  >
                    <ArrowRight className="w-6 h-6 stroke-[3px]" />
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
                className="absolute inset-0 flex flex-col items-center justify-start pt-6 gap-6"
              >
                <div className="text-2xl font-medium tracking-wide">
                  <span className="text-ritual font-bold drop-shadow-[0_0_10px_rgba(64,255,175,0.8)]">@{handle}</span> is eligible!
                </div>
                <button 
                  onClick={handleReveal}
                  className="w-full bg-white text-background font-black text-[1.1rem] tracking-wide py-4 rounded-2xl hover:bg-ritual shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(64,255,175,0.3)] transition-all transform active:scale-[0.98]"
                >
                  View Your Card
                </button>
                <button 
                  onClick={() => { setStep('input'); setHandle(''); }}
                  className="text-gray-500 hover:text-white text-sm transition-colors border-b border-transparent hover:border-white pb-0.5"
                >
                  Clear and check another handle
                </button>
              </motion.div>
            )}

            {/* Step 3: Card Revealed */}
            {step === 'card' && (
              <motion.div 
                key="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-start pt-2"
              >
                <div className="mb-4 flex flex-col items-center">
                  <h1 className="text-4xl sm:text-[2.8rem] font-black uppercase tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-b from-white to-[#64748B] text-stroke">
                    RITUAL CARDS
                  </h1>
                </div>
                <div className="text-gray-400 text-lg">
                  Signed in as <span className="text-ritual font-bold">@{handle}</span>
                </div>
                
                <div className="mt-8 flex gap-4 w-full">
                  <button className="flex-1 py-4 rounded-2xl border border-ritual/40 text-ritual hover:bg-ritual/10 transition-colors font-bold tracking-wide flex items-center justify-center gap-2">
                    <Twitter className="w-5 h-5" />
                    Share
                  </button>
                  <button 
                    onClick={() => { setStep('input'); setHandle(''); }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors font-bold tracking-wide"
                  >
                    Start Over
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* FAQ Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-black tracking-wide mb-10 text-center text-gray-200">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            { q: "What are Ritual Cards?", a: "Ritual Cards are a token of appreciation for active members of the community, presented as a highly interactive digital collectible in Wave 1." },
            { q: "Who is eligible for Wave 1?", a: "Active participants, early contributors, and the long-term believers who have engaged with the ecosystem continually on Crypto Twitter." },
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
        
        {/* Footer Text */}
        <div className="mt-24 text-center pb-8 border-t border-white/10 pt-8 flex flex-col items-center">
            <RitualLogo className="w-8 h-8 text-gray-500 mb-4" />
            <p className="text-gray-500 text-sm mt-3">┬⌐ {new Date().getFullYear()} Ritual Cards. Not a speculative asset.</p>
        </div>
      </section>
    </div>
  );
}
