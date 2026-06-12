import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Cards appear
      setTimeout(() => setPhase(2), 1500), // Cards move to center
      setTimeout(() => setPhase(3), 2500), // Spark!
      setTimeout(() => setPhase(4), 5000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
    >
      <motion.h2 
        className="text-[4vw] font-bold mb-16"
        initial={{ opacity: 0, y: -20 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
      >
        Find your <span className="text-[var(--color-primary)]">match</span>.
      </motion.h2>

      <div className="relative w-full h-[40vh] flex items-center justify-center">
        {/* Card 1 */}
        <motion.div
          className="absolute w-[20vw] aspect-[3/4] bg-[var(--color-bg-muted)] border border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center overflow-hidden"
          initial={{ x: '-60vw', rotate: -15 }}
          animate={{ 
            x: phase >= 2 ? '-12vw' : '-30vw', 
            rotate: phase >= 2 ? -5 : -15,
            borderColor: phase >= 3 ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        >
          <img src={`${import.meta.env.BASE_URL}images/avatar1.png`} className="w-[10vw] h-[10vw] object-contain mb-4" />
          <div className="w-[12vw] h-4 bg-white/10 rounded-full mb-2" />
          <div className="w-[8vw] h-4 bg-white/10 rounded-full" />
        </motion.div>

        {/* Card 2 */}
        <motion.div
          className="absolute w-[20vw] aspect-[3/4] bg-[var(--color-bg-muted)] border border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center overflow-hidden"
          initial={{ x: '60vw', rotate: 15 }}
          animate={{ 
            x: phase >= 2 ? '12vw' : '30vw', 
            rotate: phase >= 2 ? 5 : 15,
            borderColor: phase >= 3 ? 'var(--color-secondary)' : 'rgba(255,255,255,0.2)'
          }}
          transition={{ type: 'spring', stiffness: 120, damping: 15 }}
        >
          <img src={`${import.meta.env.BASE_URL}images/avatar2.png`} className="w-[10vw] h-[10vw] object-contain mb-4" />
          <div className="w-[12vw] h-4 bg-white/10 rounded-full mb-2" />
          <div className="w-[8vw] h-4 bg-white/10 rounded-full" />
        </motion.div>

        {/* The Spark */}
        {phase >= 3 && (
          <motion.div
            className="absolute w-[10vw] h-[10vw] bg-white rounded-full mix-blend-overlay filter blur-[10px]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        )}
      </div>
    </motion.div>
  );
}
