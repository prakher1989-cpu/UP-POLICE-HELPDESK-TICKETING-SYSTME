import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, AlertTriangle, CheckCircle, GripVertical } from 'lucide-react';

export default function KanbanBoard({ tickets, refreshData, userRole, userName }) {
  const navigate = useNavigate();
  const [draggedTicket, setDraggedTicket] = useState(null);

  const columns = [
    { id: 'Open', title: 'Open', icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    { id: 'In Progress', title: 'In Progress', icon: <Clock className="w-5 h-5 text-cyan-500" /> },
    { id: 'Resolved', title: 'Resolved', icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> }
  ];

  const handleDragStart = (e, ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
    // Slightly delay adding dragging class so the ghost image doesn't look weird
    setTimeout(() => {
      e.target.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggedTicket(null);
    e.target.classList.remove('opacity-50');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    if (!draggedTicket || draggedTicket.status === status) return;

    try {
      await fetch(`http://localhost:5000/api/tickets/${draggedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedBy: userName })
      });
      refreshData();
    } catch (err) {
      console.error('Failed to update ticket status', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-500 bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
      case 'High': return 'text-orange-500 bg-orange-100 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20';
      case 'Low': return 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 font-['Poppins'] text-slate-900 dark:text-slate-200 overflow-x-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Kanban Board</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Drag and drop tickets to update their status instantly.</p>
      </div>

      <div className="flex space-x-6 min-w-max pb-4">
        {columns.map(column => {
          const columnTickets = tickets.filter(t => t.status === column.id);
          
          return (
            <div 
              key={column.id}
              className="w-96 flex flex-col bg-slate-200/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-300 dark:border-slate-800"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center space-x-2">
                  {column.icon}
                  <h2 className="font-bold text-lg">{column.title}</h2>
                </div>
                <span className="bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 shadow-sm">
                  {columnTickets.length}
                </span>
              </div>

              {/* Tickets Area */}
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1 min-h-[200px]">
                {columnTickets.map(ticket => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer transition-all hover:ring-2 hover:ring-cyan-500/50 group relative"
                  >
                    <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-50 transition-opacity cursor-grab">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                    </div>
                    
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{ticket.id}</span>
                      <span className={`text-[10px] px-2 py-1 rounded font-bold border ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 pr-6 line-clamp-2">
                      {ticket.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-[10px] font-bold border border-cyan-200 dark:border-cyan-800">
                          {ticket.assignedTo ? ticket.assignedTo.charAt(0) : '?'}
                        </div>
                        <span className="text-xs text-slate-500 ml-2 truncate max-w-[120px]">
                          {ticket.assignedTo || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {columnTickets.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 text-sm font-medium">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
