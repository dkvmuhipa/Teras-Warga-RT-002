import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Activity, Search, Filter, Clock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { getPaginatedAuditLogs } from '../../services/databaseService';

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  details: string;
}

interface AuditLogManagerProps {
  logs: AuditLog[]; // Fallback or unused
}

export const AuditLogManager: React.FC<AuditLogManagerProps> = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLogs = async (isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const res = await getPaginatedAuditLogs(15, isLoadMore ? lastDoc : null);
      if (isLoadMore) {
        setLogs(prev => [...prev, ...(res.logs as AuditLog[])]);
      } else {
        setLogs(res.logs as AuditLog[]);
      }
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (error) {
      console.error("Gagal memuat log audit:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => 
        log.action.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        log.adminEmail.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, debouncedSearchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-600" />
            Audit Log Sistem
          </h2>
          <p className="text-slate-500 text-sm font-medium">Rekam jejak aktivitas administratif untuk transparansi dan keamanan (Paginated).</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => fetchLogs(false)} 
            disabled={isLoading}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors disabled:opacity-50"
            title="Refresh"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
          </button>
          
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari aktivitas atau admin..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading && logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="text-indigo-600 animate-spin" size={32} />
                      <p className="text-sm font-bold text-slate-400">Memuat log aktivitas...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    key={log.id} 
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Clock size={14} className="text-slate-300" />
                        {new Date(log.timestamp).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{log.adminEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`
                        px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                        ${log.action.includes('Hapus') ? 'bg-rose-50 text-rose-600' : 
                          log.action.includes('Tambah') ? 'bg-emerald-50 text-emerald-600' : 
                          'bg-indigo-50 text-indigo-600'}
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                        <ArrowRight size={12} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                        {log.details}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <Activity size={32} />
                      </div>
                      <p className="text-sm font-bold text-slate-400">Tidak ada log aktivitas yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {hasMore && (
          <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
            <button
              onClick={() => fetchLogs(true)}
              disabled={isLoadingMore}
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  Muat Lebih Banyak
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
        <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Keamanan Data</h4>
          <p className="text-xs font-medium text-indigo-700/70 mt-1 leading-relaxed">
            Sistem audit log ini mencatat setiap perubahan data sensitif. Log tidak dapat diubah atau dihapus oleh administrator untuk menjamin integritas data dan akuntabilitas pengurus RT.
          </p>
        </div>
      </div>
    </div>
  );
};
