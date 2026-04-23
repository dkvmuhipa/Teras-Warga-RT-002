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
    <Modal isOpen={isOpen} onClose={onClose} title={editingHouseId ? "Edit Profil" : "Warga Baru"} maxWidth="max-w-4xl">
      <form onSubmit={onFormSubmit} className="space-y-6 py-2 px-2">
        {/* Modern Tab Navigation - Compact */}
        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/60 backdrop-blur-xl sticky top-0 z-20 mx-auto max-w-sm shadow-xl shadow-slate-200/10">
          {[
            { id: 'basic', label: 'Dasar', icon: Home },
            { id: 'demographics', label: 'Demograf', icon: Activity },
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
              className={`flex-1 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                activeFormTab === tab.id ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-600/5' : 'text-slate-400 hover:text-indigo-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-700 ${
                activeFormTab === tab.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                <tab.icon size={12} />
              </div>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeFormTab === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Main Identity Section */}
                <div className="lg:col-span-12 space-y-8">
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                       <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                         <User size={20} strokeWidth={2.5} />
                       </div>
                       <div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Identitas Dasar</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Data sesuai KTP/KK untuk RT</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
                      <div className="md:col-span-8">
                        <FormField 
                          label="Kepala Keluarga" 
                          required 
                          placeholder="Nama Lengkap"
                          value={formData.headOfFamily} 
                          onChange={(v: any) => setFormData({...formData, headOfFamily: v})} 
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">Gender <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Laki-laki', 'Perempuan'].map((g) => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => setFormData({...formData, gender: g as any})}
                               className={`py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                                 formData.gender === g 
                                   ? 'bg-slate-950 text-white border-slate-950 shadow-lg shadow-black/10' 
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Demographics Card */}
                  <div className="lg:col-span-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/20">
                        <Activity size={20} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Socio-Ekonomi</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dinamika kesejahteraan keluarga</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendidikan <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none"
                          value={formData.education} 
                          onChange={e => setFormData({...formData, education: e.target.value})}
                          required
                        >
                          <option value="">Jenjang...</option>
                          {['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map(edu => (
                            <option key={edu} value={edu}>{edu}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pekerjaan <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none"
                          value={formData.jobCategory} 
                          onChange={e => setFormData({...formData, jobCategory: e.target.value})}
                          required
                        >
                          <option value="">Sektor...</option>
                          <option value="PNS">PNS / TNI / Polri</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta</option>
                          <option value="Freelance">Freelance</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Tidak Bekerja">Tidak Bekerja</option>
                        </select>
                      </div>
                      <FormField 
                        label="Agama" 
                        required 
                        value={formData.religion} 
                        onChange={(v: any) => setFormData({...formData, religion: v})} 
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="p-4 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-600/20">
                           <DollarSign size={20} strokeWidth={2.5} />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Bantuan Sosial</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-3 relative z-10">
                        <BansosCard label="PKH" checked={formData.isPKH} onChange={c => setFormData({...formData, isPKH: c})} />
                        <BansosCard label="BLT" checked={formData.isBLT} onChange={c => setFormData({...formData, isBLT: c})} />
                        <BansosCard label="BPNT" checked={formData.isBPNT} onChange={c => setFormData({...formData, isBPNT: c})} />
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
                       <div className="flex items-center gap-4 mb-8">
                         <div className="p-4 bg-amber-500 text-white rounded-2xl shadow-xl shadow-amber-600/20">
                           <Heart size={20} strokeWidth={2.5} />
                         </div>
                         <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Kesehatan</h3>
                      </div>

                      <div className="space-y-6 relative z-10">
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">BPJS</label>
                          <select className="w-full p-4.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 outline-none" value={formData.bpjsStatus} onChange={e => setFormData({...formData, bpjsStatus: e.target.value as any})}>
                            <option value="Tidak Ada">Tidak Ada</option>
                            <option value="PPU">PPU</option>
                            <option value="PBPU">PBPU</option>
                            <option value="PBI">PBI</option>
                          </select>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-4 bg-slate-950 text-white rounded-2xl shadow-xl">
                      <Users size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Anggota Keluarga</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                        {formData.familyMembers.length} Orang Terdaftar
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      familyMembers: [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki' }]
                    })}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-950 transition-all flex items-center gap-3"
                  >
                    <UserPlus size={16} strokeWidth={3} /> Tambah
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                  {formData.familyMembers.map((member: any, idx: number) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={member.id || idx} 
                      className="p-8 bg-white rounded-3xl border border-slate-100 space-y-6 relative group overflow-hidden"
                    >
                      <button 
                        type="button"
                        onClick={() => {
                          const newMembers = [...formData.familyMembers];
                          newMembers.splice(idx, 1);
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg bg-slate-50"
                      >
                        <X size={18} strokeWidth={3} />
                      </button>
                      
                      <div className="space-y-6 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-base">
                             {idx + 1}
                           </div>
                           <h4 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Anggota {idx + 1}</h4>
                        </div>

                        <FormField 
                          label="Nama" 
                          value={member.name}
                          onChange={(v: any) => {
                            const newMembers = [...formData.familyMembers];
                            newMembers[idx].name = v;
                            setFormData({...formData, familyMembers: newMembers});
                          }}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Hubungan</label>
                            <select 
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-black text-slate-700 outline-none"
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
                              <option value="Famili Lain">Famili Lain</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">NIK</label>
                            <input 
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-black text-slate-700 outline-none"
                              value={member.nik}
                              maxLength={16}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].nik = e.target.value;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {formData.familyMembers.length === 0 && (
                    <motion.div 
                      layout
                      className="md:col-span-2 text-center p-16 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl"
                    >
                      <h4 className="text-xl font-black text-slate-300 uppercase tracking-widest">Belum ada anggota</h4>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-4 pb-2">
          <div className="flex gap-4">
            {activeFormTab !== 'basic' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeFormTab === 'demographics') setActiveFormTab('basic');
                  if (activeFormTab === 'family') setActiveFormTab('demographics');
                }}
                className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200"
              >
                Kembali
              </button>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3.5 text-[11px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"
            >
              Batal
            </button>
            {activeFormTab !== 'family' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                Lanjut <ChevronRight size={14} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="px-12 py-4 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-950 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2"
              >
                <CheckCircle size={20} /> {editingHouseId ? 'Simpan' : 'Daftar'}
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
    <label className="block text-[9px] font-black mb-2 text-slate-400 uppercase tracking-widest group-focus-within/field:text-indigo-600 transition-colors">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {multiline ? (
      <textarea 
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm focus:bg-white resize-none placeholder:text-slate-300"
      />
    ) : (
      <input 
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[12px] font-black text-slate-700 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm focus:bg-white placeholder:text-slate-300"
      />
    )}
  </div>
);

const BansosCard = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${checked ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-slate-50 border-slate-100 hover:border-indigo-300 hover:bg-white'}`}>
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-white border-white scale-110 shadow-sm' : 'bg-white border-slate-200 group-hover:border-indigo-400'}`}>
      {checked ? <CheckCircle size={12} className="text-indigo-600" strokeWidth={3} /> : <div className="w-1 h-1 bg-slate-100 rounded-full"></div>}
      <input 
        type="checkbox" 
        className="hidden"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </div>
    <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${checked ? 'text-white' : 'text-slate-500'}`}>{label}</span>
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
    <Modal isOpen={isOpen} onClose={onClose} title="Rekam Iuran" maxWidth="max-w-4xl">
      <div className="space-y-6 py-2 px-2">
        {/* House Info Summary */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/[0.03] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-2xl font-black border border-white/20 font-mono shadow-xl">
                {payHouse.block}-{payHouse.number}
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Kepala Keluarga</p>
                <h3 className="text-xl font-black tracking-tight">{payHouse.headOfFamily}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">
                    {payHouse.status === 'Occupied' ? 'Dihuni' : payHouse.status === 'Empty' ? 'Kosong' : 'Ekonomi'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center md:text-right bg-white/5 backdrop-blur-xl p-4 rounded-2xl border border-white/10 min-w-[200px]">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Tunggakan</p>
              <div className={`text-2xl font-black tracking-tighter ${arrears.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {arrears.length === 0 ? 'LUNAS' : `${arrears.length} Periode`}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePayment} className="space-y-6">
          {/* Arrears Selection */}
          {arrears.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl shadow-sm border border-rose-100">
                  <History size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Pilih Periode</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Selesaikan tunggakan iuran</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {arrears.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setTargetMonth(month)}
                    className={`px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      targetMonth === month
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-rose-300'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
               <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100">
                 <DollarSign size={18} strokeWidth={2.5} />
               </div>
               <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Detail Transaksi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori Iuran <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 outline-none" 
                  value={payType} 
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Sampah & Air</option>
                  <option value="Sampah">Hanya Sampah</option>
                  <option value="Air">Hanya Air</option>
                </select>
              </div>
              <FormField label="Nominal (Rp)" type="number" required value={payAmount} onChange={setPayAmount} />
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal <span className="text-rose-500">*</span></label>
                <div className="flex gap-2">
                  <input type="date" required className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 outline-none" value={payDate} onChange={e => setPayDate(e.target.value)} />
                </div>
              </div>
              <FormField label="Penyetor" value={payerName} onChange={setPayerName} />
              <div className="md:col-span-2">
                <FormField label="Catatan" placeholder="Catatan transaksi..." multiline value={payNotes} onChange={setPayNotes} />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-200 transition-all">
              Batal
            </button>
            <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-950 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
               <CheckCircle size={18} /> Konfirmasi
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
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Transaksi" maxWidth="max-w-4xl">
      <div className="space-y-6 py-2 px-2">
        {/* Payment Headline */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl group">
           <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-2xl border border-white/20 font-black font-mono shadow-xl">
                    {editingPayment.block}-{editingPayment.number}
                 </div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Koreksi Data</p>
                    <h3 className="text-xl font-black tracking-tight">{editingPayment.headOfFamily}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="px-3 py-1 bg-indigo-600/50 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{editingPayment.month}</span>
                    </div>
                 </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[200px] text-right">
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Nominal</p>
                 <div className="text-2xl font-black tracking-tighter text-indigo-100">
                    Rp {parseInt(editingPayment.amount).toLocaleString('id-ID')}
                 </div>
              </div>
           </div>
        </div>

        <form onSubmit={handleUpdatePayment} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Edit2 size={18} strokeWidth={2.5} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">Parameter Revisi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori <span className="text-rose-500">*</span></label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 outline-none"
                  value={payType}
                  onChange={e => setPayType(e.target.value as any)}
                >
                  <option value="Both">Iuran Paket</option>
                  <option value="Sampah">Sampah Saja</option>
                  <option value="Air">Air Saja</option>
                </select>
              </div>
              <FormField label="Nominal" type="number" required value={payAmount} onChange={setPayAmount} />
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal <span className="text-rose-500">*</span></label>
                <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-700 outline-none" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
              <FormField label="Penyetor" value={payerName} onChange={setPayerName} />
              <div className="md:col-span-2">
                <FormField label="Alasan Revisi" multiline value={payNotes} onChange={setPayNotes} />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-200 transaction-all">
              Batal
            </button>
            <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-black text-[12px] uppercase tracking-widest hover:bg-slate-950 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3">
               <CheckCircle size={18} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

