import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  Download, RefreshCw, AlertTriangle, FileText, 
  CheckCircle, Clock, Server, MapPin
} from 'lucide-react';

export default function TicketList({ userRole, userName, tickets, loading, fetchTickets }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL Params for initial state
  const urlStatus = searchParams.get('status') || 'all';
  const urlPriority = searchParams.get('priority') || 'all';
  const urlSearch = searchParams.get('search') || '';

  // Filters State
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [priorityFilter, setPriorityFilter] = useState(urlPriority);
  const [districtFilter, setDistrictFilter] = useState('all');
  const [stationFilter, setStationFilter] = useState('all');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync state with URL changes (e.g. back button or clicking dashboard cards)
  useEffect(() => {
    setStatusFilter(searchParams.get('status') || 'all');
    setPriorityFilter(searchParams.get('priority') || 'all');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Update URL when filters change
  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  // Extract unique districts and stations for dropdowns
  const districts = useMemo(() => {
    return [...new Set(tickets.map(t => t.district).filter(Boolean))];
  }, [tickets]);

  const stations = useMemo(() => {
    if (districtFilter !== 'all') {
      return [...new Set(tickets.filter(t => t.district === districtFilter).map(t => t.policeStation).filter(Boolean))];
    }
    return [...new Set(tickets.map(t => t.policeStation).filter(Boolean))];
  }, [tickets, districtFilter]);

  const filteredTickets = useMemo(() => {
    let result = tickets;

    // 1. Text Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q)) ||
        (t.resolvedBy && t.resolvedBy.toLowerCase().includes(q))
      );
    }

    // 2. Status Filter
    if (statusFilter === 'active') {
      result = result.filter(t => t.status !== 'Resolved');
    } else if (statusFilter !== 'all') {
      // 'resolved' or specific statuses
      result = result.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // 3. Priority Filter
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority.toLowerCase() === priorityFilter.toLowerCase());
    }

    // 4. District & Station
    if (districtFilter !== 'all') {
      result = result.filter(t => t.district === districtFilter);
    }
    if (stationFilter !== 'all') {
      result = result.filter(t => t.policeStation === stationFilter);
    }

    // Sort: Newest first, or if critical, maybe put critical at top? 
    // The requirement says "Sort by newest first" for Critical Priority
    // Assuming t.createdAt is available, or we just reverse the array for now since mock IDs are sequential
    return result.reverse();
  }, [tickets, searchQuery, statusFilter, priorityFilter, districtFilter, stationFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const currentTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportToCSV = () => {
    const headers = ["Ticket ID", "Title", "Status", "Priority", "Category", "District", "Police Station", "Assigned To", "Resolved By"];
    
    const rows = filteredTickets.map(t => [
      t.id, 
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.category,
      t.district || 'N/A',
      t.policeStation || 'N/A',
      t.assignedTo || 'Unassigned',
      t.resolvedBy || 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `up_police_tickets_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'High': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
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

  const isCriticalFilter = priorityFilter === 'critical';
  const isResolvedFilter = statusFilter === 'resolved';

  return (
    <div className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
              <Server className="w-8 h-8 mr-3 text-cyan-500" />
              Ticket Repository
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage, filter, and export all helpdesk records.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white rounded-lg text-sm font-bold transition-all border border-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center px-4 py-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg text-sm font-bold transition-all border border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hidden sm:flex"
            >
              <FileText className="w-4 h-4 mr-2" />
              Save PDF
            </button>
            <button 
              onClick={fetchTickets}
              className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-cyan-500/20"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Banners */}
        {isCriticalFilter && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="w-6 h-6 text-red-500 mr-3 animate-pulse" />
            <span className="text-red-400 font-bold uppercase tracking-wide">Critical Tickets Require Immediate Attention</span>
          </div>
        )}

        {statusFilter === 'active' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center">
            <Clock className="w-6 h-6 text-amber-500 mr-3" />
            <span className="text-amber-400 font-bold">Showing {filteredTickets.length} Active Issues requiring resolution.</span>
          </div>
        )}

        {/* Filters Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Title, or Engineer..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none"
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <select 
              value={statusFilter} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 min-w-[130px]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Issues</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <select 
              value={priorityFilter} 
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 min-w-[130px]"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select 
              value={districtFilter} 
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 min-w-[130px]"
            >
              <option value="all">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              value={stationFilter} 
              onChange={(e) => handleFilterChange('station', e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 py-2.5 px-3 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 min-w-[130px]"
            >
              <option value="all">All Stations</option>
              {stations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Ticket No.</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Issue Context</th>
                  {isResolvedFilter ? (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Resolution Date/Time</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Resolved By</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Remarks</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Location</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Priority</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase bg-white dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">Assigned To</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-16"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-48 mb-2"></div><div className="h-3 bg-slate-100 dark:bg-slate-800/50 rounded w-32"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-6 bg-slate-100 dark:bg-slate-800 rounded w-20"></div></td>
                      <td className="px-6 py-5"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-24"></div></td>
                    </tr>
                  ))
                ) : currentTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center opacity-60">
                        <FileText className="w-16 h-16 text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No Records Found</h3>
                        <p className="text-slate-500 mt-2">Adjust your filters or try a different search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentTickets.map(ticket => {
                    const isCritical = ticket.priority === 'Critical';
                    const isActive = ticket.status !== 'Resolved';
                    
                    // Row styling logic
                    let rowClass = "hover:bg-slate-100 dark:bg-slate-800/60 transition-colors group relative ";
                    if (isCriticalFilter && isCritical) rowClass += "bg-red-950/20 ";
                    if (statusFilter === 'active' && isActive) rowClass += "border-l-4 border-l-amber-500 ";

                    return (
                      <tr key={ticket.id} className={rowClass}>
                        <td className="px-6 py-5">
                          <Link to={`/tickets/${ticket.id}`} className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                            {ticket.id}
                          </Link>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[250px]">{ticket.title}</p>
                          <p className="text-xs font-medium text-slate-500 truncate max-w-[250px] mt-1">{ticket.category}</p>
                        </td>

                        {isResolvedFilter ? (
                          <>
                            <td className="px-6 py-5">
                              <p className="text-emerald-400 font-bold text-sm">
                                {new Date(ticket.timestamp || ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <p className="text-slate-500 text-xs mt-1">
                                {new Date(ticket.timestamp || ticket.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {ticket.resolvedBy || 'Unknown Engineer'}
                            </td>
                            <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400 italic max-w-[200px] truncate">
                              {ticket.resolutionRemarks || 'Issue rectified and system stable.'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-5">
                              <p className="text-slate-700 dark:text-slate-300 text-sm font-bold flex items-center">
                                <MapPin className="w-3 h-3 mr-1 text-slate-500" />
                                {ticket.district || 'Unspecified'}
                              </p>
                              <p className="text-slate-500 text-xs mt-1">{ticket.policeStation || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="px-6 py-5">
                              <span className={`px-3 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">
                              {ticket.assignedTo ? (
                                <span className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-300 dark:border-slate-700">{ticket.assignedTo}</span>
                              ) : (
                                <span className="opacity-50">Unassigned</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length} records
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
