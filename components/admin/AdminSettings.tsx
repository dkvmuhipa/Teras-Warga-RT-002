import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Database, Download, AlertTriangle, Trash, FileText, Save, Image as ImageIcon, ShieldCheck, Edit2 } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { PdfConfig, House, Announcement, CashFlow, Official, Report, LetterRequest, RondaSchedule, InventoryItem, UMKM, Poll, RondaCheckLog, MarketItem, AppNotification } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { seedDatabase, deepSanitize } from '../../services/databaseService';
import { toast } from 'sonner';

interface AdminSettingsProps {
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
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
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  pdfConfig, setPdfConfig, houses, announcements, cashFlow, officials, 
  reports, letters, ronda, inventory, umkm, polls, rondaLogs, marketItems, notifications 
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);

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
      const blob = new Blob([JSON.stringify(deepSanitize(data), null, 2)], { type: 'application/json' });
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
    if (window.confirm('PERINGATAN: Semua data akan dihapus dan diganti dengan data dummy. Lanjutkan?')) {
      const verification = window.prompt('Ketik "RESET" untuk mengonfirmasi reset database:');
      if (verification !== 'RESET') {
        if (verification !== null) toast.error('Verifikasi gagal.');
        return;
      }
      try {
        await seedDatabase();
        toast.success('Database berhasil di-reset!');
        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error('Gagal reset database.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: keyof PdfConfig) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalConfig(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = () => {
    setPdfConfig(localConfig);
    localStorage.setItem('pdf_config', JSON.stringify(deepSanitize(localConfig)));
    toast.success('Konfigurasi surat tersimpan!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
      <div className="space-y-8">
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
      </div>
      <div className="space-y-8">
        <Card title="Konfigurasi Surat (PDF)" icon={FileText} action={<Button onClick={handleSaveConfig} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"><Save size={16}/> Simpan</Button>}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700">Nama RT (Contoh: RT 02 / RW 03)</label>
                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.rtName} onChange={e => setLocalConfig({...localConfig, rtName: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700">Nama Ketua RT</label>
                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.rtChairman} onChange={e => setLocalConfig({...localConfig, rtChairman: e.target.value})} />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700">Alamat RT di Kop Surat</label>
              <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.rtAddress} onChange={e => setLocalConfig({...localConfig, rtAddress: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700">Kelurahan</label>
                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.kelurahan} onChange={e => setLocalConfig({...localConfig, kelurahan: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700">Kecamatan</label>
                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.kecamatan} onChange={e => setLocalConfig({...localConfig, kecamatan: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-slate-700">Kota</label>
                <input className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" value={localConfig.kota} onChange={e => setLocalConfig({...localConfig, kota: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 text-slate-700">Nomor Surat Terakhir (Counter)</label>
              <input 
                type="number"
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" 
                value={localConfig.lastLetterNumber} 
                onChange={e => setLocalConfig({...localConfig, lastLetterNumber: parseInt(e.target.value) || 0})} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Logo</label>
                <div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">
                  {localConfig.logo ? <img src={localConfig.logo} className="h-full w-full object-contain p-2" /> : <ImageIcon size={24} className="text-slate-300"/>}
                  <input type="file" onChange={e => handleFileChange(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Stempel</label>
                <div className="relative h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">
                  {localConfig.stamp ? <img src={localConfig.stamp} className="h-full w-full object-contain p-2" /> : <ShieldCheck size={24} className="text-slate-300"/>}
                  <input type="file" onChange={e => handleFileChange(e, 'stamp')} className="absolute inset-0 opacity-0 cursor-pointer"/>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tanda Tangan Ketua RT</label>
              <div className="relative h-24 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden cursor-pointer">
                {localConfig.signature ? <img src={localConfig.signature} className="h-full w-full object-contain p-2" /> : <Edit2 size={20} className="text-slate-300"/>}
                <input type="file" onChange={e => handleFileChange(e, 'signature')} className="absolute inset-0 opacity-0 cursor-pointer"/>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
