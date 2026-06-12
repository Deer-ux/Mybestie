import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Profile card enters
      setTimeout(() => setPhase(2), 1500), // Avatar pops
      setTimeout(() => setPhase(3), 2800), // Username types
      setTimeout(() => setPhase(4), 4500), // Share link appears
      setTimeout(() => setPhase(5), 7000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ x: '-100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div className="w-[80%] max-w-4xl flex gap-12 items-center">
        
        {/* Left: Phone UI representation */}
        <motion.div 
          className="flex-1 bg-[var(--color-bg-muted)] border border-white/10 rounded-[3vw] p-8 shadow-2xl relative overflow-hidden"
          initial={{ rotateY: -20, scale: 0.8, opacity: 0 }}
          animate={phase >= 1 ? { rotateY: 0, scale: 1, opacity: 1 } : { rotateY: -20, scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        >
          <div className="flex flex-col items-center">
            <motion.h2 
              className="text-[2.5vw] font-bold mb-8"
              initial={{ opacity: 0 }}
              animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            >
              Create Profile
            </motion.h2>

            {/* Avatar Selection */}
            <div className="flex gap-4 mb-8">
              {[1, 2].map((num, i) => (
                <motion.div 
                  key={num}
                  className="w-[8vw] h-[8vw] rounded-full bg-[var(--color-bg-dark)] border-2 border-[var(--color-primary)] overflow-hidden p-2"
                  initial={{ scale: 0 }}
                  animate={phase >= 2 ? { scale: 1 } : { scale: 0 }}
                  transition={{ type: 'spring', delay: i * 0.2 }}
                >
                  <img src={`${import.meta.env.BASE_URL}images/avatar${num}.png`} className="w-full h-full object-contain" />
                </motion.div>
              ))}
            </div>

            {/* Username Input */}
            <motion.div 
              className="w-full bg-[var(--color-bg-dark)] rounded-xl py-4 px-6 border border-white/5 text-center text-[1.5vw] text-white/50"
              initial={{ opacity: 0, width: '50%' }}
              animate={phase >= 3 ? { opacity: 1, width: '100%' } : { opacity: 0, width: '50%' }}
            >
              @anonymous_panda
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Text & Share Link */}
        <div className="flex-1 text-left">
          <motion.h3 
            className="text-[4vw] font-bold leading-tight mb-4"
            initial={{ opacity: 0, x: 50 }}
            animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
          >
            Pick an avatar.<br/>
            <span className="text-[var(--color-primary)]">Stay anonymous.</span>
          </motion.h3>

          <motion.div 
            className="mt-8 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] p-[2px] rounded-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          >
            <div className="bg-[var(--color-bg-dark)] py-4 px-6 rounded-[14px] flex justify-between items-center">
              <span className="text-[1.5vw] font-mono text-white/80">mybestie.app/panda</span>
              <span className="bg-white/10 px-4 py-2 rounded-lg text-[1vw]">Copy Link</span>
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
