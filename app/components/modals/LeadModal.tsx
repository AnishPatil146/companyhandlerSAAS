import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newLead: any;
  setNewLead: (lead: any) => void;
  team: any[];
  currencySymbol: string;
  isSaving: boolean;
}

export function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  newLead,
  setNewLead,
  team,
  currencySymbol,
  isSaving
}: LeadModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Deploy New Lead</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="text" required value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Contact Name" />
          <input type="text" required value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Organization" />
          <input type="email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Client Email (Optional - triggers auto welcome)" />
          <input type="number" required value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder={`Value (${currencySymbol})`} />
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Assign To (Optional)</label>
            <select value={newLead.assignedToId} onChange={e => { const selectedMember = team.find(m => m.uid === e.target.value); setNewLead({ ...newLead, assignedToId: e.target.value, assignedToName: selectedMember?.name || 'Unassigned' }); }} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm appearance-none cursor-pointer">
              <option value="">-- Auto-Assign to Me --</option>
              {team.map(m => (<option key={m.id} value={m.uid}>{m.name} ({m.role})</option>))}
            </select>
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 text-black font-black py-3 rounded-lg mt-6 hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Deploy & Assign'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
