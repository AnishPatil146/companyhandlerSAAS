"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BarChart3, Bot, Settings, LogOut,
  Plus, User as UserIcon, Loader2
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, ComposedChart, Line
} from 'recharts';

// 🔥 FIREBASE IMPORTS (Secure via .env) 🔥
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

interface Lead {
  id: string;
  name: string;
  company: string;
  status: string;
  value: number;
  createdAt?: Date | { toDate(): Date };
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const performanceData = [
  { month: 'Jan', revenue: 45000, churn: 2400, target: 40000 },
  { month: 'Feb', revenue: 52000, churn: 1800, target: 48000 },
  { month: 'Mar', revenue: 48000, churn: 3200, target: 55000 },
  { month: 'Apr', revenue: 61000, churn: 1500, target: 60000 },
  { month: 'May', revenue: 68000, churn: 1200, target: 65000 },
  { month: 'Jun', revenue: 84250, churn: 900, target: 75000 },
];

export default function MasterDashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [userRole, setUserRole] = useState('CEO');

  // Cloud Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', company: '', value: '' });

  // 🔥 REAL-TIME CLOUD SYNC
  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(leadsData);
      setIsLoadingData(false);
    }, (error) => {
      console.error("Firebase fetch error:", error);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 PUSH SECURE DATA TO CLOUD
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.company || !newLead.value) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'leads'), {
        name: newLead.name,
        company: newLead.company,
        status: 'New',
        value: Number(newLead.value),
        createdAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setNewLead({ name: '', company: '', value: '' });
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Lead save nahi hui! Error check karo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-800">
      {/* MINIMALIST SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800/60 bg-[#0a0a0a] flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/60">
            <span className="text-sm font-semibold tracking-widest text-zinc-100 uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              Company Handler
            </span>
          </div>

          <nav className="p-4 space-y-1">
            {([
              { id: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'Analytics', icon: <BarChart3 size={18} /> },
              { id: 'Automation', icon: <Bot size={18} /> },
              { id: 'Settings', icon: <Settings size={18} /> }
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                    ? 'bg-zinc-800/80 text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
              >
                {tab.icon} {tab.id}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-zinc-800/60">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">

        {/* CLEAN TOP HEADER */}
        <header className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Overview</span>
            <span>/</span>
            <span className="text-zinc-100 font-medium">{activeTab}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800/60">
              {['CEO', 'Manager', 'Employee'].map(role => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`px-4 py-1.5 text-xs font-medium rounded transition-all ${userRole === role
                      ? 'bg-zinc-700 text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 border-l border-zinc-800/60 pl-6">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <UserIcon size={14} className="text-zinc-300" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-zinc-200">Anish Patil</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* DYNAMIC CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">

            {activeTab === 'Dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Active Pipeline</h1>
                    <p className="text-sm text-emerald-500 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Secure Cloud Sync Active
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus size={16} /> Deploy Lead
                  </button>
                </div>

                {/* PREMIUM STAT CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm">
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Gross Pipeline</p>
                    <h2 className="text-3xl font-semibold text-zinc-100">${leads.reduce((a, b) => a + (b.value || 0), 0).toLocaleString()}</h2>
                  </div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm">
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Enterprise Win Rate</p>
                    <h2 className="text-3xl font-semibold text-zinc-100">28.4%</h2>
                  </div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm">
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Active Leads</p>
                    <h2 className="text-3xl font-semibold text-zinc-100">{leads.length}</h2>
                  </div>
                </div>

                {/* CLEAN TABLE */}
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-8 shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800/60 bg-[#161616]">
                        <th className="p-4 text-zinc-400 font-medium">Name</th>
                        <th className="p-4 text-zinc-400 font-medium">Organization</th>
                        <th className="p-4 text-zinc-400 font-medium">Status</th>
                        <th className="p-4 text-zinc-400 font-medium text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingData ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-500">
                            <Loader2 className="animate-spin inline-block mr-2" size={16} /> Fetching from Secure Server...
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-zinc-500">
                            Pipeline is empty. Deploy a new lead to get started.
                          </td>
                        </tr>
                      ) : (
                        leads.map(l => (
                          <tr key={l.id} className="border-b border-zinc-800/30 hover:bg-[#161616] transition-colors">
                            <td className="p-4 font-medium text-zinc-200">{l.name}</td>
                            <td className="p-4 text-zinc-500">{l.company}</td>
                            <td className="p-4">
                              <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded text-xs font-medium border border-zinc-700/50">
                                {l.status}
                              </span>
                            </td>
                            <td className="p-4 text-right text-zinc-300">${(l.value || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'Analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-8">Executive Telemetry</h1>
                <div className="bg-[#111111] p-6 rounded-xl border border-zinc-800/60 shadow-sm h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="churn" fill="#52525b" radius={[4, 4, 0, 0]} barSize={12} />
                      <Line type="monotone" dataKey="target" stroke="#a1a1aa" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="revenue" stroke="#ffffff" dot={false} strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* 🔥 NEW LEAD MODAL WITH SECURE SYNC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Deploy New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Contact Name</label>
                <input type="text" required value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Organization</label>
                <input type="text" required value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="e.g. Acme Corp" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Estimated Value ($)</label>
                <input type="number" required value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="e.g. 15000" />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save Securely'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}