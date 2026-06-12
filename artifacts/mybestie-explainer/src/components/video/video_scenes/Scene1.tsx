import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3500), // exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow */}
        <motion.div
          className="absolute inset-0 blur-3xl opacity-50 bg-[var(--color-primary)] rounded-full"
          initial={{ scale: 0 }}
          animate={phase >= 1 ? { scale: 2 } : { scale: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
        
        <motion.h1 
          className="text-[8vw] font-bold tracking-tight text-white z-10"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {'MyBestie'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 50, rotateX: 45 }}
              animate={phase >= 1 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: 45 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: i * 0.05 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          className="text-[2vw] text-[var(--color-secondary)] mt-4 font-medium"
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          Your anonymous bestie, always there.
        </motion.p>
      </div>
    </motion.div>
  );
}
