"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function BrandReveal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Stagger variants for the text reveal with proper TypeScript Types
  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 1.8, // Start text reveal after logo animates
      },
    },
  };

  // FIX: Framer Motion's Variants type expects ease to be a named string or EasingFunction.
  // A raw number[] (cubic-bezier) must be cast to avoid the TS error.
  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(5px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  const title = "COMPANY HANDLER";

  return (
    <div className="relative w-full h-[500px] bg-[#0a0a0a] flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-zinc-800/60 shadow-2xl mx-auto max-w-[900px]">

      {/* 1. Background Grid & Central Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] opacity-30"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500 rounded-full blur-[100px] pointer-events-none"
      ></motion.div>

      {/* 2. SVG Geometric Lines (Hacker/Terminal Vibe) */}
      <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <motion.path
          d="M 50 150 Q 150 50 350 150 T 650 150"
          fill="transparent"
          stroke="#10b981"
          strokeWidth="1.2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.path
          d="M 80 280 Q 180 180 380 280 T 720 280"
          fill="transparent"
          stroke="#10b981"
          strokeWidth="0.8"
          strokeDasharray="4 4"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 2.5, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>

      {/* 3. Central Logo Reveal (Spring Pop) */}
      <motion.div
        initial={{ scale: 0, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 120, delay: 0.9 }}
        className="relative z-10 flex items-center justify-center w-24 h-24 bg-[#111111] border border-zinc-700 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-8 group"
      >
        {/* Subtle continuous glowing pulse around the card */}
        <motion.div
          animate={{
            boxShadow: ["0px 0px 0px rgba(16,185,129,0)", "0px 0px 40px rgba(16,185,129,0.5)", "0px 0px 0px rgba(16,185,129,0)"]
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl"
        ></motion.div>
        <ShieldCheck size={48} className="text-white" />
      </motion.div>

      {/* 4. Text Reveal with Blinking Cursor */}
      <motion.div
        variants={textContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex items-center"
      >
        <h1 className="flex text-3xl md:text-5xl font-black text-white tracking-tighter">
          {title.split("").map((char, index) => (
            <motion.span
              key={index}
              variants={letterVariants}
              className={char === " " ? "w-3 md:w-4" : ""}
            >
              {char}
            </motion.span>
          ))}
        </h1>
        {/* Blinking CMD Terminal Cursor */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: 2.8 }}
          className="w-2.5 md:w-3.5 h-8 md:h-12 bg-emerald-500 ml-2 mt-1"
        ></motion.div>
      </motion.div>

      {/* 5. Futuristic Tagline Fade In */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 3.2 }}
        className="relative z-10 mt-5 text-xs md:text-sm font-bold tracking-[0.4em] uppercase text-emerald-500/90"
      >
        Enterprise OS Initialized
      </motion.p>
    </div>
  );
}
