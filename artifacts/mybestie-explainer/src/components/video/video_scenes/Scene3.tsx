import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300), // Intro text
      setTimeout(() => setPhase(2), 1000), // Message 1
      setTimeout(() => setPhase(3), 2000), // Message 2
      setTimeout(() => setPhase(4), 3000), // Message 3
      setTimeout(() => setPhase(5), 4500), // Inbox UI
      setTimeout(() => setPhase(6), 7000), // Exit
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const msgs = [
    { text: "Anyone awake? Can't sleep.", color: "var(--color-primary)" },
    { text: "I have a secret...", color: "var(--color-secondary)" },
    { text: "Just got the job!!", color: "var(--color-success)" }
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, y: '50%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="w-[90%] max-w-5xl flex flex-col items-center">
        
        <motion.h2 
          className="text-[4vw] font-bold text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
        >
          Receive messages in <span className="text-[var(--color-secondary)]">mystery</span>.
        </motion.h2>

        <div className="relative w-full h-[40vh] flex justify-center">
          {/* Floating Messages */}
          {msgs.map((msg, i) => (
            <motion.div
              key={i}
              className="absolute bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl"
              style={{
                top: `${i * 20}%`,
                left: i === 0 ? '10%' : i === 1 ? '50%' : '20%',
                transform: `translateX(-50%)`,
                boxShadow: `0 0 20px ${msg.color}40`,
                borderColor: `${msg.color}80`
              }}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={phase >= i + 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
              transition={{ type: 'spring', bounce: 0.4 }}
            >
              <p className="text-[1.8vw] font-medium">{msg.text}</p>
            </motion.div>
          ))}

          {/* Organized Inbox Overlay */}
          <motion.div
            className="absolute bottom-0 w-[60%] bg-[var(--color-bg-dark)] border border-white/20 rounded-t-3xl shadow-2xl p-6 pb-0"
            initial={{ y: '100%' }}
            animate={phase >= 5 ? { y: '0%' } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          >
            <div className="flex justify-between border-b border-white/10 pb-4">
              <span className="text-[1.5vw] font-bold text-[var(--color-primary)]">Inbox</span>
              <span className="text-[1.5vw] font-bold text-white/40">Requests</span>
              <span className="text-[1.5vw] font-bold text-white/40">Archive</span>
            </div>
            <div className="pt-4 flex flex-col gap-4">
              <div className="h-12 w-full bg-white/5 rounded-lg" />
              <div className="h-12 w-full bg-white/5 rounded-lg" />
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}
