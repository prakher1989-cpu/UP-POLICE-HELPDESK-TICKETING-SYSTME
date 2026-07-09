import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardCard({ title, count, icon, color, destination, onClick }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (destination) {
      navigate(destination);
    }
  };

  const getBorderColor = () => {
    switch(color) {
      case 'amber': return 'border-t-amber-500';
      case 'emerald': return 'border-t-emerald-500';
      case 'cyan': return 'border-t-cyan-500';
      case 'slate': default: return 'border-t-slate-600';
    }
  };

  const getTextColor = () => {
    switch(color) {
      case 'amber': return 'text-amber-400';
      case 'emerald': return 'text-emerald-400';
      case 'cyan': return 'text-cyan-400';
      case 'slate': default: return 'text-slate-900 dark:text-slate-100';
    }
  };

  const getIconColor = () => {
    switch(color) {
      case 'amber': return 'text-amber-500';
      case 'emerald': return 'text-emerald-500';
      case 'cyan': return 'text-cyan-400';
      case 'slate': default: return 'text-slate-500';
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 border-t-4 ${getBorderColor()} flex flex-col justify-between cursor-pointer select-none overflow-hidden transition-all duration-200 ease-in-out hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(30,136,229,0.3)] hover:border-slate-300 dark:border-slate-700 active:scale-[0.98] group`}
    >
      {/* Optional Background Glow */}
      {color === 'cyan' && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-70"></div>
      )}
      
      {/* Ripple Effect Container */}
      <div className="absolute inset-0 bg-white/0 group-active:bg-white/5 transition-colors duration-200"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider group-hover:text-slate-700 dark:text-slate-300 transition-colors">{title}</p>
        <div className={`${getIconColor()} transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      <p className={`text-4xl font-black ${getTextColor()} relative z-10 drop-shadow-sm`}>
        {count}
      </p>
    </div>
  );
}
