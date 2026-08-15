import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Database, Download, Upload, AlertTriangle, Trash, Wallet, ShieldCheck, CheckCircle2, MessageSquare, Radio, RefreshCw, Key, ShieldAlert } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'gateway' | 'system'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fee Settings State
  const [airFee, setAirFee] = React.useState(settings?.airFee || 10000);
  const [sampahFee, setSampahFee] = React.useState(settings?.sampahFee || 5000);

  // Gateway Settings State
  const [waGatewayUrl, setWaGatewayUrl] = React.useState(settings?.waGatewayUrl || 'https://api.whatsapp-gateway.local');
  const [waApiKey, setWaApiKey] = React.useState(settings?.waApiKey || 'TERAS-WA-KEY-RT02-998');
  const [waSessionStatus, setWaSessionStatus] = React.useState<'CONNECTED' | 'DISCONNECTED'>('CONNECTED');

  React.useEffect(() => {
    if (settings) {
      setAirFee(settings.airFee);
      setSampahFee(settings.sampahFee);
      if (settings.waGatewayUrl) setWaGatewayUrl(settings.waGatewayUrl);
      if (settings.waApiKey) setWaApiKey(settings.waApiKey);
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

  const handleUpdateGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onUpdateSettings({
        ...settings,
        waGatewayUrl,
        waApiKey
      });
      toast.success('Konfigurasi WA Gateway & API berhasil disimpan!');
    } catch (error) {
      toast.error('Gagal menyimpan konfigurasi gateway.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok!');
      return;
    }
    setIsChangingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        toast.success('Password admin berhasil diubah!');
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
      toast.success('Cadangan data database JSON berhasil diunduh!');
    } catch (e) {
      console.error("Error exporting data:", e);
      toast.error('Gagal mengekspor data: ' + (e instanceof Error ? e.message : 'Circular structure detected'));
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonText = event.target?.result as string;
        const parsed = JSON.parse(jsonText);
        if (parsed) {
          toast.success('File cadangan JSON berhasil dibaca & diverifikasi!');
        }
      } catch (err) {
        toast.error('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
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

  // Password Strength Calculator
  const getPasswordStrength = () => {
    if (!newPassword) return null;
    if (newPassword.length < 6) return { label: 'Lemah', color: 'bg-rose-500 text-rose-600', width: 'w-1/3' };
    if (newPassword.length < 10) return { label: 'Sedang', color: 'bg-amber-500 text-amber-600', width: 'w-2/3' };
    return { label: 'Kuat & Aman ✓', color: 'bg-emerald-500 text-emerald-600', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Sistem & Keamanan</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pengaturan Admin Digital</h2>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-0.5">Kelola akun administrator, integrasi WA Gateway, tarif iuran bulanan warga, dan cadangan database.</p>
        </div>

        {/* Tabs Header */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-[2rem] border border-slate-200/80 shrink-0 w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'profile', label: 'Profil Admin', icon: User },
            { id: 'fees', label: 'Tarif Iuran', icon: Wallet },
            { id: 'gateway', label: 'WA Gateway API', icon: MessageSquare },
            { id: 'system', label: 'Sistem & Backup', icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-xs border border-indigo-100 font-black' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <tab.icon size={15} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid (Balanced 2-Column Layout) */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Left Side */}
          <div className="lg:col-span-7">
            <Card title="Profil Admin Utama" icon={User} className="border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-md">
                  A
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Administrator Utama RT 02</h3>
                  <p className="text-xs text-slate-500 font-semibold">{auth.currentUser?.email || 'admin@teras.id'}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    <ShieldCheck size={10} /> Status: Verified Super Admin
                  </span>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Pembaruan Password Akun</p>

                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      placeholder="Masukkan minimal 6 karakter..." 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                {passwordStrength && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase">
                      <span className="text-slate-400">Kekuatan Password:</span>
                      <span className={passwordStrength.color.split(' ')[1]}>{passwordStrength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.color.split(' ')[0]} transition-all duration-300 ${passwordStrength.width}`} />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all" 
                      placeholder="Ketik ulang password baru..." 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 transition-all mt-2" 
                  disabled={!newPassword || isChangingPassword}
                >
                  {isChangingPassword ? 'Memproses Keamanan...' : 'Simpan Password Baru'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Side Security Dashboard Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-100">Hak Akses & Lisensi</h4>
                    <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mt-0.5">ADMIN PRIVILEGE CONTROL</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Verifikasi Surat Warga</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> FULL ACCESS</span>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Pencatatan Keuangan Kas RT</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> FULL ACCESS</span>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Manajemen Presensi Siskamling</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> FULL ACCESS</span>
                </div>

                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Siaran WhatsApp Direct</span>
                  <span className="font-black text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> FULL ACCESS</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-800/50 text-[10.5px] text-indigo-200 leading-relaxed font-medium">
                🔒 Sesi administrator terlindungi enkripsi SSL/TLS 256-bit dengan proteksi ganda Firestore Security Rules.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fees' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
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
                <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20">
                  Simpan Tarif Iuran Bulanan
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-indigo-900 rounded-[2.5rem] p-6 text-white border border-indigo-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-indigo-800 pb-3">
                <Wallet className="text-indigo-400" size={24} />
                <div>
                  <h4 className="font-black text-base">Kalkulasi Otomatis Penagihan</h4>
                  <p className="text-[10px] font-mono text-indigo-300 uppercase">SISTEM KAS TERAS RT</p>
                </div>
              </div>
              <div className="p-4 bg-indigo-950/60 rounded-2xl border border-indigo-800/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-indigo-300">Total Iuran Sampah:</span>
                  <span className="font-bold">Rp {Number(sampahFee).toLocaleString()} / KK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-300">Total Iuran Air:</span>
                  <span className="font-bold">Rp {Number(airFee).toLocaleString()} / KK</span>
                </div>
                <div className="pt-2 border-t border-indigo-800/60 flex justify-between font-black text-sm text-emerald-400">
                  <span>Total Pengeluaran Standard:</span>
                  <span>Rp {(Number(sampahFee) + Number(airFee)).toLocaleString()} / KK</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WA Gateway API Tab */}
      {activeTab === 'gateway' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card title="Integrasi WhatsApp Gateway & API" icon={MessageSquare} className="border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
              <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed">
                Kelola endpoint API dan kunci autentikasi untuk pengiriman pesan WhatsApp siaran warga secara otomatis.
              </p>

              <form onSubmit={handleUpdateGateway} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">URL Endpoint WA Gateway</label>
                  <input 
                    type="text"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                    value={waGatewayUrl}
                    onChange={(e) => setWaGatewayUrl(e.target.value)}
                    placeholder="https://api.whatsapp-gateway.com/v1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">API Key / Secret Token</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                      value={waApiKey}
                      onChange={(e) => setWaApiKey(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20">
                  Simpan Konfigurasi WA Gateway
                </Button>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-emerald-950 rounded-[2.5rem] p-6 text-white border border-emerald-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">GATEWAY STATUS</span>
                </div>
                <Radio size={16} className="text-emerald-400" />
              </div>

              <div className="p-4 bg-[#0b141a] rounded-2xl border border-emerald-900/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Koneksi Sesi WA:</span>
                  <span className="font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">ONLINE (CONNECTED)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Nomor Sesi Pengirim:</span>
                  <span className="font-mono font-bold text-slate-200">+62 812-****-RT02</span>
                </div>
              </div>

              <p className="text-[10px] text-emerald-300/80 font-medium leading-relaxed">
                Siaran pesan warga disalurkan melalui server tercepat dengan waktu jeda otomatis 1.5 detik per pesan demi menghindari spam.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <Card title="Manajemen & Pemeliharaan Database" icon={Database} className="border-slate-200/80 rounded-[2.5rem] p-6 md:p-8">
              <div className="space-y-4">
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Cadangkan Data (JSON)</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Unduh seluruh arsip data RT 02 ke file JSON lokal.</p>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl" onClick={handleExportData}>
                    <Download size={14} className="mr-1" /> Ekspor JSON
                  </Button>
                </div>

                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Pulihkan Data (JSON Import)</h4>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Unggah dan pulihkan arsip cadangan data JSON.</p>
                  </div>
                  <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl px-3 py-2 cursor-pointer transition-all flex items-center gap-1">
                    <Upload size={14} /> Impor JSON
                    <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                  </label>
                </div>

                <div className="p-5 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={20}/></div>
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-900">Reset Database (Awal)</h4>
                      <p className="text-xs text-rose-700 font-medium leading-relaxed mt-0.5">Tindakan ini akan menghapus data dan mengembalikannya ke data sampel awal.</p>
                    </div>
                  </div>
                  <Button onClick={handleResetSystem} className="w-full py-3 bg-white text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white font-black text-xs rounded-xl shadow-xs transition-all">
                    <Trash size={16} className="mr-1.5" /> Reset Database Ke Awal
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-slate-800 shadow-xl space-y-4">
              <h4 className="font-black text-base text-slate-100">Informasi Pemeliharaan System</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Pencadangan rutin JSON disarankan dilakukan sebulan sekali oleh administrator RT untuk pengamanan arsip fisik independen.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
