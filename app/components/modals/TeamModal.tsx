import React from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newMember: any;
  setNewMember: (member: any) => void;
  userRole: string;
  isSaving: boolean;
}

export function TeamModal({
  isOpen,
  onClose,
  onSubmit,
  newMember,
  setNewMember,
  userRole,
  isSaving
}: TeamModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Register New Account</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Full Name</label>
            <input type="text" required value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="e.g. Rahul Sharma" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Work Email</label>
            <input type="email" required value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="rahul@company.com" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Assign Role</label>
            <select value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm appearance-none">
              {userRole === 'CEO' && (
                <>
                  <option value="CEO">CEO</option>
                  <option value="Manager">Manager</option>
                  <option value="HR">HR</option>
                </>
              )}
              <option value="Employee">Employee</option>
            </select>
          </div>
          <button type="submit" disabled={isSaving} className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
