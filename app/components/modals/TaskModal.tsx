import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, X, Loader2 } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newTask: any;
  setNewTask: (task: any) => void;
  targetTaskRole: string;
  eligibleTaskAssignees: any[];
  team: any[];
  isSaving: boolean;
}

export function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  newTask,
  setNewTask,
  targetTaskRole,
  eligibleTaskAssignees,
  team,
  isSaving
}: TaskModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <ClipboardList size={20} className="text-emerald-500" /> Assign New Task
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Task Title</label>
            <input type="text" required value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm" placeholder="e.g. Call 10 new leads today" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Description</label>
            <textarea required value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm min-h-[80px] resize-none" placeholder="Task details..." />
          </div>
          <div>
            <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Assign To ({targetTaskRole})</label>
            <select required value={newTask.assignedToId} onChange={e => { const selectedMember = team.find(m => m.uid === e.target.value); setNewTask({ ...newTask, assignedToId: e.target.value, assignedToName: selectedMember?.name || '', assignedToRole: selectedMember?.role || '' }); }} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer">
              <option value="">-- Select {targetTaskRole} --</option>
              {eligibleTaskAssignees.map(m => (<option key={m.id} value={m.uid}>{m.name}</option>))}
            </select>
            {eligibleTaskAssignees.length === 0 && <p className="text-red-400 text-[10px] mt-1">No {targetTaskRole}s found in the system to assign tasks to.</p>}
          </div>
          <button type="submit" disabled={isSaving || eligibleTaskAssignees.length === 0} className="w-full bg-emerald-500 text-black font-black py-3 rounded-lg mt-6 hover:bg-emerald-400 transition-colors flex justify-center items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Dispatch Task'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
