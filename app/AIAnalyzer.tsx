"use client";

import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    UploadCloud, Sparkles, TrendingUp, DollarSign,
    Package, Binary, Wrench, Handshake, ShieldCheck,
    ChevronRight, Download, BarChart3,
    Loader2, LayoutDashboard, Settings, LogOut, Search
} from 'lucide-react';

// 🔒 Security: Using the key you provided
const API_KEY = "AIzaSyBOkITjFAPVghSVaO4ju_skGAmB1vtp2Jw";
const genAI = new GoogleGenerativeAI(API_KEY);

interface AnalysisResult {
    productCol: string;
    priceCol: string;
    qtyCol: string;
    catCol: string;
    bizName: string;
    insights: string[];
    totalRevenue: number;
    avgPrice: number;
}

interface DataRow {
    [key: string]: string | number;
}

export default function AIAnalyzerPage() {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 🎨 Automatic Logo Engine (Fixed & Visual) ---
    const AutoLogo = ({ category }: { category: string }) => {
        const cat = category?.toLowerCase() || "general";
        const baseStyle = "p-6 rounded-[2.5rem] mb-6 shadow-2xl border border-white/10 transition-all duration-500 group-hover:rotate-6";

        if (cat.includes('soft') || cat.includes('tech') || cat.includes('it'))
            return <div className={`${baseStyle} bg-linear-to-br from-blue-600/30 to-indigo-600/10`}><Binary className="text-blue-400" size={60} /></div>;
        if (cat.includes('hard') || cat.includes('tool') || cat.includes('const'))
            return <div className={`${baseStyle} bg-linear-to-br from-orange-600/30 to-red-600/10`}><Wrench className="text-orange-400" size={60} /></div>;
        if (cat.includes('serv') || cat.includes('cons') || cat.includes('legal'))
            return <div className={`${baseStyle} bg-linear-to-br from-emerald-600/30 to-teal-600/10`}><Handshake className="text-emerald-400" size={60} /></div>;

        return <div className={`${baseStyle} bg-zinc-800`}><Package className="text-zinc-400" size={60} /></div>;
    };

    const processFile = async (file: File) => {
        if (!file) return;
        setIsAnalyzing(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const sample = JSON.stringify(data.slice(0, 8));

                const prompt = `
          Task: Expert Data Analysis. 
          Data Sample: ${sample}
          1. Identify exact column names for: "Product", "Price", "Quantity", "Category".
          2. Invent a high-end Business Name for this data.
          3. Generate 3 CEO-level strategic insights.
          Output strictly as JSON: {"productCol": "...", "priceCol": "...", "qtyCol": "...", "catCol": "...", "bizName": "...", "insights": []}
        `;

                const aiRes = await model.generateContent(prompt);
                const config = JSON.parse(aiRes.response.text().replace(/```json|```/g, ""));

                let totalRev = 0;
                (data as DataRow[]).forEach((row: DataRow) => {
                    const p = parseFloat(String(row[config.priceCol]).replace(/[^\d.]/g, '')) || 0;
                    const q = parseInt(String(row[config.qtyCol])) || 1;
                    totalRev += (p * q);
                });

                setResult({ ...config, totalRevenue: totalRev, avgPrice: totalRev / data.length });
            } catch {
                alert("AI Mapping Failed. Ensure Excel has clear headers.");
            } finally {
                setIsAnalyzing(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="flex min-h-screen bg-[#050505] text-zinc-400 font-sans">
            {/* --- Sidebar Navigation --- */}
            <aside className="w-64 border-r border-zinc-900 p-6 hidden md:flex flex-col gap-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-black">N</div>
                    <span className="text-white font-bold tracking-tighter text-xl">COMPANY HANDLER AI</span>
                </div>

                <nav className="flex flex-col gap-2">
                    <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
                    <NavItem icon={<BarChart3 size={18} />} label="AI Analyzer" active />
                    <NavItem icon={<Settings size={18} />} label="Settings" />
                </nav>

                <div className="mt-auto pt-6 border-t border-zinc-900">
                    <NavItem icon={<LogOut size={18} />} label="Logout" />
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            <main className="flex-1 flex flex-col">
                <header className="h-20 border-b border-zinc-900 flex items-center justify-between px-8 bg-[#050505]/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input type="text" placeholder="Search analytics..." className="w-full bg-zinc-900/50 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-all" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-emerald-500 to-blue-500 p-0.5">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[10px] font-bold text-white">ADMIN</div>
                        </div>
                    </div>
                </header>

                <section className="p-8 max-w-6xl mx-auto w-full">
                    {!result ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="text-center space-y-2">
                                <h1 className="text-5xl font-black text-white tracking-tighter">AI DATA ENGINE</h1>
                                <p className="text-zinc-500 text-lg">Upload your unstructured business files for instant intelligence.</p>
                            </div>

                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={() => setDragActive(false)}
                                onDrop={(e) => { e.preventDefault(); setDragActive(false); processFile(e.dataTransfer.files[0]); }}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative group border-2 border-dashed rounded-[3rem] p-24 text-center transition-all duration-500 cursor-pointer overflow-hidden ${dragActive ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-[#080808] hover:border-emerald-500/30'}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files![0])} className="hidden" accept=".xlsx, .csv" />
                                <div className="relative z-10 space-y-6">
                                    <div className="w-28 h-28 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-500">
                                        {isAnalyzing ? <Loader2 className="text-emerald-500 animate-spin" size={48} /> : <UploadCloud className="text-zinc-600 group-hover:text-emerald-500" size={48} />}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-2xl font-bold text-white tracking-tight">{isAnalyzing ? "Processing Big Data..." : "Drop Excel File Here"}</p>
                                        <p className="text-zinc-600 uppercase text-[10px] font-black tracking-[0.3em]">Max size 50MB • XLSX, CSV Supported</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-700 space-y-8">
                            <div className="flex items-center justify-between">
                                <button onClick={() => setResult(null)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500 transition-colors">
                                    <ChevronRight size={14} className="rotate-180" /> Reset Analysis
                                </button>
                                <div className="flex gap-3">
                                    <button className="px-6 py-2 bg-zinc-900 border border-zinc-800 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-all">View Raw Data</button>
                                    <button className="px-6 py-2 bg-emerald-500 text-black text-xs font-bold rounded-full hover:bg-white transition-all">Export PDF</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Panel */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <SummaryCard label="Annual Revenue" value={`₹${result.totalRevenue.toLocaleString()}`} icon={<DollarSign size={16} />} />
                                        <SummaryCard label="Average Unit Cost" value={`₹${result.avgPrice.toFixed(0)}`} icon={<TrendingUp size={16} />} />
                                        <SummaryCard label="Market Category" value={result.catCol || "General"} icon={<ShieldCheck size={16} />} />
                                    </div>

                                    <div className="bg-[#0c0c0c] border border-zinc-900 p-10 rounded-[3rem] relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={80} /></div>
                                        <h3 className="text-white font-black text-sm uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                            <Sparkles size={16} className="text-emerald-500" /> Executive Insights
                                        </h3>
                                        <div className="space-y-6">
                                            {result.insights.map((insight: string, i: number) => (
                                                <div key={i} className="flex gap-6 items-start group">
                                                    <div className="w-1 h-12 bg-zinc-800 group-hover:bg-emerald-500 transition-colors rounded-full" />
                                                    <p className="text-zinc-400 text-lg leading-relaxed group-hover:text-zinc-200 transition-colors">{insight}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel: Auto Logo & Brand */}
                                <div className="lg:col-span-4">
                                    <div className="bg-[#0c0c0c] border border-zinc-900 p-12 rounded-[3.5rem] flex flex-col items-center text-center sticky top-28 shadow-2xl group hover:border-emerald-500/20 transition-all duration-500">
                                        <AutoLogo category={result.catCol} />
                                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Verified Identity</span>
                                        <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">{result.bizName}</h2>
                                        <p className="text-zinc-500 text-sm mb-12">&ldquo;Innovative solutions in the {result.catCol} sector.&rdquo;</p>

                                        <div className="w-full space-y-3">
                                            <button className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                                                <Download size={18} /> Brand Identity Kit
                                            </button>
                                            <button className="w-full py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl hover:text-white transition-all">SVG Vector Pack</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

// --- Helper Components ---
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}

function NavItem({ icon, label, active = false }: NavItemProps) {
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:bg-zinc-900 hover:text-white'}`}>
            {icon} <span className="text-sm">{label}</span>
        </div>
    );
}

interface SummaryCardProps {
    label: string;
    value: string;
    icon: React.ReactNode;
}

function SummaryCard({ label, value, icon }: SummaryCardProps) {
    return (
        <div className="bg-[#0c0c0c] border border-zinc-900 p-8 rounded-[2.5rem] hover:scale-105 transition-all duration-300">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-emerald-500 mb-6 border border-zinc-800">{icon}</div>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-xl font-black text-white wrap-break-word">{value}</h4>
        </div>
    );
}