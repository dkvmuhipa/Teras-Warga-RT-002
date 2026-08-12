import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Database, Download, AlertTriangle, Trash, Wallet } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { House, Announcement, CashFlow, Official, Report, LetterRequest, RondaSchedule, InventoryItem, UMKM, Poll, RondaCheckLog, MarketItem, AppNotification } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { seedDatabase, deepSanitize, safeJsonStringify, handleFirestoreError, OperationType } from '../../services/databaseService';
import { toast } from 'sonner';
import { useConfirm, usePrompt } from '../../context/ConfirmContext';

interface AdminSettingsProps {
  houses: House[];
  announcements: Announcement[];
  cashFlow: CashFlow[];
  officials: Official[];
  reports: Report[];
  letters: LetterRequest[];
  ronda: RondaSchedule[];
  inventory: InventoryItem[];
  umkm: UMKM[];
  polls: Poll[];
  rondaLogs: RondaCheckLog[];
  marketItems: MarketItem[];
  notifications: AppNotification[];
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  houses, announcements, cashFlow, officials, 
  reports, letters, ronda, inventory, umkm, polls, rondaLogs, marketItems, notifications,
  settings, onUpdateSettings
}) => {
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'fees'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fee Settings State
  const [airFee, setAirFee] = React.useState(settings?.airFee || 10000);
  const [sampahFee, setSampahFee] = React.useState(settings?.sampahFee || 5000);

  React.useEffect(() => {
    if (settings) {
      setAirFee(settings.airFee);
      setSampahFee(settings.sampahFee);
    }
  }, [settings]);

  const handleUpdateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        ...settings,
        airFee: Number(airFee),
        sampahFee: Number(sampahFee)
      });
      toast.success('Tarif iuran berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal memperbarui tarif iuran.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Password tidak cocok!');
      return;
    }
    setIsChangingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password berhasil diubah!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengubah password. Login ulang mungkin diperlukan.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        houses, announcements, cashFlow, officials, reports, letters, 
        ronda, inventory, umkm, polls, rondaLogs, marketItems, notifications
      };
      const blob = new Blob([safeJsonStringify(data, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teras-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch (e) {
      console.error("Error exporting data:", e);
      toast.error('Gagal mengekspor data: ' + (e instanceof Error ? e.message : 'Circular structure detected'));
    }
  };

  const handleResetSystem = async () => {
    const isConfirmed = await confirm({
      title: 'Reset Database',
      message: 'PERINGATAN: Semua data akan dihapus secara permanen dan diganti dengan data dummy awal. Apakah Anda yakin ingin melanjutkan tindakan berisiko ini?',
      confirmLabel: 'Ya, Saya Yakin',
      isDanger: true
    });

    if (isConfirmed) {
      const verification = await prompt({
        title: 'Konfirmasi Keamanan',
        message: 'Ketik "RESET" untuk mengonfirmasi reset database secara permanen:',
        confirmLabel: 'Reset Sekarang',
        placeholder: 'Ketik RESET di sini',
        isDanger: true
      });

      if (verification !== 'RESET') {
        if (verification !== null) toast.error('Verifikasi gagal. Kata kunci tidak cocok.');
        return;
      }
      try {
        await seedDatabase();
        toast.success('Database berhasil di-reset!');
        window.location.reload();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, "seedDatabase");
        toast.error('Gagal reset database.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sistem & Keamanan</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pengaturan Admin</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5">Kelola akun admin, konfigurasi tarif iuran warga, dan cadangan database.</p>
        </div>

        {/* Tabs Header */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-[2rem] border border-slate-200/80 shrink-0 w-full md:w-auto">
          {[
            { id: 'profile', label: 'Profil Admin', icon: User },
            { id: 'fees', label: 'Tarif Iuran', icon: Wallet },
            { id: 'system', label: 'Sistem', icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'profile' && (
          <Card title="Profil Admin Utama" icon={User} className="relative overflow-hidden border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
            <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <div className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xl shadow-md">A</div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Admin Utama RT 02</h3>
                <p className="text-xs text-slate-500 font-semibold">{auth.currentUser?.email || 'admin@teras.id'}</p>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Ganti Password Akun</p>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type={showPassword ? "text" : "password"} className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder="Password Baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type={showPassword ? "text" : "password"} className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all" placeholder="Konfirmasi Password Baru" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6}/>
              </div>
              <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/20" disabled={!newPassword || isChangingPassword}>{isChangingPassword ? 'Memproses...' : 'Simpan Password Baru'}</Button>
            </form>
          </Card>
        )}

        {activeTab === 'fees' && (
          <Card title="Tarif Iuran Bulanan Warga" icon={Wallet} className="border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
            <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed">
              Nominal tarif iuran Air dan Sampah yang ditentukan di sini akan berlaku secara otomatis untuk penagihan bulanan seluruh warga.
            </p>
            <form onSubmit={handleUpdateFees} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black mb-2 text-slate-700 uppercase tracking-widest">Iuran Kebersihan & Sampah (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">Rp</span>
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      value={sampahFee}
                      onChange={(e) => setSampahFee(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black mb-2 text-slate-700 uppercase tracking-widest">Iuran Air Bersih (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">Rp</span>
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      value={airFee}
                      onChange={(e) => setAirFee(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/20">
                Simpan Tarif Iuran Bulanan
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'system' && (
          <Card title="Manajemen & Pemeliharaan Database" icon={Database} className="border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
            <div className="space-y-4">
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Cadangkan Data (JSON)</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Unduh seluruh arsip data RT 02 ke file JSON lokal.</p>
                </div>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl" onClick={handleExportData}><Download size={14}/> Ekspor</Button>
              </div>

              <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={20}/></div>
                  <div>
                    <h4 className="font-extrabold text-sm text-rose-900">Reset Database (Awal)</h4>
                    <p className="text-xs text-rose-700 font-medium leading-relaxed mt-0.5">Tindakan ini akan menghapus data dan mengembalikannya ke data sampel awal.</p>
                  </div>
                </div>
                <Button onClick={handleResetSystem} className="w-full py-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white font-black text-xs rounded-xl shadow-sm transition-all"><Trash size={16}/> Reset Database Ke Awal</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
