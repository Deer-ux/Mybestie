import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // AI text
      setTimeout(() => setPhase(2), 1500), // AI questions stagger in
      setTimeout(() => setPhase(3), 3500), // Transition to Badges
      setTimeout(() => setPhase(4), 4500), // Badges text
      setTimeout(() => setPhase(5), 5500), // Badges pop in
      setTimeout(() => setPhase(6), 7500), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const topics = ['Health', 'Career', 'Travel', 'Life'];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: '-100%' }}
      transition={{ duration: 0.8 }}
    >
      {/* AI Chat Phase */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{ 
          opacity: phase < 3 ? 1 : 0, 
          scale: phase < 3 ? 1 : 1.2,
          pointerEvents: phase < 3 ? 'auto' : 'none'
        }}
        transition={{ duration: 0.6 }}
      >
        <motion.h2 
          className="text-[3.5vw] font-bold mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        >
          Talk to <span className="text-[var(--color-secondary)]">Bestie AI</span>.
        </motion.h2>

        <div className="flex gap-4">
          {topics.map((topic, i) => (
            <motion.div
              key={topic}
              className="bg-white/10 border border-[var(--color-secondary)] rounded-full px-6 py-3 text-[1.5vw]"
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: 'spring', delay: i * 0.1 }}
            >
              {topic}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Badges Phase */}
      <motion.div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: phase >= 3 ? 1 : 0, 
          scale: phase >= 3 ? 1 : 0.8,
          pointerEvents: phase >= 3 ? 'auto' : 'none'
        }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.h2 
          className="text-[3.5vw] font-bold mb-16 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
        >
          Unlock <span className="text-[var(--color-primary)]">Achievements</span>.
        </motion.h2>

        <div className="flex gap-8">
          {[1, 2, 3].map((num, i) => (
            <motion.div
              key={num}
              className="w-[12vw] h-[12vw] relative"
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={phase >= 5 ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0, rotate: -45 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.2 }}
            >
              <img src={`${import.meta.env.BASE_URL}images/badge.png`} className="w-full h-full object-contain filter drop-shadow-[0_0_15px_var(--color-primary)]" />
              {/* Unlock effect */}
              {phase >= 5 && (
                <motion.div
                  className="absolute inset-0 border-2 border-[var(--color-primary)] rounded-full"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, delay: (i * 0.2) + 0.2 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
