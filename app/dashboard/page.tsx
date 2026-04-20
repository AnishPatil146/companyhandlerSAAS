"use client";
import { Analytics } from "@vercel/analytics/next"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, BarChart3, Bot, Settings, LogOut,
  Plus, User as UserIcon, Loader2, Trash2, Calendar, Users, Copy, CheckCircle2, Mail, Package, TrendingUp, Tag, Sparkles,
  X, DollarSign, ShieldCheck, Download, Binary, Wrench, Handshake, AlertCircle, ChevronRight, UploadCloud, Menu, Trophy, Send, History, Kanban, List as ListIcon, Search, Filter, Coffee, Check,
  Save, Building, Bell, Lock, Globe, Lightbulb, BrainCircuit, Target, PieChart as PieChartIcon, ClipboardList, MessageSquare, ExternalLink
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, ComposedChart, Line,
  PieChart, Pie, Cell, Legend, BarChart, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc, Timestamp, where, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// 🔥 LOTTIE ANIMATION IMPORT 🔥
import Lottie from "lottie-react";
// ⚠️ MAKE SURE YOUR JSON FILE IS NAMED 'animation.json' AND PLACED IN THE SAME FOLDER ⚠️
import loadingAnimationData from "./animation.json";

// 🔥 MODAL IMPORTS 🔥
import { TaskModal } from '../components/modals/TaskModal';
import { LeaveModal } from '../components/modals/LeaveModal';
import { LeadModal } from '../components/modals/LeadModal';
import { ProductModal } from '../components/modals/ProductModal';
import { TeamModal } from '../components/modals/TeamModal';
import { AccountCreatedModal } from '../components/modals/AccountCreatedModal';

// 📝 Interfaces
interface Lead { id: string; name: string; company: string; email?: string; status: string; value: number; assignedToId?: string; assignedToName?: string; createdAt?: any; }
interface MonthlyData { month: string; revenue: number; churn: number; target: number; forecast?: number; }
interface TeamMember { id: string; uid?: string; name: string; email: string; role: string; addedByRole: string; status: string; createdAt?: any; }
interface UserData { name: string; role: string; uid?: string; email?: string; docId?: string; }
interface Product { id: string; name: string; category: string; price: number; marketPrice: number; marketShare: number; stock: number; isTrending: boolean; createdAt?: any; }
interface MarketData { name: string; share: number; price: number; }
interface EmployeeStats { name: string; role: string; totalLeads: number; wonLeads: number; revenue: number; winRate: number; }
interface ChatMessage { role: 'user' | 'ai'; content: string; }
interface ActivityLog { id: string; action: string; module: string; description: string; userName: string; userRole: string; createdAt: any; }
interface LeaveRequest { id: string; userId: string; userName: string; userRole: string; targetRole: string; reason: string; aiSummary: string; startDate: string; endDate: string; status: string; createdAt: any; }
interface TaskItem { id: string; title: string; description: string; assignedById: string; assignedByName: string; assignedByRole: string; assignedToId: string; assignedToName: string; assignedToRole: string; status: string; createdAt: any; }
interface ChatRoomMessage { id: string; text: string; senderId: string; senderName: string; senderRole: string; room: string; createdAt: any; }

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

// 🔒 API Setup
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true });

// 🔥 GLOBAL EXCHANGE RATES (Base USD) 🔥
const EXCHANGE_RATES: Record<string, number> = {
  'USD ($)': 1, 'INR (₹)': 83.5, 'EUR (€)': 0.92, 'GBP (£)': 0.79
};

// 🔥 AI AGENTS CONFIG 🔥
const AI_AGENTS = [
  { id: 'master', name: 'Master Central AI', role: 'General Dashboard Manager', icon: <BrainCircuit size={20} />, color: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'hr', name: 'Performance Evaluator', role: 'Employee Efficiency & HR', icon: <Target size={20} />, color: 'blue', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'innovation', name: 'Innovation Strategist', role: 'Ideas & Growth Planner', icon: <Lightbulb size={20} />, color: 'purple', text: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'finance', name: 'Finance Optimizer', role: 'Revenue & Cost Analyst', icon: <DollarSign size={20} />, color: 'yellow', text: 'text-yellow-400', bg: 'bg-yellow-500/10' }
];

export default function MasterDashboard() {
  const router = useRouter();

  // 🔥 CINEMATIC TRANSITION STATE 🔥
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [leadView, setLeadView] = useState<'board' | 'list'>('board');

  const [userRole, setUserRole] = useState('');
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [timeRange, setTimeRange] = useState('all');

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [roomMessages, setRoomMessages] = useState<ChatRoomMessage[]>([]);

  // GLOBAL FILTERS STATE
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilterAction, setActivityFilterAction] = useState('All');
  const [activityFilterModule, setActivityFilterModule] = useState('All');
  const todayDate = new Date();
  const localTodayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const [activityDateFilter, setActivityDateFilter] = useState(localTodayStr);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamRoleFilter, setTeamRoleFilter] = useState('All');
  const [leadSearch, setLeadSearch] = useState('');
  const [leaveSearch, setLeaveSearch] = useState('');
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('All');

  // SETTINGS & CURRENCY STATE
  const [activeSettingsTab, setActiveSettingsTab] = useState('Profile');
  const [profileName, setProfileName] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [currency, setCurrency] = useState('USD ($)');
  const [monthlyTargetRaw, setMonthlyTargetRaw] = useState(50000);
  const [showCelebration, setShowCelebration] = useState(false);

  // MESSAGING STATE
  const [activeRoom, setActiveRoom] = useState('General');
  const [roomMessageInput, setRoomMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currencySymbol = useMemo(() => {
    if (currency.includes('₹')) return '₹';
    if (currency.includes('€')) return '€';
    if (currency.includes('£')) return '£';
    return '$';
  }, [currency]);

  const currentRate = useMemo(() => EXCHANGE_RATES[currency] || 1, [currency]);
  const monthlyTarget = useMemo(() => monthlyTargetRaw * currentRate, [monthlyTargetRaw, currentRate]);

  const availableRooms = useMemo(() => {
    const rooms = ['General'];
    if (['CEO', 'HR', 'Manager'].includes(userRole)) rooms.push('Leadership');
    if (['Manager', 'Employee'].includes(userRole)) rooms.push('Team Sync');
    return rooms;
  }, [userRole]);

  useEffect(() => {
    if (userRole && !availableRooms.includes(activeRoom)) {
      setActiveRoom(availableRooms[0]);
    }
  }, [availableRooms, activeRoom, userRole]);

  // SMART UNREAD MESSAGES DOT LOGIC
  const hasUnreadMessages = useMemo(() => {
    if (!currentUserData || roomMessages.length === 0) return false;
    const relevantMsgs = roomMessages.filter(m => availableRooms.includes(m.room));
    if (relevantMsgs.length === 0) return false;
    const lastMsg = relevantMsgs[relevantMsgs.length - 1];
    return lastMsg.senderId !== currentUserData.uid && activeTab !== 'Messages';
  }, [roomMessages, availableRooms, currentUserData, activeTab]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [isImportingAI, setIsImportingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showAIModal, setShowAIModal] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const aiFileInputRef = useRef<HTMLInputElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [createdAccount, setCreatedAccount] = useState<{ name: string, email: string, password: string } | null>(null);
  const [dismissedPopups, setDismissedPopups] = useState<string[]>([]);

  const [newLead, setNewLead] = useState({ name: '', company: '', email: '', value: '', assignedToId: '', assignedToName: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Employee' });
  const [newProduct, setNewProduct] = useState({ name: '', category: 'Software', price: '', marketPrice: '', marketShare: '', stock: '', isTrending: false });
  const [leaveForm, setLeaveForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedToId: '', assignedToName: '', assignedToRole: '' });

  // AI CHAT STATE
  const [activeAgentId, setActiveAgentId] = useState('master');
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    master: [{ role: 'ai', content: "Hello Boss. I am your Central System AI. I monitor everything. What metrics would you like to analyze?" }],
    hr: [{ role: 'ai', content: "Hello! I am your Performance Evaluator. Ask me who is performing best, or how to optimize your team's win rates." }],
    innovation: [{ role: 'ai', content: "Greetings! I am your Innovation Strategist. Give me your current product metrics and I'll suggest disruptive ideas to scale your market share." }],
    finance: [{ role: 'ai', content: "Hi! Finance Optimizer here. I track your expected revenue vs churn. Want to discuss cost-cutting or pricing strategies?" }]
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ai', content: "Hello! I am your AI Business Assistant. I am connected to your live dashboard data. Ask me to analyze performance, calculate metrics, or suggest strategies based on your current pipeline and products." }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // DYNAMIC BROWSER TAB TITLE
  useEffect(() => {
    if (userRole) { document.title = `Company Handler | ${userRole} Portal`; }
    else { document.title = 'Company Handler | Loading...'; }
  }, [userRole]);

  // HIDE CELEBRATION AFTER 5 SECONDS
  useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => setShowCelebration(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  useEffect(() => {
    const demoRole = localStorage.getItem('demoRole');
    if (demoRole) {
      setUserRole(demoRole);
      setCurrentUserData({ name: `Demo ${demoRole}`, role: demoRole, uid: `demo_${demoRole.toLowerCase()}` });
      setProfileName(`Demo ${demoRole}`);
      setTimeout(() => setIsAuthChecking(false), 800);
      return;
    }

    let unsubscribeUser: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/'); } else {
        const q = query(collection(db, 'company_team'), where('uid', '==', user.uid));
        unsubscribeUser = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data() as UserData;
            setCurrentUserData({ ...userData, uid: user.uid, docId: snapshot.docs[0].id });
            setUserRole(userData.role);
            setProfileName(userData.name);
          } else {
            setCurrentUserData({ name: 'Super Admin', role: 'CEO', uid: user.uid });
            setUserRole('CEO');
            setProfileName('Super Admin');
          }
          // Add a tiny delay so the auth Lottie animation feels smooth before cutting off
          setTimeout(() => setIsAuthChecking(false), 800);
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
    const unsubscribeLogs = onSnapshot(query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(500)), (snapshot) => { setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[]); });
    const unsubscribeLeaves = onSnapshot(query(collection(db, 'leave_requests'), orderBy('createdAt', 'desc')), (snapshot) => { setLeaveRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LeaveRequest[]); });
    const unsubscribeTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'desc')), (snapshot) => { setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TaskItem[]); });
    const unsubscribeMessages = onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'asc'), limit(200)), (snapshot) => { setRoomMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatRoomMessage[]); });

    return () => { unsubscribeLeads(); unsubscribeTeam(); unsubscribeProducts(); unsubscribeLogs(); unsubscribeLeaves(); unsubscribeTasks(); unsubscribeMessages(); };
  }, [isAuthChecking]);

  useEffect(() => {
    if (activeTab === 'Automation') { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }
    if (activeTab === 'Messages') { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }
  }, [chatHistories, chatMessages, activeAgentId, activeTab, roomMessages, activeRoom]);

  // 🔥 ANIMATED TAB CHANGER 🔥
  const handleTabChange = (tabId: string) => {
    if (activeTab === tabId) return;
    setIsTransitioning(true);
    setIsMobileMenuOpen(false);

    // Switch tab silently in background
    setTimeout(() => setActiveTab(tabId), 400);

    // Hide loading screen after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1200);
  };

  const logActivity = async (action: string, module: string, description: string) => {
    if (!currentUserData || currentUserData.name === 'Super Admin') return;
    try { await addDoc(collection(db, 'activity_logs'), { action, module, description, userName: currentUserData.name, userRole: currentUserData.role, createdAt: serverTimestamp() }); } catch (error) { }
  };

  const handleNotificationClick = (moduleName: string) => {
    setShowNotifications(false);
    const mod = moduleName.toLowerCase();
    if (mod.includes('lead')) handleTabChange('Dashboard');
    else if (mod.includes('task')) handleTabChange('Tasks');
    else if (mod.includes('leave') || mod.includes('system')) handleTabChange('Leaves');
    else if (mod.includes('product')) handleTabChange('Products');
    else if (mod.includes('team')) handleTabChange('Team');
    else if (mod.includes('finance') || mod.includes('analytics')) handleTabChange('Analytics');
    else handleTabChange('Activity');
  };

  const copyTrackingLink = (leadId: string, leadName: string) => {
    const url = `${window.location.origin}/track/${leadId}`;
    handleCopyToClipboard(url);
    logActivity('UPDATE', 'Lead', `Generated secure tracking link for ${leadName}`);
  };

  const handleCopyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert("✅ Link copied successfully!");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("❌ Could not copy to clipboard. Your browser might be blocking it.");
    }
  };

  const handleSendTrackingLink = (leadId: string, leadName: string, leadEmail: string) => {
    const url = `${window.location.origin}/track/${leadId}`;
    navigator.clipboard.writeText(url).catch(() => { });
    logActivity('UPDATE', 'Lead', `Initiated sending secure tracking link to ${leadName}`);

    if (leadEmail) {
      const subject = encodeURIComponent(`Track your project status - ${leadName}`);
      const body = encodeURIComponent(`Hello ${leadName},\n\nYou can track the live status of your project in our portal here:\n${url}\n\nBest regards,\n${currentUserData?.name || 'The Team'}`);
      const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${leadEmail}&su=${subject}&body=${body}`;
      window.open(gmailLink, '_blank');
      alert(`🔗 Magic Link Copied!\nOpening Gmail to send to ${leadEmail}...`);
    } else {
      alert(`🔗 Magic Link Copied to Clipboard!\n\nNo email address found for this lead. You can manually paste and send this link:\n${url}`);
    }
  };

  const filteredActivities = useMemo(() => activities.filter(log => {
    const searchLower = activitySearch.toLowerCase();
    const matchSearch = log.description.toLowerCase().includes(searchLower) || log.userName.toLowerCase().includes(searchLower);
    const matchAction = activityFilterAction === 'All' || log.action === activityFilterAction;
    const matchModule = activityFilterModule === 'All' || log.module === activityFilterModule;

    let matchDate = true;
    if (activityDateFilter && log.createdAt) {
      const logDate = log.createdAt.toDate ? log.createdAt.toDate() : new Date(log.createdAt);
      const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;
      matchDate = logDateStr === activityDateFilter;
    }

    return matchSearch && matchAction && matchModule && matchDate;
  }), [activities, activitySearch, activityFilterAction, activityFilterModule, activityDateFilter]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const searchLower = productSearch.toLowerCase();
    return (p.name.toLowerCase().includes(searchLower) || p.category.toLowerCase().includes(searchLower)) &&
      (productCategoryFilter === 'All' || p.category === productCategoryFilter);
  }), [products, productSearch, productCategoryFilter]);

  const visibleTeam = useMemo(() => {
    if (userRole === 'CEO') return team;
    if (userRole === 'Manager') return team.filter(m => m.role === 'Manager' || m.role === 'Employee');
    if (userRole === 'HR') return team.filter(m => m.role === 'HR' || m.role === 'Employee');
    return [];
  }, [team, userRole]);

  const filteredTeam = useMemo(() => visibleTeam.filter(m => {
    const searchLower = teamSearch.toLowerCase();
    return (m.name.toLowerCase().includes(searchLower) || m.email.toLowerCase().includes(searchLower)) &&
      (teamRoleFilter === 'All' || m.role === teamRoleFilter);
  }), [visibleTeam, teamSearch, teamRoleFilter]);

  const visibleLeads = useMemo(() => {
    if (userRole === 'Employee') return leads.filter(l => l.assignedToId === currentUserData?.uid);
    return leads;
  }, [leads, userRole, currentUserData]);

  const filteredLeads = useMemo(() => visibleLeads.filter(l => {
    const searchLower = leadSearch.toLowerCase();
    return l.name.toLowerCase().includes(searchLower) || l.company.toLowerCase().includes(searchLower);
  }), [visibleLeads, leadSearch]);

  const myLeaves = useMemo(() => leaveRequests.filter(l => l.userId === currentUserData?.uid).filter(l => {
    const s = leaveSearch.toLowerCase();
    return (l.reason.toLowerCase().includes(s) || l.aiSummary.toLowerCase().includes(s)) && (leaveStatusFilter === 'All' || l.status === leaveStatusFilter);
  }), [leaveRequests, currentUserData, leaveSearch, leaveStatusFilter]);

  const approvalLeaves = useMemo(() => leaveRequests.filter(l => l.targetRole === userRole).filter(l => {
    const s = leaveSearch.toLowerCase();
    return (l.userName.toLowerCase().includes(s) || l.reason.toLowerCase().includes(s) || l.aiSummary.toLowerCase().includes(s)) && (leaveStatusFilter === 'All' || l.status === leaveStatusFilter);
  }), [leaveRequests, userRole, leaveSearch, leaveStatusFilter]);

  const activePopup = useMemo(() => leaveRequests.find(l => l.targetRole === userRole && l.status === 'Pending' && !dismissedPopups.includes(l.id)), [leaveRequests, userRole, dismissedPopups]);

  // TASKS HIERARCHY LOGIC
  const targetTaskRole = useMemo(() => {
    if (userRole === 'CEO') return 'HR';
    if (userRole === 'HR') return 'Manager';
    if (userRole === 'Manager') return 'Employee';
    return '';
  }, [userRole]);

  const eligibleTaskAssignees = useMemo(() => {
    return team.filter(m => m.role === targetTaskRole);
  }, [team, targetTaskRole]);

  const relevantTasks = useMemo(() => {
    if (userRole === 'Employee') return tasks.filter(t => t.assignedToId === currentUserData?.uid && t.status !== 'Completed');
    return tasks;
  }, [tasks, userRole, currentUserData]);

  const handleGenerateAITasks = async () => {
    setIsSaving(true);
    try {
      let generated: {title: string, description: string}[] = [];
      try {
        const prompt = `Act as the ${userRole} of a company. Based on a CRM dashboard context, generate exactly 3 strategic tasks to assign to the ${targetTaskRole}s. Return ONLY a valid JSON array like this: [{"title": "task title", "description": "short description"}]`;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const res = await model.generateContent(prompt);
        const text = res.response.text().replace(/```json|```/g, "").trim();
        generated = JSON.parse(text);
      } catch (aiErr) {
        console.warn("AI generation failed. Using fallback tasks.", aiErr);
        generated = [
          { title: `Optimize ${targetTaskRole} Workflows`, description: `Review and optimize current workflows to increase efficiency.` },
          { title: `Quarterly Goal Review`, description: `Ensure all targets are being met and adjust strategies if necessary.` },
          { title: `Team Knowledge Sharing`, description: `Organize a session to share best practices among the team.` }
        ];
      }

      let chatFeedback = `I have generated and assigned the following strategic tasks to the **${targetTaskRole}s**:\n\n`;

      const isDemo = !!localStorage.getItem('demoRole');

      for (const t of generated) {
        const randomAssignee = eligibleTaskAssignees.length > 0 ? eligibleTaskAssignees[Math.floor(Math.random() * eligibleTaskAssignees.length)] : null;
        if (!isDemo) {
          await addDoc(collection(db, 'tasks'), {
            title: t.title,
            description: t.description,
            assignedById: currentUserData?.uid || '',
            assignedByName: currentUserData?.name || 'System',
            assignedByRole: userRole,
            assignedToId: randomAssignee?.uid || '',
            assignedToName: randomAssignee?.name || `Unassigned ${targetTaskRole}`,
            assignedToRole: targetTaskRole,
            status: 'Pending',
            createdAt: serverTimestamp()
          });
        }
        chatFeedback += `- **${t.title}** (Assigned to: ${randomAssignee?.name || 'Unassigned'})\n`;
      }

      if (!isDemo) {
        await logActivity('CREATE', 'Task', `AI Auto-Generated 3 strategy tasks for ${targetTaskRole}s.`);
      }

      if (userRole === 'CEO' || userRole === 'HR') {
        setChatHistories(prev => ({ ...prev, [activeAgentId]: [...(prev[activeAgentId] || []), { role: 'ai', content: chatFeedback }] }));
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: chatFeedback }]);
      }

      if (activeTab !== 'Automation') { handleTabChange('Automation'); }

    } catch (err) { 
      console.error("AI Task Generation Process Error:", err); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedToId) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        description: newTask.description,
        assignedById: currentUserData?.uid || '',
        assignedByName: currentUserData?.name || 'System',
        assignedByRole: userRole,
        assignedToId: newTask.assignedToId,
        assignedToName: newTask.assignedToName,
        assignedToRole: newTask.assignedToRole,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      await logActivity('CREATE', 'Task', `Delegated task "${newTask.title}" to ${newTask.assignedToName}`);
      setIsTaskModalOpen(false);
      setNewTask({ title: '', description: '', assignedToId: '', assignedToName: '', assignedToRole: '' });
    } catch (err) { alert("Failed to create task."); } finally { setIsSaving(false); }
  };

  const handleCompleteTask = async (task: TaskItem) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: 'Completed' });
      await logActivity('UPDATE', 'Task', `✅ Completed task: "${task.title}". Notifying Assigner (${task.assignedByName}).`);
    } catch (error) { console.error(error); }
  };

  const handleSendRoomMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomMessageInput.trim() || !currentUserData) return;
    const text = roomMessageInput;
    setRoomMessageInput('');
    try {
      await addDoc(collection(db, 'messages'), {
        text: text,
        senderId: currentUserData.uid || 'system',
        senderName: currentUserData.name,
        senderRole: userRole,
        room: activeRoom,
        createdAt: serverTimestamp()
      });
    } catch (err) { console.error(err); }
  };

  const handleDropAIDailyBriefing = async () => {
    if (!currentUserData) return;
    setIsSaving(true);
    try {
      const prompt = `You are the Master Central AI. Act as the CEO's assistant. Provide a quick, punchy daily briefing to be sent to the Leadership team (HR & Managers). Mention today's focus based on general SaaS CRM goals. Suggest 1 strategic task for HR and 1 for Managers. Format as a professional, motivating message with bullet points.`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const res = await model.generateContent(prompt);

      await addDoc(collection(db, 'messages'), {
        text: `**🤖 CEO's AI Daily Briefing:**\n\n${res.response.text()}`,
        senderId: 'ai-master',
        senderName: 'Master Central AI',
        senderRole: 'System',
        room: 'Leadership',
        createdAt: serverTimestamp()
      });

      setActiveRoom('Leadership');
    } catch (err) { alert("Failed to generate AI Briefing."); } finally { setIsSaving(false); }
  };

  // CURRENCY ENABLED ANALYTICS WITH RADAR, FORECAST & TARGET PROGRESS
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
    const empPerformance: Record<string, EmployeeStats> = {};

    validLeads.forEach(lead => {
      const val = Number(lead.value) || 0; totalGross += val;
      if (counts[lead.status as keyof typeof counts] !== undefined) counts[lead.status as keyof typeof counts]++; else counts['New']++;
      if (lead.status === 'In Progress') expectedRev += (val * 0.5);
      if (lead.status === 'Won') wonRev += val;
      if (lead.createdAt && typeof lead.createdAt.toDate === 'function') {
        const monthName = months[lead.createdAt.toDate().getMonth()];
        if (lead.status === 'Won') dataMap[monthName].revenue += val; else if (lead.status === 'Lost') dataMap[monthName].churn += val;
      }
      const empId = lead.assignedToId || 'unassigned';
      if (!empPerformance[empId]) { empPerformance[empId] = { name: lead.assignedToName || 'Unassigned', role: 'Team', totalLeads: 0, wonLeads: 0, revenue: 0, winRate: 0 }; }
      empPerformance[empId].totalLeads += 1;
      if (lead.status === 'Won') { empPerformance[empId].wonLeads += 1; empPerformance[empId].revenue += val; }
    });

    Object.values(empPerformance).forEach(emp => { emp.winRate = emp.totalLeads > 0 ? Math.round((emp.wonLeads / emp.totalLeads) * 100) : 0; });
    const leaderboard = Object.values(empPerformance).filter(e => e.name !== 'Unassigned').sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const totalClosed = counts.Won + counts.Lost;
    const winRate = totalClosed > 0 ? ((counts.Won / totalClosed) * 100).toFixed(1) : "0.0";
    const avgDealSize = validLeads.length > 0 ? (totalGross / validLeads.length) : 0;
    const pieData = [{ name: 'New', value: counts.New, color: '#3b82f6' }, { name: 'In Progress', value: counts['In Progress'], color: '#eab308' }, { name: 'Won', value: counts.Won, color: '#10b981' }, { name: 'Lost', value: counts.Lost, color: '#ef4444' }].filter(d => d.value > 0);

    let totalInventoryValue = 0; const productMarketData: MarketData[] = [];
    products.forEach(p => {
      totalInventoryValue += (p.price * p.stock);
      if (p.marketShare > 0) { productMarketData.push({ name: p.name, share: p.marketShare, price: p.price }); }
    });
    productMarketData.sort((a, b) => b.share - a.share);

    const currentMonthIndex = new Date().getMonth();
    const dynamicGraphData = Object.values(dataMap).map((d, index) => {
      const isFuture = index > currentMonthIndex;
      return { ...d, revenue: d.revenue * currentRate, churn: d.churn * currentRate, target: d.target * currentRate, forecast: isFuture ? (Math.random() * 20000 + 30000) * currentRate : undefined };
    });

    const radarData = leaderboard.length > 0 ? leaderboard.map(emp => ({
      subject: emp.name.split(' ')[0], WinRate: emp.winRate, Leads: emp.totalLeads * 5, RevenueScore: Math.min((emp.revenue / (totalGross || 1)) * 100 * 2, 100), fullMark: 100
    })) : [{ subject: 'No Data', WinRate: 0, Leads: 0, RevenueScore: 0, fullMark: 100 }];

    return {
      totalGross: totalGross * currentRate, expectedRev: expectedRev * currentRate, wonRev: wonRev * currentRate, winRate, avgDealSize: avgDealSize * currentRate, activeCount: counts.New + counts['In Progress'],
      graphData: dynamicGraphData, pieData, totalInventoryValue: totalInventoryValue * currentRate, productMarketData: productMarketData.slice(0, 5),
      leaderboard: leaderboard.map(l => ({ ...l, revenue: l.revenue * currentRate })), radarData
    };
  }, [leads, timeRange, products, currentRate]);

  const handleLogout = async () => { try { localStorage.removeItem('demoRole'); await signOut(auth); router.push('/'); } catch (error) { console.error(error); } };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!currentUserData?.docId && !localStorage.getItem('demoRole')) { alert("⚠️ Real DB updates require a registered Team Member account."); return; }
    if (localStorage.getItem('demoRole')) { alert("✅ Profile updated successfully! (Demo Mode)"); return; }
    
    if (!currentUserData?.docId) return;

    setIsSaving(true);
    try { await updateDoc(doc(db, 'company_team', currentUserData.docId), { name: profileName }); await logActivity('UPDATE', 'System', `Updated personal profile name to ${profileName}`); alert("✅ Profile updated successfully!"); } catch (err) { alert("Failed to update profile: " + err); } finally { setIsSaving(false); }
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    setTimeout(() => { setIsSaving(false); logActivity('UPDATE', 'System', `Changed global system preferences.`); alert("✅ System Preferences synced securely! Currency and notifications updated."); }, 800);
  };

  const handleResetPassword = async () => {
    if (!currentUserData?.email) return;
    try { await sendPasswordResetEmail(auth, currentUserData.email); logActivity('UPDATE', 'System', `Requested secure password reset link.`); alert(`✅ Password reset link dispatched securely to ${currentUserData.email}`); } catch (err) { alert("Failed to send reset link. Ensure you are logged in correctly."); }
  };

  const handleSendMultiAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatHistories(prev => ({ ...prev, [activeAgentId]: [...(prev[activeAgentId] || []), { role: 'user', content: userMessage }] }));
    setChatInput(''); setIsChatLoading(true);
    try {
      let rolePrompt = "You are the Master Central AI Business Assistant.";
      if (activeAgentId === 'hr') rolePrompt = "You are a specialized HR & Performance Evaluator AI. Analyze employee win rates, lead handling, and efficiency. Be strict but encouraging.";
      if (activeAgentId === 'innovation') rolePrompt = "You are an Innovation Strategist. Look at product market share and pipeline active counts. Suggest wild, disruptive, out-of-the-box business ideas.";
      if (activeAgentId === 'finance') rolePrompt = "You are a Finance Optimizer. Look at Gross Revenue, Churn (Lost value), and Win Rates. Suggest aggressive cost-cutting or pricing optimizations.";

      const contextPrompt = `${rolePrompt} You have direct access to the live company data. Give short, professional insights using Markdown (bold, lists). Do not invent numbers that aren't provided. LIVE CONTEXT: - Currency: ${currencySymbol} - Total Pipeline Gross: ${currencySymbol}${analytics.totalGross.toFixed(0)} - Total Won Revenue: ${currencySymbol}${analytics.wonRev.toFixed(0)} - Expected Revenue: ${currencySymbol}${analytics.expectedRev.toFixed(0)} - Current Win Rate: ${analytics.winRate}% - Active Leads Count: ${analytics.activeCount} - Total Inventory Value: ${currencySymbol}${analytics.totalInventoryValue} TOP PERFORMING EMPLOYEES: ${analytics.leaderboard.map(emp => `- ${emp.name}: ${currencySymbol}${emp.revenue} won, ${emp.winRate}% win rate`).join('\n') || 'No data yet.'} USER ROLE: ${userRole} USER REQUEST: "${userMessage}"`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); const result = await model.generateContent(contextPrompt);
      setChatHistories(prev => ({ ...prev, [activeAgentId]: [...(prev[activeAgentId] || []), { role: 'ai', content: result.response.text() }] }));
    } catch (error: any) { setChatHistories(prev => ({ ...prev, [activeAgentId]: [...(prev[activeAgentId] || []), { role: 'ai', content: "⚠️ System error connecting to AI core. Check your API Keys." }] })); } finally { setIsChatLoading(false); }
  };

  const handleSendSingleChatMessage = async (e: React.FormEvent) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]); setChatInput(''); setIsChatLoading(true);
    try {
      const contextPrompt = `You are an AI Business Assistant helping an Employee/Manager. Data: Gross: ${currencySymbol}${analytics.totalGross.toFixed(0)}, Won: ${currencySymbol}${analytics.wonRev.toFixed(0)}. Request: "${userMessage}"`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); const result = await model.generateContent(contextPrompt);
      setChatMessages(prev => [...prev, { role: 'ai', content: result.response.text() }]);
    } catch (error: any) { setChatMessages(prev => [...prev, { role: 'ai', content: "⚠️ System error connecting to AI core." }]); } finally { setIsChatLoading(false); }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsImportingAI(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result; const workbook = XLSX.read(data, { type: 'binary' }); const sheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData: any[] = XLSX.utils.sheet_to_json(sheet);
        await new Promise(resolve => setTimeout(resolve, 2000)); let importCount = 0;
        for (const row of jsonData) {
          const keys = Object.keys(row); let name = '', category = 'Software', price = 0, marketPrice = 0, marketShare = 0, stock = 0;
          keys.forEach(k => { const lowerK = k.toLowerCase(); if (lowerK.includes('name') || lowerK.includes('product') || lowerK.includes('title')) name = row[k]; else if (lowerK.includes('market price')) marketPrice = Number(row[k]); else if (lowerK.includes('price') || lowerK.includes('cost')) price = Number(row[k]); else if (lowerK.includes('share') || lowerK.includes('%')) marketShare = Number(row[k]); else if (lowerK.includes('stock') || lowerK.includes('qty')) stock = Number(row[k]); else if (lowerK.includes('category') || lowerK.includes('type')) category = String(row[k]); });
          if (name) { await addDoc(collection(db, 'products'), { name: String(name), category, price: (price || 0) / currentRate, marketPrice: (marketPrice || 0) / currentRate, marketShare: marketShare || 0, stock: stock || 0, isTrending: marketShare > 50, createdAt: serverTimestamp() }); importCount++; }
        }
        alert(`🤖 Import Complete! Extracted ${importCount} products.`);
      } catch (error) { alert("❌ Error analyzing."); } finally { setIsImportingAI(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsBinaryString(file);
  };

  const processBulletproofAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsAiProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result; const wb = XLSX.read(bstr, { type: 'binary' }); const data: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (data.length === 0) throw new Error("Excel is empty");
        const exactHeaders = Object.keys(data[0]); const sample = JSON.stringify(data.slice(0, 5));
        const prompt = `You are Data Analyst. Headers: ${JSON.stringify(exactHeaders)}. Sample: ${sample}. Output valid JSON: {"productCol": "...", "priceCol": "...", "qtyCol": "...", "catCol": "...", "bizName": "...", "insights": ["...", "..."]}`;
        let configText = "";
        try { const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); const aiRes = await model.generateContent(prompt); configText = aiRes.response.text(); } catch (err) { throw new Error("AI provider failed."); }
        const config = JSON.parse(configText.replace(/```json|```/g, "").trim());
        const getRealColumn = (aiGuess: string, keywords: string[]) => exactHeaders.includes(aiGuess) ? aiGuess : exactHeaders.find(h => keywords.some(kw => h.toLowerCase().includes(kw))) || exactHeaders[1] || "";
        const safePriceCol = getRealColumn(config.priceCol, ['price', 'cost', 'rate', 'amt', 'value', '₹', '$', '€', '£']); const safeQtyCol = getRealColumn(config.qtyCol, ['qty', 'quantity', 'stock', 'unit']); const safeNameCol = getRealColumn(config.productCol, ['name', 'product', 'item', 'title', 'desc']); const safeCatCol = getRealColumn(config.catCol, ['cat', 'type', 'group', 'class']);
        let totalRev = 0; let validProductCount = 0; const readyToSaveData: any[] = [];
        data.forEach((row: any) => {
          const validPrice = isNaN(parseFloat(String(row[safePriceCol] || "0").replace(/[^\d.]/g, ''))) ? 0 : parseFloat(String(row[safePriceCol] || "0").replace(/[^\d.]/g, ''));
          const validQty = isNaN(parseInt(String(row[safeQtyCol] || "1").replace(/[^\d]/g, ''))) ? 1 : parseInt(String(row[safeQtyCol] || "1").replace(/[^\d]/g, ''));
          if (validPrice > 0 && row[safeNameCol]) { totalRev += (validPrice * validQty); validProductCount++; readyToSaveData.push({ name: String(row[safeNameCol]), category: row[safeCatCol] ? String(row[safeCatCol]) : 'General', price: validPrice, marketPrice: validPrice * 1.1, marketShare: Math.floor(Math.random() * 40) + 10, stock: validQty, isTrending: validPrice > 1000 }); }
        });
        const avg = validProductCount > 0 ? (totalRev / validProductCount) : 0;
        setAiResult({ ...config, totalRevenue: totalRev, avgPrice: avg, safePriceColumnUsed: safePriceCol, processedProducts: readyToSaveData });
      } catch (err) { alert("Data Processing Failed! " + ((err as Error).message)); } finally { setIsAiProcessing(false); }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveAiProductsToDb = async () => {
    if (!aiResult || !aiResult.processedProducts) return; setIsSaving(true);
    try { for (const p of aiResult.processedProducts as any[]) { await addDoc(collection(db, 'products'), { ...p, price: p.price / currentRate, marketPrice: p.marketPrice / currentRate, createdAt: serverTimestamp() }); } await logActivity('IMPORT', 'Product', `Imported AI products`); alert("✅ All AI-Analyzed products injected into Database!"); setShowAIModal(false); setAiResult(null); } catch (err) { alert("Error saving to DB"); } finally { setIsSaving(false); }
  };

  const handleExportPDF = async () => {
    if (!aiResult) return; setIsExporting(true);
    try { const { toPng } = await import('html-to-image'); const jsPDF = (await import('jspdf')).default; const element = document.getElementById('pdf-report-container'); if (!element) throw new Error("Not found"); const dataUrl = await toPng(element, { backgroundColor: '#0c0c0c', pixelRatio: 2 }); const pdf = new jsPDF('p', 'mm', 'a4'); const pdfWidth = pdf.internal.pageSize.getWidth(); const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth; pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight); pdf.save(`Executive_Report.pdf`); await logActivity('EXPORT', 'Analytics', `Exported Executive PDF Report`); } catch (error: any) { window.print(); } finally { setIsExporting(false); }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newLead.name || !newLead.company || !newLead.value) return; setIsSaving(true);
    try {
      const rawUsdValue = Number(newLead.value) / currentRate;
      await addDoc(collection(db, 'leads'), { name: newLead.name, company: newLead.company, email: newLead.email || '', status: 'New', value: rawUsdValue, assignedToId: newLead.assignedToId || currentUserData?.uid || '', assignedToName: newLead.assignedToName || currentUserData?.name || 'Unassigned', createdAt: serverTimestamp() });
      await logActivity('CREATE', 'Lead', `Deployed lead: ${newLead.name} (${newLead.company})`);
      if (newLead.email && notifyEmail) { try { await fetch('/api/send-lead-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName: newLead.name, clientEmail: newLead.email, companyName: newLead.company, assignedRep: newLead.assignedToName || currentUserData?.name || 'Our Team' }) }); } catch (emailErr) { } }
      setIsModalOpen(false); setNewLead({ name: '', company: '', email: '', value: '', assignedToId: '', assignedToName: '' });
    } finally { setIsSaving(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try { const generatedPassword = Math.random().toString(36).slice(-6) + "A1!"; const apps = getApps(); const secondaryApp = apps.find(app => app.name === "SecondaryApp") || initializeApp(firebaseConfig, "SecondaryApp"); const secondaryAuth = getAuth(secondaryApp); const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newMember.email, generatedPassword); await addDoc(collection(db, 'company_team'), { uid: userCredential.user.uid, name: newMember.name, email: newMember.email, role: newMember.role, addedByRole: userRole, status: 'Active', createdAt: serverTimestamp() }); await logActivity('CREATE', 'Team', `Registered new ${newMember.role} account`); setCreatedAccount({ name: newMember.name, email: newMember.email, password: generatedPassword }); setIsTeamModalOpen(false); setNewMember({ name: '', email: '', role: 'Employee' }); } catch (error) { alert("Error: " + ((error as Error).message)); } finally { setIsSaving(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    try { await addDoc(collection(db, 'products'), { name: newProduct.name, category: newProduct.category, price: Number(newProduct.price) / currentRate, marketPrice: (Number(newProduct.marketPrice) || 0) / currentRate, marketShare: Number(newProduct.marketShare) || 0, stock: Number(newProduct.stock), isTrending: newProduct.isTrending, createdAt: serverTimestamp() }); await logActivity('CREATE', 'Product', `Added marketplace item: ${newProduct.name}`); setIsProductModalOpen(false); setNewProduct({ name: '', category: 'Software', price: '', marketPrice: '', marketShare: '', stock: '', isTrending: false }); } finally { setIsSaving(false); }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return; setIsSaving(true);
    try {
      let aiSummary = '';
      try { const prompt = `Summarize this leave reason in 5 words: "${leaveForm.reason}"`; const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); const res = await model.generateContent(prompt); aiSummary = res.response.text().trim(); } catch (err) { aiSummary = leaveForm.reason.slice(0, 40) + '...'; }
      let targetRole = 'Manager'; if (userRole === 'Manager') targetRole = 'HR'; if (userRole === 'HR') targetRole = 'CEO';
      await addDoc(collection(db, 'leave_requests'), { userId: currentUserData?.uid, userName: currentUserData?.name, userRole: userRole, targetRole: targetRole, reason: leaveForm.reason, aiSummary, startDate: leaveForm.startDate, endDate: leaveForm.endDate, status: 'Pending', createdAt: serverTimestamp() });
      await logActivity('CREATE', 'System', `Submitted leave request`); setIsLeaveModalOpen(false); setLeaveForm({ startDate: '', endDate: '', reason: '' }); alert("✅ Leave request submitted.");
    } catch (err) { alert("Failed to submit leave."); } finally { setIsSaving(false); }
  };

  const handleLeaveAction = async (id: string, status: string) => { await updateDoc(doc(db, 'leave_requests', id), { status }); const req = leaveRequests.find(l => l.id === id); await logActivity('UPDATE', 'System', `${status} leave request`); setDismissedPopups(prev => [...prev, id]); };

  const sendRealEmail = async () => { if (!createdAccount) return; setIsSendingEmail(true); try { const response = await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: createdAccount.name, email: createdAccount.email, password: createdAccount.password }) }); const data = await response.json(); if (data.success) { alert("✅ Email sent!"); await logActivity('EMAIL', 'System', `Emailed credentials`); setCreatedAccount(null); } else { alert("❌ Failed."); } } catch { alert("❌ Error connecting to email server."); } finally { setIsSendingEmail(false); } };
  const handleDeleteDoc = async (collectionName: string, id: string) => { if (window.confirm("Are you sure?")) { await deleteDoc(doc(db, collectionName, id)); await logActivity('DELETE', 'System', `Deleted a record.`); } };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const leadToUpdate = leads.find(l => l.id === id); if (!leadToUpdate || leadToUpdate.status === newStatus) return;

    if (newStatus === 'Won') {
      const currentWonRev = analytics.wonRev;
      const leadValueInSelectedCurrency = leadToUpdate.value * currentRate;
      if (currentWonRev < monthlyTarget && (currentWonRev + leadValueInSelectedCurrency) >= monthlyTarget) { setShowCelebration(true); }
    }

    await updateDoc(doc(db, 'leads', id), { status: newStatus }); await logActivity('UPDATE', 'Lead', `Moved lead [${leadToUpdate.name}] to ${newStatus}`);

    if (newStatus === 'Won' && autoInvoice) {
      if (leadToUpdate.email) {
        try {
          const displayValue = (leadToUpdate.value * currentRate).toFixed(0);
          const res = await fetch('/api/send-invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientName: leadToUpdate.name, clientEmail: leadToUpdate.email, companyName: leadToUpdate.company, value: displayValue, assignedRep: leadToUpdate.assignedToName || currentUserData?.name || 'Our Team', currencySymbol: currencySymbol }) });
          const data = await res.json();
          if (data.success) { await logActivity('EMAIL', 'Finance', `Auto-generated & emailed invoice`); alert(`✅ BOOM! Lead Won! Invoice successfully sent.`); } else { alert(`❌ Invoice failed: ${data.error}`); }
        } catch (err: any) { alert(`❌ API Error: Invoice failed.`); }
      } else { alert(`⚠️ Lead moved to Won, but Client Email was empty. No invoice sent.`); }
    }
  };

  const handleTrendingToggle = async (id: string, currentTrending: boolean) => { await updateDoc(doc(db, 'products', id), { isTrending: !currentTrending }); await logActivity('UPDATE', 'Product', `Toggled trending status.`); };
  const handleDragStart = (e: React.DragEvent, leadId: string) => { e.dataTransfer.setData('leadId', leadId); };
  const handleDrop = async (e: React.DragEvent, targetStatus: string) => { e.preventDefault(); const leadId = e.dataTransfer.getData('leadId'); if (leadId) { await handleStatusChange(leadId, targetStatus); } };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const KANBAN_COLUMNS = [{ id: 'New', label: 'New Request', color: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/30' }, { id: 'In Progress', label: 'In Progress', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/30' }, { id: 'Won', label: 'Closed Won', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/30' }, { id: 'Lost', label: 'Closed Lost', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/30' }];
  const formatAIText = (text: string) => { return text.split('\n').map((line, i) => { const boldedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: boldedLine }} />; }); };
  const formatLogDate = (timestamp: any) => { if (!timestamp) return 'Just now'; const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); return d.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }); };

  const targetProgress = Math.min((analytics.wonRev / (monthlyTarget || 1)) * 100, 100).toFixed(0);

  // 🔥 MAIN LOTTIE LOADER SCREEN 🔥
  if (isAuthChecking) return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0a0a0a] text-zinc-400 relative">
      <div className="w-80 h-80 md:w-[450px] md:h-[450px] opacity-90">
        <Lottie animationData={loadingAnimationData} loop={true} />
      </div>
      <h2 className="text-blue-500 font-bold tracking-widest uppercase mt-4 animate-pulse text-lg">Securing Connection...</h2>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-800 overflow-hidden relative">

      {/* 🔥 LOTTIE TRANSITION SCREEN FOR TABS 🔥 */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0a0a0a] backdrop-blur-md"
          >
            <div className="w-72 h-72 md:w-[400px] md:h-[400px] opacity-90">
              <Lottie animationData={loadingAnimationData} loop={true} />
            </div>
            <h2 className="text-blue-500 font-bold tracking-widest uppercase mt-6 animate-pulse text-lg">Loading Module...</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAMIFICATION CELEBRATION POPUP */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-none">
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }} className="text-center flex flex-col items-center">
              <motion.div animate={{ y: [0, -30, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-9xl mb-6 drop-shadow-[0_0_50px_rgba(250,204,21,0.6)]">🏆</motion.div>
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-2xl mb-4 tracking-tighter">TARGET SMASHED!</h1>
              <p className="text-xl md:text-2xl text-yellow-100 font-bold bg-yellow-900/40 border border-yellow-500/50 px-6 py-2 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.2)]">You are the MVP! 👑</p>
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div key={i} initial={{ y: "100vh", x: "50vw", scale: 0 }} animate={{ y: "-10vh", x: `${Math.random() * 100}vw`, scale: Math.random() * 2 + 1, rotate: Math.random() * 360 }} transition={{ duration: Math.random() * 2 + 2, ease: "easeOut" }} className="absolute text-3xl">
                    {['🎉', '✨', '💰', '🔥', '🚀'][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEAVE POPUP */}
      <AnimatePresence>
        {activePopup && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, x: 100 }} className="fixed bottom-6 right-6 z-[100] w-80 bg-[#161616] border border-emerald-500/30 rounded-2xl shadow-[0_10px_40px_rgba(16,185,129,0.15)] overflow-hidden">
            <div className="bg-emerald-500/10 p-4 border-b border-emerald-500/20 flex justify-between items-start">
              <div><p className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><Sparkles size={12} /> AI Leave Alert</p><h3 className="text-white font-bold mt-1">{activePopup.userName} <span className="text-zinc-500 text-xs font-normal">({activePopup.userRole})</span></h3></div>
              <button onClick={() => setDismissedPopups(prev => [...prev, activePopup.id])} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4">
              <p className="text-xs text-zinc-500 uppercase font-bold mb-1">AI Summarized Reason:</p>
              <p className="text-sm font-medium text-zinc-200 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg mb-4">"{activePopup.aiSummary}"</p>
              <div className="flex justify-between text-xs text-zinc-400 mb-4"><span><Calendar size={12} className="inline mr-1" />{activePopup.startDate}</span><span>to</span><span><Calendar size={12} className="inline mr-1" />{activePopup.endDate}</span></div>
              <div className="flex gap-2">
                <button onClick={() => handleLeaveAction(activePopup.id, 'Rejected')} className="flex-1 flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2 rounded-lg text-sm font-bold transition-colors"><X size={14} /> Reject</button>
                <button onClick={() => handleLeaveAction(activePopup.id, 'Approved')} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg text-sm font-black transition-colors"><Check size={14} /> Approve</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />)}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-800/60 bg-[#0a0a0a] flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800/60 font-semibold tracking-widest text-zinc-100 uppercase text-sm">
            Company Handler
            <button className="md:hidden text-zinc-400" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { id: 'Dashboard', icon: <LayoutDashboard size={18} /> },
              { id: 'Tasks', icon: <ClipboardList size={18} /> },
              { id: 'Messages', icon: <MessageSquare size={18} /> },
              { id: 'Analytics', icon: <BarChart3 size={18} /> },
              { id: 'Products', icon: <Package size={18} /> },
              { id: 'Team', icon: <Users size={18} /> },
              { id: 'Leaves', icon: <Coffee size={18} /> },
              { id: 'Automation', icon: <Bot size={18} /> },
              { id: 'Activity', icon: <History size={18} /> },
              { id: 'Settings', icon: <Settings size={18} /> }
            ].map((tab) => {
              if (tab.id === 'Team' && userRole === 'Employee') return null;
              if (tab.id === 'Activity' && userRole === 'Employee') return null;
              if (tab.id === 'Tasks' && userRole === 'Employee') return null;
              return (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'}`}>
                  {tab.icon} {tab.id}
                  {tab.id === 'Leaves' && approvalLeaves.filter(l => l.status === 'Pending').length > 0 && (<span className="ml-auto bg-emerald-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{approvalLeaves.filter(l => l.status === 'Pending').length}</span>)}
                  {/* 🔥 SMART NOTIFICATION DOT ON MESSAGES TAB 🔥 */}
                  {tab.id === 'Messages' && hasUnreadMessages && (<span className="ml-auto w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>)}
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a] h-full overflow-hidden">

        {/* HEADER (MOBILE) */}
        <header className="md:hidden flex h-16 border-b border-zinc-800/60 items-center justify-between px-4 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400 hover:text-white p-1"> <Menu size={24} /> </button>
            <span className="font-semibold text-zinc-100 text-sm">{activeTab}</span>
          </div>
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 relative">
              <Bell size={14} className="text-zinc-300" />
              {activities.length > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0a0a0a]" />}
            </button>
          </div>
        </header>

        {/* HEADER (DESKTOP) */}
        <header className="hidden md:flex h-16 border-b border-zinc-800/60 items-center justify-between px-8 bg-[#0a0a0a] shrink-0">
          <div className="flex items-center gap-2 text-sm text-zinc-500"><span>Overview</span><span>/</span><span className="text-zinc-100 font-medium">{activeTab}</span></div>
          <div className="flex items-center gap-6">

            {/* NOTIFICATION BELL WITH ROUTING */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="text-zinc-400 hover:text-white p-2 relative rounded-full hover:bg-zinc-800 transition-colors">
                <Bell size={18} />
                {activities.length > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#0a0a0a]" />}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 bg-[#161616] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-[#111111]">
                      <span className="text-sm font-bold text-white flex items-center gap-2"><Bell size={14} className="text-emerald-500" /> Live Activity</span>
                      <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white"><X size={14} /></button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                      {activities.slice(0, 10).map(act => (
                        <div key={act.id} onClick={() => handleNotificationClick(act.module)} className="p-3 border-b border-zinc-800/50 hover:bg-[#1a1a1a] transition-colors cursor-pointer group">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1 group-hover:text-emerald-300">{act.module} • {act.action}</p>
                          <p className="text-xs text-zinc-300 leading-relaxed"><span className="font-bold text-white">{act.userName}</span> {act.description.toLowerCase()}</p>
                          <p className="text-[9px] text-zinc-500 mt-1">{formatLogDate(act.createdAt)}</p>
                        </div>
                      ))}
                      {activities.length === 0 && <div className="p-4 text-center text-xs text-zinc-500">No new notifications.</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700"><UserIcon size={14} className="text-zinc-300" /></div>
              <div className="text-sm"><p className="font-medium text-zinc-200">{currentUserData?.name || 'Loading...'}</p><p className="text-[10px] text-zinc-500 uppercase tracking-wider">{userRole || 'Verifying'}</p></div>
            </div>
          </div>
        </header>

        {/* TAB CONTENTS */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full flex flex-col">

            {/* MESSAGES / DISCUSSION ROOMS */}
            {activeTab === 'Messages' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] gap-6">

                {/* Rooms Sidebar */}
                <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
                  <h2 className="text-lg font-bold text-white mb-2 tracking-tight">Channels</h2>
                  {availableRooms.map(room => (
                    <button
                      key={room}
                      onClick={() => setActiveRoom(room)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${activeRoom === room ? `bg-[#161616] border-emerald-500/50 shadow-sm` : 'bg-[#111111] border-zinc-800/60 hover:bg-[#161616]'}`}
                    >
                      <span className={`text-lg font-black ${activeRoom === room ? 'text-emerald-400' : 'text-zinc-500'}`}>#</span>
                      <div>
                        <h3 className={`font-bold text-sm ${activeRoom === room ? 'text-white' : 'text-zinc-300'}`}>{room}</h3>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-[#111111] border border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                  <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-[#161616] shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-700 bg-zinc-800">
                        <span className="text-zinc-400 font-black text-xl">#</span>
                      </div>
                      <div>
                        <h2 className="text-zinc-100 font-bold">{activeRoom}</h2>
                        <p className="text-xs font-medium flex items-center gap-1 text-emerald-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Discussion</p>
                      </div>
                    </div>
                    {/* CEO AI Briefing Button */}
                    {userRole === 'CEO' && activeRoom === 'Leadership' && (
                      <button onClick={handleDropAIDailyBriefing} disabled={isSaving} className="bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white border border-purple-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50">
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI Daily Briefing
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar flex flex-col">
                    {roomMessages.filter(m => m.room === activeRoom).length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">No messages in #{activeRoom} yet. Start the conversation!</div>
                    ) : (
                      roomMessages.filter(m => m.room === activeRoom).map((msg) => {
                        const isMe = msg.senderId === currentUserData?.uid;
                        const isSystemAI = msg.senderId === 'ai-master';
                        return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-2 mb-1 px-1">
                              {!isMe && <span className="text-xs font-bold text-zinc-300">{msg.senderName}</span>}
                              {!isMe && <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border ${isSystemAI ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>{msg.senderRole}</span>}
                            </div>
                            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' :
                              isSystemAI ? 'bg-zinc-800 border border-purple-500/30 text-zinc-200 rounded-tl-sm' :
                                'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-sm'
                              }`}>
                              {isSystemAI ? formatAIText(msg.text) : msg.text}
                            </div>
                            <span className="text-[9px] text-zinc-600 mt-1 px-1">{formatLogDate(msg.createdAt)}</span>
                          </div>
                        )
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendRoomMessage} className="p-4 bg-[#161616] border-t border-zinc-800/60 shrink-0">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={roomMessageInput}
                        onChange={(e) => setRoomMessageInput(e.target.value)}
                        placeholder={`Message #${activeRoom}...`}
                        className="w-full bg-[#0a0a0a] border border-zinc-700 text-zinc-200 rounded-xl pl-4 pr-12 py-3.5 outline-none focus:border-zinc-500 transition-colors text-sm"
                      />
                      <button type="submit" disabled={!roomMessageInput.trim()} className="absolute right-2 p-2 bg-zinc-200 hover:bg-white text-black rounded-lg transition-colors disabled:opacity-50"><Send size={16} /></button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'Tasks' && userRole !== 'Employee' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Delegation Engine</h1>
                    <p className="text-sm text-zinc-500 mt-1">Assign strategic objectives to your direct subordinates ({targetTaskRole}s).</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={handleGenerateAITasks} disabled={isSaving || eligibleTaskAssignees.length === 0} className="bg-zinc-800 text-emerald-400 hover:bg-zinc-700 border border-zinc-700 px-4 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto disabled:opacity-50">
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} Auto-Generate Strategy
                    </button>
                    <button onClick={() => setIsTaskModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto">
                      <Plus size={16} /> New Task
                    </button>
                  </div>
                </div>

                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-8 shadow-sm">
                  <div className="p-4 border-b border-zinc-800/60 bg-[#161616]">
                    <h2 className="text-white font-bold text-sm tracking-widest uppercase">Active Objectives</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-zinc-800/60 bg-[#111111]">
                          <th className="p-4 text-zinc-500 font-medium">Task / Objective</th>
                          <th className="p-4 text-zinc-500 font-medium">Assigned To</th>
                          <th className="p-4 text-zinc-500 font-medium">Assigned By</th>
                          <th className="p-4 text-zinc-500 font-medium text-center">Status</th>
                          <th className="p-4 text-zinc-500 font-medium text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relevantTasks.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No active tasks in the system.</td></tr> :
                          relevantTasks.map(task => (
                            <tr key={task.id} className="border-b border-zinc-800/30 hover:bg-[#161616] transition-colors group">
                              <td className="p-4">
                                <p className="font-bold text-zinc-200">{task.title}</p>
                                <p className="text-xs text-zinc-500 truncate max-w-[250px] mt-0.5" title={task.description}>{task.description}</p>
                              </td>
                              <td className="p-4 font-medium text-emerald-400">{task.assignedToName} <span className="text-[9px] uppercase border border-emerald-500/30 px-1 rounded ml-1 bg-emerald-500/10 text-emerald-500">{task.assignedToRole}</span></td>
                              <td className="p-4 text-zinc-400">{task.assignedByName} <span className="text-[9px] uppercase border border-zinc-700 px-1 rounded ml-1 bg-zinc-800">{task.assignedByRole}</span></td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  }`}>{task.status}</span>
                              </td>
                              <td className="p-4 text-center">
                                <button onClick={() => handleDeleteDoc('tasks', task.id)} className="text-zinc-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-1"><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SETTINGS TAB WITH MONTHLY TARGET ADDED */}
            {activeTab === 'Settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl space-y-8 pb-12">
                <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">System Settings</h1><p className="text-sm text-zinc-500 mt-1">Manage your account, global preferences, and security access.</p></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-2 md:col-span-1">
                    <button onClick={() => setActiveSettingsTab('Profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'Profile' ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/50 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/30 border border-transparent'}`}> <UserIcon size={16} /> Personal Profile </button>
                    <button onClick={() => setActiveSettingsTab('Preferences')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'Preferences' ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/50 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/30 border border-transparent'}`}> <Globe size={16} /> Preferences </button>
                    <button onClick={() => setActiveSettingsTab('Security')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSettingsTab === 'Security' ? 'bg-zinc-800/80 text-emerald-400 border border-zinc-700/50 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/30 border border-transparent'}`}> <Lock size={16} /> Security Settings </button>
                  </div>
                  <div className="md:col-span-3 space-y-8">
                    {/* FORM 1: PROFILE */}
                    {activeSettingsTab === 'Profile' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-[#161616]"><UserIcon size={18} className="text-zinc-400" /><h2 className="text-white font-bold text-sm uppercase tracking-widest">Personal Profile</h2></div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div><label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Full Name</label><input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                            <div><label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Job Role</label><input type="text" value={userRole} disabled className="w-full bg-[#0a0a0a] border border-zinc-800/50 text-zinc-500 px-4 py-2.5 rounded-lg outline-none cursor-not-allowed text-sm" /></div>
                          </div>
                          <div><label className="text-xs text-zinc-500 uppercase font-bold mb-1.5 block">Email Address</label><input type="email" value={currentUserData?.email || 'Admin Authentication Active'} disabled className="w-full bg-[#0a0a0a] border border-zinc-800/50 text-zinc-500 px-4 py-2.5 rounded-lg outline-none cursor-not-allowed text-sm" /></div>
                          <div className="pt-2 border-t border-zinc-800/60 flex justify-end"><button type="submit" disabled={isSaving || profileName === currentUserData?.name} className="bg-emerald-500 text-black hover:bg-emerald-400 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes</button></div>
                        </form>
                      </motion.div>
                    )}
                    {/* FORM 2: PREFERENCES */}
                    {activeSettingsTab === 'Preferences' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-[#161616]"><Globe size={18} className="text-emerald-400" /><h2 className="text-white font-bold text-sm uppercase tracking-widest">Global System Preferences</h2></div>
                        <div className="p-6 space-y-6">

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">Base Currency</label>
                              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full bg-[#1a1a1a] border border-zinc-700 text-white px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer">
                                <option value="USD ($)">USD ($) - US Dollar</option><option value="INR (₹)">INR (₹) - Indian Rupee</option><option value="EUR (€)">EUR (€) - Euro</option><option value="GBP (£)">GBP (£) - British Pound</option>
                              </select>
                              <p className="text-zinc-500 text-[10px] mt-2">Changes will instantly reflect across Dashboard, Invoices, and AI Analytics.</p>
                            </div>

                            <div>
                              <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block flex items-center gap-1">Monthly Revenue Target <Trophy size={10} className="text-yellow-500" /></label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                                <input
                                  type="number"
                                  value={monthlyTargetRaw}
                                  onChange={(e) => setMonthlyTargetRaw(Number(e.target.value))}
                                  className="w-full bg-[#1a1a1a] border border-zinc-700 text-white pl-7 pr-4 py-2.5 rounded-lg outline-none focus:border-yellow-500 text-sm transition-colors"
                                />
                              </div>
                              <p className="text-zinc-500 text-[10px] mt-2">Set in Base USD. Hitting this target unlocks MVP Celebration.</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between py-4 border-t border-zinc-800/50">
                            <div><p className="text-zinc-200 font-medium text-sm">Automated Invoice Dispatch</p><p className="text-zinc-500 text-xs mt-0.5">Send a secure PDF invoice immediately when a lead is marked as 'Won'.</p></div>
                            <button onClick={() => setAutoInvoice(!autoInvoice)} className={`w-11 h-6 rounded-full transition-colors relative ${autoInvoice ? 'bg-emerald-500' : 'bg-zinc-700'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoInvoice ? 'right-1' : 'left-1'}`} /></button>
                          </div>
                          <div className="flex items-center justify-between py-4 border-t border-zinc-800/50">
                            <div><p className="text-zinc-200 font-medium text-sm">System Email Alerts</p><p className="text-zinc-500 text-xs mt-0.5">Receive notifications for new deals, leaves, and team additions.</p></div>
                            <button onClick={() => setNotifyEmail(!notifyEmail)} className={`w-11 h-6 rounded-full transition-colors relative ${notifyEmail ? 'bg-emerald-500' : 'bg-zinc-700'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifyEmail ? 'right-1' : 'left-1'}`} /></button>
                          </div>
                          <div className="pt-4 border-t border-zinc-800/60 flex justify-end"><button onClick={handleSavePreferences} disabled={isSaving} className="bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Sync Settings</button></div>
                        </div>
                      </motion.div>
                    )}
                    {/* FORM 3: SECURITY */}
                    {activeSettingsTab === 'Security' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-[#161616]"><Lock size={18} className="text-zinc-400" /><h2 className="text-white font-bold text-sm uppercase tracking-widest">Password Management</h2></div>
                          <div className="p-6">
                            <p className="text-zinc-400 text-sm mb-6">Secure your account by updating your password regularly. A secure reset link will be dispatched to <strong>{currentUserData?.email}</strong>.</p>
                            <button onClick={handleResetPassword} className="bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"><Mail size={16} /> Send Password Reset Link</button>
                          </div>
                        </div>
                        <div className="bg-[#111111] border border-emerald-500/20 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                          <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3 bg-[#161616]"><ShieldCheck size={18} className="text-emerald-400" /><h2 className="text-white font-bold text-sm uppercase tracking-widest">Advanced Security</h2></div>
                          <div className="p-6 space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-zinc-800/50"><div><p className="text-zinc-200 font-medium text-sm">Two-Factor Authentication (2FA)</p><p className="text-zinc-500 text-xs mt-0.5">Require an extra security code during login.</p></div><span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold rounded-full">Enabled</span></div>
                            <div className="flex justify-between items-center"><div><p className="text-zinc-200 font-medium text-sm">Active Sessions</p><p className="text-zinc-500 text-xs mt-0.5">Currently logged in on this device (IP logged).</p></div><button onClick={() => alert('All other devices have been securely signed out.')} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider">Sign out all devices</button></div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* LEAVES TAB */}
            {activeTab === 'Leaves' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Leaves & Approvals</h1><p className="text-sm text-zinc-500 mt-1">Manage time-off requests and AI-summarized approvals.</p></div>
                  <div className="flex items-center gap-3">{userRole !== 'CEO' && (<button onClick={() => setIsLeaveModalOpen(true)} className="bg-emerald-500 text-black hover:bg-emerald-400 px-4 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors w-full md:w-auto"><Plus size={16} /> Request Leave</button>)}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search by reason or summary..." value={leaveSearch} onChange={(e) => setLeaveSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                  <select value={leaveStatusFilter} onChange={(e) => setLeaveStatusFilter(e.target.value)} className="bg-[#111111] border border-zinc-800/60 text-zinc-300 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer w-full sm:w-auto"><option value="All">All Status</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option></select>
                </div>
                {userRole !== 'CEO' && (
                  <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-zinc-800/60 bg-[#161616]"><h2 className="text-white font-bold text-sm tracking-widest uppercase">My Requested Leaves</h2></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead><tr className="border-b border-zinc-800/60 bg-[#111111]"><th className="p-4 text-zinc-500 font-medium">Dates</th><th className="p-4 text-zinc-500 font-medium">AI Summary</th><th className="p-4 text-zinc-500 font-medium">Full Reason</th><th className="p-4 text-zinc-500 font-medium">Approver Role</th><th className="p-4 text-zinc-500 font-medium text-center">Status</th></tr></thead>
                        <tbody>
                          {myLeaves.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No leave requests found.</td></tr> :
                            myLeaves.map(leave => (
                              <tr key={leave.id} className="border-b border-zinc-800/30 hover:bg-[#161616] transition-colors">
                                <td className="p-4 text-zinc-300"><Calendar size={14} className="inline mr-2 text-zinc-500" />{leave.startDate} to {leave.endDate}</td><td className="p-4 font-bold text-emerald-400">{leave.aiSummary}</td><td className="p-4 text-zinc-400 truncate max-w-[200px]" title={leave.reason}>{leave.reason}</td><td className="p-4 text-zinc-500 text-xs font-bold uppercase tracking-wider">{leave.targetRole}</td>
                                <td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : leave.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{leave.status}</span></td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {userRole !== 'Employee' && (
                  <div className="bg-[#111111] border border-emerald-500/20 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.05)] mt-8">
                    <div className="p-4 border-b border-zinc-800/60 bg-[#161616] flex justify-between items-center"><h2 className="text-emerald-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2"><ShieldCheck size={16} /> Pending Actions (Your Subordinates)</h2></div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead><tr className="border-b border-zinc-800/60 bg-[#111111]"><th className="p-4 text-zinc-500 font-medium">Employee</th><th className="p-4 text-zinc-500 font-medium">Dates</th><th className="p-4 text-zinc-500 font-medium">AI Summary</th><th className="p-4 text-zinc-500 font-medium">Status</th><th className="p-4 text-zinc-500 font-medium text-center">Action</th></tr></thead>
                        <tbody>
                          {approvalLeaves.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No approvals pending for your role.</td></tr> :
                            approvalLeaves.map(leave => (
                              <tr key={leave.id} className="border-b border-zinc-800/30 hover:bg-[#161616] transition-colors">
                                <td className="p-4 text-zinc-200 font-bold">{leave.userName} <span className="text-[10px] font-normal text-zinc-500 uppercase ml-1 border border-zinc-700 px-1 rounded">{leave.userRole}</span></td><td className="p-4 text-zinc-400 text-xs">{leave.startDate} to {leave.endDate}</td><td className="p-4 font-bold text-emerald-400 truncate max-w-[200px]" title={leave.reason}>{leave.aiSummary}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${leave.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : leave.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{leave.status}</span></td>
                                <td className="p-4 text-center">{leave.status === 'Pending' ? (<div className="flex justify-center gap-2"><button onClick={() => handleLeaveAction(leave.id, 'Approved')} className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black rounded transition-colors border border-emerald-500/20" title="Approve"><Check size={16} /></button><button onClick={() => handleLeaveAction(leave.id, 'Rejected')} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded transition-colors border border-red-500/20" title="Reject"><X size={16} /></button></div>) : (<span className="text-xs text-zinc-600 font-bold">LOCKED</span>)}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ACTIVITY LOG TAB */}
            {activeTab === 'Activity' && userRole !== 'Employee' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Enterprise Audit Trail</h1><p className="text-sm text-zinc-500 mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Real-time security and activity monitoring module.</p></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search activities or users..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-[#111111] border border-zinc-800/60 rounded-lg px-2"><Calendar size={14} className="text-zinc-500 ml-2" /><input type="date" value={activityDateFilter} onChange={(e) => setActivityDateFilter(e.target.value)} className="bg-transparent text-zinc-300 py-2.5 outline-none focus:border-emerald-500 text-sm [color-scheme:dark] cursor-pointer" title="Filter by Date" />{activityDateFilter && (<button onClick={() => setActivityDateFilter('')} className="text-zinc-500 hover:text-white px-2 py-1 transition-colors text-xs font-medium border-l border-zinc-800 ml-1">Clear</button>)}</div>
                    <select value={activityFilterAction} onChange={(e) => setActivityFilterAction(e.target.value)} className="bg-[#111111] border border-zinc-800/60 text-zinc-300 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer"><option value="All">All Actions</option><option value="CREATE">Create</option><option value="UPDATE">Update</option><option value="DELETE">Delete</option><option value="EMAIL">Email</option><option value="IMPORT">Import</option><option value="EXPORT">Export</option></select>
                    <select value={activityFilterModule} onChange={(e) => setActivityFilterModule(e.target.value)} className="bg-[#111111] border border-zinc-800/60 text-zinc-300 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer"><option value="All">All Modules</option><option value="Lead">Lead</option><option value="Task">Task</option><option value="Product">Product</option><option value="Team">Team</option><option value="Finance">Finance</option><option value="Analytics">Analytics</option><option value="System">System</option></select>
                  </div>
                </div>
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-4 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead><tr className="border-b border-zinc-800/60 bg-[#161616]"><th className="p-4 text-zinc-400 font-medium">Timestamp</th><th className="p-4 text-zinc-400 font-medium">User Profile</th><th className="p-4 text-zinc-400 font-medium">Action</th><th className="p-4 text-zinc-400 font-medium">System Module</th><th className="p-4 text-zinc-400 font-medium">Detailed Activity</th>{userRole === 'CEO' && <th className="p-4 text-zinc-400 font-medium text-center w-16">Manage</th>}</tr></thead>
                      <tbody>
                        {filteredActivities.length === 0 ? <tr><td colSpan={userRole === 'CEO' ? 6 : 5} className="p-8 text-center text-zinc-500">No matching activities found.</td></tr> :
                          filteredActivities.map(log => (
                            <tr key={log.id} className="border-b border-zinc-800/30 hover:bg-[#161616] transition-colors group">
                              <td className="p-4 text-zinc-500 font-mono text-[11px] uppercase tracking-wider">{formatLogDate(log.createdAt)}</td><td className="p-4 text-zinc-300 flex items-center gap-2"><UserIcon size={12} className="text-zinc-500" /> {log.userName} <span className="text-[9px] font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded uppercase">{log.userRole}</span></td>
                              <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : log.action === 'DELETE' ? 'bg-red-500/10 text-red-400 border-red-500/20' : log.action === 'IMPORT' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : log.action === 'EXPORT' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : log.action === 'EMAIL' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{log.action}</span></td>
                              <td className="p-4 text-zinc-400 font-medium">{log.module}</td><td className="p-4 text-zinc-300">{log.description}</td>
                              {userRole === 'CEO' && (<td className="p-4 text-center"><button onClick={() => handleDeleteDoc('activity_logs', log.id)} className="text-zinc-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-1" title="Delete Log"><Trash2 size={16} /></button></td>)}
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUTOMATION TAB */}
            {activeTab === 'Automation' && (
              <>
                {userRole === 'CEO' || userRole === 'HR' ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] gap-6">
                    <div className="w-full md:w-72 flex flex-col gap-3 shrink-0">
                      <h2 className="text-lg font-bold text-white mb-2 tracking-tight">AI Agent Hub</h2>
                      {AI_AGENTS.map(agent => (
                        <button key={agent.id} onClick={() => setActiveAgentId(agent.id)} className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${activeAgentId === agent.id ? `bg-[#161616] border-${agent.color}-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]` : 'bg-[#111111] border-zinc-800/60 hover:bg-[#161616]'}`}>
                          <div className={`mt-1 p-2 rounded-lg ${agent.bg} ${agent.text}`}>{agent.icon}</div>
                          <div><h3 className={`font-bold text-sm ${activeAgentId === agent.id ? 'text-white' : 'text-zinc-300'}`}>{agent.name}</h3><p className="text-xs text-zinc-500 mt-0.5">{agent.role}</p></div>
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 bg-[#111111] border border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
                      <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-[#161616] shrink-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${AI_AGENTS.find(a => a.id === activeAgentId)?.bg} border-${AI_AGENTS.find(a => a.id === activeAgentId)?.color}-500/20`}><div className={AI_AGENTS.find(a => a.id === activeAgentId)?.text}>{AI_AGENTS.find(a => a.id === activeAgentId)?.icon}</div></div>
                          <div><h2 className="text-zinc-100 font-bold">{AI_AGENTS.find(a => a.id === activeAgentId)?.name}</h2><p className={`text-xs font-medium flex items-center gap-1 ${AI_AGENTS.find(a => a.id === activeAgentId)?.text}`}><span className={`w-1.5 h-1.5 rounded-full ${AI_AGENTS.find(a => a.id === activeAgentId)?.bg.replace('/10', '')} animate-pulse`} /> Live Data Synced</p></div>
                        </div>
                        <button onClick={handleGenerateAITasks} disabled={isSaving} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Give Tasks to Juniors
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {(chatHistories[activeAgentId] || []).map((msg, index) => (
                          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-zinc-200 text-black font-medium rounded-br-sm' : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-sm'}`}>{msg.role === 'ai' ? formatAIText(msg.content) : msg.content}</div></div>
                        ))}
                        {isChatLoading && (<div className="flex justify-start"><div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center"><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" /><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75" /><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150" /></div></div>)}
                        <div ref={chatEndRef} />
                      </div>
                      <form onSubmit={handleSendMultiAgentMessage} className="p-4 bg-[#161616] border-t border-zinc-800/60 shrink-0">
                        <div className="relative flex items-center"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={`Ask ${AI_AGENTS.find(a => a.id === activeAgentId)?.name.split(' ')[0]} to analyze...`} className="w-full bg-[#0a0a0a] border border-zinc-700 text-zinc-200 rounded-xl pl-4 pr-12 py-3.5 outline-none focus:border-zinc-500 transition-colors text-sm" disabled={isChatLoading} /><button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 p-2 bg-zinc-200 hover:bg-white text-black rounded-lg transition-colors disabled:opacity-50"><Send size={16} className={isChatLoading ? "animate-pulse" : ""} /></button></div>
                      </form>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-12rem)] bg-[#111111] border border-zinc-800/60 rounded-2xl shadow-sm overflow-hidden relative">
                    <div className="px-6 py-4 border-b border-zinc-800/60 flex items-center justify-between bg-[#161616] shrink-0">
                      <div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20"><Bot className="text-emerald-400" size={20} /></div><div><h2 className="text-zinc-100 font-bold">Context-Aware AI Assistant</h2><p className="text-xs text-emerald-500 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Data Synced</p></div></div>
                      {userRole === 'Manager' && (
                        <button onClick={handleGenerateAITasks} disabled={isSaving} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50">
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Give Tasks to Juniors
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user' ? 'bg-zinc-200 text-black font-medium rounded-br-sm' : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-bl-sm'}`}>{msg.role === 'ai' ? formatAIText(msg.content) : msg.content}</div></div>
                      ))}
                      {isChatLoading && (<div className="flex justify-start"><div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center"><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" /><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-75" /><span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-150" /></div></div>)}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendSingleChatMessage} className="p-4 bg-[#161616] border-t border-zinc-800/60 shrink-0">
                      <div className="relative flex items-center"><input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask AI to analyze your dashboard data (e.g. 'What is my current win rate?')" className="w-full bg-[#0a0a0a] border border-zinc-700 text-zinc-200 rounded-xl pl-4 pr-12 py-3.5 outline-none focus:border-zinc-500 transition-colors text-sm" disabled={isChatLoading} /><button type="submit" disabled={!chatInput.trim() || isChatLoading} className="absolute right-2 p-2 bg-zinc-200 hover:bg-white text-black rounded-lg transition-colors disabled:opacity-50"><Send size={16} className={isChatLoading ? "animate-pulse" : ""} /></button></div>
                    </form>
                  </motion.div>
                )}
              </>
            )}

            {/* PRODUCTS TAB */}
            {activeTab === 'Products' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Marketplace & Inventory</h1><p className="text-sm text-zinc-500 mt-1">Manage company products, pricing, and active trends.</p></div>
                  {userRole !== 'Employee' && (<div className="flex flex-wrap items-center gap-3"><input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleExcelUpload} /><button onClick={() => setShowAIModal(true)} className="flex-1 md:flex-none justify-center bg-zinc-800 text-emerald-400 border border-zinc-700 hover:bg-zinc-700 px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"><Sparkles size={16} /> Smart Import</button><button onClick={() => setIsProductModalOpen(true)} className="flex-1 md:flex-none justify-center bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 shadow-sm"><Plus size={16} /> Add Product</button></div>)}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                  <select value={productCategoryFilter} onChange={(e) => setProductCategoryFilter(e.target.value)} className="bg-[#111111] border border-zinc-800/60 text-zinc-300 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer w-full sm:w-auto"><option value="All">All Categories</option><option value="Software">Software</option><option value="Hardware">Hardware</option><option value="Service">Service</option><option value="General">General</option></select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.length === 0 ? (<div className="col-span-full p-12 text-center text-zinc-500 bg-[#111111] border border-zinc-800/60 rounded-xl">No products found matching your criteria.</div>) : (
                    filteredProducts.map(product => (
                      <motion.div whileHover={{ y: -4 }} key={product.id} className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm relative group flex flex-col">
                        {product.isTrending && (<div className="absolute top-4 right-4 bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded flex items-center gap-1"><TrendingUp size={12} /> Trending</div>)}
                        <div className="p-6 flex-1">
                          <div className="w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center mb-4 border border-zinc-800"><Package size={24} className="text-emerald-400" /></div>
                          <div className="flex items-center gap-2 mb-1"><Tag size={12} className="text-emerald-500" /><p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">{product.category}</p></div>
                          <h3 className="text-lg font-bold text-zinc-100 mb-1">{product.name}</h3>
                          <div className="flex flex-col mt-4">
                            <div className="flex items-end gap-3 mb-1">
                              <h2 className="text-2xl font-bold text-white tabular-nums tracking-tight">{currencySymbol}{(product.price * currentRate).toLocaleString()}</h2>
                              {product.marketPrice > 0 && (<span className="text-sm text-zinc-500 line-through mb-1">{currencySymbol}{(product.marketPrice * currentRate).toLocaleString()}</span>)}
                            </div>
                            <div className="mt-4 mb-1">
                              <div className="flex justify-between text-xs mb-1.5"><span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Market Captured</span><span className="text-emerald-400 font-bold">{product.marketShare || 0}%</span></div>
                              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800"><motion.div initial={{ width: 0 }} animate={{ width: `${product.marketShare || 0}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="bg-emerald-500 h-1.5 rounded-full" /></div>
                            </div>
                          </div>
                        </div>
                        <div className="px-6 py-4 bg-[#161616] border-t border-zinc-800/60 flex justify-between items-center mt-auto">
                          <p className="text-xs font-medium text-zinc-500">Stock: <span className={product.stock > 0 ? 'text-zinc-200' : 'text-red-400'}>{product.stock} Units</span></p>
                          {userRole !== 'Employee' && (
                            <div className="flex items-center gap-3 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleTrendingToggle(product.id, product.isTrending)} className="text-xs text-zinc-400 hover:text-orange-400 font-medium">{product.isTrending ? 'Unmark' : 'Mark Fire'}</button>
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
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-4">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Organization Directory</h1><p className="text-sm text-zinc-500 mt-1">Manage access control and auto-generate accounts.</p></div>
                  <button onClick={() => setIsTeamModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 shadow-sm w-full md:w-auto"><Plus size={16} /> Add Member</button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search team members by name or email..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                  <select value={teamRoleFilter} onChange={(e) => setTeamRoleFilter(e.target.value)} className="bg-[#111111] border border-zinc-800/60 text-zinc-300 px-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm appearance-none cursor-pointer w-full sm:w-auto"><option value="All">All Roles</option><option value="CEO">CEO</option><option value="Manager">Manager</option><option value="HR">HR</option><option value="Employee">Employee</option></select>
                </div>
                <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden mt-4 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead><tr className="border-b border-zinc-800/60 bg-[#161616]"><th className="p-4 text-zinc-400 font-medium">Name</th><th className="p-4 text-zinc-400 font-medium">Email Address</th><th className="p-4 text-zinc-400 font-medium">Role</th><th className="p-4 text-zinc-400 font-medium">Status</th><th className="p-4 text-zinc-400 font-medium text-center w-16">Action</th></tr></thead>
                      <tbody>
                        {filteredTeam.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-zinc-500">No members found matching your search.</td></tr> :
                          filteredTeam.map(member => (
                            <tr key={member.id} className="border-b border-zinc-800/30 hover:bg-[#161616] group transition-colors">
                              <td className="p-4 font-medium text-zinc-200">{member.name}</td><td className="p-4 text-zinc-500">{member.email}</td>
                              <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold border ${member.role === 'Manager' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''} ${member.role === 'HR' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''} ${member.role === 'Employee' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}`}>{member.role}</span></td>
                              <td className="p-4"><span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><CheckCircle2 size={12} /> {member.status}</span></td>
                              <td className="p-4 text-center">{(userRole === 'CEO' || (userRole !== 'CEO' && member.role === 'Employee')) && (<button onClick={() => handleDeleteDoc('company_team', member.id)} className="text-zinc-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-1"><Trash2 size={16} /></button>)}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* DASHBOARD TAB (KANBAN) */}
            {activeTab === 'Dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                {/* EMPLOYEE MY TASKS WIDGET WITH COMPLETION LOGIC */}
                {userRole === 'Employee' && relevantTasks.length > 0 && (
                  <div className="bg-[#111111] border border-blue-500/20 rounded-xl overflow-hidden shadow-sm mb-8">
                    <div className="p-4 border-b border-zinc-800/60 bg-[#161616] flex items-center justify-between">
                      <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase flex items-center gap-2"><ClipboardList size={16} /> My Pending Tasks</h2>
                    </div>
                    <div className="p-4 space-y-3">
                      {relevantTasks.map(task => (
                        <div key={task.id} className="bg-[#1a1a1a] border border-zinc-800/60 p-4 rounded-lg flex items-center justify-between">
                          <div>
                            <p className="font-bold text-zinc-200">{task.title}</p>
                            <p className="text-xs text-zinc-500 mt-1">{task.description}</p>
                            <p className="text-[10px] text-zinc-600 mt-2">Assigned by: {task.assignedByName}</p>
                          </div>
                          <button onClick={() => handleCompleteTask(task)} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/20 px-3 py-1.5 rounded text-xs font-bold transition-colors">
                            Mark Complete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
                  <div><h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Active Pipeline</h1><p className="text-sm text-emerald-500 mt-1 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> {userRole === 'Employee' ? 'Your Assigned Leads' : 'Company Wide Leads'}</p></div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64 hidden sm:block"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search leads..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>
                    <div className="bg-[#111111] border border-zinc-800/60 rounded-md p-1 flex shrink-0"><button onClick={() => setLeadView('board')} className={`p-1.5 rounded transition-all ${leadView === 'board' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><Kanban size={18} /></button><button onClick={() => setLeadView('list')} className={`p-1.5 rounded transition-all ${leadView === 'list' ? 'bg-zinc-800 text-emerald-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}><ListIcon size={18} /></button></div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-white text-black hover:bg-zinc-200 px-4 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 shadow-sm shrink-0 w-full sm:w-auto"><Plus size={16} /> Deploy</button>
                  </div>
                </div>
                <div className="relative block sm:hidden mb-4"><Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" /><input type="text" placeholder="Search leads..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} className="w-full bg-[#111111] border border-zinc-800/60 text-white pl-9 pr-4 py-2.5 rounded-lg outline-none focus:border-emerald-500 text-sm transition-colors" /></div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Gross Pipeline</p><h2 className="text-3xl font-semibold text-zinc-100">{currencySymbol}{analytics.totalGross.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Won Revenue</p><h2 className="text-3xl font-semibold text-emerald-400">{currencySymbol}{analytics.wonRev.toLocaleString()}</h2></div>
                  <div className="bg-[#111111] p-5 rounded-xl border border-zinc-800/60 shadow-sm"><p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Total Active Leads</p><h2 className="text-3xl font-semibold text-zinc-100">{analytics.activeCount}</h2></div>
                </div>

                {isLoadingData ? (<div className="p-8 text-center text-zinc-500"><Loader2 className="animate-spin inline-block mr-2" size={16} /> Fetching Pipeline...</div>) : (
                  <>
                    {leadView === 'board' ? (
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-[500px] items-start">
                        {KANBAN_COLUMNS.map(col => (
                          <div key={col.id} className="flex-1 min-w-[280px] max-w-[320px] bg-[#111111] rounded-xl border border-zinc-800/60 flex flex-col shadow-sm" onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver}>
                            <div className={`p-4 border-b border-zinc-800/60 flex justify-between items-center ${col.text}`}><h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${col.color}`} />{col.label}</h3><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.color}/10 border ${col.border}`}>{filteredLeads.filter(l => l.status === col.id).length}</span></div>
                            <div className="p-4 flex-1 flex flex-col gap-3 min-h-[150px]">
                              {filteredLeads.filter(l => l.status === col.id).map(lead => (
                                <motion.div layoutId={lead.id} key={lead.id} draggable onDragStart={(e: any) => handleDragStart(e, lead.id)} className="bg-[#1a1a1a] p-4 rounded-lg border border-zinc-800/60 cursor-grab active:cursor-grabbing hover:border-zinc-600 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all group">
                                  <div className="flex justify-between items-start mb-3"><div className="pr-4"><h4 className="text-zinc-100 font-bold text-sm leading-tight">{lead.name}</h4><p className="text-zinc-500 text-xs mt-0.5 truncate">{lead.company}</p></div><button onClick={() => handleDeleteDoc('leads', lead.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button></div>
                                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                                    <span className="text-zinc-300 font-bold text-sm">{currencySymbol}{(lead.value * currentRate).toLocaleString()}</span>
                                    {/* 🔥 MAGIC LINK ICON 🔥 */}
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleSendTrackingLink(lead.id, lead.name, lead.email || '')} className="text-zinc-500 hover:text-emerald-400 transition-colors p-1" title="Send Magic Client Link"><Send size={14} /></button>
                                      <button onClick={() => copyTrackingLink(lead.id, lead.name)} className="text-zinc-500 hover:text-blue-400 transition-colors p-1" title="Copy Magic Client Link"><ExternalLink size={14} /></button>
                                      <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800/50 truncate max-w-[90px]"><UserIcon size={10} className="text-zinc-500 shrink-0" /> {lead.assignedToName?.split(' ')[0] || 'Unassigned'}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                              {filteredLeads.filter(l => l.status === col.id).length === 0 && (<div className="border-2 border-dashed border-zinc-800/60 rounded-lg p-6 text-center text-zinc-600 text-xs font-medium uppercase tracking-widest mt-2">{leadSearch ? 'No matches' : 'Drop Here'}</div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#111111] border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead><tr className="border-b border-zinc-800/60 bg-[#161616]"><th className="p-4 text-zinc-400 font-medium">Name</th><th className="p-4 text-zinc-400 font-medium">Organization</th><th className="p-4 text-zinc-400 font-medium">Email</th><th className="p-4 text-zinc-400 font-medium">Assigned To</th><th className="p-4 text-zinc-400 font-medium">Status</th><th className="p-4 text-zinc-400 font-medium text-right">Value</th><th className="p-4 text-zinc-400 font-medium text-center w-24">Action</th></tr></thead>
                            <tbody>
                              {filteredLeads.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No leads found matching your search.</td></tr> :
                                filteredLeads.map(l => (
                                  <tr key={l.id} className="border-b border-zinc-800/30 hover:bg-[#161616] group transition-colors">
                                    <td className="p-4 font-medium text-zinc-200">{l.name}</td><td className="p-4 text-zinc-500">{l.company}</td><td className="p-4 text-zinc-400">{l.email || '-'}</td><td className="p-4 text-zinc-400 font-medium flex items-center gap-2"><UserIcon size={12} /> {l.assignedToName || 'Unassigned'}</td>
                                    <td className="p-4"><select value={l.status} onChange={(e) => handleStatusChange(l.id, e.target.value)} className={`bg-zinc-800/50 text-zinc-300 px-2 py-1.5 rounded text-xs font-medium border border-zinc-700/50 outline-none cursor-pointer hover:bg-zinc-700 transition-colors ${l.status === 'Won' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : ''} ${l.status === 'Lost' ? 'text-red-400 border-red-500/30 bg-red-500/10' : ''}`}><option value="New" className="bg-zinc-900 text-white">New</option><option value="In Progress" className="bg-zinc-900 text-white">In Progress</option><option value="Won" className="bg-zinc-900 text-emerald-400">Won</option><option value="Lost" className="bg-zinc-900 text-red-400">Lost</option></select></td>
                                    <td className="p-4 text-right text-zinc-300">{currencySymbol}{(l.value * currentRate).toLocaleString()}</td>
                                    {/* 🔥 MAGIC LINK ICON 🔥 */}
                                    <td className="p-4 text-center flex items-center justify-center gap-2">
                                      <button onClick={() => handleSendTrackingLink(l.id, l.name, l.email || '')} className="text-zinc-500 hover:text-emerald-400 transition-colors p-1" title="Send Magic Client Link"><Send size={16} /></button>
                                      <button onClick={() => copyTrackingLink(l.id, l.name)} className="text-zinc-500 hover:text-blue-400 transition-colors p-1" title="Copy Magic Client Link"><ExternalLink size={16} /></button>
                                      <button onClick={() => handleDeleteDoc('leads', l.id)} className="text-zinc-600 hover:text-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100 p-1"><Trash2 size={16} /></button>
                                    </td>
                                  </tr>
                                ))
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* ANALYTICS 2.0 TAB */}
            {activeTab === 'Analytics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 tracking-tight">Executive Telemetry 2.0</h1>
                    <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2"><Sparkles size={14} className="text-emerald-500" /> Deep AI Performance Metrics</p>
                  </div>
                  <div className="flex items-center gap-3 bg-[#111111] border border-zinc-800/60 px-4 py-2.5 rounded-lg shadow-sm w-full md:w-auto"><Calendar size={16} className="text-zinc-400 shrink-0" /><select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-transparent text-sm font-medium text-zinc-200 outline-none cursor-pointer w-full"><option value="all" className="bg-zinc-900">All Time</option><option value="1y" className="bg-zinc-900">Last 1 Year</option><option value="30d" className="bg-zinc-900">Last 30 Days</option><option value="7d" className="bg-zinc-900">Last 7 Days</option></select></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
                  <div className="bg-gradient-to-b from-[#161616] to-[#0c0c0c] p-5 rounded-2xl border border-zinc-800/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BarChart3 size={60} /></div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Avg Deal Size</p><h2 className="text-xl md:text-2xl font-black text-zinc-100">{currencySymbol}{Number(analytics.avgDealSize).toLocaleString()}</h2>
                  </div>
                  <div className="bg-gradient-to-b from-[#161616] to-[#0c0c0c] p-5 rounded-2xl border border-zinc-800/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-yellow-500"><TrendingUp size={60} /></div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Expected Rev</p><h2 className="text-xl md:text-2xl font-black text-yellow-500">{currencySymbol}{analytics.expectedRev.toLocaleString()}</h2>
                  </div>
                  <div className="bg-gradient-to-b from-[#161616] to-[#0c0c0c] p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500"><Target size={60} /></div>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">Closed Won</p><h2 className="text-xl md:text-2xl font-black text-emerald-400">{currencySymbol}{analytics.wonRev.toLocaleString()}</h2>
                  </div>
                  <div className="bg-gradient-to-b from-[#161616] to-[#0c0c0c] p-5 rounded-2xl border border-zinc-800/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-zinc-300"><PieChartIcon size={60} /></div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Win Rate</p><h2 className="text-xl md:text-2xl font-black text-zinc-100">{analytics.winRate}%</h2>
                  </div>
                  <div className="col-span-2 sm:col-span-3 md:col-span-1 bg-[#111111] p-5 rounded-2xl border border-zinc-800/60 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-5 text-zinc-500"><Package size={80} /></div>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Inventory Value</p><h2 className="text-2xl font-black text-zinc-300">{currencySymbol}{analytics.totalInventoryValue.toLocaleString()}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* TEAM EFFICIENCY RADAR */}
                  <div className="bg-[#111111] p-4 md:p-6 rounded-2xl border border-zinc-800/60 shadow-sm h-[350px] flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-300 mb-4 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={16} className="text-purple-500" /> Team Efficiency Matrix</h3>
                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.radarData}>
                          <PolarGrid stroke="#27272a" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10, fontWeight: 'bold' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Win Rate" dataKey="WinRate" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                          <Radar name="Revenue Score" dataKey="RevenueScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* AI PREDICTIVE FORECAST */}
                  <div className="bg-[#111111] p-4 md:p-6 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] h-[350px] flex flex-col">
                    <h3 className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16} /> AI Predictive Revenue Forecast</h3>
                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.graphData} margin={{ left: -20, right: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="month" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${currencySymbol}${v / 1000}k`} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #10b981', borderRadius: '8px', color: '#fff' }} />
                          <Area type="monotone" dataKey="revenue" name="Actual Won" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                          <Area type="monotone" dataKey="forecast" name="AI Forecast" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {userRole !== 'Employee' && (
                    <div className="bg-[#111111] border border-zinc-800/60 rounded-2xl overflow-hidden shadow-sm relative lg:col-span-2 flex flex-col h-[350px]">
                      <div className="p-5 border-b border-zinc-800/60 relative z-10 flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={20} />
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Top Performing Employees</h3>
                      </div>
                      <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead><tr className="bg-[#161616] text-zinc-400"><th className="p-4 font-medium">Rank & Name</th><th className="p-4 font-medium text-center">Total Leads</th><th className="p-4 font-medium text-center">Win Rate</th><th className="p-4 font-medium text-right text-emerald-400">Revenue Won</th></tr></thead>
                          <tbody>
                            {analytics.leaderboard.length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No performance data yet. Assign leads to see rankings.</td></tr> :
                              analytics.leaderboard.map((emp, idx) => (
                                <tr key={idx} className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors">
                                  <td className="p-4 font-bold flex items-center gap-3"><span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.5)]' : idx === 1 ? 'bg-zinc-300 text-black' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{idx + 1}</span>{emp.name}{idx === 0 && emp.revenue > 0 && <span className="ml-2 bg-yellow-500/20 text-yellow-500 text-[9px] px-1.5 py-0.5 rounded border border-yellow-500/30 uppercase tracking-widest">MVP 👑</span>}</td>
                                  <td className="p-4 text-center text-zinc-300 font-medium">{emp.totalLeads}</td>
                                  <td className="p-4 text-center"><span className={`px-2 py-1 rounded-md text-xs font-bold ${emp.winRate > 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>{emp.winRate}%</span></td>
                                  <td className="p-4 text-right font-black text-emerald-500">{currencySymbol}{emp.revenue.toLocaleString()}</td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#111111] p-4 md:p-5 rounded-2xl border border-zinc-800/60 shadow-sm h-[350px] lg:col-span-1 flex flex-col">
                    <h3 className="text-sm font-bold text-zinc-400 mb-4 uppercase tracking-widest flex items-center gap-2"><Package size={16} /> Top Market Share</h3>
                    <div className="flex-1 w-full min-h-0">
                      {analytics.productMarketData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.productMarketData} layout="vertical" margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                            <XAxis type="number" stroke="#52525b" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={80} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #10b981', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#27272a' }} />
                            <Bar dataKey="share" name="Market Share (%)" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12}>
                              {analytics.productMarketData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#059669'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (<div className="h-full flex items-center justify-center text-zinc-600 text-sm font-medium">Upload products to see data</div>)}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* 🔥 MODALS 🔥 */}

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        newTask={newTask}
        setNewTask={setNewTask}
        targetTaskRole={targetTaskRole}
        eligibleTaskAssignees={eligibleTaskAssignees}
        team={team}
        isSaving={isSaving}
      />

      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSubmit={handleSubmitLeave}
        leaveForm={leaveForm}
        setLeaveForm={setLeaveForm}
        isSaving={isSaving}
      />

      <LeadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddLead}
        newLead={newLead}
        setNewLead={setNewLead}
        team={team}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleAddProduct}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        currencySymbol={currencySymbol}
        isSaving={isSaving}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        onSubmit={handleAddMember}
        newMember={newMember}
        setNewMember={setNewMember}
        userRole={userRole}
        isSaving={isSaving}
      />

      <AccountCreatedModal
        account={createdAccount}
        onClose={() => setCreatedAccount(null)}
        onSendEmail={sendRealEmail}
        isSendingEmail={isSendingEmail}
        onCopyToClipboard={handleCopyToClipboard}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0c0c0c; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />

    </div>
  );
}