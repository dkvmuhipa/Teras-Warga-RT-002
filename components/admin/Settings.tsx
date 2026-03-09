import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Download, Trash2, Shield, User, Key, Mail, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { PdfConfig } from '../../types';
import { motion } from 'motion/react';
import { updateAdminPassword, seedDatabase } from '../../services/databaseService';
import { generateHouses, MOCK_ANNOUNCEMENTS, MOCK_UMKM, MOCK_RONDA, MOCK_CASHFLOW, INITIAL_OFFICIALS, MOCK_INVENTORY, INITIAL_REPORTS, MOCK_POLLS, MOCK_RONDA_LOGS } from '../../constants';

interface SettingsProps {
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ pdfConfig, setPdfConfig }) => {
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("Password konfirmasi tidak cocok!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }
    
    setIsChangingPassword(true);
    try {
      await updateAdminPassword(newPassword);
      alert("Password berhasil diubah! Silakan login ulang dengan password baru.");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah password. Pastikan Anda baru saja login (re-authentication needed).");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetSystem = async () => {
    if (window.confirm("PERINGATAN: Tindakan ini akan MENGHAPUS SEMUA DATA REAL dan me-reset sistem ke data dummy awal. Apakah Anda yakin?")) {
        const confirmation = prompt("Ketik 'RESET' untuk konfirmasi penghapusan data:");
        if (confirmation === 'RESET') {
            try {
                const initialData = { 
                    houses: generateHouses(), 
                    announcements: MOCK_ANNOUNCEMENTS, 
                    cashFlow: MOCK_CASHFLOW, 
                    officials: INITIAL_OFFICIALS, 
                    reports: INITIAL_REPORTS, 
                    ronda: MOCK_RONDA, 
                    inventory: MOCK_INVENTORY, 
                    umkm: MOCK_UMKM, 
                    polls: MOCK_POLLS, 
                    rondaLogs: MOCK_RONDA_LOGS 
                };
                await seedDatabase(initialData);
                alert("Reset sistem berhasil. Halaman akan dimuat ulang."); 
                window.location.reload();
            } catch (e) { 
                console.error(e);
                alert("Gagal melakukan reset sistem."); 
            }
        }
    }
  };

  const handleExportData = () => {
    try {
      const data = {
          pdfConfig: localConfig,
          exportedAt: new Date().toISOString(),
          note: "Full database export requires fetching all collections."
      };
      
      const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", jsonString);
      downloadAnchorNode.setAttribute("download", `backup_config_rt002_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error("Error exporting data:", e);
      alert('Gagal mengekspor data: ' + (e instanceof Error ? e.message : 'Circular structure detected'));
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan Sistem</h2>
          <p className="text-slate-500 font-medium mt-1">Konfigurasi aplikasi, keamanan, dan profil administrator.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin Profile */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <User size={20} />
              </div>
              Profil Administrator
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center gap-5 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] group/profile hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl group-hover/profile:scale-110 transition-transform">
                  A
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-800">Admin Utama RT 002</h4>
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mt-1">
                    <Mail size={12} />
                    admin@teras.id
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Keamanan Akun</p>
                <div className="relative group/input">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Password Baru" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="relative group/input">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    placeholder="Konfirmasi Password" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-70"
                >
                  {isChangingPassword ? 'Memproses...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Management */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
              <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl">
                <Database size={20} />
              </div>
              Manajemen Data
            </h3>
            
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center group/item hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover/item:scale-110 transition-transform">
                    <Download size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">Backup Konfigurasi</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Unduh Config JSON</p>
                  </div>
                </div>
                <button 
                    onClick={handleExportData}
                    className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                >
                  Export
                </button>
              </div>

              <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-rose-900">Reset Database</h4>
                      <p className="text-xs font-medium text-rose-600/80 leading-relaxed mt-1">
                        Tindakan ini akan menghapus semua data real dan mengembalikan aplikasi ke kondisi data dummy awal.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleResetSystem}
                    className="w-full py-4 bg-white text-rose-600 border border-rose-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    <RefreshCw size={14} className="inline mr-2" /> Reset ke Pengaturan Awal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
