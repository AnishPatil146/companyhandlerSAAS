"use client";

// 1. Import the component
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle, Users, LayoutDashboard, User as UserIcon } from 'lucide-react';
import { signInWithEmailAndPassword, fetchSignInMethodsForEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Ya '../lib/firebase' agar error aaye
import { useRouter } from 'next/navigation';
import BookingModal from '@/app/components/modals/BookingModal';

import { FloatingBookingWidget } from '@/app/components/FloatingBookingWidget';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Automatically pop open the booking modal after 2.5 seconds
        const timer = setTimeout(() => {
            setIsBookingModalOpen(true);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    const handleDemoLogin = (role: string) => {
        localStorage.setItem('demoRole', role);
        router.push('/dashboard');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(''); // Purane errors clear karne ke liye

        try {
            // Check if email exists
            try {
                const signInMethods = await fetchSignInMethodsForEmail(auth, email);
                if (signInMethods.length === 0) {
                    // 🚀 Auto-Registration Magic: Instead of denying access, create the account!
                    await createUserWithEmailAndPassword(auth, email, password);
                    router.push('/dashboard');
                    return;
                }
            } catch (err) {
                // Ignore if Email Enumeration Protection is enabled
            }

            // FIREBASE THE REAL MAGIC
            await signInWithEmailAndPassword(auth, email, password);

            // Agar login successful hua, toh Dashboard ka darwaza kholo!
            router.push('/dashboard');

        } catch (error: Error | unknown) {
            // Agar password galat hua toh
            console.error("Login Error:", error);
            setErrorMsg("Access Denied. Invalid credentials.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-zinc-100 p-4 font-sans selection:bg-zinc-800">

            {/* Background Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 bg-zinc-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md relative z-10"
            >
                {/* Promo Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer rounded-xl p-4 mb-6 flex items-center justify-between group transition-colors"
                >
                    <div>
                        <p className="text-sm font-bold text-emerald-400">Want to see the source code in action?</p>
                        <p className="text-[11px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Book a free 1-on-1 strategy session.</p>
                    </div>
                    <ArrowRight size={18} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
                </motion.div>

                {/* Brand Header */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <ShieldCheck className="text-black" size={24} />
                    </motion.div>
                    <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome to COMPANY HANDLER</h1>
                    <p className="text-sm text-zinc-500 mt-2">Enter your credentials to access the terminal.</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#111111] border border-zinc-800/60 p-8 rounded-2xl shadow-2xl backdrop-blur-sm">
                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Error Message Animation */}
                        <AnimatePresence>
                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2"
                                >
                                    <AlertCircle size={16} />
                                    {errorMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Email Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider mb-2 block">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm placeholder:text-zinc-600"
                                    placeholder="admin@company.com"
                                />
                            </div>
                        </motion.div>

                        {/* Password Input */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider block">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1a1a1a] border border-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm placeholder:text-zinc-600"
                                    placeholder="••••••••"
                                />
                            </div>
                        </motion.div>

                        {/* Submit Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="pt-2"
                        >
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black hover:bg-zinc-200 py-3 rounded-lg text-sm font-semibold transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin text-black" size={18} />
                                ) : (
                                    <>
                                        Authorize Access
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </form>

                    {/* DEMO LOGIN SECTION */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 pt-6 border-t border-zinc-800/60"
                    >
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <span className="w-full h-px bg-zinc-800/60"></span>
                            <span className="text-[11px] text-emerald-400/90 uppercase font-semibold whitespace-nowrap flex items-center">
                                Try Demo
                                <span className="inline-block w-1 h-3 ml-1.5 bg-emerald-400 animate-pulse"></span>
                            </span>
                            <span className="w-full h-px bg-zinc-800/60"></span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleDemoLogin('HR')} className="flex-1 bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-500 transition py-2.5 rounded-lg text-xs font-semibold text-zinc-300 shadow-sm flex items-center justify-center gap-1.5"><Users size={14} /> HR</button>
                            <button onClick={() => handleDemoLogin('Manager')} className="flex-1 bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-500 transition py-2.5 rounded-lg text-xs font-semibold text-zinc-300 shadow-sm flex items-center justify-center gap-1.5"><LayoutDashboard size={14} /> Manager</button>
                            <button onClick={() => handleDemoLogin('Employee')} className="flex-1 bg-[#1a1a1a] hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-500 transition py-2.5 rounded-lg text-xs font-semibold text-zinc-300 shadow-sm flex items-center justify-center gap-1.5"><UserIcon size={14} /> Employee</button>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            <FloatingBookingWidget onClick={() => setIsBookingModalOpen(true)} />
            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />
        </div>
    );
}