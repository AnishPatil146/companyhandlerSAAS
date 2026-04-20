import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Sparkles, X, Loader2 } from 'lucide-react';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  leaveForm: any;
  setLeaveForm: (form: any) => void;
  isSaving: boolean;
}

export function LeaveModal({
  isOpen,
  onClose,
  onSubmit,
  leaveForm,
  setLeaveForm,
  isSaving
}: LeaveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Coffee size={20} className="text-emerald-500" /> Request Time Off
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Start Date</label>
              <input type="date" required value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm [color-scheme:dark]" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">End Date</label>
              <input type="date" required value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm [color-scheme:dark]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block flex items-center gap-1">
              Reason <Sparkles size={10} className="text-emerald-500" />
            </label>
            <textarea required value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm min-h-[100px] resize-none" placeholder="Provide details. AI will summarize this for your manager..." />
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 text-black font-black py-3 rounded-lg mt-6 hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Submit Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
