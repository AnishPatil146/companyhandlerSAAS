import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Mail, Loader2 } from 'lucide-react';

interface AccountCreatedModalProps {
  account: any | null;
  onClose: () => void;
  onSendEmail: () => void;
  isSendingEmail: boolean;
  onCopyToClipboard: (text: string) => void;
}

export function AccountCreatedModal({
  account,
  onClose,
  onSendEmail,
  isSendingEmail,
  onCopyToClipboard
}: AccountCreatedModalProps) {
  if (!account) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#111111] border border-emerald-500/30 p-6 md:p-8 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(16,185,129,0.1)] text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
        <p className="text-sm text-zinc-400 mb-6">Share these credentials securely. They can log in immediately.</p>
        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 mb-6 text-left space-y-3">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Email</p>
            <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded text-sm text-zinc-200">
              <span className="truncate mr-2">{account.email}</span>
              <button onClick={() => onCopyToClipboard(account.email)} className="text-zinc-500 hover:text-white shrink-0">
                <Copy size={14} />
              </button>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Temporary Password</p>
            <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded text-sm text-zinc-200">
              <span className="font-mono text-emerald-400 truncate mr-2">{account.password}</span>
              <button onClick={() => onCopyToClipboard(account.password)} className="text-zinc-500 hover:text-white shrink-0">
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={onSendEmail} disabled={isSendingEmail} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isSendingEmail ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
            {isSendingEmail ? 'Sending Email...' : 'Send via Email'}
          </button>
          <button onClick={onClose} className="w-full bg-transparent border border-zinc-700 text-zinc-300 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
