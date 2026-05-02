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
    <Modal isOpen={isOpen} onClose={onClose} title={editingHouseId ? "Edit Profil Warga" : "Pendaftaran Warga Baru"} maxWidth="max-w-6xl">
      <form onSubmit={onFormSubmit} className="space-y-12 py-4 px-4">
        {/* Modern Tab Navigation - More Refined */}
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 sticky top-0 z-30 mx-auto max-w-xl shadow-xl shadow-slate-200/20 backdrop-blur-md bg-opacity-80">
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
              className={`flex-1 px-4 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative z-10 ${
                activeFormTab === tab.id ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10' : 'text-slate-500 hover:text-indigo-400'
              }`}
            >
              <tab.icon size={14} className={activeFormTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              <span className="hidden md:inline">{tab.label}</span>
              {idx < 2 && (
                <div className="hidden md:block absolute -right-1.5 top-1/2 -translate-y-1/2 text-slate-300">
                  <ChevronRight size={12} />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[600px]">
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
                <div className="lg:col-span-12 space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                      <div className="flex items-center gap-4">
                         <div className="p-4 bg-slate-950 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/10">
                           <User size={24} />
                         </div>
                         <div>
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">Data Personal</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Sesuai Dokumen Kependudukan (KTP/KK)</p>
                         </div>
                      </div>

                      {role === Role.ADMIN && (
                        <div className="flex items-center gap-3 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-3 pr-2">Status Akun:</span>
                          <button
                            type="button"
                            onClick={() => setFormData({...formData, isVerified: !formData.isVerified})}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              formData.isVerified 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                : 'bg-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            <ShieldCheck size={14} />
                            {formData.isVerified ? 'Tersahkankan' : 'Belum Sah'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
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
                        <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Gender <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                           {['Laki-laki', 'Perempuan'].map((g) => (
                             <button
                               key={g}
                               type="button"
                               onClick={() => setFormData({...formData, gender: g as any})}
                               className={`py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all ${
                                 formData.gender === g 
                                   ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                   : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'
                               }`}
                             >
                               {g}
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

                  {/* Residence Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                       <div className="flex items-center gap-4 mb-10 relative z-10">
                          <div className="p-3 bg-slate-950 text-white rounded-xl">
                            <Home size={20} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Domisili</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Lokasi hunian di RT 02</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6 relative z-10">
                        <FormField 
                          label="Blok" 
                          required 
                          placeholder="A/B..."
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
                          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Status Hunian</label>
                          <div className="grid grid-cols-4 gap-2">
                             {['Tetap', 'Keluarga', 'Kontrak', 'Kost'].map((st) => (
                               <button
                                 key={st}
                                 type="button"
                                 onClick={() => setFormData({...formData, residenceType: st as any})}
                                 className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                                   formData.residenceType === (st === 'Keluarga' ? 'Rumah Keluarga' : st) 
                                     ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                                     : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'
                                 }`}
                               >
                                 {st}
                               </button>
                             ))}
                          </div>
                        </div>

                        {formData.residenceType !== 'Tetap' && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="col-span-2 grid grid-cols-2 gap-4 overflow-hidden"
                          >
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
                          </motion.div>
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
                           <p className="text-[9px] text-slate-400 mt-2 italic">* Digunakan untuk acuan perhitungan tunggakan iuran.</p>
                        </div>
                       </div>
                    </div>

                    <div className="space-y-8 flex flex-col">
                       <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group flex-1">
                         <div className="flex items-center gap-4 mb-8 relative z-10">
                           <div className="p-3 bg-emerald-600 text-white rounded-xl">
                             <Phone size={20} />
                           </div>
                           <div>
                             <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider">Kontak</h3>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Media komunikasi warga</p>
                           </div>
                         </div>
                         <div className="relative z-10">
                            <FormField 
                              label="Nomor WhatsApp" 
                              placeholder="08..."
                              value={formData.phone} 
                              onChange={(v: any) => setFormData({...formData, phone: v})} 
                            />
                         </div>
                       </div>

                       <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden group">
                         <div className="relative z-10 space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                                <Shield size={20} className="text-indigo-400" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold uppercase tracking-wider">Akses Portal</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">PIN Aktivasi Aplikasi</p>
                              </div>
                           </div>
                           
                           <div className="flex gap-4">
                             <input 
                               className="flex-1 py-4 px-6 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold text-white focus:bg-white/10 focus:border-indigo-400 transition-all outline-none text-center tracking-widest" 
                               value={formData.accessCode ?? ''} 
                               onChange={e => setFormData({...formData, accessCode: e.target.value})} 
                               placeholder="XXXXXX" 
                             />
                             <button 
                               type="button"
                               onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                               className="px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold text-[10px] uppercase tracking-widest transition-all"
                             >
                               Generate
                             </button>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center gap-4 mb-12 relative z-10">
                    <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-500/10">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Karakteristik Sosio-Ekonomi</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Latar belakang pendidikan, pekerjaan, dan kepercayaan</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest pl-1">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                        value={formData.education ?? ''} 
                        onChange={e => setFormData({...formData, education: e.target.value})}
                      >
                        <option value="">Pilih Jenjang...</option>
                        {['SD', 'SMP', 'SMA/SMK', 'D3', 'S1', 'S2', 'S3'].map(edu => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest pl-1">Sektor Pekerjaan <span className="text-rose-500">*</span></label>
                      <select 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
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
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest pl-1">Status Ekonomi</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white" value={formData.economicStatus ?? ''} onChange={e => setFormData({...formData, economicStatus: e.target.value as any})}>
                        <option value="Pra-Sejahtera">Pra-Sejahtera (Subsidi)</option>
                        <option value="Sejahtera">Sejahtera</option>
                        <option value="Mampu">Mampu / Mandiri</option>
                      </select>
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

                  <div className="mt-12 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                    <div className="md:col-span-12 mb-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <AlertCircle size={14} /> Demografi & Status Rentan
                      </h4>
                    </div>

                    {[
                      { id: 'pregnantCount', label: 'Ibu Hamil', icon: <Heart size={14} /> },
                      { id: 'babyCount', label: 'Bayi (0-1 th)', icon: <Activity size={14} /> },
                      { id: 'toddlerCount', label: 'Balita (1-5 th)', icon: <Activity size={14} /> },
                      { id: 'childCount', label: 'Anak (6-12 th)', icon: <Users size={14} /> },
                      { id: 'teenagerCount', label: 'Remaja (13-18 th)', icon: <Users size={14} /> },
                      { id: 'adultCount', label: 'Dewasa', icon: <Users size={14} /> },
                      { id: 'elderlyCount', label: 'Lansia', icon: <ChevronRight size={14} /> },
                      { id: 'widowCount', label: 'Janda/Duda', icon: <Users size={14} /> },
                    ].map(item => (
                      <div key={item.id} className="md:col-span-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-indigo-400">{item.icon}</div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</label>
                        </div>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                          value={formData[item.id] || 0}
                          onChange={e => setFormData({...formData, [item.id]: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    ))}

                    <div className="md:col-span-6 flex items-center gap-4">
                      <div className="flex-1">
                        <BansosCard 
                          label="Penyandang Disabilitas" 
                          checked={formData.isDisability} 
                          onChange={c => setFormData({...formData, isDisability: c})} 
                        />
                      </div>
                      {formData.isDisability && (
                        <div className="w-24">
                          <input 
                            type="number" 
                            placeholder="Jml"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                            value={formData.disabilityCount || 0}
                            onChange={e => setFormData({...formData, disabilityCount: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-6 flex items-center gap-4">
                      <div className="flex-1">
                        <BansosCard 
                          label="Anak Yatim / Piatu" 
                          checked={formData.isOrphan} 
                          onChange={c => setFormData({...formData, isOrphan: c})} 
                        />
                      </div>
                      {formData.isOrphan && (
                        <div className="w-24">
                          <input 
                            type="number" 
                            placeholder="Jml"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white"
                            value={formData.orphanCount || 0}
                            onChange={e => setFormData({...formData, orphanCount: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-10">
                       <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]">
                         <DollarSign size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-slate-900 tracking-tight">Perlindungan Sosial</h3>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Keikutsertaan program bantuan pemerintah</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                       {[
                         { id: 'isPKH', label: 'Penerima PKH' },
                         { id: 'isBLT', label: 'Bantuan Langsung Tunai (BLT)' },
                         { id: 'isBPNT', label: 'Bantuan Pangan Non Tunai' },
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
                             className="col-span-full overflow-hidden"
                           >
                             <div className="pt-2">
                               <input 
                                 placeholder="Sebutkan nama program bantuan..." 
                                 className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none"
                                 value={formData.bansosLainName ?? ''}
                                 onChange={e => setFormData({...formData, bansosLainName: e.target.value})}
                               />
                             </div>
                           </motion.div>
                         )}
                       </AnimatePresence>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                     
                     <div className="flex items-center gap-4 mb-10 relative z-10">
                       <div className="p-4 bg-white/10 text-amber-400 rounded-[1.5rem] border border-white/10">
                         <Heart size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black tracking-tight">Kesehatan</h3>
                         <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1">Status proteksi medis</p>
                       </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div>
                        <label className="block text-[10px] font-black mb-3 text-white/50 uppercase tracking-widest pl-1">Kategori BPJS</label>
                        <select 
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all" 
                          value={formData.bpjsStatus} 
                          onChange={e => setFormData({...formData, bpjsStatus: e.target.value as any})}
                        >
                          <option value="Tidak Ada" className="bg-slate-900">Belum Terdaftar</option>
                          <option value="PPU" className="bg-slate-900">PPU (Pekerja)</option>
                          <option value="PBPU" className="bg-slate-900">PBPU (Mandiri)</option>
                          <option value="PBI" className="bg-slate-900">PBI (Pemerintah)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-3 text-white/50 uppercase tracking-widest pl-1">Vaksinasi</label>
                        <select 
                          className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all" 
                          value={formData.vaccinationStatus} 
                          onChange={e => setFormData({...formData, vaccinationStatus: e.target.value as any})}
                        >
                          <option value="Belum" className="bg-slate-900">Belum Terdata</option>
                          <option value="Dosis 1" className="bg-slate-900">Dosis 1</option>
                          <option value="Dosis 2" className="bg-slate-900">Dosis 2</option>
                          <option value="Booster" className="bg-slate-900">Booster</option>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm gap-8 relative overflow-hidden group">
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="p-4 bg-slate-950 text-white rounded-[1.5rem] shadow-xl shadow-slate-900/10">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Anggota Keluarga</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {formData.familyMembers.length} Personel Terdaftar
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      familyMembers: [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki', job: '' }]
                    })}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <UserPlus size={18} />
                    <span>Tambah Anggota</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                  <AnimatePresence>
                    {formData.familyMembers.map((member: any, idx: number) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        key={member.id || idx} 
                        className="p-10 bg-white rounded-[2.5rem] border border-slate-200 space-y-8 relative group hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all overflow-hidden"
                      >
                        <button 
                          type="button"
                          onClick={() => {
                            const newMembers = [...formData.familyMembers];
                            newMembers.splice(idx, 1);
                            setFormData({...formData, familyMembers: newMembers});
                          }}
                          className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl opacity-0 group-hover:opacity-100"
                        >
                          <X size={18} />
                        </button>
                        
                        <div className="space-y-8 relative z-10">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-slate-950/10">
                               {idx + 1}
                             </div>
                             <h4 className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px]">Profil Anggota #{idx + 1}</h4>
                          </div>

                          <FormField 
                            label="Nama Lengkap" 
                            required
                            placeholder="Nama sesuai KTP..." 
                            value={member.name}
                            onChange={(v: any) => {
                              const newMembers = [...formData.familyMembers];
                              newMembers[idx].name = v;
                              setFormData({...formData, familyMembers: newMembers});
                            }}
                          />
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest pl-1">Hubungan</label>
                              <select 
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
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
                            </div>
                            <div>
                              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest pl-1">Gender</label>
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
                                     className={`py-3 rounded-[1rem] text-[9px] font-black uppercase tracking-widest border transition-all ${
                                       (member.gender || 'Laki-laki') === g 
                                         ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                         : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-white'
                                     }`}
                                   >
                                     {g === 'Laki-laki' ? 'Pria' : 'Wanita'}
                                   </button>
                                 ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <FormField 
                              label="NIK" 
                              required
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
                              label="Pekerjaan" 
                              required
                              placeholder="Status/Profesi" 
                              value={member.job}
                              onChange={(v: any) => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].job = v;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {formData.familyMembers.length === 0 && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="md:col-span-2 text-center py-24 bg-slate-50 border border-dashed border-slate-300 rounded-[3rem]"
                    >
                      <div className="w-20 h-20 bg-white rounded-[2rem] border border-slate-100 flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
                        <Users size={40} />
                      </div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Belum Ada Anggota Keluarga</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Daftarkan pasangan, anak, atau kerabat yang tinggal serumah</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-between items-center px-4">
          <div className="flex gap-4">
            {activeFormTab !== 'basic' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeFormTab === 'demographics') setActiveFormTab('basic');
                  if (activeFormTab === 'family') setActiveFormTab('demographics');
                }}
                className="group px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
              >
                <div className="group-hover:-translate-x-1 transition-transform">←</div>
                Kembali
              </button>
            )}
          </div>

          <div className="flex gap-6 items-center">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-4 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em]"
            >
              Batalkan
            </button>
            {activeFormTab !== 'family' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="group px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95"
              >
                Lanjutkan
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button 
                type="submit" 
                className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center gap-3"
              >
                <ShieldCheck size={20} />
                {editingHouseId ? 'Simpan Perubahan' : 'Finalisasi Data'}
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
    <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest group-focus-within/field:text-indigo-600 transition-colors">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {multiline ? (
      <textarea 
        required={required}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white resize-none placeholder:text-slate-300"
      />
    ) : (
      <input 
        type={type}
        required={required}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all focus:bg-white placeholder:text-slate-300"
      />
    )}
  </div>
);

const BansosCard = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (c: boolean) => void }) => (
  <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${checked ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}>
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checked ? 'bg-white border-white' : 'bg-white border-slate-200'}`}>
      {checked ? <CheckCircle size={14} className="text-indigo-600" /> : <div className="w-1 h-1 bg-slate-100 rounded-full"></div>}
      <input 
        type="checkbox" 
        className="hidden"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
    </div>
    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${checked ? 'text-white' : 'text-slate-600'}`}>{label}</span>
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

