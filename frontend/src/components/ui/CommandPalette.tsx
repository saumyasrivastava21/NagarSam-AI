import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/useUIStore';
import { mockStore } from '../../services/mock/mockStore';
import { Search, MapPin, FileText, AlertTriangle, Wrench, ArrowRight, X } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const db = mockStore.getDB();
  const q = query.toLowerCase().trim();

  // Search reports
  const matchingReports = q
    ? db.reports
        .filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.description.toLowerCase().includes(q) ||
            r.address.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  // Search incidents
  const matchingIncidents = q
    ? db.incidents
        .filter(
          (i) =>
            i.id.toLowerCase().includes(q) ||
            i.title.toLowerCase().includes(q) ||
            i.address.toLowerCase().includes(q)
        )
        .slice(0, 4)
    : [];

  // Search work orders
  const matchingWorkOrders = q
    ? db.workOrders
        .filter(
          (w) =>
            w.id.toLowerCase().includes(q) ||
            w.title.toLowerCase().includes(q) ||
            w.locationAddress.toLowerCase().includes(q)
        )
        .slice(0, 3)
    : [];

  // Quick navigation pages
  const quickPages = [
    { title: 'Public Civic Map', path: '/map', icon: <MapPin className="w-4 h-4 text-secondary-600" /> },
    { title: 'Report a Pothole (Citizen)', path: '/citizen/report', icon: <FileText className="w-4 h-4 text-primary-600" /> },
    { title: 'Officer Incident Queue', path: '/officer/incidents', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> },
    { title: 'Field Worker Jobs', path: '/worker/jobs', icon: <Wrench className="w-4 h-4 text-emerald-600" /> },
    { title: 'Public Announcements', path: '/announcements', icon: <FileText className="w-4 h-4 text-slate-600" /> },
  ];

  const handleSelect = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
    setQuery('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => setCommandPaletteOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search report ID (e.g. NS-2026-001001), incident, location or page..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Pages */}
          {!query && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Navigation
              </div>
              {quickPages.map((page) => (
                <button
                  key={page.path}
                  onClick={() => handleSelect(page.path)}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-slate-50 text-slate-700 text-sm font-medium transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-slate-100">{page.icon}</div>
                    <span>{page.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Reports Results */}
          {matchingReports.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Citizen Reports
              </div>
              {matchingReports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(`/citizen/reports/${r.id}`)}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-primary-50/60 text-slate-800 text-sm transition text-left border border-transparent hover:border-primary-200"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-primary-700 flex items-center gap-2">
                      <span>{r.id}</span>
                      <span className="text-xs px-2 py-0.2 bg-slate-100 text-slate-700 rounded-full font-medium">
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{r.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Incidents Results */}
          {matchingIncidents.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Operations Incidents
              </div>
              {matchingIncidents.map((i) => (
                <button
                  key={i.id}
                  onClick={() => handleSelect(`/officer/incidents/${i.id}`)}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-amber-50/60 text-slate-800 text-sm transition text-left border border-transparent hover:border-amber-200"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{i.id}</span>
                      <span className="text-xs px-2 py-0.2 bg-amber-100 text-amber-800 rounded-full font-medium">
                        {i.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{i.title}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {/* Work Orders Results */}
          {matchingWorkOrders.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Work Orders
              </div>
              {matchingWorkOrders.map((w) => (
                <button
                  key={w.id}
                  onClick={() => handleSelect(`/worker/jobs/${w.id}`)}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-emerald-50/60 text-slate-800 text-sm transition text-left border border-transparent hover:border-emerald-200"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{w.id}</span>
                      <span className="text-xs px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                        {w.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{w.title}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}

          {query && matchingReports.length === 0 && matchingIncidents.length === 0 && matchingWorkOrders.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching civic records found for <strong className="text-slate-800">"{query}"</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
