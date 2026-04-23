import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Activity, Users, User, Phone, DollarSign, CheckCircle, ChevronRight, X, UserPlus,
  CreditCard, AlertCircle, Calendar, FileText, Shield, Send, History, Edit2, Heart
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
        { key: 'number', label: 'Nomor' }
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
      if (!isAdmin) {
        for (let i = 0; i < formData.familyMembers.length; i++) {
          const member = formData.familyMembers[i];
          if (!member.name || !member.nik || !member.birthDate || !member.job) {
            toast.error(`Lengkapi data anggota keluarga ke-${i + 1}.`);
            return false;
          }
          if (member.nik && member.nik.length !== 16) {
            toast.error(`NIK anggota keluarga ke-${i + 1} harus 16 digit.`);
            return false;
          }
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingHouseId ? "Edit Profil Warga" : "Pendaftaran Warga Baru"} maxWidth="max-w-7xl">
      <form onSubmit={onFormSubmit} className="space-y-16 py-6 px-4">
        {/* Modern Tab Navigation - More Refined and Integrated */}
        <div className="flex bg-slate-100/50 p-2 rounded-[3rem] border border-slate-200/60 backdrop-blur-xl sticky top-0 z-20 mx-auto max-w-2xl shadow-xl shadow-slate-200/20">
          {[
            { id: 'basic', label: 'Informasi Dasar', icon: Home },
            { id: 'demographics', label: 'Demografi', icon: Activity },
            { id: 'family', label: 'Keluarga', icon: Users }
          ].map((tab) => (
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
              className={`flex-1 px-5 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${
                activeFormTab === tab.id ? 'bg-white text-indigo-600 shadow-2xl shadow-indigo-600/10' : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              <div className={`p-2.5 rounded-2xl transition-all duration-700 ${
                activeFormTab === tab.id ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-200 text-slate-400 -rotate-6 group-hover:rotate-0'
              }`}>
                <tab.icon size={16} />
              </div>
              <span className="hidden md:inline">{tab.label}</span>
              {activeFormTab === tab.id && (
                <motion.div 
                  layoutId="activeFormTab"
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[700px]">
          <AnimatePresence mode="wait">
            {activeFormTab === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12"
              >
                {/* Main Identity Section */}
                <div className="lg:col-span-12 space-y-12">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex items-center gap-6 mb-12 relative z-10">
                       <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/20 rotate-3">
                         <User size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Identitas Terpusat</h3>
                         <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Sinkronisasi data sesuai KTP/KK untuk keakuratan basis data RT</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 relative z-10">
                      <div className="md:col-span-8">
                        <FormField 
                          label="Nama Lengkap Kepala Keluarga" 
                          required 
                          placeholder="Contoh: Budi Santoso"
                          value={formData.headOfFamily} 
                          onChange={(v: any) => setFormData({...formData, headOfFamily: v})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-black mb-4 text-slate-400 uppercase tracking-[0.2em]">Gender <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 gap-4">
                           {['Laki-laki', 'Perempuan'].map((g) => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => setFormData({...formData, gender: g as any})}
                               className={`py-5 rounded-3xl text-sm font-black uppercase tracking-widest border transition-all ${
                                 formData.gender === g 
                                   ? 'bg-slate-950 text-white border-slate-950 shadow-2xl shadow-black/20' 
                                   : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-white hover:border-slate-300'
                               }`}
                             >
                               {g}
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="md:col-span-6">
                        <FormField 
                          label="No. NIK (KTP)" 
                          required 
                          placeholder="16 Digit Nomor Induk"
                          value={formData.nik} 
                          onChange={(v: any) => setFormData({...formData, nik: v})} 
                          maxLength={16}
                        />
                      </div>
                      <div className="md:col-span-6">
                        <FormField 
                          label="No. Kartu Keluarga" 
                          required 
                          placeholder="16 Digit Nomor KK"
                          value={formData.kkNumber} 
                          onChange={(v: any) => setFormData({...formData, kkNumber: v})} 
                          maxLength={16}
                        />
                      </div>

                       <div className="md:col-span-6">
                        <FormField 
                          label="Tempat Lahir" 
                          required 
                          placeholder="Kota Kelahiran"
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

                  {/* Residence Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                       
                       <div className="flex items-center gap-6 mb-12 relative z-10">
                          <div className="p-5 bg-emerald-600 text-white rounded-[2rem] shadow-2xl shadow-emerald-600/20 -rotate-3 transition-transform group-hover:rotate-0 duration-700">
                            <Home size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Alamat Domisili</h3>
                            <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Lokasi hunian dalam koordinat RT 02</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-10 relative z-10">
                        <FormField 
                          label="Blok" 
                          required 
                          placeholder="A/B/C..."
                          value={formData.block} 
                          onChange={(v: any) => setFormData({...formData, block: v})} 
                        />
                        <FormField 
                          label="Nomor" 
                          required 
                          placeholder="00"
                          value={formData.number} 
                          onChange={(v: any) => setFormData({...formData, number: v})} 
                        />
                        <div className="col-span-2">
                          <label className="block text-[11px] font-black mb-4 text-slate-400 uppercase tracking-[0.2em]">Status Hunian</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                             {['Tetap', 'Rumah Keluarga', 'Kontrak', 'Kost'].map((st) => (
                               <button
                                 key={st}
                                 type="button"
                                 onClick={() => setFormData({...formData, residenceType: st as any})}
                                 className={`py-4 px-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all ${
                                   formData.residenceType === st 
                                     ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xl shadow-emerald-600/30 ring-4 ring-emerald-500/10' 
                                     : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                                 }`}
                               >
                                 {st === 'Rumah Keluarga' ? 'Keluarga' : st}
                               </button>
                             ))}
                          </div>
                        </div>
                        <div className="col-span-2 mt-2">
                          <FormField 
                            label="Alamat KTP Lengkap" 
                            required 
                            placeholder="Tuliskan sesuai dokumen..."
                            multiline
                            value={formData.addressKtp} 
                            onChange={(v: any) => setFormData({...formData, addressKtp: v})} 
                          />
                        </div>
                       </div>
                    </div>

                    <div className="space-y-12 flex flex-col">
                       <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group flex-1">
                         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                         
                         <div className="flex items-center gap-6 mb-12 relative z-10">
                           <div className="p-5 bg-rose-500 text-white rounded-[2rem] shadow-2xl shadow-rose-600/20 rotate-6 group-hover:rotate-0 transition-transform duration-700">
                             <Phone size={28} strokeWidth={2.5} />
                           </div>
                           <div>
                             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Komunikasi</h3>
                             <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Saluran koordinasi antar warga</p>
                           </div>
                         </div>
                         <div className="relative z-10">
                            <FormField 
                              label="No. WhatsApp Aktif" 
                              placeholder="08xxxxxxxxxx"
                              value={formData.phone} 
                              onChange={(v: any) => setFormData({...formData, phone: v})} 
                            />
                         </div>
                       </div>

                       <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/[0.15] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-600/20 transition-colors duration-1000"></div>
                         <div className="relative z-10 space-y-10">
                           <div className="flex items-center gap-6">
                              <div className="p-5 bg-white/10 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-2xl">
                                <Shield size={28} className="text-indigo-400" strokeWidth={2.5} />
                              </div>
                              <div>
                                <h3 className="text-2xl font-black uppercase tracking-widest tracking-tight">E-Warga Access</h3>
                                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">Akses portal mandiri untuk warga</p>
                              </div>
                           </div>
                           
                           <div className="flex flex-col sm:flex-row gap-6">
                             <div className="relative flex-1 group/pin">
                               <input 
                                 className="w-full py-6 px-8 bg-white/5 border border-white/10 rounded-[2rem] text-3xl font-black text-white focus:bg-white/10 focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/10 transition-all outline-none text-center tracking-[1em] placeholder:text-white/5" 
                                 value={formData.accessCode} 
                                 onChange={e => setFormData({...formData, accessCode: e.target.value})} 
                                 placeholder="000000" 
                               />
                               <div className="absolute inset-0 rounded-[2rem] border-2 border-transparent group-focus-within/pin:border-indigo-400/30 pointer-events-none"></div>
                             </div>
                             <button 
                               type="button"
                               onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                               className="py-6 px-10 bg-indigo-600 text-white rounded-[2rem] hover:bg-white hover:text-indigo-600 font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-600/40 active:scale-95"
                             >
                               Generate
                             </button>
                           </div>
                           <div className="flex items-start gap-4">
                              <AlertCircle size={16} className="text-indigo-400 mt-1" />
                              <p className="text-[11px] text-slate-500 font-bold leading-relaxed">Berikan PIN ini kepada warga untuk proses aktivasi aplikasi. Jaga kerahasiaan PIN demi keamanan data warga.</p>
                           </div>
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
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Demographics Card */}
                  <div className="lg:col-span-12 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-6 mb-12 relative z-10">
                      <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-600/20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Activity size={28} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Dimensi Sosio-Ekonomi</h3>
                        <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dinamika kesejahteraan dan latar belakang warga</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                      <div className="space-y-4">
                        <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none"
                          value={formData.education} 
                          onChange={e => setFormData({...formData, education: e.target.value})}
                          required
                        >
                          <option value="">Pilih Jenjang...</option>
                          {['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map(edu => (
                            <option key={edu} value={edu}>{edu}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Sektor Pekerjaan <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none"
                          value={formData.jobCategory} 
                          onChange={e => setFormData({...formData, jobCategory: e.target.value})}
                          required
                        >
                          <option value="">Pilih Sektor...</option>
                          <option value="PNS">PNS / TNI / Polri</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                          <option value="Freelance">Pekerja Lepas / Freelance</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                        </select>
                      </div>
                      <FormField 
                        label="Agama" 
                        required 
                        placeholder="Contoh: Islam"
                        value={formData.religion} 
                        onChange={(v: any) => setFormData({...formData, religion: v})} 
                      />
                      <FormField 
                        label="Jabatan / Profesi Spesifik" 
                        placeholder="Contoh: Arsitek"
                        value={formData.job} 
                        onChange={(v: any) => setFormData({...formData, job: v})} 
                      />
                      <div className="space-y-4">
                        <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Kemandirian Ekonomi</label>
                        <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none" value={formData.economicStatus} onChange={e => setFormData({...formData, economicStatus: e.target.value as any})}>
                          <option value="Pra-Sejahtera">Pra-Sejahtera (Subsidi)</option>
                          <option value="Sejahtera">Sejahtera</option>
                          <option value="Mampu">Mampu / Mandiri</option>
                        </select>
                      </div>
                      <FormField 
                        label="Kepemilikan Kendaraan" 
                        type="number"
                        placeholder="0"
                        value={formData.vehicleCount} 
                        onChange={(v: any) => setFormData({...formData, vehicleCount: parseInt(v) || 0})} 
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-3 bg-rose-600/10"></div>
                    <div className="flex items-center gap-6 mb-12">
                       <div className="p-5 bg-rose-500 text-white rounded-[2rem] shadow-2xl shadow-rose-600/20 -rotate-6 group-hover:rotate-0 transition-transform duration-700">
                         <DollarSign size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Jaringan Pengaman Sosial</h3>
                         <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Status keikutsertaan program bantuan pemerintah</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                      <BansosCard 
                        label="Keikutsertaan PKH" 
                        checked={formData.isPKH} 
                        onChange={c => setFormData({...formData, isPKH: c})} 
                      />
                      <BansosCard 
                        label="Penerima BLT" 
                        checked={formData.isBLT} 
                        onChange={c => setFormData({...formData, isBLT: c})} 
                      />
                      <BansosCard 
                        label="Program BPNT" 
                        checked={formData.isBPNT} 
                        onChange={c => setFormData({...formData, isBPNT: c})} 
                      />
                      <div className="space-y-6">
                        <BansosCard 
                          label="Program Bantuan Lain" 
                          checked={formData.isBansosLain} 
                          onChange={c => setFormData({...formData, isBansosLain: c})} 
                        />
                        <AnimatePresence>
                          {formData.isBansosLain && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0, marginTop: 0 }} 
                              animate={{ opacity: 1, height: 'auto', marginTop: 12 }} 
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <input 
                                placeholder="Tuliskan nama program bantuan..." 
                                className="w-full p-6 bg-rose-50 border border-rose-100 rounded-[1.5rem] text-[12px] font-black text-rose-950 focus:ring-8 focus:ring-rose-500/5 focus:border-rose-400 transition-all outline-none"
                                value={formData.bansosLainName}
                                onChange={e => setFormData({...formData, bansosLainName: e.target.value})}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-3 bg-amber-600/10"></div>
                     <div className="flex items-center gap-6 mb-12">
                       <div className="p-5 bg-amber-500 text-white rounded-[2rem] shadow-2xl shadow-amber-600/20 rotate-6 group-hover:rotate-0 transition-transform duration-700">
                         <Heart size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Kesehatan</h3>
                         <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Cakupan akses kesehatan keluarga</p>
                       </div>
                    </div>

                    <div className="space-y-10 relative z-10">
                      <div className="space-y-4">
                        <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Kategori BPJS</label>
                        <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none" value={formData.bpjsStatus} onChange={e => setFormData({...formData, bpjsStatus: e.target.value as any})}>
                          <option value="Tidak Ada">Belum Terdaftar</option>
                          <option value="PPU">PPU (Pekerja)</option>
                          <option value="PBPU">PBPU (Mandiri)</option>
                          <option value="PBI">PBI (Pemerintah)</option>
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Vaksinasi Terakhir</label>
                        <select className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none" value={formData.vaccinationStatus} onChange={e => setFormData({...formData, vaccinationStatus: e.target.value as any})}>
                          <option value="Belum">Belum Terdata</option>
                          <option value="Dosis 1">Dosis 1</option>
                          <option value="Dosis 2">Dosis 2 (Primer)</option>
                          <option value="Booster">Booster Terpenuhi</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeFormTab === 'family' && (
              <motion.div 
                key="family"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-12"
              >
                <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm gap-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-center gap-8 relative z-10">
                    <div className="p-6 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl shadow-black/30 group-hover:rotate-12 transition-transform duration-700">
                      <Users size={36} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Sinergi Keluarga</h3>
                      <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2.5 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                        {formData.familyMembers.length} Personel Terdaftar
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      familyMembers: [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki' }]
                    })}
                    className="w-full lg:w-auto px-16 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-[13px] uppercase tracking-widest hover:bg-slate-950 transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-5 active:scale-95 group/add"
                  >
                    <UserPlus size={22} strokeWidth={3} className="group-hover/add:scale-110 transition-transform" /> 
                    Registrasi Anggota
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12">
                  {formData.familyMembers.map((member: any, idx: number) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={member.id || idx} 
                      className="p-12 bg-white rounded-[4rem] border border-slate-100 space-y-10 relative group hover:border-indigo-300 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-48 h-48 bg-slate-50 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                      
                      <button 
                        type="button"
                        onClick={() => {
                          const newMembers = [...formData.familyMembers];
                          newMembers.splice(idx, 1);
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                        className="absolute top-10 right-10 p-4 text-slate-300 hover:text-white hover:bg-rose-500 transition-all rounded-[1.5rem] bg-slate-50 group-hover:bg-rose-100 group-hover:text-rose-500 hover:rotate-12"
                      >
                        <X size={22} strokeWidth={3} />
                      </button>
                      
                      <div className="space-y-8 relative z-10">
                        <div className="flex items-center gap-5 mb-4">
                           <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl shadow-indigo-600/20">
                             {idx + 1}
                           </div>
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-sm">Profil Anggota</h4>
                        </div>

                        <FormField 
                          label="Nama Lengkap" 
                          placeholder="Masukkan nama lengkap" 
                          value={member.name}
                          onChange={(v: any) => {
                            const newMembers = [...formData.familyMembers];
                            newMembers[idx].name = v;
                            setFormData({...formData, familyMembers: newMembers});
                          }}
                        />
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Hubungan</label>
                            <select 
                              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                              value={member.relation}
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
                          </div>
                          <div className="space-y-4">
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                            <select 
                              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                              value={member.gender || 'Laki-laki'}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].gender = e.target.value as any;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                        </div>
                        <FormField 
                          label="Nomor Induk Kependudukan" 
                          placeholder="NIK 16 Digit" 
                          value={member.nik}
                          onChange={(v: any) => {
                            const newMembers = [...formData.familyMembers];
                            newMembers[idx].nik = v;
                            setFormData({...formData, familyMembers: newMembers});
                          }}
                          maxLength={16}
                        />
                      </div>
                    </motion.div>
                  ))}
                  
                  {formData.familyMembers.length === 0 && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="md:col-span-2 text-center p-32 bg-slate-50/50 border-4 border-dashed border-slate-200 rounded-[5rem] group hover:border-indigo-300 transition-all"
                    >
                      <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center text-slate-200 mx-auto mb-10 shadow-2xl shadow-slate-200/40 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                        <Users size={64} strokeWidth={2} />
                      </div>
                      <h4 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em]">Keluarga Belum Diinput</h4>
                      <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-4">Sistem mendeteksi hunian ini sebagai kepala keluarga tunggal</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-12 border-t border-slate-100 flex justify-between items-center px-6">
          <div className="flex gap-6">
            {activeFormTab !== 'basic' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeFormTab === 'demographics') setActiveFormTab('basic');
                  if (activeFormTab === 'family') setActiveFormTab('demographics');
                }}
                className="px-12 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 shadow-sm"
              >
                Kembali
              </button>
            )}
          </div>

          <div className="flex gap-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-12 py-5 text-[12px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Batal
            </button>
            {activeFormTab !== 'family' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-14 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[12px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-4 shadow-2xl shadow-indigo-500/20 active:scale-95"
              >
                Halaman Berikutnya <ChevronRight size={18} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="px-20 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.2em] hover:bg-slate-950 transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 flex items-center gap-4"
              >
                <CheckCircle size={24} /> {editingHouseId ? 'Simpan Perubahan' : 'Selesaikan Pendaftaran'}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

// UI Helpers
const FormField = ({ label, value, onChange, placeholder, type = 'text', required = false, multiline = false, maxLength }: any) => (
  <div className="w-full group/field">
    <label className="block text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest group-focus-within/field:text-indigo-600 transition-colors">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {multiline ? (
      <textarea 
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-[13px] font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm focus:bg-white resize-none placeholder:text-slate-300"
      />
    ) : (
      <input 
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[13px] font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm focus:bg-white placeholder:text-slate-300"
      />
    )}
  </div>
);

const BansosCard = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <label className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${checked ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/20' : 'bg-slate-50 border-slate-100 hover:border-indigo-300 hover:bg-white'}`}>
    {checked && (
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
    )}
    <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${checked ? 'bg-white border-white scale-110 shadow-lg' : 'bg-white border-slate-200 group-hover:border-indigo-400 group-hover:rotate-6'}`}>
      {checked ? <CheckCircle size={16} className="text-indigo-600" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-100 rounded-full"></div>}
      <input 
        type="checkbox" 
        className="hidden"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </div>
    <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-slate-500'}`}>{label}</span>
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
  targetMonth: string;
  setTargetMonth: (month: string) => void;
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
  targetMonth,
  setTargetMonth,
  payNotes,
  setPayNotes,
  payerName,
  setPayerName,
  handleSavePayment,
  getIndonesianMonthYear
}) => {
  const { getArrearsForHouse, getPaymentStatus } = useFinancial();
  if (!payHouse) return null;

  const arrears = getArrearsForHouse(payHouse);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rekam Pembayaran Iuran" maxWidth="max-w-5xl">
      <div className="space-y-10 py-6">
        {/* House Info Summary */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-8">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center text-4xl font-black border border-white/20 font-mono shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-700">
                {payHouse.block}-{payHouse.number}
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400">Kepala Keluarga</p>
                <h3 className="text-3xl font-black tracking-tight">{payHouse.headOfFamily}</h3>
                <div className="flex gap-3 mt-4">
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                    {payHouse.status === 'Occupied' ? 'Dihuni' : payHouse.status === 'Empty' ? 'Kosong' : 'Tempat Usaha'}
                  </span>
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                    {payHouse.residenceType}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Akumulasi Tunggakan</p>
              <div className={`text-4xl font-black tracking-tighter ${arrears.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {arrears.length === 0 ? 'TERVALIDASI LUNAS' : `${arrears.length} Periode Bulan`}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-12">
          {/* Arrears Selection */}
          {arrears.length > 0 && (
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-3 bg-rose-600/10"></div>
              <div className="flex items-center gap-6 mb-10">
                <div className="p-5 bg-rose-50 text-rose-600 rounded-[2rem] shadow-xl shadow-rose-600/5 border border-rose-100 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                  <History size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Penentuan Periode</h3>
                  <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Pilih bulan yang ingin diselesaikan pembayarannya</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                {arrears.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setTargetMonth(month)}
                    className={`px-8 py-5 rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.1em] transition-all ${
                      targetMonth === month
                        ? 'bg-rose-600 text-white shadow-2xl shadow-rose-600/30 scale-105'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-rose-300 hover:bg-white'
                    }`}
                  >
                    {month}
                  </button>
                ))}
                <div className="w-full mt-6 pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center gap-6">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-6 py-2 rounded-full">Opsi Periode Lain:</p>
                  <select 
                    className="flex-1 sm:flex-none w-full sm:w-64 bg-slate-100 p-5 rounded-[1.25rem] text-[13px] font-black text-slate-600 outline-none hover:bg-slate-200 transition-all cursor-pointer border border-transparent focus:border-indigo-400"
                    value={targetMonth}
                    onChange={e => setTargetMonth(e.target.value)}
                  >
                    {generateMonthOptions(12, 36).map((m: string) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-3 bg-emerald-600/10"></div>
            <div className="flex items-center gap-6 mb-12">
               <div className="p-5 bg-emerald-50 text-emerald-600 rounded-[2rem] shadow-xl shadow-emerald-600/5 border border-emerald-100 -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                 <DollarSign size={24} strokeWidth={2.5} />
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Detail Transaksi</h3>
                 <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Lengkapi rincian nominal dan data pendukung</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Instrumen Iuran <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[14px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none" 
                  value={payType} 
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Sampah & Air (Sepaket)</option>
                  <option value="Sampah">Iuran Sampah Saja</option>
                  <option value="Air">Iuran Air Saja</option>
                </select>
              </div>
              <FormField 
                label="Nominal Pembayaran (Rp)" 
                type="number" 
                required
                placeholder="Masukkan jumlah Rupiah"
                value={payAmount} 
                onChange={setPayAmount} 
              />
              <div className="space-y-4">
                <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Waktu Transaksi <span className="text-rose-500">*</span></label>
                <div className="flex gap-4">
                  <input 
                    type="date"
                    required
                    className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-[14px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none" 
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setPayDate(new Date().toISOString().split('T')[0])}
                    className="px-8 py-5 bg-slate-100 text-slate-500 rounded-[1.25rem] hover:bg-slate-950 hover:text-white font-black text-[11px] uppercase tracking-widest transition-all shadow-sm"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>
              <FormField 
                label="Nama Penyetor" 
                placeholder={`Otomatis: ${payHouse.headOfFamily}`}
                value={payerName} 
                onChange={setPayerName} 
              />
              <div className="md:col-span-2">
                <FormField 
                  label="Memorandum / Catatan" 
                  placeholder="Contoh: Pembayaran dimajukan, titipan melalui kurir, dll..."
                  multiline
                  value={payNotes} 
                  onChange={setPayNotes} 
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row gap-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black text-[13px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batalkan
            </button>
            <button 
              type="submit"
              className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.2em] hover:bg-slate-950 transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 flex items-center justify-center gap-4"
            >
               <CheckCircle size={24} /> Konfirmasi Pembayaran
            </button>
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
      <div className="space-y-10 py-6">
        {/* Payment Headline */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl group">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
              <div className="flex items-center gap-10">
                 <div className="w-28 h-28 bg-white/10 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center text-4xl border border-white/20 font-black font-mono shadow-2xl group-hover:scale-110 transition-transform duration-700">
                    {editingPayment.block}-{editingPayment.number}
                 </div>
                 <div className="space-y-3">
                    <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em]">Koreksi Transaksi</p>
                    <h3 className="text-4xl font-black tracking-tighter italic">{editingPayment.headOfFamily}</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20">{editingPayment.month}</span>
                       <span className="text-[11px] text-white/30 font-black uppercase tracking-widest border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">LOG ID: #{editingPayment.id?.slice(-8).toUpperCase()}</span>
                    </div>
                 </div>
              </div>
              <div className="flex flex-col items-center md:items-end bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/10">
                 <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.4em] mb-3">Nominal Tercatat</p>
                 <div className="text-5xl font-black tracking-tighter text-indigo-100">
                    Rp {parseInt(editingPayment.amount).toLocaleString('id-ID')}
                 </div>
              </div>
           </div>
        </div>

        <form onSubmit={handleUpdatePayment} className="space-y-12">
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-3 bg-indigo-600/10"></div>
            <div className="flex items-center gap-6 mb-12">
              <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] border border-indigo-100 shadow-xl shadow-indigo-600/5 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                <Edit2 size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Parameter Pembaruan</h3>
                <p className="text-[12px] text-slate-400 font-bold uppercase tracking-widest mt-2">Modifikasi detail iuran yang telah diverifikasi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Kategori Iuran <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-[14px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                  value={payType}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Sampah & Air (Paket)</option>
                  <option value="Sampah">Iuran Sampah Saja</option>
                  <option value="Air">Iuran Air Saja</option>
                </select>
              </div>
              
              <FormField 
                label="Nominal Revisi (Rp)" 
                type="number" 
                required
                value={payAmount} 
                onChange={setPayAmount} 
              />

              <div className="space-y-4">
                <label className="block text-[11px] font-black mb-1 text-slate-400 uppercase tracking-widest">Tanggal Perubahan <span className="text-rose-500">*</span></label>
                <div className="flex gap-4">
                  <input 
                    type="date"
                    required
                    className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-[14px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setPayDate(new Date().toISOString().split('T')[0])}
                    className="px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] hover:bg-indigo-600 font-black text-[12px] uppercase tracking-widest transition-all shadow-xl shadow-black/10"
                  >
                    Hari Ini
                  </button>
                </div>
              </div>

              <FormField 
                label="Entitas Penyetor" 
                placeholder={`Default: ${editingPayment.headOfFamily}`}
                value={payerName} 
                onChange={setPayerName} 
              />

              <div className="md:col-span-2">
                <FormField 
                  label="Log Perubahan / Catatan" 
                  placeholder="Alasan perubahan atau catatan tambahan..."
                  multiline
                  value={payNotes} 
                  onChange={setPayNotes} 
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-6 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black text-[13px] uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batalkan
            </button>
            <button 
              type="submit" 
              className="flex-[2] py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.3em] hover:bg-slate-950 transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 flex items-center justify-center gap-5"
            >
              <CheckCircle size={24} /> Simpan Perubahan Data
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

