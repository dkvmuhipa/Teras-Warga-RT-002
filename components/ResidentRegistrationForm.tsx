import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Home, Phone, Users, Send, CheckCircle, ArrowLeft, Plus, Trash2, GraduationCap, Briefcase, Car, Baby, Heart, Accessibility, Smile, FileText, Camera, ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { addResidentRegistrationToDb, uploadImageToStorage, checkHouseOccupied, formatHouseId, handleFirestoreError, OperationType } from '../services/databaseService';
import { toast } from 'sonner';

interface ResidentRegistrationFormProps {
  onClose: () => void;
}

export const ResidentRegistrationForm: React.FC<ResidentRegistrationFormProps> = ({ onClose }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [kkFile, setKkFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    headOfFamily: '',
    gender: 'Laki-laki' as 'Laki-laki' | 'Perempuan',
    birthDate: '',
    ownerName: '',
    block: '',
    number: '',
    phone: '',
    status: 'Occupied' as const,
    residenceType: 'Tetap' as const,
    religion: 'Islam',
    occupants: 1,
    education: '',
    jobCategory: '',
    vehicleCount: 0,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    familyMembers: [] as { id?: string; name: string; nik?: string; gender: 'Laki-laki' | 'Perempuan'; relation: any; birthDate?: string; job?: string }[]
  });

  const addFamilyMember = () => {
    setFormData({
      ...formData,
      familyMembers: [...formData.familyMembers, { 
        id: Math.random().toString(36).substr(2, 9),
        name: '', 
        relation: 'Anak', 
        gender: 'Laki-laki', 
        birthDate: '' 
      }]
    });
  };

  const removeFamilyMember = (index: number) => {
    const newList = [...formData.familyMembers];
    newList.splice(index, 1);
    setFormData({ ...formData, familyMembers: newList });
  };

  const updateFamilyMember = (index: number, field: string, value: string) => {
    const newList = [...formData.familyMembers];
    newList[index] = { ...newList[index], [field]: value };
    setFormData({ ...formData, familyMembers: newList });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check if house is already occupied in the system
      const houseId = formatHouseId(`${formData.block}-${formData.number}`);
      const isOccupied = await checkHouseOccupied(houseId);
      
      if (isOccupied) {
        toast.error('Rumah Sudah Terdaftar!', {
          description: `Blok ${formData.block} No. ${formData.number} sudah memiliki penghuni terdaftar. Jika Anda ingin menambah anggota keluarga, silakan gunakan menu Mutasi > Tambah Anggota di halaman Layanan.`,
          duration: 6000
        });
        setIsLoading(false);
        return;
      }

      let ktpUrl = '';
      let kkUrl = '';

      if (ktpFile) {
        ktpUrl = await uploadImageToStorage(ktpFile, `registrations/ktp_${Date.now()}_${ktpFile.name}`);
      }
      if (kkFile) {
        kkUrl = await uploadImageToStorage(kkFile, `registrations/kk_${Date.now()}_${kkFile.name}`);
      }

      await addResidentRegistrationToDb({
        ...formData,
        ktpUrl,
        kkUrl,
        date: new Date().toISOString(),
        approvalStatus: 'Pending'
      });
      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "residentRegistrations");
      toast.error('Gagal mengirim pendaftaran.', {
        description: 'Silakan coba lagi beberapa saat lagi.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-4">Pendaftaran Terkirim!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Data Anda telah kami terima dan sedang dalam proses peninjauan oleh Pengurus RT. 
          Kami akan menghubungi Anda melalui nomor WhatsApp yang terdaftar jika diperlukan verifikasi lebih lanjut.
        </p>
        <Button onClick={onClose} className="w-full py-4 bg-slate-800 hover:bg-slate-900">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto border border-slate-100">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-slate-400" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800">Formulir Registrasi Penghuni</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lengkapi Data Kependudukan RT 02</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1: Identitas Utama */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <User size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Identitas Utama</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kepala Keluarga / Penghuni Utama <span className="text-rose-500">*</span></label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="Contoh: Budi Santoso" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.headOfFamily} onChange={e => setFormData({...formData, headOfFamily: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
              <select required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir <span className="text-rose-500">*</span></label>
              <input required type="date" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp Aktif <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="tel" placeholder="0812xxxx" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blok Rumah <span className="text-rose-500">*</span></label>
              <input required type="text" placeholder="Contoh: A" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Rumah <span className="text-rose-500">*</span></label>
              <input required type="text" placeholder="Contoh: 12" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Kepemilikan <span className="text-rose-500">*</span></label>
              <select required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.residenceType} onChange={e => setFormData({...formData, residenceType: e.target.value as any})}>
                <option value="Tetap">Milik Sendiri (Tetap)</option>
                <option value="Kontrak">Sewa / Kontrak</option>
                <option value="Kost">Kost / Mahasiswa</option>
                <option value="Rumah Keluarga">Rumah Keluarga</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agama <span className="text-rose-500">*</span></label>
              <select required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.religion} onChange={e => setFormData({...formData, religion: e.target.value})}>
                <option value="Islam">Islam</option>
                <option value="Kristen">Kristen</option>
                <option value="Katolik">Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Budha">Budha</option>
                <option value="Konghucu">Konghucu</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Penghuni (Total) <span className="text-rose-500">*</span></label>
              <input required type="number" min="1" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.occupants} onChange={e => setFormData({...formData, occupants: parseInt(e.target.value)})} />
            </div>
          </div>
        </section>

        {/* Section 2: Data Pekerjaan & Pendidikan */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Pekerjaan & Pendidikan</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
              <div className="relative">
                <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="Contoh: S1" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Pekerjaan <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input required type="text" placeholder="Contoh: Karyawan Swasta" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.jobCategory} onChange={e => setFormData({...formData, jobCategory: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Kendaraan</label>
              <div className="relative">
                <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="number" min="0" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" value={formData.vehicleCount} onChange={e => setFormData({...formData, vehicleCount: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Demografi Khusus */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
              <Heart size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Data Demografi Khusus</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Ibu Hamil', field: 'pregnantCount', icon: Heart },
              { label: 'Bayi', field: 'babyCount', icon: Baby },
              { label: 'Balita', field: 'toddlerCount', icon: Smile },
              { label: 'Remaja', field: 'teenagerCount', icon: Users },
              { label: 'Dewasa', field: 'adultCount', icon: ShieldCheck },
              { label: 'Lansia', field: 'elderlyCount', icon: Accessibility },
              { label: 'Janda', field: 'widowCount', icon: User },
            ].map((item) => (
              <div key={item.field} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                <item.icon size={16} className="mx-auto mb-2 text-slate-400" />
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</label>
                <input 
                  type="number" 
                  min="0" 
                  className="w-full bg-transparent text-center font-black text-slate-800 outline-none"
                  value={(formData as any)[item.field]} 
                  onChange={e => setFormData({...formData, [item.field]: parseInt(e.target.value) || 0})}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Anggota Keluarga */}
        <section className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <Users size={16} />
              </div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Anggota Keluarga</h3>
            </div>
            <button type="button" onClick={addFamilyMember} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-all">
              <Plus size={14} /> Tambah Anggota
            </button>
          </div>

          <div className="space-y-4">
            {formData.familyMembers.map((member, idx) => (
              <div key={member.id || idx} className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] relative group">
                <button type="button" onClick={() => removeFamilyMember(idx)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-600 transition-colors">
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                    <input required type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.name} onChange={e => updateFamilyMember(idx, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Kelamin <span className="text-rose-500">*</span></label>
                    <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.gender} onChange={e => updateFamilyMember(idx, 'gender', e.target.value)}>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir <span className="text-rose-500">*</span></label>
                    <input required type="date" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.birthDate || ''} onChange={e => updateFamilyMember(idx, 'birthDate', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hubungan <span className="text-rose-500">*</span></label>
                    <select required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.relation} onChange={e => updateFamilyMember(idx, 'relation', e.target.value)}>
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Orang Tua">Orang Tua</option>
                      <option value="Famili Lain">Famili Lain</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK (Opsional)</label>
                    <input type="text" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.nik || ''} onChange={e => updateFamilyMember(idx, 'nik', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pekerjaan <span className="text-rose-500">*</span></label>
                    <input required type="text" placeholder="Contoh: Pelajar" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" value={member.job || ''} onChange={e => updateFamilyMember(idx, 'job', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            {formData.familyMembers.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm italic font-medium">Belum ada anggota keluarga yang ditambahkan.</p>
            )}
          </div>
        </section>

        {/* Section 5: Upload Dokumen */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Upload Dokumen</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto KTP Kepala Keluarga</label>
              <div className={`
                relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden
                ${ktpFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-indigo-300'}
              `}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setKtpFile(e.target.files?.[0] || null)}
                />
                {ktpFile ? (
                  <div className="text-center p-4">
                    <CheckCircle className="mx-auto mb-2 text-indigo-600" size={32} />
                    <p className="text-xs font-black text-indigo-600 truncate max-w-[200px]">{ktpFile.name}</p>
                    <p className="text-[10px] text-indigo-400 font-bold mt-1">Klik untuk mengganti</p>
                  </div>
                ) : (
                  <>
                    <Camera className="text-slate-300" size={40} />
                    <p className="text-xs font-black text-slate-400">Ambil Foto / Upload KTP</p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto Kartu Keluarga (KK)</label>
              <div className={`
                relative h-48 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer overflow-hidden
                ${kkFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'}
              `}>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setKkFile(e.target.files?.[0] || null)}
                />
                {kkFile ? (
                  <div className="text-center p-4">
                    <CheckCircle className="mx-auto mb-2 text-emerald-600" size={32} />
                    <p className="text-xs font-black text-emerald-600 truncate max-w-[200px]">{kkFile.name}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">Klik untuk mengganti</p>
                  </div>
                ) : (
                  <>
                    <Camera className="text-slate-300" size={40} />
                    <p className="text-xs font-black text-slate-400">Ambil Foto / Upload KK</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="pt-10 border-t border-slate-100">
          <Button type="submit" disabled={isLoading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 shadow-2xl shadow-indigo-100 flex items-center justify-center gap-3 text-lg">
            {isLoading ? 'Mengirim...' : (
              <>
                <Send size={20} />
                Kirim Pendaftaran
              </>
            )}
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-black mt-6 uppercase tracking-widest">
            * Pastikan data yang Anda isi sudah benar dan sesuai dengan KTP/KK.
          </p>
        </div>
      </form>
    </div>
  );
};
