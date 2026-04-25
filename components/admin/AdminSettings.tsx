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
    <div className="space-y-8 animate-fade-in">
      {/* Tabs Header */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
        {[
          { id: 'profile', label: 'Profil Admin', icon: User },
          { id: 'fees', label: 'Tarif Iuran', icon: Wallet },
          { id: 'system', label: 'Sistem', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:bg-white/50'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'profile' && (
          <Card title="Profil Admin" icon={User} className="relative overflow-hidden">
            <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">A</div>
              <div>
                <h3 className="font-bold text-slate-800">Admin Utama</h3>
                <p className="text-xs text-slate-500 font-medium">{auth.currentUser?.email || 'admin@teras.id'}</p>
              </div>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ganti Password</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Password Baru" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type={showPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-800 outline-none" placeholder="Konfirmasi Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6}/>
              </div>
              <Button type="submit" className="w-full" disabled={!newPassword || isChangingPassword}>{isChangingPassword ? 'Memproses...' : 'Simpan Password Baru'}</Button>
            </form>
          </Card>
        )}

        {activeTab === 'fees' && (
          <Card title="Tarif Iuran Bulanan" icon={Wallet}>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Atur nominal iuran Air dan Sampah yang akan berlaku untuk seluruh warga. 
              Perubahan ini akan langsung terlihat di halaman publik.
            </p>
            <form onSubmit={handleUpdateFees} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Iuran Air (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      value={airFee}
                      onChange={(e) => setAirFee(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Iuran Sampah (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                    <input 
                      type="number"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      value={sampahFee}
                      onChange={(e) => setSampahFee(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full py-4 shadow-lg shadow-indigo-100">
                Simpan Tarif Iuran
              </Button>
            </form>
          </Card>
        )}

        {activeTab === 'system' && (
          <Card title="Manajemen Sistem" icon={Database} className="border-rose-100">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div><h4 className="font-bold text-sm text-slate-700">Backup Data</h4><p className="text-xs text-slate-400">Unduh semua data dalam format JSON.</p></div>
                <Button size="sm" variant="secondary" onClick={handleExportData}><Download size={14}/> Export</Button>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><AlertTriangle size={20}/></div>
                  <div><h4 className="font-bold text-sm text-rose-700">Reset Database (Seed)</h4><p className="text-xs text-rose-600 leading-relaxed">Hapus semua data real dan mengembalikannya ke dummy.</p></div>
                </div>
                <Button onClick={handleResetSystem} className="w-full bg-white text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white shadow-sm transition-all"><Trash size={16}/> Reset ke Pengaturan Awal</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
