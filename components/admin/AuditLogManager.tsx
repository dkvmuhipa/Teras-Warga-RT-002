import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Search, Filter, Clock, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  details: string;
}

interface AuditLogManagerProps {
  logs: AuditLog[];
}

export const AuditLogManager: React.FC<AuditLogManagerProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs
    .filter(log => 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-600" />
            Audit Log Sistem
          </h2>
          <p className="text-slate-500 text-sm font-medium">Rekam jejak aktivitas administratif untuk transparansi dan keamanan.</p>
        </div>

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
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
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
