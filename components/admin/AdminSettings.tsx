import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Database, Download, AlertTriangle, Trash, FileText, Save, Image as ImageIcon, ShieldCheck, Edit2, MessageCircle, Search, CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import { PdfConfig, House, Announcement, CashFlow, Official, Report, LetterRequest, RondaSchedule, InventoryItem, UMKM, Poll, RondaCheckLog, MarketItem, AppNotification } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { seedDatabase, deepSanitize, updatePdfConfig, handleFirestoreError, OperationType } from '../../services/databaseService';
import { getWhatsAppGroups } from '../../services/whatsappService';
import { SignaturePad } from './SignaturePad';
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
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ 
  pdfConfig, setPdfConfig, houses, announcements, cashFlow, officials, 
  reports, letters, ronda, inventory, umkm, polls, rondaLogs, marketItems, notifications,
  settings, onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'system' | 'pdf' | 'whatsapp' | 'fees'>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [localConfig, setLocalConfig] = useState<PdfConfig>(pdfConfig);
  const [isVerifyingGroup, setIsVerifyingGroup] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<{id: string, name: string}[]>([]);
  const [showGroupList, setShowGroupList] = useState(false);

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
        handleFirestoreError(error, OperationType.WRITE, "seedDatabase");
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

  const handleSaveConfig = async () => {
    try {
      await updatePdfConfig(localConfig);
      setPdfConfig(localConfig);
      toast.success('Konfigurasi surat tersimpan di cloud!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "pdfConfig");
      toast.error('Gagal menyimpan konfigurasi ke cloud.');
    }
  };

  const handleVerifyGroup = async () => {
    setIsVerifyingGroup(true);
    try {
      const result = await getWhatsAppGroups();
      if (result?.success && Array.isArray(result?.data)) {
        setAvailableGroups(result.data.map((g: any) => ({
          id: g.id || g.jid,
          name: g.name || g.subject
        })));
        setShowGroupList(true);
        toast.success(`Ditemukan ${result.data.length} grup.`);
      } else if (result?.error) {
        toast.error(`Gagal: ${result?.error}`);
      } else {
        const data = result?.data || result;
        if (Array.isArray(data)) {
          setAvailableGroups(data.map((g: any) => ({
            id: g.id || g.jid,
            name: g.name || g.subject
          })));
          setShowGroupList(true);
          toast.success(`Ditemukan ${data.length} grup.`);
        } else {
          toast.error('Gagal mengambil daftar grup. Pastikan API Key benar.');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Terjadi kesalahan saat verifikasi.');
    } finally {
      setIsVerifyingGroup(false);
    }
  };

  const selectGroup = (id: string, name: string) => {
    setLocalConfig(prev => ({
      ...prev,
      whatsappGroupId: id,
      whatsappGroupName: name
    }));
    setShowGroupList(false);
    toast.success(`Grup "${name}" terpilih.`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Tabs Header */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100/50 rounded-2xl w-fit">
        {[
          { id: 'profile', label: 'Profil Admin', icon: User },
          { id: 'fees', label: 'Tarif Iuran', icon: Wallet },
          { id: 'pdf', label: 'Konfigurasi PDF', icon: FileText },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
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
                      required
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
                      required
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

        {activeTab === 'pdf' && (
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
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <SignaturePad 
                    initialValue={localConfig.signature}
                    onSave={(sig) => setLocalConfig({...localConfig, signature: sig})}
                    onClear={() => setLocalConfig({...localConfig, signature: ''})}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'whatsapp' && (
          <Card title="Integrasi WhatsApp" icon={MessageCircle} action={<Button onClick={handleSaveConfig} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"><Save size={16}/> Simpan</Button>}>
            <div className="p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} className="text-brand-blue" />
                <h4 className="font-bold text-sm text-slate-700">Integrasi WhatsApp</h4>
              </div>
              <label className="block text-xs font-bold mb-2 text-slate-700">WhatsApp Group ID (JID)</label>
              <div className="flex gap-2 mb-4">
                <input 
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none font-mono" 
                  placeholder="Contoh: 1234567890@g.us"
                  value={localConfig.whatsappGroupId || ''} 
                  onChange={e => setLocalConfig({...localConfig, whatsappGroupId: e.target.value})} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleVerifyGroup}
                  disabled={isVerifyingGroup}
                  className="shrink-0"
                >
                  {isVerifyingGroup ? '...' : <Search size={16} />}
                </Button>
              </div>

              {showGroupList && availableGroups.length > 0 && (
                <div className="mb-4 p-3 bg-white border border-indigo-100 rounded-xl shadow-inner max-h-40 overflow-y-auto space-y-2">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Pilih dari Grup Anda:</p>
                  {availableGroups.map(group => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => selectGroup(group.id, group.name)}
                      className="w-full text-left p-2 hover:bg-indigo-50 rounded-lg transition-colors flex items-center justify-between group"
                    >
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate">{group.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{group.id}</p>
                      </div>
                      <CheckCircle2 size={14} className="text-indigo-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setShowGroupList(false)}
                    className="w-full text-center py-1 text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    Tutup Daftar
                  </button>
                </div>
              )}

              <label className="block text-xs font-bold mb-2 text-slate-700">Nama Grup WhatsApp (Display)</label>
              <input 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm outline-none" 
                placeholder="Contoh: Warga RT 02 Official"
                value={localConfig.whatsappGroupName || ''} 
                onChange={e => setLocalConfig({...localConfig, whatsappGroupName: e.target.value})} 
              />
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                ID Grup diperlukan untuk mengirim pengumuman ke grup WhatsApp warga secara otomatis. 
                Anda bisa mendapatkan ID ini dari dashboard Sidobe atau melalui bot helper.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
