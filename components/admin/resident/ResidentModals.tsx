import React from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Activity, Users, User, Phone, DollarSign, CheckCircle, ChevronRight, X, UserPlus,
  CreditCard, AlertCircle, Calendar, FileText
} from 'lucide-react';
import { House, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { 
  getIndonesianMonthYear, 
  generateMonthOptions, 
  isMonthMatch 
} from '../../../src/utils/dateUtils';

import { toast } from 'sonner';

interface AddEditResidentModalProps {
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

      for (const field of requiredFields) {
        if (!formData[field.key]) {
          toast.error(`Field "${field.label}" wajib diisi.`);
          return false;
        }
      }

      if (formData.nik.length !== 16) {
        toast.error('NIK harus 16 digit.');
        return false;
      }
      if (formData.kkNumber.length !== 16) {
        toast.error('Nomor KK harus 16 digit.');
        return false;
      }
    } else if (tab === 'demographics') {
      const requiredFields = [
        { key: 'education', label: 'Pendidikan' },
        { key: 'jobCategory', label: 'Kategori Pekerjaan' },
        { key: 'religion', label: 'Agama' }
      ];

      for (const field of requiredFields) {
        if (!formData[field.key]) {
          toast.error(`Field "${field.label}" wajib diisi.`);
          return false;
        }
      }
    } else if (tab === 'family') {
      for (let i = 0; i < formData.familyMembers.length; i++) {
        const member = formData.familyMembers[i];
        if (!member.name || !member.nik || !member.birthDate || !member.job) {
          toast.error(`Lengkapi data anggota keluarga ke-${i + 1}.`);
          return false;
        }
        if (member.nik.length !== 16) {
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
    <Modal isOpen={isOpen} onClose={onClose} title={editingHouseId ? "Edit Data Warga" : "Tambah Warga Baru"} maxWidth="max-w-7xl">
      <form onSubmit={onFormSubmit} className="space-y-8">
        {/* Tab Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200">
          <button 
            type="button"
            onClick={() => setActiveFormTab('basic')}
            className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'basic' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeFormTab === 'basic' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
              <Home size={14} />
            </div>
            1. Informasi Dasar
          </button>
          <button 
            type="button"
            onClick={() => {
              if (activeFormTab === 'basic') {
                if (validateTab('basic')) setActiveFormTab('demographics');
              } else {
                setActiveFormTab('demographics');
              }
            }}
            className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'demographics' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeFormTab === 'demographics' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
              <Activity size={14} />
            </div>
            2. Demografi & Bantuan
          </button>
          <button 
            type="button"
            onClick={() => {
              if (activeFormTab === 'basic') {
                if (validateTab('basic')) {
                  setActiveFormTab('demographics'); // Go to next first? Or just allow?
                  // Actually if they click 3 from 1, we should validate 1 AND 2.
                  if (validateTab('demographics')) setActiveFormTab('family');
                }
              } else if (activeFormTab === 'demographics') {
                if (validateTab('demographics')) setActiveFormTab('family');
              } else {
                setActiveFormTab('family');
              }
            }}
            className={`flex-1 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeFormTab === 'family' ? 'bg-white text-indigo-600 shadow-md shadow-indigo-500/10' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <div className={`p-1.5 rounded-lg ${activeFormTab === 'family' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
              <Users size={14} />
            </div>
            3. Anggota Keluarga
          </button>
        </div>
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            {activeFormTab === 'basic' && (
              <motion.div 
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10"
              >
                {/* Section 1: Informasi Utama */}
                <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                      <User size={18} />
                    </div>
                    Informasi Utama
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kepala Keluarga (Penghuni) <span className="text-rose-500">*</span></label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.headOfFamily} onChange={e => setFormData({...formData, headOfFamily: e.target.value})} required placeholder="Nama Lengkap..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">NIK (Kepala Keluarga) <span className="text-rose-500">*</span></label>
                      <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} placeholder="16 Digit NIK..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">No. Kartu Keluarga (KK) <span className="text-rose-500">*</span></label>
                      <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.kkNumber} onChange={e => setFormData({...formData, kkNumber: e.target.value})} placeholder="16 Digit No. KK..." />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                      <input 
                        type="checkbox" 
                        id="rondaExempt"
                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                        checked={formData.rondaExempt}
                        onChange={e => setFormData({...formData, rondaExempt: e.target.checked})}
                      />
                      <label htmlFor="rondaExempt" className="text-xs font-bold text-slate-700 cursor-pointer">
                        Pengecualian Ronda (Lansia, Sakit, atau Alasan Khusus Lainnya)
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jenis Kelamin <span className="text-rose-500">*</span></label>
                      <select required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tempat Lahir <span className="text-rose-500">*</span></label>
                      <input required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} placeholder="Kota/Kabupaten..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tanggal Lahir <span className="text-rose-500">*</span></label>
                      <input required type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Perkawinan</label>
                      <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})}>
                        <option value="Belum Kawin">Belum Kawin</option>
                        <option value="Kawin">Kawin</option>
                        <option value="Cerai Hidup">Cerai Hidup</option>
                        <option value="Cerai Mati">Cerai Mati</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Golongan Darah</label>
                      <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.bloodType} onChange={e => setFormData({...formData, bloodType: e.target.value as any})}>
                        <option value="-">-</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kewarganegaraan</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} placeholder="WNI / WNA..." />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Alamat Sesuai KTP <span className="text-rose-500">*</span></label>
                      <textarea required className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.addressKtp} onChange={e => setFormData({...formData, addressKtp: e.target.value})} placeholder="Alamat lengkap sesuai KTP..." rows={2} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nama Pemilik Rumah</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} placeholder="Nama Pemilik (Kosongkan jika sama dengan KK)" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kontak Pemilik Rumah</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.ownerPhone} onChange={e => setFormData({...formData, ownerPhone: e.target.value})} placeholder="No. HP/WA Pemilik Rumah..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Blok <span className="text-rose-500">*</span></label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} required placeholder="A" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nomor <span className="text-rose-500">*</span></label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required placeholder="12" />
                    </div>
                  </div>
                </div>

                <div className="space-y-10">
                  {/* Section 2: Status & Kepemilikan */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Home size={18} />
                      </div>
                      Status & Kepemilikan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Hunian</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                          <option value="Occupied">Dihuni</option>
                          <option value="Empty">Kosong</option>
                          <option value="Business">Usaha</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Kepemilikan</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.residenceType} onChange={e => setFormData({...formData, residenceType: e.target.value as any})}>
                          <option value="Tetap">Pemilik (Tetap)</option>
                          <option value="Rumah Keluarga">Rumah Keluarga</option>
                          <option value="Kontrak">Kontrak</option>
                          <option value="Kost">Kost</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Penghuni (Total Jiwa) <span className="text-rose-500">*</span></label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                          value={formData.occupants} 
                          onChange={e => setFormData({...formData, occupants: parseInt(e.target.value) || 0})} 
                          min={1} 
                          required
                        />
                      </div>
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={formData.isOutOfTown} onChange={e => setFormData({...formData, isOutOfTown: e.target.checked})} />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Luar Kota</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={formData.hasGuest} onChange={e => setFormData({...formData, hasGuest: e.target.checked})} />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ada Tamu</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all">
                          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={formData.isIsoman} onChange={e => setFormData({...formData, isIsoman: e.target.checked})} />
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Isoman</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Section: Kontak & Keamanan */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Phone size={18} />
                      </div>
                      Kontak & Keamanan
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Telepon / WA</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">PIN Akses (Access Code)</label>
                        <div className="flex gap-3">
                          <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.accessCode} onChange={e => setFormData({...formData, accessCode: e.target.value})} placeholder="Masukkan PIN..." />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, accessCode: Math.floor(100000 + Math.random() * 900000).toString()})}
                            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 whitespace-nowrap"
                          >
                            Generate
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
                className="space-y-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Section 3: Data Demografi */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <Activity size={18} />
                      </div>
                      Demografi & Pekerjaan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Pendidikan Terakhir <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                          value={formData.education} 
                          onChange={e => setFormData({...formData, education: e.target.value})}
                          required
                        >
                          <option value="">Pilih...</option>
                          <option value="SD">SD</option>
                          <option value="SMP">SMP</option>
                          <option value="SMA/SMK">SMA/SMK</option>
                          <option value="D3">D3</option>
                          <option value="S1">S1</option>
                          <option value="S2">S2</option>
                          <option value="S3">S3</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Kategori Pekerjaan <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                          value={formData.jobCategory} 
                          onChange={e => setFormData({...formData, jobCategory: e.target.value})}
                          required
                        >
                          <option value="">Pilih...</option>
                          <option value="PNS">PNS / TNI / Polri</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                          <option value="Freelance">Pekerja Lepas / Freelance</option>
                          <option value="Pensiunan">Pensiunan</option>
                          <option value="Tidak Bekerja">Tidak / Belum Bekerja</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Pekerjaan Spesifik</label>
                        <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.job} onChange={e => setFormData({...formData, job: e.target.value})} placeholder="Contoh: Guru, Arsitek..." />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Agama <span className="text-rose-500">*</span></label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                          value={formData.religion} 
                          onChange={e => setFormData({...formData, religion: e.target.value})}
                          required
                        >
                          <option value="">Pilih...</option>
                          <option value="Islam">Islam</option>
                          <option value="Kristen">Kristen</option>
                          <option value="Katolik">Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Budha">Budha</option>
                          <option value="Konghucu">Konghucu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Ekonomi</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.economicStatus} onChange={e => setFormData({...formData, economicStatus: e.target.value as any})}>
                          <option value="Pra-Sejahtera">Pra-Sejahtera</option>
                          <option value="Sejahtera">Sejahtera</option>
                          <option value="Mampu">Mampu</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status BPJS</label>
                        <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.bpjsStatus} onChange={e => setFormData({...formData, bpjsStatus: e.target.value as any})}>
                          <option value="Tidak Ada">Tidak Ada</option>
                          <option value="PPU">PPU (Pekerja Penerima Upah)</option>
                          <option value="PBPU">PBPU (Mandiri)</option>
                          <option value="PBI">PBI (Pemerintah)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Kendaraan</label>
                        <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.vehicleCount} onChange={e => setFormData({...formData, vehicleCount: parseInt(e.target.value) || 0})} min={0} />
                      </div>
                    </div>
                  </div>

                  {/* Section: Bantuan Sosial */}
                  <div className="space-y-6 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4">
                      <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                        <DollarSign size={18} />
                      </div>
                      Bantuan Sosial
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={formData.isPKH}
                          onChange={e => setFormData({...formData, isPKH: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Program Keluarga Harapan (PKH)</span>
                          <span className="text-[10px] text-slate-400 font-bold">Bantuan sosial bersyarat untuk keluarga miskin</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={formData.isBLT}
                          onChange={e => setFormData({...formData, isBLT: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Bantuan Langsung Tunai (BLT)</span>
                          <span className="text-[10px] text-slate-400 font-bold">Bantuan tunai langsung dari pemerintah</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={formData.isBPNT}
                          onChange={e => setFormData({...formData, isBPNT: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Bantuan Pangan Non-Tunai (BPNT)</span>
                          <span className="text-[10px] text-slate-400 font-bold">Bantuan pangan non-tunai (Sembako)</span>
                        </div>
                      </label>
                      <div className="space-y-4">
                        <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                          <input 
                            type="checkbox" 
                            className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            checked={formData.isBansosLain}
                            onChange={e => setFormData({...formData, isBansosLain: e.target.checked})}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Bantuan Lainnya</span>
                            <span className="text-[10px] text-slate-400 font-bold">Sebutkan jenis bantuan sosial lainnya</span>
                          </div>
                        </label>
                        {formData.isBansosLain && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <input 
                              placeholder="Sebutkan jenis bantuan..."
                              className="w-full p-4 bg-white border border-indigo-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                              value={formData.bansosLainName}
                              onChange={e => setFormData({...formData, bansosLainName: e.target.value})}
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: Kelompok Rentan */}
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                      <Users size={18} />
                    </div>
                    Rincian Kelompok Rentan
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 mb-8">
                    {[
                      { label: 'Hamil', key: 'pregnantCount' },
                      { label: 'Bayi', key: 'babyCount' },
                      { label: 'Balita', key: 'toddlerCount' },
                      { label: 'Anak', key: 'childCount' },
                      { label: 'Remaja', key: 'teenagerCount' },
                      { label: 'Dewasa', key: 'adultCount' },
                      { label: 'Lansia', key: 'elderlyCount' },
                      { label: 'Janda', key: 'widowCount' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">{item.label}</label>
                        <input 
                          type="number" 
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-center focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                          value={formData[item.key as keyof typeof formData] as number} 
                          onChange={e => setFormData({...formData, [item.key]: parseInt(e.target.value) || 0})} 
                          min={0} 
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={formData.isDisability}
                          onChange={e => setFormData({...formData, isDisability: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Penyandang Disabilitas</span>
                          <span className="text-[10px] text-slate-400 font-bold">Centang jika ada anggota keluarga disabilitas</span>
                        </div>
                      </label>
                      {formData.isDisability && (
                        <div className="pl-14">
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Jiwa Disabilitas</label>
                          <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.disabilityCount} onChange={e => setFormData({...formData, disabilityCount: parseInt(e.target.value) || 0})} min={1} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all group">
                        <input 
                          type="checkbox" 
                          className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          checked={formData.isOrphan}
                          onChange={e => setFormData({...formData, isOrphan: e.target.checked})}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600">Anak Yatim / Piatu</span>
                          <span className="text-[10px] text-slate-400 font-bold">Centang jika ada anggota keluarga yatim/piatu</span>
                        </div>
                      </label>
                      {formData.isOrphan && (
                        <div className="pl-14">
                          <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jumlah Jiwa Yatim/Piatu</label>
                          <input type="number" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.orphanCount} onChange={e => setFormData({...formData, orphanCount: parseInt(e.target.value) || 0})} min={1} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Dokumen & Catatan */}
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-3 border-b border-indigo-100 pb-4 mb-8">
                    <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                      <FileText size={18} />
                    </div>
                    Dokumen & Catatan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Status Vaksinasi</label>
                      <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.vaccinationStatus} onChange={e => setFormData({...formData, vaccinationStatus: e.target.value as any})}>
                        <option value="Belum">Belum</option>
                        <option value="Dosis 1">Dosis 1</option>
                        <option value="Dosis 2">Dosis 2</option>
                        <option value="Booster 1">Booster 1</option>
                        <option value="Booster 2">Booster 2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tanggal Bergabung</label>
                      <input type="date" className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Foto KTP (URL)</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.ktpUrl} onChange={e => setFormData({...formData, ktpUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Foto KK (URL)</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.kkUrl} onChange={e => setFormData({...formData, kkUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Foto Rumah (URL)</label>
                      <input className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.housePhotoUrl} onChange={e => setFormData({...formData, housePhotoUrl: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="flex items-end pb-2">
                      <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-indigo-50 transition-all w-full">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={formData.isVerified} onChange={e => setFormData({...formData, isVerified: e.target.checked})} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Warga Terverifikasi</span>
                      </label>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Catatan Khusus</label>
                      <textarea className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" value={formData.specialNotes} onChange={e => setFormData({...formData, specialNotes: e.target.value})} placeholder="Catatan tambahan mengenai warga..." rows={3} />
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
                className="space-y-8"
              >
                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/20">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Daftar Anggota Keluarga</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{formData.familyMembers.length} Orang Terdaftar</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFormData({
                      ...formData, 
                      familyMembers: [...formData.familyMembers, { id: Math.random().toString(36).substr(2, 9), name: '', relation: 'Anak', nik: '', birthDate: '', gender: 'Laki-laki' }]
                    })}
                    className="text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-3 px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest active:scale-95"
                  >
                    <UserPlus size={18} /> Tambah Anggota
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {formData.familyMembers.map((member: any, idx: number) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={member.id || idx} 
                      className="p-8 bg-white rounded-[2.5rem] border border-slate-200 space-y-6 relative group transition-all hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                      <button 
                        type="button"
                        onClick={() => {
                          const newMembers = [...formData.familyMembers];
                          newMembers.splice(idx, 1);
                          setFormData({...formData, familyMembers: newMembers});
                        }}
                        className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                      >
                        <X size={20} />
                      </button>
                      
                      <div className="space-y-5">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap <span className="text-rose-500">*</span></label>
                          <input 
                            placeholder="Nama Lengkap" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            value={member.name}
                            onChange={e => {
                              const newMembers = [...formData.familyMembers];
                              newMembers[idx].name = e.target.value;
                              setFormData({...formData, familyMembers: newMembers});
                            }}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jenis Kelamin <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.gender || 'Laki-laki'}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].gender = e.target.value as any;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              required
                            >
                              <option value="Laki-laki">Laki-laki</option>
                              <option value="Perempuan">Perempuan</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hubungan <span className="text-rose-500">*</span></label>
                            <select 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.relation}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].relation = e.target.value as any;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              required
                            >
                              <option value="Istri">Istri</option>
                              <option value="Anak">Anak</option>
                              <option value="Orang Tua">Orang Tua</option>
                              <option value="Famili Lain">Famili Lain</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NIK <span className="text-rose-500">*</span></label>
                            <input 
                              placeholder="NIK" 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.nik || ''}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].nik = e.target.value;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tgl Lahir <span className="text-rose-500">*</span></label>
                            <input 
                              type="date"
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.birthDate || ''}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].birthDate = e.target.value;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pekerjaan <span className="text-rose-500">*</span></label>
                            <input 
                              placeholder="Pekerjaan" 
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                              value={member.job || ''}
                              onChange={e => {
                                const newMembers = [...formData.familyMembers];
                                newMembers[idx].job = e.target.value;
                                setFormData({...formData, familyMembers: newMembers});
                              }}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {formData.familyMembers.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 text-center p-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                      <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-sm">
                        <Users size={48} />
                      </div>
                      <h4 className="text-lg font-black text-slate-400 uppercase tracking-widest">Belum Ada Anggota</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Klik tombol di atas untuk menambahkan anggota keluarga</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-10 border-t border-slate-100 flex justify-between items-center">
          <div className="flex gap-4">
            {activeFormTab !== 'basic' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeFormTab === 'demographics') setActiveFormTab('basic');
                  if (activeFormTab === 'family') setActiveFormTab('demographics');
                }}
                className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Kembali
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-4 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
            >
              Batal
            </button>
          </div>

          <div className="flex gap-4">
            {activeFormTab !== 'family' ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-10 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-3"
              >
                Lanjut <ChevronRight size={16} />
              </button>
            ) : (
              <button 
                type="submit" 
                className="px-16 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-3"
              >
                <CheckCircle size={20} /> {editingHouseId ? 'Simpan Perubahan' : 'Simpan Data'}
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

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
    <Modal isOpen={isOpen} onClose={onClose} title={`Bayar Iuran: ${payHouse.headOfFamily}`} maxWidth="max-w-xl">
      <form onSubmit={handleSavePayment} className="space-y-6">
        {arrears.length > 0 && (
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-[2rem]">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 bg-rose-100 rounded-xl">
                <AlertCircle size={18} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Daftar Tunggakan</p>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Klik bulan untuk membayar tunggakan tersebut</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {arrears.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTargetMonth(m)}
                  className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${
                    targetMonth === m 
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-200 scale-105' 
                    : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Calendar size={12} />
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Informasi Rumah</p>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 text-indigo-600 shadow-sm">
                <Home size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800">Blok {payHouse.block} No. {payHouse.number}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{payHouse.headOfFamily}</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Bulan Iuran (Target)</p>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl border border-indigo-100 text-indigo-600 shadow-sm">
                <Calendar size={20} />
              </div>
              <div className="flex-1">
                <select 
                  className="w-full bg-transparent py-1 text-sm font-black text-indigo-600 outline-none cursor-pointer"
                  value={targetMonth}
                  onChange={e => setTargetMonth(e.target.value)}
                >
                  {generateMonthOptions(12, 36).map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      getPaymentStatus(payHouse, 'Air', targetMonth) === PaymentStatus.PAID ? 'bg-blue-500' : 'bg-rose-500'
                    }`}></div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Air</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      getPaymentStatus(payHouse, 'Sampah', targetMonth) === PaymentStatus.PAID ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}></div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Sampah</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-slate-50/30 p-6 rounded-[2.5rem] border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jenis Iuran <span className="text-rose-500">*</span></label>
              <select 
                required
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                value={payType}
                onChange={e => setPayType(e.target.value as any)}
              >
                <option value="Both">Iuran Sampah & Air</option>
                <option value="Sampah">Iuran Sampah Saja</option>
                <option value="Air">Iuran Air Saja</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nominal (Rp) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                <input 
                  type="number"
                  className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tanggal Transaksi (Kapan Dibayar) <span className="text-rose-500">*</span></label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="date"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>
              <button 
                type="button"
                onClick={() => setPayDate(new Date().toISOString().split('T')[0])}
                className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Hari Ini
              </button>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-2 italic px-1">
              * Tanggal saat uang diterima oleh petugas
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nama Pembayar (Jika Berbeda)</label>
            <input 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={payerName}
              onChange={e => setPayerName(e.target.value)}
              placeholder={`Default: ${payHouse.headOfFamily}`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Catatan Tambahan (Opsional)</label>
            <textarea 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm min-h-[80px]"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              placeholder="Contoh: Titipan tetangga, Bayar lunas 3 bulan, dll..."
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <CheckCircle size={20} /> Simpan Pembayaran
          </button>
        </div>
      </form>
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Catatan Iuran: ${editingPayment.headOfFamily}`} maxWidth="max-w-xl">
      <form onSubmit={handleUpdatePayment} className="space-y-6">
        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Informasi Rumah</p>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 text-indigo-600 shadow-sm">
              <Home size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Blok {editingPayment.block} No. {editingPayment.number}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Bulan: {editingPayment.month}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-slate-50/30 p-6 rounded-[2.5rem] border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Jenis Iuran <span className="text-rose-500">*</span></label>
              <select 
                required
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                value={payType}
                onChange={e => setPayType(e.target.value as any)}
              >
                <option value="Both">Iuran Sampah & Air</option>
                <option value="Sampah">Iuran Sampah Saja</option>
                <option value="Air">Iuran Air Saja</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nominal (Rp) <span className="text-rose-500">*</span></label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</div>
                <input 
                  type="number"
                  className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Tanggal Transaksi <span className="text-rose-500">*</span></label>
            <div className="flex gap-3">
              <input 
                type="date"
                className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                required
              />
              <button 
                type="button"
                onClick={() => setPayDate(new Date().toISOString().split('T')[0])}
                className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Hari Ini
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Nama Pembayar</label>
            <input 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={payerName}
              onChange={e => setPayerName(e.target.value)}
              placeholder={`Default: ${editingPayment.headOfFamily}`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">Catatan Tambahan</label>
            <textarea 
              className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm min-h-[80px]"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
            />
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3"
          >
            <CheckCircle size={20} /> Simpan Perubahan
          </button>
        </div>
      </form>
    </Modal>
  );
};
