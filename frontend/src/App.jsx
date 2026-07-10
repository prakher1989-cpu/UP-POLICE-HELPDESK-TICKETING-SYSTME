import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import TicketDetails from './TicketDetails.jsx';
import DashboardCard from './DashboardCard.jsx';
import TicketList from './TicketList.jsx';
import KanbanBoard from './KanbanBoard.jsx';
import UserProfile from './UserProfile.jsx';
import { 
  ShieldAlert, LayoutDashboard, Ticket, HardDrive, 
  Settings, Bell, Search, UserCircle, Plus, 
  Clock, CheckCircle, AlertTriangle, ChevronRight, X,
  Menu, Lock, UserPlus, Key, LogOut, Zap, Activity, ShieldCheck, Sun, Moon, Eye, EyeOff, Loader2, Paperclip
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

import districtPoliceStations from './districtData.json';
const defaultDistrict = Object.keys(districtPoliceStations)[0];
const defaultStation = districtPoliceStations[defaultDistrict][0];

const supabaseUrl = 'https://iokmquslburktttwmmnf.supabase.co';
const supabaseKey = 'sb_publishable__aw3f4SJQ2u0CLmoi3oTRQ_VgJpzqCn';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('auth') === 'true');
  const [userId, setUserId] = useState(() => sessionStorage.getItem('userId') || '');
  const [userName, setUserName] = useState(() => sessionStorage.getItem('userName') || '');
  const [userRole, setUserRole] = useState(() => sessionStorage.getItem('userRole') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginMode, setLoginMode] = useState('login'); // 'login' | 'register' | 'password'
  
  // Registration State
  const [newUserId, setNewUserId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard State
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [avatar, setAvatar] = useState(() => localStorage.getItem(`avatar_${userId}`) || null);

  // Sync avatar when updated in profile
  useEffect(() => {
    const handleAvatarUpdate = () => {
      setAvatar(localStorage.getItem(`avatar_${userId}`));
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [userId]);
  
  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const [newTicket, setNewTicket] = useState({ 
    name: '',
    mobile: '',
    ipAddress: '',
    designation: 'Inspector',
    title: '', 
    description: '', 
    category: 'Hardware', 
    priority: 'Low',
    district: defaultDistrict,
    policeStation: defaultStation
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError('');
    
    // Simulate secure network delay
    setTimeout(async () => {
      try {
        const res = await fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId.trim().toLowerCase(), password })
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
          setUserName(data.name);
          setIsAuthenticated(true);
          sessionStorage.setItem('auth', 'true');
          sessionStorage.setItem('userId', userId);
          sessionStorage.setItem('userName', data.name);
          sessionStorage.setItem('userRole', data.role);
          setLoginError('');
          fetchData();
        } else {
          const data = await res.json();
          setLoginError(data.error || 'Invalid credentials');
        }
      } catch (err) {
        setLoginError('Error connecting to backend server.');
      } finally {
        setIsLoginLoading(false);
      }
    }, 1200);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUserId, name: newUserName, password: newPassword })
      });
      if (res.ok) {
        const data = await res.json();
        // Automatically log in the new user and go to the dashboard
        setUserId(newUserId);
        setUserName(data.name);
        setPassword(newPassword);
        setUserRole(data.role);
        setIsAuthenticated(true);
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('userId', newUserId);
        sessionStorage.setItem('userName', data.name);
        sessionStorage.setItem('userRole', data.role);
        setLoginError('');
        setSuccessMessage('');
        fetchData();
        
        // Reset form state
        setNewUserId('');
        setNewUserName('');
        setNewPassword('');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Registration failed');
      }
    } catch (err) {
      setLoginError('Error connecting to backend server.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setLoginError('New passwords do not match');
    }
    try {
      const res = await fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword, newPassword })
      });
      if (res.ok) {
        setSuccessMessage('Password changed successfully! Please log in.');
        setLoginMode('login');
        setPassword('');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setLoginError('');
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Password change failed');
      }
    } catch (err) {
      setLoginError('Error connecting to backend server.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    setUserName('');
    setUserId('');
    setPassword('');
    sessionStorage.clear();
    setStats(null);
    setTickets([]);
  };

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      
      const ticketsRes = await fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/tickets');

      if (!ticketsRes.ok) {
        throw new Error('Failed to fetch data from backend. Make sure the Node server is running.');
      }

      const allTickets = await ticketsRes.json();
      
      // Filter tickets based on role
      let userTickets = allTickets;
      if (userRole !== 'admin') {
        userTickets = allTickets.filter(t => t.assignedTo === userName || t.resolvedBy === userName || t.name === userName);
      }

      // Fetch pre-calculated stats from SQL Database via backend
      const statsRes = await fetch(`https://up-police-helpdesk-ticketing-system.onrender.com/api/stats?userRole=${userRole}&userName=${encodeURIComponent(userName)}`);
      if (statsRes.ok) {
        const dbStats = await statsRes.json();
        setStats(dbStats);
      } else {
        throw new Error('Failed to fetch dashboard statistics.');
      }

      setTickets(userTickets);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      
      // Supabase Real-time WebSockets
      const ticketsSubscription = supabase
        .channel('public:tickets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
          console.log('Real-time event received:', payload);
          fetchData(); // Instantly refresh data when DB changes
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(ticketsSubscription);
      };
    }
  }, [isAuthenticated, userRole, userName]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      let uploadedUrl = null;
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('attachments').upload(fileName, attachmentFile);
        if (data) {
          const { data: publicUrlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
          uploadedUrl = publicUrlData.publicUrl;
        } else {
          console.error("Storage upload error:", error);
          // Proceed without attachment if upload fails or notify user
        }
      }

      const ticketPayload = { ...newTicket, name: userName, attachmentUrl: uploadedUrl };

      const res = await fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketPayload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setNewTicket({ 
          name: '',
          mobile: '',
          ipAddress: '',
          designation: 'Inspector',
          title: '', 
          description: '', 
          category: 'Hardware', 
          priority: 'Low',
          district: defaultDistrict,
          policeStation: defaultStation
        });
        setAttachmentFile(null);
        fetchData();
      } else {
        alert('Failed to create ticket');
      }
    } catch (err) {
      alert('Error connecting to server to create ticket.');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'Low': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-amber-400';
      case 'In Progress': return 'text-cyan-400';
      case 'Resolved': return 'text-emerald-400';
      default: return 'text-slate-500';
    }
  };

  // --- ENGINEER STATS (ADMIN ONLY) ---
  const engineerStats = useMemo(() => {
    if (userRole !== 'admin') return [];
    
    const statsMap = {
      "Saurabh Singh": { name: "Saurabh Singh", open: 0, resolved: 0 },
      "Deepak Shukla": { name: "Deepak Shukla", open: 0, resolved: 0 },
      "Adarsh Kumar": { name: "Adarsh Kumar", open: 0, resolved: 0 },
      "Prakher Singh": { name: "Prakher Singh", open: 0, resolved: 0 }
    };
    
    tickets.forEach(t => {
      if (t.status === 'Resolved' && t.resolvedBy) {
        // Only update if it's one of the 4 official engineers
        if (statsMap[t.resolvedBy]) {
          statsMap[t.resolvedBy].resolved++;
        }
      } else if (t.status !== 'Resolved' && t.assignedTo) {
        // Only update if it's one of the 4 official engineers
        if (statsMap[t.assignedTo]) {
          statsMap[t.assignedTo].open++;
        }
      }
    });
    
    return Object.values(statsMap);
  }, [tickets, userRole]);

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex font-['Poppins']">
        
        {/* LEFT PANEL - Branding (40%) */}
        <div className="hidden lg:flex w-[40%] flex-col justify-between p-12 border-r border-slate-200 dark:border-slate-800 relative overflow-hidden">
          {/* Background Image of Signature Building */}
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/hq.jpg")' }}></div>
          {/* Gradient Overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#020817]/90 to-[#0F172A]/95"></div>

          {/* Subtle Glows */}
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#1E88E5]/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col items-center text-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Logo_of_Uttar_Pradesh_Police.png/330px-Logo_of_Uttar_Pradesh_Police.png" 
                alt="UP Police Logo" 
                className="w-24 h-24 object-contain mb-8 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
              />
              <h1 className="text-[42px] font-bold text-white leading-tight tracking-tight mb-4">
                UP POLICE HELPDESK
              </h1>
              <p className="text-[#00BCD4] text-lg font-medium tracking-wide mb-12">
                TICKETING DASHBOARD
              </p>
            </div>

            <div className="space-y-6 mt-8">
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl mr-4 border border-white/10"><Zap className="w-6 h-6 text-[#1E88E5]" /></div>
                <span className="text-[16px] font-medium">Fast Ticket Registration</span>
              </div>
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl mr-4 border border-white/10"><Activity className="w-6 h-6 text-[#1E88E5]" /></div>
                <span className="text-[16px] font-medium">Real-time Status Tracking</span>
              </div>
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl mr-4 border border-white/10"><HardDrive className="w-6 h-6 text-[#1E88E5]" /></div>
                <span className="text-[16px] font-medium">Asset Management</span>
              </div>
              <div className="flex items-center text-slate-700 dark:text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl mr-4 border border-white/10"><ShieldCheck className="w-6 h-6 text-[#1E88E5]" /></div>
                <span className="text-[16px] font-medium">Secure Government Network</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-slate-500 font-medium">
            <p>Version 2.0</p>
            <p>Government of Uttar Pradesh</p>
          </div>
        </div>

        {/* RIGHT PANEL - Login Area (60%) */}
        <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-geometric">
          
          {/* Animated Blobs */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#00BCD4]/10 rounded-full blur-[100px] animate-blob pointer-events-none mix-blend-screen"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#1E88E5]/10 rounded-full blur-[100px] animate-blob animation-delay-2000 pointer-events-none mix-blend-screen"></div>
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[#0B3C6F]/30 rounded-full blur-[80px] animate-blob animation-delay-4000 pointer-events-none mix-blend-screen"></div>

          {/* Floating Glass Login Card */}
          <div className="w-full max-w-md glass-card p-10 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            
            {/* Mobile Logo (hidden on desktop) */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Logo_of_Uttar_Pradesh_Police.png/330px-Logo_of_Uttar_Pradesh_Police.png" alt="UP Police Logo" className="w-16 h-16 object-contain mb-4" />
              <h2 className="text-2xl font-bold text-white text-center">UP POLICE HELPDESK</h2>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
                {loginMode === 'login' ? 'Welcome Back' : loginMode === 'register' ? 'Create Account' : 'Reset Credentials'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                {loginMode === 'login' ? 'Enter your authorized credentials to access the dashboard.' : loginMode === 'register' ? 'Register a new engineering or staff account.' : 'Update your secure portal password.'}
              </p>
            </div>

            {/* Error & Success Messages */}
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center mb-6 shadow-sm backdrop-blur-md animate-in fade-in">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                {loginError}
              </div>
            )}
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm font-medium flex items-center mb-6 shadow-sm backdrop-blur-md animate-in fade-in">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {/* LOGIN FORM */}
            {loginMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Administrator ID / User ID</label>
                  <input 
                    type="text" 
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full glass-input"
                    placeholder="Enter your ID"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</label>
                    <button type="button" onClick={() => { setLoginMode('password'); setLoginError(''); setSuccessMessage(''); }} className="text-[13px] font-semibold text-[#00BCD4] hover:text-white transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full glass-input focus:ring-2 focus:ring-cyan-500/50 transition-all pr-12"
                      placeholder="Enter your password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center mt-2">
                  <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#1E88E5] focus:ring-[#00BCD4]/50 focus:ring-offset-slate-900" />
                  <label htmlFor="remember" className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-medium">Remember me for 30 days</label>
                </div>
                
                <div className="pt-2">
                  <button type="submit" disabled={isLoginLoading} className="w-full relative overflow-hidden bg-gradient-to-r from-[#00BCD4] to-[#1E88E5] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(30,136,229,0.3)] hover:shadow-[0_6px_20px_rgba(30,136,229,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center group disabled:opacity-80 disabled:cursor-not-allowed">
                    {isLoginLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="relative z-10 tracking-wide">SECURE LOGIN</span>
                        <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Secure Badge */}
                <div className="mt-8 flex items-center justify-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-full max-w-max mx-auto shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  256-bit Secure Connection
                </div>
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                    Need an account?{' '}
                    <button type="button" onClick={() => { setLoginMode('register'); setLoginError(''); setSuccessMessage(''); }} className="text-[#1E88E5] hover:text-white font-semibold transition-colors">
                      Create New Account
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* REGISTER FORM */}
            {loginMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">New User ID</label>
                  <input 
                    type="text" required value={newUserId} onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full glass-input"
                    placeholder="e.g. jdoe"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Full Name</label>
                  <input 
                    type="text" required value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full glass-input"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Password</label>
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full glass-input"
                    placeholder="Create a strong password"
                  />
                </div>
                
                <button type="submit" className="w-full glass-button mt-4">
                  Register Account
                </button>
                
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setLoginMode('login')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-white transition-colors">
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            {/* CHANGE PASSWORD FORM */}
            {loginMode === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">User ID</label>
                  <input 
                    type="text" required value={userId} onChange={(e) => setUserId(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Current Password</label>
                  <input 
                    type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">New Password</label>
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">Confirm New Password</label>
                  <input 
                    type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                
                <button type="submit" className="w-full glass-button mt-4">
                  Update Password
                </button>
                
                <div className="mt-6 text-center">
                  <button type="button" onClick={() => setLoginMode('login')} className="text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-white transition-colors">
                    Back to Login
                  </button>
                </div>
              </form>
            )}

            <div className="mt-12 text-center text-xs font-medium text-slate-500 space-y-1.5">
              <p className="text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">CCTNS Help Desk</p>
              <p>0522- 2390520, 2390521, 2390522</p>
              <p>Email-id: <a href="mailto:cctns-helpdesk.lu@up.gov.in" className="text-[#00BCD4] hover:text-white transition-colors">cctns-helpdesk.lu@up.gov.in</a></p>
              <p className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">© 2026 Government of Uttar Pradesh</p>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white dark:bg-slate-900 z-30 flex flex-col border-r border-slate-200 dark:border-slate-800">
        <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="bg-white p-1 rounded-lg mr-3 shadow-inner">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Logo_of_Uttar_Pradesh_Police.png/330px-Logo_of_Uttar_Pradesh_Police.png" alt="UP Police Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-wide uppercase leading-tight">UP Police Helpdesk</h1>
            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mt-0.5">Ticketing Dashboard</p>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
          <ul className="space-y-2 mt-4">
            <li>
              <Link to="/" className={`flex items-center p-3 rounded-xl transition-all ${location.pathname === '/' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-100 dark:border-cyan-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/kanban" className={`flex items-center p-3 rounded-xl transition-all ${location.pathname === '/kanban' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-100 dark:border-cyan-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                <Activity className="w-5 h-5 mr-3" />
                Kanban Board
              </Link>
            </li>
          </ul>
          <ul className="space-y-1.5 mt-6">
            {['Tickets', 'Assets & Network', 'Settings'].map((tab, index) => {
              const icons = [Ticket, HardDrive, Settings];
              const Icon = icons[index];
              
              let path = '/tickets';
              if (tab === 'Assets & Network') path = '/assets';
              else if (tab === 'Settings') path = '/settings';

              let isActive = false;
              if (tab === 'Tickets' && location.pathname.startsWith('/tickets')) isActive = true;
              if (tab === 'Assets & Network' && location.pathname.startsWith('/assets')) isActive = true;
              if (tab === 'Settings' && location.pathname.startsWith('/settings')) isActive = true;
              
              return (
                <li key={tab}>
                  <Link 
                    to={path}
                    className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-800 dark:text-slate-200 font-medium'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                    {tab}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="flex flex-col space-y-4">
            {/* User Profile Badge */}
            <Link to="/profile" className="flex items-center space-x-3 pl-5 ml-5 border-l border-slate-200 dark:border-slate-800 cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-200 dark:border-cyan-800 overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-cyan-500 transition-all">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  userName.charAt(0)
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 transition-colors">{userName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{userRole}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-500/20 text-slate-600 dark:text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/30 rounded-lg transition-all font-bold text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        
        {/* Top App Bar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 flex items-center justify-between px-8">
          <div className="flex items-center flex-1">
            <button className="md:hidden mr-4 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative w-full max-w-md hidden md:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="w-5 h-5 text-slate-500" />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block pl-12 p-3 transition-all outline-none" 
                placeholder="Search tickets, IDs, or assets..." 
              />
            </div>
          </div>
          <div className="flex items-center space-x-5 relative">
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6 text-slate-600" />}
            </button>

            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-6 h-6" />
              {stats?.active > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(239,68,68,0.8)] text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                  {stats.active > 9 ? '9+' : stats.active}
                </span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900/80 backdrop-blur-sm">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Notifications</h3>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md">{stats?.active || 0} New</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {stats?.active > 0 ? (
                    tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').slice(0, 5).map(ticket => (
                      <div 
                        key={ticket.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(`/tickets/${ticket.id}`);
                        }}
                        className="p-4 border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{ticket.id}</span>
                          <span className="text-[9px] font-medium text-slate-500">{new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-2">{ticket.title}</p>
                        <span className="inline-block mt-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
                          {ticket.status === 'Open' ? 'Action Required' : 'In Progress'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                      All caught up!
                    </div>
                  )}
                </div>
                <div 
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/tickets?status=active');
                  }}
                  className="p-3 text-center text-xs font-bold text-cyan-400 hover:bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors bg-white dark:bg-slate-900/50"
                >
                  View All Active Tickets
                </div>
              </div>
            )}
          </div>
        </header>

        {/* --- ROUTES --- */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 dark:bg-slate-950 font-['Poppins']">
          <Routes>
            {/* DASHBOARD ROUTE */}
            <Route path="/" element={
              <div className="relative min-h-[calc(100vh-5rem)]">
                {/* Background Image of Signature Building */}
                <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: 'url("/hq.jpg")', opacity: 0.15 }}></div>
                
                <div className="relative z-10 max-w-7xl mx-auto space-y-8 p-8">
                
                {/* Page Title & Action */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">System Overview</h2>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2">Real-time IT infrastructure and support metrics.</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold uppercase tracking-wide rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] transform hover:-translate-y-0.5"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Raise Ticket
                    </button>
                  </div>

                {error && (
                  <div className="p-5 rounded-xl bg-red-950/50 flex items-start border border-red-500/20 shadow-sm">
                    <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 mr-4 flex-shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-red-400">Backend Connection Error</h3>
                      <p className="text-sm font-medium text-red-300/80 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Cyber Cards Grid */}
                {!loading && stats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard 
                      title="Total Tickets" 
                      count={stats.total} 
                      icon={<Ticket className="w-6 h-6" />} 
                      color="slate" 
                      destination="/tickets" 
                    />
                    <DashboardCard 
                      title="Active Issues" 
                      count={stats.active} 
                      icon={<AlertTriangle className="w-6 h-6" />} 
                      color="amber" 
                      destination="/tickets?status=active" 
                    />
                    <DashboardCard 
                      title="Resolved" 
                      count={stats.resolved} 
                      icon={<CheckCircle className="w-6 h-6" />} 
                      color="emerald" 
                      destination="/tickets?status=resolved" 
                    />
                    <DashboardCard 
                      title="Critical Priority" 
                      count={stats.priorities?.Critical || 0} 
                      icon={<Clock className="w-6 h-6" />} 
                      color="cyan" 
                      destination="/tickets?priority=critical" 
                    />
                  </div>
                ) : (
                  loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-36 animate-pulse"></div>
                      ))}
                    </div>
                  )
                )}

                {/* --- CHARTS SECTION --- */}
                {!loading && stats && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                    {/* Bar Chart: Categories */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                        <div className="w-2 h-6 bg-cyan-500 rounded-sm mr-3"></div>
                        Tickets by Category
                      </h3>
                      <div className="flex-1 flex items-end gap-4 h-56 pt-8 border-b border-l border-slate-200 dark:border-slate-800 pl-4 pb-2 relative">
                        {/* Y-axis grid lines (decorative) */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-2 pl-4">
                           <div className="w-full border-b border-slate-200 dark:border-slate-800/50"></div>
                           <div className="w-full border-b border-slate-200 dark:border-slate-800/50"></div>
                           <div className="w-full border-b border-slate-200 dark:border-slate-800/50"></div>
                           <div className="w-full border-b border-slate-200 dark:border-slate-800/50"></div>
                        </div>

                        {Object.entries(stats.categories || {}).map(([category, count]) => {
                          const maxCount = Math.max(...Object.values(stats.categories || { 'None': 1 }));
                          const heightPercent = maxCount === 0 ? 0 : (count / maxCount) * 100;
                          return (
                            <div key={category} className="flex-1 flex flex-col items-center group z-10 h-full justify-end">
                              <div className="w-full relative flex justify-center flex-1 items-end">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity pointer-events-none whitespace-nowrap z-20 border border-slate-300 dark:border-slate-700 shadow-xl">
                                  {count} Tickets
                                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-100 dark:bg-slate-800 border-b border-r border-slate-300 dark:border-slate-700 rotate-45"></div>
                                </div>
                                {/* Bar */}
                                <div 
                                  className="w-full max-w-[40px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm transition-all duration-700 ease-out group-hover:brightness-125 group-hover:from-cyan-500 group-hover:to-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                  style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                ></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 mt-3 truncate w-full text-center uppercase tracking-wider" title={category}>
                                {category.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                        {Object.keys(stats.categories || {}).length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium">No data available</div>
                        )}
                      </div>
                    </div>

                    {/* Donut Chart: Priorities */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col relative shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                        <div className="w-2 h-6 bg-purple-500 rounded-sm mr-3"></div>
                        Tickets by Priority
                      </h3>
                      
                      {(() => {
                        const priorities = stats.priorities || {};
                        const total = Object.values(priorities).reduce((a, b) => a + b, 0);
                        
                        if (total === 0) {
                           return <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium">No data available</div>;
                        }

                        // Colors for pie slices
                        const colors = {
                          'Low': '#3b82f6', // blue
                          'Medium': '#f59e0b', // amber
                          'High': '#ef4444', // red
                          'Critical': '#a855f7' // purple
                        };
                        
                        // Calculate conic-gradient stops
                        let currentAngle = 0;
                        const stops = Object.entries(priorities).map(([priority, count]) => {
                          const percentage = (count / total) * 100;
                          const start = currentAngle;
                          currentAngle += percentage;
                          const color = colors[priority] || '#94a3b8';
                          return `${color} ${start}% ${currentAngle}%`;
                        });

                        return (
                          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center w-full gap-8">
                            {/* Donut Chart */}
                            <div className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 duration-500 group"
                                 style={{ background: `conic-gradient(${stops.join(', ')})` }}>
                              {/* Inner Circle to make it a Donut */}
                              <div className="absolute w-32 h-32 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner group-hover:bg-slate-100 dark:bg-slate-800 transition-colors duration-300">
                                <span className="block text-4xl font-black text-slate-900 dark:text-slate-100 drop-shadow-md">{total}</span>
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total</span>
                              </div>
                            </div>
                            
                            {/* Legend */}
                            <div className="flex flex-col gap-3">
                              {Object.entries(priorities).map(([priority, count]) => {
                                const percentage = Math.round((count / total) * 100);
                                return (
                                  <div key={priority} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-2 pr-4 rounded-lg border border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800 transition-colors">
                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: colors[priority] || '#94a3b8' }}></div>
                                    <div>
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{priority}</p>
                                      <p className="text-[10px] font-medium text-slate-500 mt-1">{count} Tickets ({percentage}%)</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Engineer Performance (Admin Only) */}
                {userRole === 'admin' && engineerStats.length > 0 && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Engineer Workload Overview</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {engineerStats.map(stat => (
                        <div 
                          key={stat.name} 
                          onClick={() => navigate(`/tickets?search=${encodeURIComponent(stat.name)}`)}
                          className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:bg-white dark:bg-slate-900 hover:border-slate-300 dark:border-slate-700 cursor-pointer transition-all shadow-sm hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:scale-[1.02]"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center mr-4 border border-cyan-500/20">
                              <UserCircle className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{stat.name}</p>
                              <p className="text-xs font-medium text-slate-500 uppercase">COMPUTER OPERATOR GRADE B</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 uppercase tracking-wider inline-block">
                              {stat.open} Open
                            </span>
                            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 uppercase tracking-wider inline-block">
                              {stat.resolved} Resolved
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
            } />
            <Route path="/tickets" element={<TicketList tickets={tickets} userRole={userRole} userName={userName} loading={loading} fetchTickets={fetchData} />} />
            <Route path="/tickets/:id" element={<TicketDetails tickets={tickets} userRole={userRole} userName={userName} refreshData={fetchData} />} />
            <Route path="/kanban" element={<KanbanBoard tickets={tickets} refreshData={fetchData} userRole={userRole} userName={userName} />} />
            <Route path="/profile" element={<UserProfile userId={userId} userName={userName} userRole={userRole} tickets={tickets} />} />
          </Routes>
        </main>
      </div>

      {/* Cyber Dark Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-300 dark:border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Raise New Ticket</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Reporter Info Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Designation</label>
                  <select 
                    value={newTicket.designation}
                    onChange={(e) => setNewTicket({...newTicket, designation: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    <option>Inspector</option>
                    <option>Sub-Inspector</option>
                    <option>ASI</option>
                    <option>Head Constable</option>
                    <option>Constable</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Name</label>
                  <input 
                    type="text" 
                    required
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({...newTicket, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all"
                    placeholder="E.g., Rajesh Kumar"
                  />
                </div>
              </div>

              {/* Contact & Attachment Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Mobile No.</label>
                  <input 
                    type="tel" 
                    required
                    value={newTicket.mobile}
                    onChange={(e) => setNewTicket({...newTicket, mobile: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all"
                    placeholder="10-digit mobile number"
                  />
                </div>
                {/* File Attachment */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Attachment (Optional)</label>
                  <div className="relative h-[46px]">
                    <input 
                      type="file" 
                      id="file-upload"
                      onChange={(e) => setAttachmentFile(e.target.files[0])}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="w-full h-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 border-dashed text-slate-500 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center outline-none transition-all cursor-pointer px-4"
                    >
                      <Paperclip className="w-5 h-5 mr-2 text-cyan-500 flex-shrink-0" />
                      <span className="text-sm truncate">{attachmentFile ? attachmentFile.name : 'Upload file'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Title & IP Address Row */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Issue Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all"
                    placeholder="Summarize the problem..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">System IP Address</label>
                  <input 
                    type="text" 
                    value={newTicket.ipAddress}
                    onChange={(e) => setNewTicket({...newTicket, ipAddress: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all"
                    placeholder="E.g., 192.168.1.10 (Optional)"
                  />
                </div>
              </div>

              {/* District and Police Station Dropdowns */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">District</label>
                  <select 
                    value={newTicket.district}
                    onChange={(e) => {
                      const newDist = e.target.value;
                      setNewTicket({
                        ...newTicket, 
                        district: newDist,
                        policeStation: districtPoliceStations[newDist][0]
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    {Object.keys(districtPoliceStations).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Police Station</label>
                  <select 
                    value={newTicket.policeStation}
                    onChange={(e) => setNewTicket({...newTicket, policeStation: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    {districtPoliceStations[newTicket.district]?.map(station => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                  <select 
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Network</option>
                    <option>Surveillance</option>
                    <option>Offline</option>
                    <option>Online</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Priority</label>
                  <select 
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 outline-none transition-all cursor-pointer"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-1.5">Detailed Description</label>
                <textarea 
                  required
                  rows="3"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-3 resize-none outline-none transition-all"
                  placeholder="Provide all necessary details..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors mt-4"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 text-sm font-bold text-slate-950 bg-cyan-500 hover:bg-cyan-400 rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] transform hover:-translate-y-0.5 mt-4"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
