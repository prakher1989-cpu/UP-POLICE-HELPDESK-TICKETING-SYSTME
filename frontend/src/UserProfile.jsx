import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Camera, Activity, CheckCircle, ShieldAlert } from 'lucide-react';

export default function UserProfile({ userId, userName, userRole, tickets }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [avatar, setAvatar] = useState(localStorage.getItem(`avatar_${userId}`) || null);
  const fileInputRef = useRef(null);

  // Calculate Stats
  const userTickets = tickets.filter(t => t.assignedTo === userName || t.resolvedBy === userName);
  const openTickets = userTickets.filter(t => t.status !== 'Resolved' && t.assignedTo === userName).length;
  const resolvedTickets = userTickets.filter(t => t.status === 'Resolved' && t.resolvedBy === userName).length;

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match!', type: 'error' });
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/users/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword, newPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: 'Password updated successfully!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ text: data.error || 'Failed to update password', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Server error. Please try again.', type: 'error' });
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatar(base64String);
        localStorage.setItem(`avatar_${userId}`, base64String);
        // Dispatch event so App.jsx can listen and update the top bar avatar
        window.dispatchEvent(new Event('avatarUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 font-['Poppins'] text-slate-900 dark:text-slate-200">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your personal settings and view performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 dark:from-cyan-500/10 dark:to-blue-500/10"></div>
            
            <div className="relative mb-6 mt-4">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-slate-400" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 p-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-full shadow-lg transition-transform hover:scale-110"
              >
                <Camera className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{userName}</h2>
            <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mt-1">{userRole}</p>
            <p className="text-xs text-slate-500 mt-4">User ID: {userId}</p>
          </div>

          {/* Stats & Security */}
          <div className="col-span-1 md:col-span-2 space-y-8">
            
            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-transform hover:-translate-y-1">
                <div className="p-4 bg-amber-100 dark:bg-amber-500/10 text-amber-500 rounded-xl">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Tickets</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{openTickets}</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 flex items-center space-x-4 transition-transform hover:-translate-y-1">
                <div className="p-4 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resolved</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white">{resolvedTickets}</p>
                </div>
              </div>
            </div>

            {/* Security Panel */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="border-b border-slate-200 dark:border-slate-800 p-6 flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50">
                <ShieldAlert className="w-6 h-6 text-cyan-500" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Security Settings</h2>
              </div>
              
              <div className="p-8">
                {message.text && (
                  <div className={`p-4 mb-6 rounded-xl text-sm font-bold border ${
                    message.type === 'error' 
                      ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20' 
                      : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/20'
                  }`}>
                    {message.text}
                  </div>
                )}
                
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input 
                        type="password" 
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="password" 
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input 
                          type="password" 
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button type="submit" className="px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transition-all hover:-translate-y-0.5 w-full md:w-auto">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
