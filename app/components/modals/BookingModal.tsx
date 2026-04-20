import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ExternalLink, Calendar, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    date: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save to Firebase
      await addDoc(collection(db, 'demo_bookings'), {
        ...formData,
        status: 'Pending',
        createdAt: serverTimestamp()
      });

      // 2. Send Email via API Route
      await fetch('/api/book-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ name: '', company: '', email: '', date: '', message: '' });
        onClose();
      }, 3000);
    } catch (error) {
      console.error("Booking Error:", error);
      alert("Failed to submit booking. Please try emailing directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#0a0a0a] border-t-4 border-t-emerald-500 border-x border-b border-x-zinc-800 border-b-zinc-800 p-6 md:p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-full z-10"
            >
              <X size={20} />
            </button>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                  <CheckCircle2 size={40} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Demo Request Received!</h2>
                <p className="text-zinc-400 max-w-sm">I have received your details and will reach out via email shortly to confirm the time.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 pr-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Schedule a Walkthrough</h2>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Book a 1-on-1 session where I will showcase the system architecture, real-time sync capabilities, and business logic of this application.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Full Name</label>
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#111] border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Company</label>
                      <input required type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-[#111] border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm" placeholder="Acme Corp" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Work Email</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#111] border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm" placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1 block">Preferred Date</label>
                      <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-[#111] border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm [color-scheme:dark]" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1 block">What would you like to focus on?</label>
                    <textarea required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-[#111] border border-zinc-800 text-white px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm min-h-[100px] resize-none" placeholder="e.g. Code structure, Firebase integration, UI/UX..." />
                  </div>

                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-500 text-black font-black py-3 rounded-xl mt-4 hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50">
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Confirm Demo Request</>}
                  </button>
                </form>

                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="h-px bg-zinc-800 flex-1"></div>
                  <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Or</span>
                  <div className="h-px bg-zinc-800 flex-1"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="mailto:anishpatil146@gmail.com" className="flex-1 flex items-center justify-center gap-2 bg-[#161616] border border-zinc-800 hover:border-emerald-500/50 hover:bg-[#1a1a1a] text-zinc-300 hover:text-emerald-400 transition-all py-3 px-4 rounded-xl font-medium text-sm">
                    <Mail size={18} />
                    Email Me Directly
                  </a>
                  <a href="https://linkedin.com/in/anish-patil" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#161616] border border-zinc-800 hover:border-emerald-500/50 hover:bg-[#1a1a1a] text-zinc-300 hover:text-emerald-400 transition-all py-3 px-4 rounded-xl font-medium text-sm">
                    <ExternalLink size={18} />
                    Connect on LinkedIn
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
