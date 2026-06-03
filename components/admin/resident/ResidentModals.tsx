import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Activity, Users, User, Phone, DollarSign, CheckCircle, ChevronRight, X, UserPlus,
  CreditCard, AlertCircle, Calendar, FileText, Shield, Send, History, Edit2, Heart, ShieldCheck
} from 'lucide-react';
import { House, PaymentStatus, Role } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions, 
  isMonthMatch 
} from '../../../src/utils/dateUtils';

import { toast } from 'sonner';

interface AddEditResidentModalProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
  editingHouseId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  handleSaveHouse: (e: React.FormEvent) => void;
  activeFormTab: 'basic' | 'demographics' | 'family';
  setActiveFormTab: (tab: 'basic' | 'demographics' | 'family') => void;
}

export const AddEditResidentModal: React.FC<AddEditResidentModalProps> = ({
  role,
  isOpen,
  onClose,
  editingHouseId,
  formData,
  setFormData,
  handleSaveHouse,
  activeFormTab,
  setActiveFormTab
}) => {
  const validateTab = (tab: 'basic' | 'demographics' | 'family') => {
    const isAdmin = role === Role.ADMIN;

    if (formData.status === 'Empty') {
      if (!formData.block || !formData.number) {
        toast.error('Blok dan Nomor Rumah wajib diisi.');
        return false;
      }
      return true;
    }

    if (tab === 'basic') {
      const requiredFields = [
        { key: 'headOfFamily', label: 'Kepala Keluarga' },
        { key: 'nik', label: 'NIK' },
        { key: 'kkNumber', label: 'Nomor KK' },
        { key: 'gender', label: 'Jenis Kelamin' },
        { key: 'birthPlace', label: 'Tempat Lahir' },
        { key: 'birthDate', label: 'Tanggal Lahir' },
        { key: 'addressKtp', label: 'Alamat KTP' },
        { key: 'block', label: 'Blok' },
        { key: 'number', label: 'Nomor' },
        { key: 'joiningDate', label: 'Tanggal Mulai Menempati' }
      ];

      if (!isAdmin) {
        for (const field of requiredFields) {
          if (!formData[field.key]) {
            toast.error(`Field "${field.label}" wajib diisi.`);
            return false;
          }
        }

        if (formData.nik && formData.nik.length !== 16) {
          toast.error('NIK harus 16 digit.');
          return false;
        }
        if (formData.kkNumber && formData.kkNumber.length !== 16) {
          toast.error('Nomor KK harus 16 digit.');
          return false;
        }
      }
    } else if (tab === 'demographics') {
      const requiredFields = [
        { key: 'education', label: 'Pendidikan' },
        { key: 'jobCategory', label: 'Kategori Pekerjaan' },
        { key: 'religion', label: 'Agama' }
      ];

      if (!isAdmin) {
        for (const field of requiredFields) {
          if (!formData[field.key]) {
            toast.error(`Field "${field.label}" wajib diisi.`);
            return false;
          }
        }
      }
    } else if (tab === 'family') {
      for (let i = 0; i < formData.familyMembers.length; i++) {
        const member = formData.familyMembers[i];
        if (member.nik && member.nik.trim() !== "" && member.nik.trim().length !== 16) {
          toast.error(`NIK anggota keluarga ke-${i + 1} harus 16 digit.`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateTab(activeFormTab)) {
      if (activeFormTab === 'basic') setActiveFormTab('demographics');
      else if (activeFormTab === 'demographics') setActiveFormTab('family');
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateTab('basic') && validateTab('demographics') && validateTab('family')) {
      handleSaveHouse(e);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingHouseId ? "Edit Profil Warga" : "Pendaftaran Warga Baru"} 
      maxWidth="max-w-4xl"
      stickyHeader={
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full max-w-md mx-auto items-center gap-1">
          {[
            { id: 'basic', label: 'Identitas', icon: User },
            { id: 'demographics', label: 'Profil', icon: ShieldCheck },
            { id: 'family', label: 'Keluarga', icon: Users }
          ].map((tab, idx) => (
            <button 
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'basic') setActiveFormTab('basic');
                else if (tab.id === 'demographics') {
                   if (validateTab('basic')) setActiveFormTab('demographics');
                } else if (tab.id === 'family') {
                   if (validateTab('basic') && validateTab('demographics')) setActiveFormTab('family');
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeFormTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={13} className={activeFormTab === tab.id ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      }
    >
      <form onSubmit={onFormSubmit} className="space-y-6">
        <div className="min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeFormTab === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-5 animate-fade-in"
              >
                {/* Main Identity Section */}
                <div className="space-y-5">
                  <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                         <div className="w-8 h-8 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center justify-center">
                           <User size={15} className="stroke-[2]" />
                         </div>
                         <div>
                           <h3 className="text-sm font-bold text-slate-800">Data Personal</h3>
                           <p className="text-[10px] text-slate-400">Sesuai Dokumen Kependudukan (KTP/KK)</p>
                         </div>
                      </div>

                      {role === Role.ADMIN && (
                        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 border border-slate-200/60 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-450 pl-1.5 pr-1 uppercase tracking-wider">OPSI:</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, isVerified: !formData.isVerified})}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              formData.isVerified 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <ShieldCheck size={11} className="stroke-[2]" />
                            <span>Tersahkankan</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, isInitialData: !formData.isInitialData})}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              !formData.isInitialData 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Calendar size={11} className="stroke-[2]" />
                            <span>Mutasi Baru</span>
                          </button>

                          <div className="h-4 w-px bg-slate-200 mx-0.5"></div>

                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData, 
                              pbbStatus: formData.pbbStatus === 'Sudah Diambil' ? 'Belum Diambil' : 'Sudah Diambil',
                              pbbYear: formData.pbbYear || new Date().getFullYear().toString()
                            })}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                              formData.pbbStatus === 'Sudah Diambil' 
                                ? 'bg-[#10b981] text-white shadow-xs' 
                                : 'bg-[#fffbeb] text-[#d97706] border border-[#fde68a] hover:bg-[#fef3c7]'
                            }`}
                          >
                            <FileText size={11} className="stroke-[2]" />
                            <span>Ambil PBB</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
                      <div className="md:col-span-8">
                        <FormField 
                          label="Nama Lengkap Kepala Keluarga" 
                          required 
                          placeholder="Nama lengkap..."
                          value={formData.headOfFamily} 
                          onChange={(v: any) => setFormData({...formData, headOfFamily: v})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 gap-2">
                           {[
                             { id: 'Laki-laki', label: 'Laki-laki' },
                             { id: 'Perempuan', label: 'Perempuan' }
                           ].map((g) => (
                             <button
                               key={g.id}
                               type="button"
                               onClick={() => setFormData({...formData, gender: g.id as any})}
                               className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                                 formData.gender === g.id 
                                   ? 'bg-[#0f172a] text-white border-[#0f172a]' 
                                   : 'bg-[#f8fafc] text-slate-500 border border-slate-200 hover:bg-slate-50'
                               }`}
                             >
                               {g.label}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="md:col-span-6">
                        <FormField 
                          label="NIK" 
                          required 
                          placeholder="16 Digit NIK"
                          value={formData.nik} 
                          onChange={(v: any) => setFormData({...formData, nik: v})} 
                          maxLength={16}
                        />
                      </div>
                      <div className="md:col-span-6">
                        <FormField 
                          label="Nomor KK" 
                          required 
                          placeholder="16 Digit No. KK"
                          value={formData.kkNumber} 
                          onChange={(v: any) => setFormData({...formData, kkNumber: v})} 
                          maxLength={16}
                        />
                      </div>

                       <div className="md:col-span-6">
                        <FormField 
                          label="Tempat Lahir" 
                          required 
                          placeholder="Kota kelahiran"
                          value={formData.birthPlace} 
                          onChange={(v: any) => setFormData({...formData, birthPlace: v})} 
                        />
                      </div>
                      <div className="md:col-span-6">
                        <FormField 
                          label="Tanggal Lahir" 
                          required 
                          type="date"
                          value={formData.birthDate} 
                          onChange={(v: any) => setFormData({...formData, birthDate: v})} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Residence Info & Contact Access Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Residence details block */}
                    <div className="lg:col-span-7 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                       <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700">
                            <Home size={14} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800">Domisili</h3>
                            <p className="text-[10px] text-slate-400">Lokasi hunian di RT 02</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                        <FormField 
                          label="Blok" 
                          required 
                          placeholder="A/B..."
                          value={formData.block} 
                          onChange={(v: any) => setFormData({...formData, block: v})} 
                        />
                        <FormField 
                          label="Nomor Rumah" 
                          required 
                          placeholder="00"
                          value={formData.number} 
                          onChange={(v: any) => setFormData({...formData, number: v})} 
                        />

                        <div className="col-span-2 flex flex-col gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Hunian (Keberadaan Rumah)</label>
                            <div className="grid grid-cols-3 gap-2">
                               {[
                                 { id: 'Occupied', label: 'Dihuni' },
                                 { id: 'Empty', label: 'Kosong (Belum Dihuni)' },
                                 { id: 'Business', label: 'Tempat Usaha' }
                               ].map((st) => (
                                 <button
                                   key={st.id}
                                   type="button"
                                   onClick={() => {
                                     if (st.id === 'Empty') {
                                       setFormData({
                                         ...formData,
                                         status: 'Empty' as any,
                                         headOfFamily: formData.headOfFamily || 'Rumah Kosong',
                                         occupants: 0
                                       });
                                     } else {
                                       setFormData({
                                         ...formData,
                                         status: st.id as any,
                                         headOfFamily: formData.headOfFamily === 'Rumah Kosong' ? '' : formData.headOfFamily,
                                         occupants: formData.occupants || 1
                                       });
                                     }
                                   }}
                                   className={`py-1.5 rounded-lg text-xs font-bold border transition-all text-center ${
                                     formData.status === st.id 
                                       ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                                       : 'bg-slate-50 text-slate-500 border border-slate-200/80 hover:bg-white hover:text-slate-800'
                                   }`}
                                 >
                                   {st.label}
                                 </button>
                               ))}
                            </div>
                          </div>

                          {formData.status !== 'Empty' && (
                            <div>
                              <label className="block text-xs font-bold text-slate-705 mb-1.5">Status Kepemilikan Rumah</label>
                              <div className="grid grid-cols-4 gap-2">
                                 {['Tetap', 'Keluarga', 'Kontrak', 'Kost'].map((st) => (
                                   <button
                                     key={st}
                                     type="button"
                                     onClick={() => setFormData({...formData, residenceType: (st === 'Keluarga' ? 'Rumah Keluarga' : st) as any})}
                                     className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                       formData.residenceType === (st === 'Keluarga' ? 'Rumah Keluarga' : st) 
                                         ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                         : 'bg-slate-50 text-slate-500 border border-slate-200/80 hover:bg-white hover:text-slate-800'
                                     }`}
                                   >
                                     {st}
                                   </button>
                                 ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {formData.residenceType !== 'Tetap' && (
                          <div className="col-span-2 grid grid-cols-2 gap-4">
                            <FormField 
                              label="Nama Pemilik Rumah" 
                              placeholder="Nama pemilik asli..."
                              value={formData.ownerName} 
                              onChange={(v: any) => setFormData({...formData, ownerName: v})} 
                            />
                            <FormField 
                              label="Kontak Pemilik Rumah" 
                              placeholder="WA Pemilik..."
                              value={formData.ownerPhone} 
                              onChange={(v: any) => setFormData({...formData, ownerPhone: v})} 
                            />
                          </div>
                        )}

                        <div className="col-span-2">
                          <FormField 
                            label="Alamat Sesuai KTP" 
                            required 
                            placeholder="Alamat asal..."
                            multiline
                            value={formData.addressKtp} 
                            onChange={(v: any) => setFormData({...formData, addressKtp: v})} 
                          />
                        </div>

                        <div className="col-span-2">
                           <FormField 
                             label="Tanggal Mulai Menempati" 
                             required 
                             type="date"
                             value={formData.joiningDate} 
                             onChange={(v: any) => setFormData({...formData, joiningDate: v})} 
                           />
                           <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">* Acuan perhitungan tunggakan iuran.</p>
                        </div>
                       </div>
                    </div>

                    {/* Contact & Access Card */}
                    <div className="lg:col-span-5 flex flex-col gap-5">
                       {/* Contact Info block */}
                       <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex-1">
                          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                            <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex-shrink-0 flex items-center justify-center text-slate-700">
                              <Phone size={14} />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">Kontak</h3>
                              <p className="text-[10px] text-slate-400">Media komunikasi warga</p>
                            </div>
                          </div>
                          
                          <FormField 
                            label="Nomor WhatsApp" 
                            placeholder="08..."
                            value={formData.phone} 
                            onChange={(v: any) => setFormData({...formData, phone: v})} 
                          />
                       </div>

                       {/* Portal Access PIN code block */}
                       <div className="bg-[#0f172a] p-5 border border-slate-800 rounded-xl text-white shadow-xs relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-4">
                              <div className="w-8 h-8 bg-white/10 rounded-lg border border-white/5 flex-shrink-0 flex items-center justify-center text-indigo-400">
                                <Shield size={14} />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold">Akses Portal</h3>
                                <p className="text-[10px] text-slate-400">PIN Aktivasi</p>
                              </div>
                          </div>
                          
                          <div className="flex gap-2 items-stretch">
                            <input 
                              className="flex-1 min-w-0 py-1.5 px-2 bg-white/5 border border-white/10 rounded-lg text-lg font-bold text-white focus:bg-white/10 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500 transition-all outline-none text-center tracking-widest" 
                              value={formData.accessCode ?? ''} 
                              onChange={e => setFormData({...formData, accessCode: e.target.value})} 
                              placeholder="XXXXXX" 
                            />
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                              className="shrink-0 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center"
                            >
                              Buat PIN
                            </button>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'demographics' && (
              <motion.div 
                key="demographics"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-9 h-9 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-705">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Karakteristik Sosio-Ekonomi</h3>
                      <p className="text-[10px] text-slate-400">Latar belakang pendidikan, pekerjaan, dan kepercayaan</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <select 
                          className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer"
                          value={formData.education ?? ''} 
                          onChange={e => setFormData({...formData, education: e.target.value})}
                        >
                          <option value="">Pilih Jenjang...</option>
                          {['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map(edu => (
                            <option key={edu} value={edu}>{edu}</option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sektor Pekerjaan <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <select 
                          className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer"
                          value={formData.jobCategory ?? ''} 
                          onChange={e => setFormData({...formData, jobCategory: e.target.value})}
                        >
                          <option value="">Pilih Sektor...</option>
                          <option value="PNS">PNS / TNI / Polri</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                          <option value="Freelance">Pekerja Lepas / Freelance</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                        </select>
                        <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <FormField 
                        label="Agama" 
                        required 
                        type="select"
                        options={['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']}
                        value={formData.religion} 
                        onChange={(v: any) => setFormData({...formData, religion: v})} 
                      />
                    </div>
                    <div className="md:col-span-6">
                      <FormField 
                        label="Profesi Spesifik" 
                        placeholder="Contoh: Arsitek"
                        value={formData.job} 
                        onChange={(v: any) => setFormData({...formData, job: v})} 
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status Ekonomi</label>
                      <div className="relative">
                        <select 
                          className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer" 
                          value={formData.economicStatus ?? ''} 
                          onChange={e => setFormData({...formData, economicStatus: e.target.value as any})}
                        >
                          <option value="Pra-Sejahtera">Pra-Sejahtera (Subsidi)</option>
                          <option value="Sejahtera">Sejahtera</option>
                          <option value="Mampu">Mampu / Mandiri</option>
                        </select>
                        <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <FormField 
                        label="Jumlah Kendaraan" 
                        type="number"
                        placeholder="0"
                        value={formData.vehicleCount} 
                        onChange={(v: any) => setFormData({...formData, vehicleCount: parseInt(v) || 0})} 
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-slate-400" /> Demografi & Status Rentan
                      </h4>
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, useManualDemographics: !formData.useManualDemographics })}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all border text-[10px] uppercase font-bold tracking-wider ${
                          formData.useManualDemographics 
                            ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-xs' 
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs'
                        }`}
                      >
                        <span className="text-[9px] font-bold">
                          {formData.useManualDemographics ? 'Input Manual' : 'Kalkulasi Otomatis'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { id: 'pregnantCount', label: 'Ibu Hamil', icon: <Heart size={14} /> },
                        { id: 'babyCount', label: 'Bayi (0-1 th)', icon: <Activity size={14} />, auto: true },
                        { id: 'toddlerCount', label: 'Balita (1-5 th)', icon: <Activity size={14} />, auto: true },
                        { id: 'childCount', label: 'Anak (6-12 th)', icon: <Users size={14} />, auto: true },
                        { id: 'teenagerCount', label: 'Remaja (13-18 th)', icon: <Users size={14} />, auto: true },
                        { id: 'adultCount', label: 'Dewasa', icon: <Users size={14} />, auto: true },
                        { id: 'elderlyCount', label: 'Lansia', icon: <ChevronRight size={14} />, auto: true },
                        { id: 'widowCount', label: 'Janda/Duda', icon: <Users size={14} />, auto: true },
                      ].map(item => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-center justify-between px-0.5">
                            <label className="block text-[11px] font-semibold text-slate-500">{item.label}</label>
                            {(item as any).auto && !formData.useManualDemographics ? (
                              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded uppercase leading-none">Auto</span>
                            ) : (
                              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded uppercase leading-none">Manual</span>
                            )}
                          </div>
                          <input 
                            type="number" 
                            className={`w-full px-3 py-1.5 border rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 transition-all ${
                              (item as any).auto && !formData.useManualDemographics 
                                ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-80' 
                                : 'bg-white border-slate-200'
                            }`}
                            value={formData[item.id] || 0}
                            readOnly={(item as any).auto && !formData.useManualDemographics}
                            onChange={e => setFormData({...formData, [item.id]: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <BansosCard 
                            label="Penyandang Disabilitas" 
                            checked={formData.isDisability} 
                            onChange={c => setFormData({...formData, isDisability: c})} 
                          />
                        </div>
                        {formData.isDisability && (
                          <div className="w-16">
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 transition-all bg-white text-center"
                              value={formData.disabilityCount || 0}
                              onChange={e => setFormData({...formData, disabilityCount: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <BansosCard 
                            label="Anak Yatim / Piatu" 
                            checked={formData.isOrphan} 
                            onChange={c => setFormData({...formData, isOrphan: c})} 
                          />
                        </div>
                        {formData.isOrphan && (
                          <div className="w-16">
                            <input 
                              type="number" 
                              placeholder="0"
                              className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-100 transition-all bg-white text-center"
                              value={formData.orphanCount || 0}
                              onChange={e => setFormData({...formData, orphanCount: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                  <div className="md:col-span-7 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                       <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700">
                         <DollarSign size={14} />
                       </div>
                       <div>
                         <h3 className="text-sm font-bold text-slate-800">Perlindungan Sosial</h3>
                         <p className="text-[10px] text-slate-400">Keikutsertaan program bantuan pemerintah</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {[
                         { id: 'isPKH', label: 'Penerima PKH' },
                         { id: 'isBLT', label: 'Bantuan Tunai (BLT)' },
                         { id: 'isBPNT', label: 'Sembako / BPNT' },
                         { id: 'isBansosLain', label: 'Bansos Lainnya' }
                       ].map((item) => (
                        <BansosCard 
                          key={item.id}
                          label={item.label} 
                          checked={formData[item.id]} 
                          onChange={c => setFormData({...formData, [item.id]: c})} 
                        />
                       ))}
                       
                       <AnimatePresence>
                         {formData.isBansosLain && (
                           <motion.div 
                             initial={{ opacity: 0, height: 0 }} 
                             animate={{ opacity: 1, height: 'auto' }} 
                             exit={{ opacity: 0, height: 0 }}
                             className="col-span-2 overflow-hidden"
                           >
                             <div className="pt-2">
                               <input 
                                 placeholder="Sebutkan nama program bantuan..." 
                                 className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-indigo-100 transition-all outline-none"
                                 value={formData.bansosLainName ?? ''}
                                 onChange={e => setFormData({...formData, bansosLainName: e.target.value})}
                               />
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </div>

                  <div className="md:col-span-5 bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                     <div className="flex items-center gap-1.5 mb-4 pb-3 border-b border-slate-100">
                       <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700">
                         <Heart size={14} />
                       </div>
                       <div>
                         <h3 className="text-sm font-bold text-slate-800">Kesehatan</h3>
                         <p className="text-[10px] text-slate-400">Proteksi medis & BPJS</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori BPJS</label>
                        <div className="relative">
                          <select 
                            className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-850 outline-none focus:ring-1 focus:ring-indigo-100 transition-all appearance-none pr-8 cursor-pointer" 
                            value={formData.bpjsStatus} 
                            onChange={e => setFormData({...formData, bpjsStatus: e.target.value as any})}
                          >
                            <option value="Tidak Ada">Belum Terdaftar</option>
                            <option value="PPU">PPU (Pekerja)</option>
                            <option value="PBPU">PBPU (Mandiri)</option>
                            <option value="PBI">PBI (Pemerintah)</option>
                          </select>
                          <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Vaksinasi</label>
                        <div className="relative">
                          <select 
                            className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-850 outline-none focus:ring-1 focus:ring-indigo-100 transition-all appearance-none pr-8 cursor-pointer" 
                            value={formData.vaccinationStatus} 
                            onChange={e => setFormData({...formData, vaccinationStatus: e.target.value as any})}
                          >
                            <option value="Belum">Belum Terdata</option>
                            <option value="Dosis 1">Dosis 1</option>
                            <option value="Dosis 2">Dosis 2</option>
                            <option value="Booster">Booster</option>
                          </select>
                          <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'family' && (
              <motion.div 
                key="family"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 animate-fade-in"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 border border-slate-200 rounded-xl shadow-xs gap-4 animate-slide-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-705">
                      <Users size={14} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Anggota Keluarga</h3>
                      <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {formData.familyMembers.length} Personel Terdaftar
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const newMembers = [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki', job: '' }];
                      setFormData({
                        ...formData, 
                        familyMembers: newMembers,
                        occupants: newMembers.length + 1 // Auto update occupants
                      });
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <UserPlus size={13} />
                    <span>Tambah Anggota</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                  <AnimatePresence>
                    {formData.familyMembers.map((member: any, idx: number) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        key={member.id || idx} 
                        className="p-5 bg-white rounded-xl border border-slate-200 space-y-4 relative group hover:border-indigo-400 transition-all overflow-hidden"
                      >
                        <button 
                          type="button"
                          onClick={() => {
                            const newMembers = [...formData.familyMembers];
                            newMembers.splice(idx, 1);
                            setFormData({
                              ...formData, 
                              familyMembers: newMembers,
                              occupants: newMembers.length + 1 // Auto update occupants
                            });
                          }}
                          className="absolute top-4 right-4 p-1.5 text-slate-405 hover:text-rose-505 hover:bg-rose-50 transition-all rounded-lg md:opacity-0 md:group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                        
                        <div className="space-y-4 relative z-10">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-slate-900 text-white rounded flex items-center justify-center font-bold text-[11px]">
                               {idx + 1}
                             </div>
                             <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Anggota #{idx + 1}</h4>
                          </div>

                          <FormField 
                            label="Nama Lengkap" 
                            showAsterisk
                            placeholder="Nama sesuai KTP..." 
                            value={member.name}
                            onChange={(v: any) => {
                              const newMembers = [...formData.familyMembers];
                              newMembers[idx].name = v;
                              setFormData({...formData, familyMembers: newMembers});
                            }}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Hubungan</label>
                              <div className="relative">
                                <select 
                                  className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none pr-8 cursor-pointer"
                                  value={member.relation ?? ''}
                                  onChange={e => {
                                    const newMembers = [...formData.familyMembers];
                                    newMembers[idx].relation = e.target.value as any;
                                    setFormData({...formData, familyMembers: newMembers});
                                  }}
                                >
                                  <option value="Istri">Istri</option>
                                  <option value="Anak">Anak</option>
                                  <option value="Orang Tua">Orang Tua</option>
                                  <option value="Mertua">Ibu/Ayah Mertua</option>
                                  <option value="Famili Lain">Famili Lain</option>
                                </select>
                                <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Gender</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {['Laki-laki', 'Perempuan'].map(g => (
                                   <button
                                     key={g}
                                     type="button"
                                     onClick={() => {
                                       const newMembers = [...formData.familyMembers];
                                       newMembers[idx].gender = g as any;
                                       setFormData({...formData, familyMembers: newMembers});
                                     }}
                                     className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                       (member.gender || 'Laki-laki') === g 
                                         ? 'bg-slate-900 text-white border-slate-900' 
                                         : 'bg-[#f8fafc] text-slate-450 border border-slate-200 hover:bg-slate-50'
                                     }`}
                                   >
                                     {g === 'Laki-laki' ? 'Pria' : 'Wanita'}
                                   </button>
                                 ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField 
                              label="NIK" 
                              showAsterisk
                              placeholder="16 Digit NIK" 
                              value={member.nik}
                              onChange={(v: any) => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].nik = v;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              maxLength={16}
                            />
                            <FormField 
                              label="Tanggal Lahir" 
                              showAsterisk
                              type="date"
                              value={member.birthDate}
                              onChange={(v: any) => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].birthDate = v;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                            />
                          </div>

                          <FormField 
                            label="Pekerjaan / Aktivitas" 
                            showAsterisk
                            placeholder="Contoh: Pekerja Swasta, Pelajar" 
                            value={member.job}
                            onChange={(v: any) => {
                              const newMembers = [...formData.familyMembers];
                              newMembers[idx].job = v;
                              setFormData({...formData, familyMembers: newMembers});
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {formData.familyMembers.length === 0 && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="md:col-span-2 text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl"
                    >
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3 shadow-xs">
                        <Users size={20} />
                      </div>
                      <h4 className="text-xs font-bold text-slate-650 uppercase tracking-wider">Belum Ada Anggota Keluarga</h4>
                      <p className="text-[11px] text-slate-405 mt-1 max-w-xs mx-auto">Daftarkan pasangan, anak, atau kerabat jika ada tinggal serumah.</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-5 border-t border-slate-100 flex justify-between items-center px-2">
          <div className="flex gap-2">
            {activeFormTab !== 'basic' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeFormTab === 'demographics') setActiveFormTab('basic');
                  if (activeFormTab === 'family') setActiveFormTab('demographics');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1"
              >
                <span>←</span>
                <span>Kembali</span>
              </button>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-wide"
            >
              Batalkan
            </button>
            {activeFormTab !== 'family' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>Lanjutkan</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck size={14} />
                <span>{editingHouseId ? 'Simpan Perubahan' : 'Finalisasi Data'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};


// UI Helpers
const FormField = ({ label, value, onChange, placeholder, type = 'text', required = false, showAsterisk = false, multiline = false, maxLength, options }: any) => (
  <div className="w-full group/field">
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 group-focus-within/field:text-indigo-600 transition-colors">
      {label} {(required || showAsterisk) && <span className="text-rose-500">*</span>}
    </label>
    {multiline ? (
      <textarea 
        required={required ? true : undefined}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white hover:border-slate-300 resize-none placeholder:text-slate-400"
      />
    ) : type === 'select' && options ? (
      <div className="relative">
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          required={required ? true : undefined}
          className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-800 outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none pr-8 cursor-pointer"
        >
          <option value="">Pilih...</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronRight size={14} className="text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
      </div>
    ) : (
      <div className="relative">
        <input 
          type={type}
          required={required ? true : undefined}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full px-3 py-2 bg-white hover:border-slate-300 border border-slate-200 rounded-lg text-sm font-medium text-slate-805 outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-500 transition-all placeholder:text-slate-400"
        />
        {type === 'date' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 bg-transparent flex items-center pr-0.5">
            <Calendar size={14} className="stroke-[1.5]" />
          </div>
        )}
      </div>
    )}
  </div>
);

const BansosCard = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <label className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group relative overflow-hidden ${checked ? 'bg-indigo-50 border-indigo-400 shadow-xs' : 'bg-slate-50/50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}>
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-250'}`}>
      {checked && <CheckCircle size={12} className="text-white fill-none stroke-[2.5]" />}
      <input 
        type="checkbox" 
        className="hidden"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </div>
    <span className={`text-xs font-semibold transition-colors ${checked ? 'text-indigo-900 font-bold' : 'text-slate-600 font-medium'}`}>{label}</span>
  </label>
);


interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payHouse: House | null;
  payType: 'Air' | 'Sampah' | 'Both';
  setPayType: (type: 'Air' | 'Sampah' | 'Both') => void;
  payAmount: string;
  setPayAmount: (amount: string) => void;
  payDate: string;
  setPayDate: (date: string) => void;
  targetMonths: string[];
  setTargetMonths: (months: string[]) => void;
  payNotes: string;
  setPayNotes: (notes: string) => void;
  payerName: string;
  setPayerName: (name: string) => void;
  handleSavePayment: (e: React.FormEvent) => void;
  getIndonesianMonthYear: (date: Date) => string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  payHouse,
  payType,
  setPayType,
  payAmount,
  setPayAmount,
  payDate,
  setPayDate,
  targetMonths,
  setTargetMonths,
  payNotes,
  setPayNotes,
  payerName,
  setPayerName,
  handleSavePayment,
  getIndonesianMonthYear
}) => {
  const { getArrearsForHouse, settings } = useFinancial();
  if (!payHouse) return null;

  const arrears = getArrearsForHouse(payHouse);
  const airFee = settings?.airFee || 10000;
  const sampahFee = settings?.sampahFee || 10000;
  const unitFee = payType === 'Air' ? airFee : payType === 'Sampah' ? sampahFee : (airFee + sampahFee);
  
  const totalSuggested = targetMonths.length * unitFee;

  const toggleMonth = (month: string) => {
    if (targetMonths.includes(month)) {
      setTargetMonths(targetMonths.filter(m => m !== month));
    } else {
      setTargetMonths([...targetMonths, month].sort((a, b) => {
        // Simple sort by approximate date logic or just leave it
        return 0; 
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sistem Pembayaran Terpadu" maxWidth="max-w-5xl">
      <div className="space-y-8 py-6">
        {/* House Info Summary - Modern & Clean */}
        <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 relative overflow-hidden group shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-3xl font-bold font-mono shadow-lg">
                {payHouse.block}-{payHouse.number}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Profil Warga</p>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  {payHouse.headOfFamily}
                  {payHouse.isVerified && <ShieldCheck size={20} className="text-emerald-500" />}
                </h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Home size={12} /> {payHouse.residenceType || 'Warga'}
                  </span>
                  <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Activity size={12} /> {payHouse.status === 'Occupied' ? 'AKTIF' : 'KOSONG'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-w-[240px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status Tunggakan</p>
              <div className={`text-2xl font-bold tracking-tight ${arrears.length === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {arrears.length === 0 ? 'TERVALIDASI LUNAS' : `${arrears.length} Bulan Terhutang`}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePayment} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column: Month Selection */}
          <div className="xl:col-span-7 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Pilih Periode</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Pilih bulan yang akan dibayar</p>
                  </div>
                </div>
                {targetMonths.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setTargetMonths([])}
                    className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {arrears.map((month) => {
                  const isSelected = targetMonths.includes(month);
                  return (
                    <button
                      key={month}
                      type="button"
                      onClick={() => toggleMonth(month)}
                      className={`relative px-4 py-4 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center gap-1 border ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-black/10 scale-[1.02] z-10'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-400 hover:bg-white hover:text-slate-600'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                          <CheckCircle size={12} />
                        </div>
                      )}
                      <span>{month}</span>
                      <span className={`text-[9px] opacity-60 font-medium ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>
                        Rp {unitFee.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {arrears.length === 0 && (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                   <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={24} />
                   </div>
                   <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-1">TIDAK ADA TUNGGAKAN</h4>
                   <p className="text-[11px] text-slate-400 max-w-xs mx-auto">Semua iuran telah terbayar hingga periode saat ini.</p>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Input Manual Periode:</p>
                  <select 
                    className="flex-1 bg-white p-3 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    value={targetMonths[0] || ""}
                    onChange={e => {
                      if (e.target.value) setTargetMonths([e.target.value]);
                    }}
                  >
                    <option value="" disabled>Pilih Bulan Spesifik...</option>
                    {generateMonthOptions(12, 60).map((m: string) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bill Summary & Details */}
          <div className="xl:col-span-5 space-y-8">
            <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-white/5">
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                <div className="p-3 bg-indigo-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold uppercase tracking-wider">Ringkasan Tagihan</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Iuran Bulanan RT 02</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Jenis Iuran</span>
                  <select 
                    required
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white outline-none focus:border-indigo-400 transition-all"
                    value={payType} 
                    onChange={e => {
                      const newType = e.target.value as any;
                      setPayType(newType);
                      const nFee = newType === 'Air' ? airFee : newType === 'Sampah' ? sampahFee : (airFee + sampahFee);
                      setPayAmount((targetMonths.length * nFee).toString());
                    }}
                  >
                    <option value="Both" className="bg-slate-900">Paket (Air & Sampah)</option>
                    <option value="Air" className="bg-slate-900">Hanya Air</option>
                    <option value="Sampah" className="bg-slate-900">Hanya Sampah</option>
                  </select>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Jumlah Bulan</span>
                  <span className="font-mono font-bold text-indigo-400">{targetMonths.length} Bulan</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 font-bold uppercase tracking-widest text-[9px]">Tarif Satuan</span>
                  <span className="font-bold text-white">Rp {unitFee.toLocaleString()}</span>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Total Sesuai Pilihan</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xl font-bold text-white/50">Rp</span>
                       <input 
                         type="number"
                         className="bg-transparent text-4xl font-bold text-white w-full border-b border-indigo-500/30 focus:border-indigo-500 outline-none transition-all tracking-tight"
                         value={payAmount}
                         onChange={e => setPayAmount(e.target.value)}
                       />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                 <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Nama Penyetor</label>
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-indigo-400 transition-all placeholder:text-white/10"
                      placeholder={`Default: ${payHouse.headOfFamily}`}
                      value={payerName}
                      onChange={e => setPayerName(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Waktu Pembayaran</label>
                    <input 
                      type="date"
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-indigo-400 transition-all font-mono"
                      value={payDate ?? ''}
                      onChange={e => setPayDate(e.target.value)}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest">Catatan Tambahan</label>
                    <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm font-medium outline-none focus:border-indigo-400 transition-all placeholder:text-white/10 h-20 resize-none"
                      placeholder="Tulis catatan jika ada..."
                      value={payNotes ?? ''}
                      onChange={e => setPayNotes(e.target.value)}
                    />
                 </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={targetMonths.length === 0}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 <CheckCircle size={20} /> Konfirmasi Bayar
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};


interface EditPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPayment: any;
  payType: 'Air' | 'Sampah' | 'Both';
  setPayType: (type: 'Air' | 'Sampah' | 'Both') => void;
  payAmount: string;
  setPayAmount: (amount: string) => void;
  payDate: string;
  setPayDate: (date: string) => void;
  payNotes: string;
  setPayNotes: (notes: string) => void;
  payerName: string;
  setPayerName: (name: string) => void;
  handleUpdatePayment: (e: React.FormEvent) => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  isOpen,
  onClose,
  editingPayment,
  payType,
  setPayType,
  payAmount,
  setPayAmount,
  payDate,
  setPayDate,
  payNotes,
  setPayNotes,
  payerName,
  setPayerName,
  handleUpdatePayment
}) => {
  if (!editingPayment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Catatan Iuran`} maxWidth="max-w-5xl">
      <div className="space-y-8 py-6">
        {/* Payment Headline - Modern & Clean */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group shadow-xl">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl border border-white/20 font-bold font-mono">
                    {editingPayment.block}-{editingPayment.number}
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Koreksi Transaksi</p>
                    <h3 className="text-2xl font-bold tracking-tight">{editingPayment.headOfFamily}</h3>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest">{editingPayment.month}</span>
                       <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest border border-white/5 px-3 py-1 rounded-lg">ID: {editingPayment.id?.slice(-8).toUpperCase()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col items-center md:items-end bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                 <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Nominal Terdaftar</p>
                 <div className="text-3xl font-bold tracking-tight text-white">
                    Rp {parseInt(editingPayment.amount).toLocaleString('id-ID')}
                 </div>
              </div>
           </div>
        </div>

        <form onSubmit={handleUpdatePayment} className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-slate-100 text-slate-900 rounded-xl">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Detail Perubahan</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Sesuaikan parameter transaksi yang lama</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Jenis Iuran <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                  value={payType ?? 'Both'}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Sepaket (Air & Sampah)</option>
                  <option value="Sampah">Hanya Sampah</option>
                  <option value="Air">Hanya Air</option>
                </select>
              </div>
              
              <FormField 
                label="Nominal Revisi (Rp)" 
                type="number" 
                required
                value={payAmount} 
                onChange={setPayAmount} 
              />

              <div>
                <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Tanggal Perkoreksian <span className="text-rose-500">*</span></label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    required
                    className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                    value={payDate ?? ''}
                    onChange={e => setPayDate(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setPayDate(new Date().toISOString().split('T')[0])}
                    className="px-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold text-[9px] uppercase tracking-widest transition-all shadow-sm"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>

              <FormField 
                label="Penyetor" 
                placeholder={`Default: ${editingPayment.headOfFamily}`}
                value={payerName} 
                onChange={setPayerName} 
              />

              <div className="md:col-span-2">
                <FormField 
                  label="Log Perubahan" 
                  placeholder="Alasan perubahan atau catatan tambahan..."
                  multiline
                  value={payNotes} 
                  onChange={setPayNotes} 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              Batal
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
            >
              <CheckCircle size={20} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

