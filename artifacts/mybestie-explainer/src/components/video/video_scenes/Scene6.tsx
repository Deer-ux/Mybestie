import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),  // Logo + Tagline
      setTimeout(() => setPhase(2), 1500), // CTA Download
      setTimeout(() => setPhase(3), 5500), // Exit (loop)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col items-center">
        
        <motion.h1 
          className="text-[6vw] font-bold tracking-tight text-white mb-4"
          style={{ fontFamily: 'var(--font-display)' }}
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          My<span className="text-[var(--color-primary)]">Bestie</span>
        </motion.h1>

        <motion.p
          className="text-[2vw] text-white/70 font-medium mb-12"
          initial={{ opacity: 0 }}
          animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Your anonymous bestie, always there.
        </motion.p>

        <motion.div
          className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px] rounded-full overflow-hidden cursor-pointer"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="bg-[var(--color-bg-dark)] px-10 py-4 rounded-full flex items-center gap-4">
            <span className="text-[1.8vw] font-bold text-white">Download MyBestie</span>
            <svg className="w-[2vw] h-[2vw] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
