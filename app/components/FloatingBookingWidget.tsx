import React from 'react';
import { motion } from 'framer-motion';

interface FloatingBookingWidgetProps {
  onClick: () => void;
}

export function FloatingBookingWidget({ onClick }: FloatingBookingWidgetProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-[#111111] border border-zinc-800 px-5 py-3 rounded-full shadow-2xl hover:border-emerald-500/50 transition-colors group"
    >
      <div className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
      </div>
      <span className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors">
        Book 1-on-1 Demo
      </span>
    </motion.button>
  );
}
