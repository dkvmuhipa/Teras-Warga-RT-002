import React, { useState, useEffect } from 'react';
import { 
  X, Check, Mail, Lock, Eye, EyeOff, Sparkles, Key, 
  Copy, CheckCircle2, MessageSquare, AlertCircle, Shield, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  createTenantAdminAccount, 
  suggestRtAdminEmail, 
  generateTemporaryPassword,
  deleteAdminAccount 
} from '../../services/authAdminService';
import { updateOfficialInDb, addOfficialToDb } from '../../services/databaseService';
import { toast } from 'sonner';

export interface OfficialAccountTarget {
  id: string;
  name: string;
  roleTitle: string;
  tenantId: string;
  tenantName: string;
  tenantRt: string;
  kelurahan: string;
  phone: string;
  email?: string;
}

interface CreateOfficialAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: OfficialAccountTarget | null;
  onSuccess?: () => void;
}

export const CreateOfficialAccountModal: React.FC<CreateOfficialAccountModalProps> = ({
  isOpen,
  onClose,
  target,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Ketua RT');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ email: string; password: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (target && isOpen) {
      const suggestedEmail = target.email || suggestRtAdminEmail(target.tenantRt, target.kelurahan);
      setEmail(suggestedEmail);
      // For existing accounts, do not overwrite/generate a random password on open
      if (target.email) {
        setPassword('');
      } else {
        setPassword(generateTemporaryPassword(target.tenantRt));
      }
      setRole(target.roleTitle || 'Ketua RT');
      setCreatedResult(null);
      setIsDeleting(false);
      setIsLoading(false);
    }
  }, [target, isOpen]);

  if (!isOpen || !target) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Disalin ke clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!createdResult || !target.phone) return;
    let cleanPhone = target.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);

    const portalUrl = `${window.location.origin}/?rt=${target.tenantId}#/admin`;
    const message = encodeURIComponent(
      `Halo Bpk/Ibu ${target.name},\n\n` +
      `Akun login Admin untuk *${target.tenantName}* telah diaktifkan oleh Super Admin di portal Teras Warga:\n\n` +
      `🔑 *Kredensial Akses Admin RT*\n` +
      `• URL Portal: ${portalUrl}\n` +
      `• Email Login: ${createdResult.email}\n` +
      `• Password Sementara: ${createdResult.password}\n` +
      `• Peran: ${role}\n\n` +
      `Silakan login untuk mengelola data warga, iuran, persuratan, dan ronda lingkungan Anda.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleDeleteAccount = async () => {
    const targetEmail = target.email || email;
    if (!targetEmail) return;

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus akun login untuk ${target.name} (${targetEmail})?\n\n` +
      `Pengurus ini tidak akan bisa login lagi ke portal admin RT.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAdminAccount({
        email: targetEmail,
        officialId: target.id,
        tenantId: target.tenantId
      });

      toast.success(`Akun ${targetEmail} berhasil dihapus dari Firebase Auth.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete admin account:', err);
      toast.error('Gagal Menghapus Akun', {
        description: err?.message || 'Terjadi kesalahan saat menghapus akun.'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Masukkan alamat email yang valid.');
      return;
    }
    // Validation: password is required for new accounts; for existing accounts, only validate length if typed
    if (!target.email && (!password || password.length < 6)) {
      toast.error('Password sementara minimal 6 karakter.');
      return;
    }
    if (password && password.length < 6) {
      toast.error('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create or update account in Firebase Auth
      const result = await createTenantAdminAccount({
        email,
        password: password || undefined,
        name: target.name,
        phone: target.phone,
        role,
        tenantId: target.tenantId,
        officialId: target.id
      });

      // 2. If this target already exists as a distinct Firestore official document, sync their email
      if (target.id && !target.id.includes('-chairman') && !target.id.includes('-secretary') && !target.id.includes('-treasurer')) {
        try {
          await updateOfficialInDb(target.id, { email: email.trim().toLowerCase(), role });
        } catch (dbErr) {
          console.warn('Update official document warning:', dbErr);
        }
      }

      if (password) {
        setCreatedResult({ email: email.trim().toLowerCase(), password });
        toast.success(result?.isExisting ? `Akun ${email} berhasil diperbarui & password baru disetel!` : `Akun login untuk ${target.name} berhasil dibuat!`);
      } else {
        toast.success(`Data akun ${email} berhasil diperbarui! Password aktif tetap dipertahankan.`);
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to create/update official account:', err);
      toast.error('Gagal Memproses Akun Login', {
        description: err.message || 'Terjadi kesalahan saat memproses akun.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
              <Key size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-slate-900 truncate">
                {createdResult 
                  ? 'Akun Login Berhasil Dibuat!' 
                  : target.email 
                    ? 'Kelola / Perbarui Akun Login' 
                    : 'Buat Akun Login Pengurus RT'}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">
                {target.tenantName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          {createdResult ? (
            /* Result State */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">Kredensial Siap Digunakan</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Akun login telah aktif di cloud Firebase Authentication. Silakan bagikan kredensial ini kepada pengurus terkait.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Pengurus / Peran:</span>
                  <span className="font-bold text-slate-800">{target.name} ({role})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Email Login:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                    <span>{createdResult.email}</span>
                    <button 
                      onClick={() => handleCopy(createdResult.email, 'email')}
                      className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {copiedKey === 'email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Password Sementara:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    <span>{createdResult.password}</span>
                    <button 
                      onClick={() => handleCopy(createdResult.password, 'pass')}
                      className="p-1 text-indigo-500 hover:text-indigo-800 cursor-pointer"
                    >
                      {copiedKey === 'pass' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {target.phone && (
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer transition-all"
                  >
                    <MessageSquare size={16} />
                    <span>Kirim via WhatsApp</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-6 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Calon Pemilik Akun:</span>
                  <span className="font-black text-slate-900 text-sm">{target.name}</span>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                  {target.roleTitle}
                </span>
              </div>

              {/* If target already has an account */}
              {target.email && (
                <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-emerald-900 font-bold shrink-0">Akun Aktif:</span>
                    <span className="font-mono text-emerald-800 font-bold truncate">{target.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || isLoading}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shrink-0 min-h-[36px]"
                    title="Hapus akun login ini"
                  >
                    <Trash2 size={13} />
                    <span>{isDeleting ? 'Menghapus...' : 'Hapus Akun'}</span>
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Email Login <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEmail(suggestRtAdminEmail(target.tenantRt, target.kelurahan))}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer py-1 px-1.5"
                  >
                    Reset Rekomendasi
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[44px]"
                    placeholder="nama@teraswarga.id"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    {target.email ? 'Ganti Password Baru (Opsional)' : 'Password Sementara'} {!target.email && <span className="text-rose-500">*</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateTemporaryPassword(target.tenantRt))}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer py-1 px-1.5"
                  >
                    {target.email ? '+ Buat Password Acak' : 'Acak Password'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required={!target.email}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none min-h-[44px]"
                    placeholder={target.email ? "•••••••• (Biarkan kosong jika tidak ingin mengubah password)" : "Minimal 6 karakter"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-0 bottom-0 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {target.email && (
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {password 
                      ? '⚠️ Password akan diubah ke password baru di atas saat Anda klik "Perbarui & Set Password Baru".' 
                      : 'ℹ️ Password login saat ini tetap aktif dan tidak berubah. Kosongkan jika hanya ingin memperbarui email atau peran pengurus.'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Peran / Akses di Lingkungan RT
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="Ketua RT">Ketua RT (Administrator Utama - Akses Penuh)</option>
                  <option value="Sekretaris">Sekretaris RT (Administrasi, Warga & Persuratan)</option>
                  <option value="Bendahara">Bendahara RT (Keuangan, Kas & Iuran)</option>
                  <option value="Admin">Staf / Operator RT (Akses Penuh Admin)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Akun dibuat langsung di Firebase Authentication tanpa memutus sesi login Super Admin Anda saat ini.
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 gap-2">
                {target.email ? (
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || isLoading}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px] shrink-0"
                  >
                    <Trash2 size={14} />
                    <span>{isDeleting ? 'Menghapus...' : 'Hapus Akun'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isLoading || isDeleting}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || isDeleting}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[44px]"
                  >
                    {isLoading ? (
                      <span>Memproses di Cloud...</span>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>
                          {target.email 
                            ? (password ? 'Perbarui & Set Password Baru' : 'Simpan Perubahan') 
                            : 'Buat Akun Sekarang'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
