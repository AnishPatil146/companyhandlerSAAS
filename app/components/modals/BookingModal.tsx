import React, { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Linkedin,
  ChevronRight,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModel({ isOpen, onClose }: BookingModelProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    challenge: '',
    bookingDate: ''
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({ name: '', email: '', company: '', challenge: '', bookingDate: '' });
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.company || !formData.bookingDate) {
      setError('Please fill in all required fields, including the date.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setStep(2);
  };

  const handleSchedule = async () => {
    setIsLoading(true);
    setError('');

    try {
      // CONNECTING TO YOUR EXACT NEW FOLDER NAME
      const response = await fetch('/api/Demosessionemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to process booking.');
      }

      setStep(3);
      triggerConfetti();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5, angle: 60, spread: 55, origin: { x: 0 },
        colors: ['#e20707ff', '#10eb10ff', '#076ce2ff']
      });
      confetti({
        particleCount: 5, angle: 120, spread: 55, origin: { x: 1 },
        colors: ['#e20707ff', '#10eb10ff', '#076ce2ff']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const generateGCalLink = () => {
    if (!formData.bookingDate) return '#';
    const startDate = new Date(formData.bookingDate);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatGcalDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const startStr = formatGcalDate(startDate);
    const endStr = formatGcalDate(endDate);
    const title = encodeURIComponent(`Demo Session with ${formData.company}`);
    const details = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nChallenge: ${formData.challenge}`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
  };

  const waText = encodeURIComponent(`Hi Anish, I just booked a demo for ${formData.company}. Looking forward to it!`);
  const mailSubject = encodeURIComponent('Demo Session Booking');
  const mailBody = encodeURIComponent(`Hi Anish,\n\nI just booked a demo session for ${formData.company}.\n\nBest,\n${formData.name}`);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl custom-scrollbar"
        >
          <div className="sticky top-0 z-10 px-6 py-4 bg-gray-900/95 border-b border-gray-800 flex items-center justify-between backdrop-blur-md">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-white">Book Demo Session</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className={`h-1.5 w-12 rounded-full ${step >= 1 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
                <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`} />
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">

              {step === 1 && (
                <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleNextStep} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-4 py-3 text-white transition-all bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Email *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-3 text-white transition-all bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" placeholder="john@company.com" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Company Name *</label>
                      <input type="text" name="company" value={formData.company} onChange={handleInputChange} required className="w-full px-4 py-3 text-white transition-all bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none" placeholder="Acme Corp" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Select Date & Time *</label>
                      <input type="datetime-local" name="bookingDate" value={formData.bookingDate} onChange={handleInputChange} required className="w-full px-4 py-3 text-white transition-all bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none [color-scheme:dark]" />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-gray-300">Biggest Automation Challenge</label>
                      <textarea name="challenge" value={formData.challenge} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 text-white transition-all bg-gray-900 border border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none" placeholder="What's slowing your team down?" />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 mt-6 font-semibold text-gray-900 transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    Review Details <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col py-4">
                  <h3 className="mb-6 text-2xl font-bold text-center text-white">Confirm Booking</h3>

                  <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700 mb-6 space-y-3 text-sm">
                    <p><span className="text-gray-400">Date & Time:</span> <br /><span className="text-white text-base font-medium">{new Date(formData.bookingDate).toLocaleString()}</span></p>
                    <p><span className="text-gray-400">Name:</span> <span className="text-white">{formData.name}</span></p>
                    <p><span className="text-gray-400">Company:</span> <span className="text-white">{formData.company}</span></p>
                  </div>

                  {error && <p className="mb-4 text-sm text-center text-red-400">{error}</p>}

                  <button onClick={handleSchedule} disabled={isLoading} className="w-full flex items-center justify-center gap-2 py-4 font-bold text-gray-900 transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-70 disabled:cursor-not-allowed">
                    {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CheckCircle className="w-5 h-5" /> Confirm & Book</>}
                  </button>

                  <button onClick={() => setStep(1)} disabled={isLoading} className="mt-4 text-sm text-center text-gray-400 hover:text-white transition-colors">
                    Back to edit details
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center pt-2 pb-2 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }} className="flex items-center justify-center w-20 h-20 mb-4 rounded-full bg-emerald-500/20 text-emerald-500">
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                  <h3 className="mb-2 text-2xl font-bold text-white">Demo Confirmed!</h3>
                  <p className="mb-6 text-gray-400">We've saved your slot and sent a confirmation email.</p>

                  <div className="w-full space-y-3">
                    <a href={generateGCalLink()} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 font-medium text-gray-900 transition-all bg-white rounded-xl hover:bg-gray-200">
                      <Calendar className="w-5 h-5" /> Add to Google Calendar
                    </a>

                    <a href={`https://wa.me/919096861443?text=${waText}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 font-medium text-white transition-all bg-[#25D366] rounded-xl hover:bg-[#20bd5a] hover:shadow-[0_0_15px_rgba(37,211,102,0.4)]">
                      <MessageCircle className="w-5 h-5" /> Send WhatsApp Message
                    </a>

                    <a href="https://linkedin.com/in/anish-patil-16aa9422a" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 py-3.5 font-medium text-white transition-all bg-[#0A66C2] rounded-xl hover:bg-[#0957a5] hover:shadow-[0_0_15px_rgba(10,102,194,0.4)]">
                      <Linkedin className="w-5 h-5" /> Connect on LinkedIn
                    </a>
                  </div>

                  <div className="w-full mt-8 border-t border-gray-800 pt-6">
                    <p className="mb-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Prefer direct contact?</p>
                    <div className="grid grid-cols-2 gap-3">
                      <a href="tel:+919096861443" className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-300 transition-all bg-transparent border border-gray-700 rounded-xl hover:bg-gray-800 hover:text-white cursor-pointer">
                        <Phone className="w-4 h-4" /> Call Now
                      </a>
                      <a href={`mailto:anishpatil146@gmail.com?subject=${mailSubject}&body=${mailBody}`} className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-300 transition-all bg-transparent border border-gray-700 rounded-xl hover:bg-gray-800 hover:text-white cursor-pointer">
                        <Mail className="w-4 h-4" /> Send Email
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}