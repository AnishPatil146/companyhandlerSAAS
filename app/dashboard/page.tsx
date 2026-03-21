"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Bot, Settings, LogOut,
  Plus, User as UserIcon, Loader2, Trash2, Calendar, Users, Copy, CheckCircle2, Mail, Package, TrendingUp, Tag, Sparkles
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, ComposedChart, Line,
  PieChart, Pie, Cell, Legend, BarChart
} from 'recharts';

import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc, Timestamp, where } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

// 🔥 NAYA FEATURE: Excel parsing ke liye import
import * as XLSX from 'xlsx';

interface Lead { id: string; name: string; company: string; status: string; value: number; createdAt?: Timestamp; }
interface MonthlyData { month: string; revenue: number; churn: number; target: number; }
interface TeamMember { id: string; name: string; email: string; role: string; addedByRole: string; status: string; createdAt?: Timestamp; }
interface UserData { name: string; role: string; uid?: string; email?: string; }
interface Product { id: string; name: string; category: string; price: number; marketPrice: number; marketShare: number; stock: number; isTrending: boolean; createdAt?: Timestamp; }

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
export const auth = getAuth(app);

export default function MasterDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Products');

  const [userRole, setUserRole] = useState('');
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

  const [timeRange, setTimeRange] = useState('all');

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // 🔥 NAYA STATE: AI Import Loader
  const [isImportingAI, setIsImportingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [createdAccount, setCreatedAccount] = useState<{ name: string, email: string, password: string } | null>(null);

  const [newLead, setNewLead] = useState({ name: '', company: '', value: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Employee' });
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Software', price: '', marketPrice: '', marketShare: '', stock: '', isTrending: false });

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/'); } else {
        const q = query(collection(db, 'company_team'), where('uid', '==', user.uid));
        unsubscribeUser = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data() as UserData;
            setCurrentUserData(userData); setUserRole(userData.role);
          } else { setCurrentUserData({ name: 'Super Admin', role: 'CEO' }); setUserRole('CEO'); }
          setIsAuthChecking(false);
        });
      }
    });
    return () => { unsubscribeAuth(); if (unsubscribeUser) unsubscribeUser(); };
  }, [router]);

  useEffect(() => {
    if (isAuthChecking) return;
    const unsubscribeLeads = onSnapshot(query(collection(db, 'leads'), orderBy('createdAt', 'desc')), (snapshot) => { setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Lead[]); setIsLoadingData(false); });
    const unsubscribeTeam = onSnapshot(query(collection(db, 'company_team'), orderBy('createdAt', 'desc')), (snapshot) => { setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeamMember[]); });
    const unsubscribeProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snapshot) => { setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]); });
    return () => { unsubscribeLeads(); unsubscribeTeam(); unsubscribeProducts(); };
  }, [isAuthChecking]);

  const analytics = useMemo(() => {
    const now = new Date(); const cutoffDate = new Date();
    if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
    else if (timeRange === '1y') cutoffDate.setFullYear(now.getFullYear() - 1);
    else cutoffDate.setFullYear(2000);

    const validLeads = leads.filter(l => { const d = l.createdAt?.toDate ? l.createdAt.toDate() : new Date(); return d >= cutoffDate; });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dataMap: Record<string, MonthlyData> = {};
    months.forEach(m => dataMap[m] = { month: m, revenue: 0, churn: 0, target: 50000 });

    let totalGross = 0; let expectedRev = 0; let wonRev = 0;
    const counts = { 'New': 0, 'In Progress': 0, 'Won': 0, 'Lost': 0 };

    validLeads.forEach(lead => {
      const val = Number(lead.value) || 0; totalGross += val;
      if (counts[lead.status as keyof typeof counts] !== undefined) counts[lead.status as keyof typeof counts]++; else counts['New']++;
      if (lead.status === 'In Progress') expectedRev += (val * 0.5);
      if (lead.status === 'Won') wonRev += val;
      if (lead.createdAt && typeof lead.createdAt.toDate === 'function') {
        const monthName = months[lead.createdAt.toDate().getMonth()];
        if (lead.status === 'Won') dataMap[monthName].revenue += val; else if (lead.status === 'Lost') dataMap[monthName].churn += val;
      }
    });

    const totalClosed = counts.Won + counts.Lost;
    const winRate = totalClosed > 0 ? ((counts.Won / totalClosed) * 100).toFixed(1) : "0.0";
    const avgDealSize = validLeads.length > 0 ? (totalGross / validLeads.length).toFixed(0) : "0";

    const pieData = [
      { name: 'New', value: counts.New, color: '#3b82f6' }, { name: 'In Progress', value: counts['In Progress'], color: '#eab308' },
      { name: 'Won', value: counts.Won, color: '#10b981' }, { name: 'Lost', value: counts.Lost, color: '#ef4444' }
    ].filter(d => d.value > 0);

    // 🔥 NAYA FEATURE: Product Analytics Calculations
    let totalInventoryValue = 0;
    const productMarketData: unknown[] = [];
    products.forEach(p => {
      totalInventoryValue += (p.price * p.stock);
      if (p.marketShare > 0) {
        productMarketData.push({ name: p.name, share: p.marketShare, price: p.price });
      }
    });

    // Sort by highest market share
    productMarketData.sort((a, b) => (b as { share: number }).share - (a as { share: number }).share);

    return {
      totalGross, expectedRev, wonRev, winRate, avgDealSize, activeCount: counts.New + counts['In Progress'],
      graphData: Object.values(dataMap).slice(0, 6), pieData,
      totalInventoryValue, productMarketData: productMarketData.slice(0, 5) // Top 5 products
    };
  }, [leads, timeRange, products]);

  const visibleTeam = useMemo(() => {
    if (userRole === 'CEO') return team;
    if (userRole === 'Manager') return team.filter(m => m.role === 'Manager' || m.role === 'Employee');
    if (userRole === 'HR') return team.filter(m => m.role === 'HR' || m.role === 'Employee');
    return [];
  }, [team, userRole]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLogout = async () => { try { await signOut(auth); router.push('/'); } catch (error) { } };

  // 🔥 NAYA FEATURE: Smart AI Excel Analyzer 🔥
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingAI(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulated AI delay

        let importCount = 0;

        for (const row of jsonData as []) {
          const keys = Object.keys(row);
          let name = '', category = 'Software', price = 0, marketPrice = 0, marketShare = 0, stock = 0;

          // 🤖 AI Logic: Fuzzy matching column headers
          keys.forEach(k => {
            const lowerK = k.toLowerCase();
            if (lowerK.includes('name') || lowerK.includes('product') || lowerK.includes('title') || lowerK.includes('item')) name = row[k];
            else if (lowerK.includes('market price') || lowerK.includes('competitor')) marketPrice = Number(row[k]);
            else if (lowerK.includes('price') || lowerK.includes('mrp') || lowerK.includes('cost')) price = Number(row[k]);
            else if (lowerK.includes('share') || lowerK.includes('percentage') || lowerK.includes('%') || lowerK.includes('market')) marketShare = Number(row[k]);
            else if (lowerK.includes('stock') || lowerK.includes('qty') || lowerK.includes('quantity') || lowerK.includes('units')) stock = Number(row[k]);
            else if (lowerK.includes('category') || lowerK.includes('type')) category = String(row[k]);
          });

          if (name) {
            await addDoc(collection(db, 'products'), {
              name: String(name), category, price: price || 0, marketPrice: marketPrice || 0, marketShare: marketShare || 0, stock: stock || 0,
              isTrending: marketShare > 50,
              createdAt: serverTimestamp()
            });
            importCount++;
          }
        }
        alert(`🤖 AI Analysis Complete!\nSuccessfully extracted and imported ${importCount} products from your Excel sheet.`);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        alert("❌ Error analyzing the Excel file. Please ensure it's a valid format.");
      } finally {
        setIsImportingAI(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newLead.name || !newLead.company || !newLead.value) return;
    setIsSaving(true);
    try { await addDoc(collection(db, 'leads'), { name: newLead.name, company: newLead.company, status: 'New', value: Number(newLead.value), createdAt: serverTimestamp() }); setIsModalOpen(false); setNewLead({ name: '', company: '', value: '' }); } finally { setIsSaving(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      const generatedPassword = Math.random().toString(36).slice(-6) + "A1!";
      const apps = getApps(); const secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp"); const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newMember.email, generatedPassword);
      await addDoc(collection(db, 'company_team'), { uid: userCredential.user.uid, name: newMember.name, email: newMember.email, role: newMember.role, addedByRole: userRole, status: 'Active', createdAt: serverTimestamp() });
      setCreatedAccount({ name: newMember.name, email: newMember.email, password: generatedPassword }); setIsTeamModalOpen(false); setNewMember({ name: '', email: '', role: 'Employee' });
    } catch (error: unknown

    ) { alert("Error: " + (error as Error).message); } finally { setIsSaving(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try {
      await addDoc(collection(db, 'products'), { name: newProduct.name, category: newProduct.category, price: Number(newProduct.price), marketPrice: Number(newProduct.marketPrice) || 0, marketShare: Number(newProduct.marketShare) || 0, stock: Number(newProduct.stock), isTrending: newProduct.isTrending, createdAt: serverTimestamp() });
      setIsProductModalOpen(false); setNewProduct({ name: '', category: 'Software', price: '', marketPrice: '', marketShare: '', stock: '', isTrending: false });
    } finally { setIsSaving(false); }
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); alert("Copied to clipboard!"); };

  const sendRealEmail = async () => {
    if (!createdAccount) return; setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createdAccount.name, email: createdAccount.email, password: createdAccount.password }) });
      const data = await response.json();
      if (data.success) { alert("✅ Email sent successfully!"); setCreatedAccount(null); } else { alert("❌ Failed to send email: " + data.error); }
    } catch { alert("❌ Error connecting to email server."); } finally { setIsSendingEmail(false); }
  };

  const handleDeleteDoc = async (collectionName: string, id: string) => { if (window.confirm("Are you sure?")) await deleteDoc(doc(db, collectionName, id)); };
  const handleStatusChange = async (id: string, newStatus: string) => { await updateDoc(doc(db, 'leads', id), { status: newStatus }); };
  const handleTrendingToggle = async (id: string, currentTrending: boolean) => { await updateDoc(doc(db, 'products', id), { isTrending: !currentTrending }); };

  if (isAuthChecking) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-zinc-400"><Loader2 className="animate-spin mr-3" size={20} /> Verifying Secure Connection...</div>;

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-800">

      <aside className="w-64 border-r border-zinc-800/60 bg-[#0a0a0a] flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-zinc-800/60 font-semibold tracking-widest text-zinc-100 uppercase text-sm">Company Handler</div>
          <nav className="p-4 space-y-1">
            {[
              { id: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'Analytics', icon: <BarChart3 size={18} /> },
              { id: 'Products', icon: <Package size={18} /> },
              { id: 'Team', icon: <Users size={18} /> },
              { id: 'Automation', icon: <Bot size={18} /> },
              { id: 'Settings', icon: <Settings size={18} /> }
            ].map((tab) => {
              if (tab.id === 'Team' && userRole === 'Employee') return null;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`}>
                  {tab.icon} {tab.id}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-zinc-800/60">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        <header className="h-16 border-b border-zinc-800/60 flex items-center justify-between px-8 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 text-sm text-zinc-500"><span>Overview</span><span>/</span><span className="text-zinc-100 font-medium">{activeTab}</span></div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700"><UserIcon size={14} className="text-zinc-300" /></div>
              <div className="text-sm"><p className="font-medium text-zinc-200">{currentUserData?.name || 'Loading...'}</p><p className="text-[10px] text-zinc-500 uppercase tracking-wider">{userRole || 'Verifying'}</p></div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">

            {/* 🔥 PRODUCTS TAB 🔥 */}
            {activeTab === 'Products' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Marketplace & Inventory</h1>
                    <p className="text-sm text-zinc-500 mt-1">Manage company products, pricing, and active trends.</p>
                  </div>

                  {userRole !== 'Employee' && (
                    <div className="flex items-center gap-3">
                      {/* 🔥 NAYA FEATURE: AI Import Button */}
                      <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleExcelUpload} />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImportingAI}
                        className="bg-zinc-800 text-emerald-400 border border-zinc-700 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                      >
                        {isImportingAI ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                        {isImportingAI ? 'AI Analyzing...' : 'Smart Import (Excel)'}
                      </button>

                      <button onClick={() => setIsProductModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm">
                        <Plus size={16} /> Add Product
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.length === 0 ? (
                    <div className="col-span-full p-12 text-center text-zinc-500 bg-[#111111] border border-zinc-800/60 rounded-xl">No products in marketplace yet. Click &quot;Smart Import&quot; to add via Excel!</div>
                  ) : (
                    products.map(product => (
                      <motion.div whileHover={{ y: -4 }} key={product.id} className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm relative group flex flex-col">

                        {product.isTrending && (
                          <div className="absolute top-4 right-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded flex items-center gap-1">
                            <TrendingUp size={12} /> Trending
                          </div>
                        )}

                        <div className="p-6 flex-1">
                          <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 border border-zinc-800">
                            <Package size={24} className="text-emerald-400" />
                          </div>

                          <div className="flex items-center gap-2 mb-1">
                            <Tag size={12} className="text-emerald-500" />
                            <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">{product.category}</p>
                          </div>

                          <h3 className="text-lg font-bold text-zinc-100 mb-1">{product.name}</h3>

                          <div className="flex flex-col mt-4">
                            <div className="flex items-end gap-3 mb-1">
                              <h2 className="text-2xl font-bold text-white tabular-nums tracking-tight">${product.price.toLocaleString()}</h2>
                              {product.marketPrice > 0 && (
                                <span className="text-sm text-zinc-500 line-through mb-1">${product.marketPrice.toLocaleString()}</span>
                              )}
                            </div>

                            <div className="mt-4 mb-1">
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Market Captured</span>
                                <span className="text-emerald-400 font-bold">{product.marketShare || 0}%</span>
                              </div>
                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${product.marketShare || 0}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut" }}
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 py-4 bg-[#161616] border-t border-zinc-800/60 flex justify-between items-center mt-auto">
                          <p className="text-xs font-medium text-zinc-500">
                            Stock: <span className={product.stock > 0 ? 'text-zinc-200' : 'text-red-400'}>{product.stock} Units</span>
                          </p>

                          {userRole !== 'Employee' && (
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleTrendingToggle(product.id, product.isTrending)} className="text-xs text-zinc-400 hover:text-orange-400 font-medium">
                                {product.isTrending ? 'Unmark Fire' : 'Mark Trending'}
                              </button>
                              <button onClick={() => handleDeleteDoc('products', product.id)} className="text-zinc-500 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'Team' && userRole !== 'Employee' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Organization Directory</h1><p className="text-sm text-zinc-500 mt-1">Manage access control and auto-generate accounts.</p></div>
                  <button onClick={() => setIsTeamModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm"><Plus size={16} /> Add Member</button>
                </div>
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-8 shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-zinc-800/60 bg-[#161616]"><th className="p-4 text-zinc-400 font-medium">Name</th><th className="p-4 text-zinc-400 font-medium">Email Address</th><th className="p-4 text-zinc-400 font-medium">Role</th><th className="p-4 text-zinc-400 font-medium">Status</th><th className="p-4 text-zinc-400 font-medium text-center w-16">Action</th></tr></thead>
                    <tbody>
                      {visibleTeam.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No members visible to your role.</td></tr> :
                        visibleTeam.map(member => (
                          <tr key={member.id} className="border-b border-zinc-800/30 hover:bg-[#161616] group transition-colors">
                            <td className="p-4 font-medium text-zinc-200">{member.name}</td><td className="p-4 text-zinc-500">{member.email}</td>
                            <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${member.role === 'Manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''} ${member.role === 'HR' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''} ${member.role === 'Employee' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}`}>{member.role}</span></td>
                            <td className="p-4"><span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><CheckCircle2 size={12} /> {member.status}</span></td>
                            <td className="p-4 text-center">{(userRole === 'CEO' || (userRole !== 'CEO' && member.role === 'Employee')) && (<button onClick={() => handleDeleteDoc('company_team', member.id)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={16} /></button>)}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* DASHBOARD TAB */}
            {activeTab === 'Dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-end mb-8">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Active Pipeline</h1><p className="text-sm text-emerald-500 mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Secure Cloud Sync Active</p></div>
                  <button onClick={() => setIsModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm"><Plus size={16} /> Deploy Lead</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Gross Pipeline</p><h2 className="text-3xl font-semibold text-zinc-100">${analytics.totalGross.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Won Revenue</p><h2 className="text-3xl font-semibold text-emerald-400">${analytics.wonRev.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Active Leads</p><h2 className="text-3xl font-semibold text-zinc-100">{analytics.activeCount}</h2></div>
                </div>
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-8 shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead><tr className="border-b border-zinc-800/60 bg-[#161616]"><th className="p-4 text-zinc-400 font-medium">Name</th><th className="p-4 text-zinc-400 font-medium">Organization</th><th className="p-4 text-zinc-400 font-medium">Status</th><th className="p-4 text-zinc-400 font-medium text-right">Value</th><th className="p-4 text-zinc-400 font-medium text-center w-16">Action</th></tr></thead>
                    <tbody>
                      {isLoadingData ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin inline-block mr-2" size={16} /> Fetching...</td></tr> :
                        leads.map(l => (
                          <tr key={l.id} className="border-b border-zinc-800/30 hover:bg-[#161616] group transition-colors">
                            <td className="p-4 font-medium text-zinc-200">{l.name}</td><td className="p-4 text-zinc-500">{l.company}</td>
                            <td className="p-4"><select value={l.status} onChange={(e) => handleStatusChange(l.id, e.target.value)} className={`bg-zinc-800/50 text-zinc-300 px-2 py-1.5 rounded text-xs font-medium border border-zinc-700/50 outline-none cursor-pointer hover:bg-zinc-700 transition-colors ${l.status === 'Won' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : ''} ${l.status === 'Lost' ? 'text-red-400 border-red-500/30 bg-red-500/10' : ''}`}><option value="New" className="bg-zinc-900 text-white">New</option><option value="In Progress" className="bg-zinc-900 text-white">In Progress</option><option value="Won" className="bg-zinc-900 text-emerald-400">Won</option><option value="Lost" className="bg-zinc-900 text-red-400">Lost</option></select></td>
                            <td className="p-4 text-right text-zinc-300">${(l.value || 0).toLocaleString()}</td>
                            <td className="p-4 text-center"><button onClick={() => handleDeleteDoc('leads', l.id)} className="text-zinc-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"><Trash2 size={16} /></button></td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 🔥 UPDATED ANALYTICS TAB 🔥 */}
            {activeTab === 'Analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex justify-between items-end mb-6">
                  <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Executive Telemetry & Intelligence</h1>
                  <div className="flex items-center gap-3 bg-[#111111] border border-zinc-800/60 px-4 py-2 rounded-lg shadow-sm">
                    <Calendar size={16} className="text-zinc-400" />
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-200 outline-none cursor-pointer">
                      <option value="all" className="bg-zinc-900">All Time</option><option value="1y" className="bg-zinc-900">Last 1 Year</option><option value="30d" className="bg-zinc-900">Last 30 Days</option><option value="7d" className="bg-zinc-900">Last 7 Days</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60"><p className="text-zinc-500 text-xs font-medium uppercase mb-1">Avg Deal Size</p><h2 className="text-2xl font-semibold text-zinc-100">${Number(analytics.avgDealSize).toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60"><p className="text-zinc-500 text-xs font-medium uppercase mb-1">Expected Revenue</p><h2 className="text-2xl font-semibold text-yellow-500">${analytics.expectedRev.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60"><p className="text-zinc-500 text-xs font-medium uppercase mb-1">Total Closed Won</p><h2 className="text-2xl font-semibold text-emerald-400">${analytics.wonRev.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60"><p className="text-zinc-500 text-xs font-medium uppercase mb-1">Win Rate</p><h2 className="text-2xl font-semibold text-zinc-100">{analytics.winRate}%</h2></div>

                  {/* 🔥 NEW ANALYTICS CARD: Inventory Value */}
                  <div className="bg-[#111111] p-5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10 text-emerald-500"><Package size={80} /></div>
                    <p className="text-emerald-500 text-xs font-medium uppercase mb-1">Total Inventory Value</p>
                    <h2 className="text-2xl font-semibold text-emerald-400">${analytics.totalInventoryValue.toLocaleString()}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-[#111111] p-6 rounded-xl border border-zinc-800/60 shadow-sm h-96 lg:col-span-1 flex flex-col">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Pipeline Breakdown</h3>
                    <div className="flex-1 w-full">
                      {analytics.pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart><Pie data={analytics.pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{analytics.pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />))}</Pie><Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} /></PieChart>
                        </ResponsiveContainer>
                      ) : (<div className="h-full flex items-center justify-center text-zinc-600 text-sm">No data</div>)}
                    </div>
                  </div>

                  <div className="bg-[#111111] p-6 rounded-xl border border-zinc-800/60 shadow-sm h-96 lg:col-span-2 flex flex-col">
                    <h3 className="text-sm font-medium text-zinc-400 mb-4">Revenue vs Churn</h3>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analytics.graphData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="month" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                          <Bar dataKey="churn" name="Lost Value ($)" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
                          <Line type="monotone" dataKey="target" name="Target" stroke="#52525b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                          <Line type="monotone" dataKey="revenue" name="Won Revenue ($)" stroke="#10b981" dot={false} strokeWidth={3} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 🔥 NEW ANALYTICS SECTION: Market Share Analysis 🔥 */}
                <div className="bg-[#111111] p-6 rounded-xl border border-zinc-800/60 shadow-sm h-96 flex flex-col mt-6">
                  <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2"><Sparkles size={16} /> Top Products by Market Share</h3>
                  <div className="flex-1 w-full">
                    {analytics.productMarketData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.productMarketData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                          <XAxis type="number" stroke="#52525b" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                          <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={12} width={150} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #10b981', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#27272a' }} />
                          <Bar dataKey="share" name="Market Share (%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                            {analytics.productMarketData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#059669'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (<div className="h-full flex items-center justify-center text-zinc-600 text-sm">Upload products via AI Import to see Market Share Analytics</div>)}
                  </div>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* LEAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Deploy New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
              <input type="text" required value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Contact Name" />
              <input type="text" required value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Organization" />
              <input type="number" required value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 transition-all text-sm" placeholder="Value ($)" />
              <button type="submit" disabled={isSaving} className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Save Securely'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 🔥 ADD PRODUCT MODAL 🔥 */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Add New Product</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Product Name</label>
                <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="e.g. Enterprise License" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Selling Price ($)</label>
                  <input type="number" required value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Market Price ($)</label>
                  <input type="number" required value={newProduct.marketPrice} onChange={e => setNewProduct({ ...newProduct, marketPrice: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="0.00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Stock / Units</label>
                  <input type="number" required value={newProduct.stock} onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="100" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Market Share (%)</label>
                  <input type="number" required value={newProduct.marketShare} onChange={e => setNewProduct({ ...newProduct, marketShare: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm" placeholder="e.g. 45" />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 uppercase font-medium mb-1 block">Category</label>
                <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="w-full bg-[#1a1a1a] border border-zinc-800 text-white px-4 py-3 rounded-lg outline-none focus:border-zinc-500 text-sm appearance-none">
                  <option value="Software">Software License</option>
                  <option value="Hardware">Hardware / Equipment</option>
                  <option value="Service">Consulting Service</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="trending" checked={newProduct.isTrending} onChange={e => setNewProduct({ ...newProduct, isTrending: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700" />
                <label htmlFor="trending" className="text-sm text-zinc-400 cursor-pointer">Mark as Trending Fire 🔥</label>
              </div>

              <button type="submit" disabled={isSaving} className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'List Product'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* TEAM MEMBER MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111111] border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Register New Account</h2>
              <button onClick={() => setIsTeamModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-4">
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
                  {userRole === 'CEO' && (<><option value="Manager">Manager</option><option value="HR">HR</option></>)}
                  <option value="Employee">Employee</option>
                </select>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-white text-black py-3 rounded-lg font-medium mt-6 hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {createdAccount && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-[#111111] border border-emerald-500/30 p-8 rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(16,185,129,0.1)] text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-sm text-zinc-400 mb-6">Share these credentials securely. They can log in immediately.</p>
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 mb-6 text-left space-y-3">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Email</p>
                <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded text-sm text-zinc-200">
                  <span>{createdAccount.email}</span>
                  <button onClick={() => copyToClipboard(createdAccount.email)} className="text-zinc-500 hover:text-white"><Copy size={14} /></button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Temporary Password</p>
                <div className="flex items-center justify-between bg-[#1a1a1a] p-2 rounded text-sm text-zinc-200">
                  <span className="font-mono text-emerald-400">{createdAccount.password}</span>
                  <button onClick={() => copyToClipboard(createdAccount.password)} className="text-zinc-500 hover:text-white"><Copy size={14} /></button>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={sendRealEmail} disabled={isSendingEmail} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {isSendingEmail ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />}
                {isSendingEmail ? 'Sending Email...' : 'Send via Email'}
              </button>
              <button onClick={() => setCreatedAccount(null)} className="w-full bg-transparent border border-zinc-700 text-zinc-300 py-2.5 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}