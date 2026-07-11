import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Ticket as TicketIcon, Clock, AlertTriangle, CheckCircle, MonitorSmartphone, MapPin, User, Hash, Printer, Paperclip, Badge, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function TicketDetails({ tickets, userRole, refreshData, userName }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Find the ticket based on the ID parameter
  const ticket = tickets.find(t => t.id === id);

  const [assignedTo, setAssignedTo] = useState(ticket?.assignedTo || "");
  const [resolvedBy, setResolvedBy] = useState(ticket?.resolvedBy || "");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch('https://up-police-helpdesk-ticketing-system.onrender.com/api/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error("Failed to fetch users", err));
      
    if (id) {
      fetch(`https://up-police-helpdesk-ticketing-system.onrender.com/api/tickets/${id}/history`)
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error("Failed to fetch history", err));
    }
  }, [id]);

  if (!ticket) {
    return (
      <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
        <AlertTriangle className="w-16 h-16 mb-4 text-slate-700" />
        <h2 className="text-2xl font-black text-slate-700 dark:text-slate-300">Ticket Not Found</h2>
        <p className="mt-2">The ticket ID "{id}" does not exist or has been deleted.</p>
        <Link to="/" className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg transition-colors">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to permanently delete this ticket?")) {
      try {
        await fetch(`https://up-police-helpdesk-ticketing-system.onrender.com/api/tickets/${id}`, { method: 'DELETE' });
        refreshData();
        navigate('/');
      } catch (err) {
        console.error(err);
        refreshData();
        navigate('/');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const newStatus = resolvedBy ? "Resolved" : ticket.status;
      await fetch(`https://up-police-helpdesk-ticketing-system.onrender.com/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo, resolvedBy, status: newStatus, updatedBy: userName })
      });
      refreshData();
      navigate('/');
    } catch (err) {
      console.error(err);
      refreshData();
      navigate('/');
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('ticket-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Ticket_${ticket.id}.pdf`);
    } catch (error) {
      console.error("Could not generate PDF", error);
      alert("Failed to generate PDF. Please try again.");
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
      case 'Open': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'In Progress': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'Resolved': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      <div id="ticket-content" className="max-w-5xl mx-auto space-y-8 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
        
        {/* Print-Only Header (Hidden on screen, visible only when printing) */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-black uppercase tracking-wider">Uttar Pradesh Police IT Helpdesk</h1>
          <p className="text-lg font-bold">Official Ticket Record</p>
          <p className="text-sm mt-2">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {/* Header & Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-6 no-print">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 rounded-xl transition-all">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Ticket Details</h1>
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 mt-1 flex items-center">
                <Hash className="w-4 h-4 mr-1 inline" /> {ticket.id}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3 no-print">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg transition-all flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button 
              onClick={downloadPDF}
              className="px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-500 hover:text-white border border-indigo-500/20 font-bold rounded-lg transition-all flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Save PDF
            </button>
            {userRole === 'admin' && (
              <button 
                onClick={handleDelete}
                className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-slate-950 border border-red-500/20 font-bold rounded-lg transition-all uppercase tracking-wider"
              >
                Delete
              </button>
            )}
            <button 
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all uppercase tracking-wider"
            >
              Submit
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">{ticket.title}</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
              
              {ticket.attachmentUrl && (
                <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Attachments</h3>
                  <a 
                    href={ticket.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mr-4 group-hover:bg-cyan-500/20 transition-colors">
                      <Paperclip className="w-5 h-5 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">View Attachment</p>
                      <p className="text-xs text-slate-500">Click to open in new tab</p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Resolution/Updates Section (History Timeline) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-cyan-400" /> Activity Log
              </h3>
              <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-6 space-y-6">
                {history.map((log, idx) => (
                  <div key={log.id || idx} className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    <p className="text-sm text-cyan-400 font-bold mb-1">{log.action}</p>
                    <p className="text-slate-700 dark:text-slate-300">Action performed by <span className="font-semibold">{log.updated_by}</span>.</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                ))}
                
                {history.length === 0 && (
                  <div className="relative">
                    <div className="absolute -left-[31px] w-4 h-4 rounded-full bg-cyan-500 border-4 border-slate-900 shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                    <p className="text-sm text-cyan-400 font-bold mb-1">Ticket Created</p>
                    <p className="text-slate-700 dark:text-slate-300">Issue logged into the system by {ticket.name || 'Unknown User'}.</p>
                    <p className="text-xs text-slate-500 mt-2">{new Date(ticket.timestamp || ticket.created_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Meta Column */}
          <div className="space-y-6">
            
            {/* Meta Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Metadata</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><TicketIcon className="w-3.5 h-3.5 mr-1.5"/> Category</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg inline-block">
                    {ticket.category}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><AlertTriangle className="w-3.5 h-3.5 mr-1.5"/> Priority</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5"/> Location</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{ticket.policeStation}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{ticket.district} District</p>
                </div>
              </div>
            </div>

            {/* Assignment Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Assignment Info</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Assign To</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    disabled={userRole !== 'admin'}
                  >
                    <option value="">-- Select Engineer --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Resolved By</label>
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-xl focus:bg-white dark:bg-slate-900 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 outline-none transition-all cursor-pointer"
                    value={resolvedBy}
                    onChange={(e) => setResolvedBy(e.target.value)}
                  >
                    <option value="">-- Select Engineer --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reporter Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Reporter Info</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><Badge className="w-3.5 h-3.5 mr-1.5"/> Designation</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{ticket.designation || 'Unspecified'}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><User className="w-3.5 h-3.5 mr-1.5"/> Name</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{ticket.name || 'Not Provided'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500 mb-1">Mobile No.</p>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{ticket.mobile || 'Not Provided'}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1 flex items-center"><MonitorSmartphone className="w-3.5 h-3.5 mr-1.5"/> IP Address</p>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">{ticket.ipAddress || 'Not Captured'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
