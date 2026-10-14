import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Filter,
  User,
  LayoutGrid,
  Calendar,
  List,
  FileUp,
  CheckCircle
} from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { PopulationLogFormData } from './types';

interface PopulationLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  logFormData: PopulationLogFormData;
  setLogFormData: React.Dispatch<React.SetStateAction<PopulationLogFormData>>;
  editingLogId?: string | null;
  autoUpdateHouse: boolean;
  setAutoUpdateHouse: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PopulationLogModal: React.FC<PopulationLogModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  logFormData,
  setLogFormData,
  editingLogId,
  autoUpdateHouse,
  setAutoUpdateHouse
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingLogId ? 'Edit Log Mutasi Warga' : 'Tambah Log Mutasi Warga'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={onSubmit} className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
        {/* Header Info */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-3xl text-white shadow-lg shadow-emerald-600/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Catat Mutasi Penduduk</h3>
              <p className="text-emerald-100 text-xs font-medium opacity-80">Rekam setiap perubahan status warga secara real-time.</p>
            </div>
          </div>
        </div>

        {/* Jenis Mutasi Section */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
            <Filter size={14} /> Jenis Mutasi
          </h4>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'Newcomer', label: 'Masuk', color: 'emerald' },
              { id: 'MovedOut', label: 'Pindah', color: 'amber' },
              { id: 'Birth', label: 'Lahir', color: 'blue' },
              { id: 'Death', label: 'Wafat', color: 'rose' }
            ].map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setLogFormData({ ...logFormData, type: type.id as any })}
                className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all flex flex-col items-center gap-1 ${
                  logFormData.type === type.id 
                    ? `bg-${type.color}-600 text-white border-${type.color}-600 shadow-md scale-105` 
                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Identitas Section */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-5 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <User size={14} /> Identitas Utama
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="col-span-full">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Lengkap Warga</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><User size={16} /></div>
                <input 
                  type="text" 
                  value={logFormData.name} 
                  onChange={e => setLogFormData({ ...logFormData, name: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Blok & Nomor Rumah</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><LayoutGrid size={16} /></div>
                <input 
                  type="text" 
                  value={logFormData.houseId} 
                  onChange={e => setLogFormData({ ...logFormData, houseId: e.target.value.toUpperCase() })} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="C7-02"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">No. WhatsApp</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Activity size={16} /></div>
                <input 
                  type="text" 
                  value={logFormData.phone} 
                  onChange={e => setLogFormData({ ...logFormData, phone: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                  placeholder="0812..."
                />
              </div>
            </div>
            <div className="col-span-full">
              <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tanggal Kejadian</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><Calendar size={16} /></div>
                <input 
                  type="date" 
                  value={logFormData.date} 
                  onChange={e => setLogFormData({ ...logFormData, date: e.target.value })} 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Details Section */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-5">
          <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
            <List size={14} /> Detail Informasi Tambahan
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {logFormData.type === 'Newcomer' && (
              <>
                <div className="col-span-full">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alamat Asal</label>
                  <input 
                    type="text" 
                    value={logFormData.details.previousAddress} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, previousAddress: e.target.value } })} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                {logFormData.details.residenceType !== 'Tetap' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="col-span-full grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Pemilik Rumah</label>
                      <input 
                        type="text" 
                        value={logFormData.details.ownerName} 
                        onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, ownerName: e.target.value } })} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Kontak Pemilik Rumah</label>
                      <input 
                        type="text" 
                        value={logFormData.details.ownerPhone} 
                        onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, ownerPhone: e.target.value } })} 
                        className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                      />
                    </div>
                  </motion.div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alasan Pindah</label>
                  <input 
                    type="text" 
                    value={logFormData.details.reasonForMoving} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Jumlah Anggota Keluarga</label>
                  <input 
                    type="number" 
                    value={logFormData.details.familyCount} 
                    onChange={e => {
                      const count = parseInt(e.target.value) || 1;
                      const newMembers = count > 1 ? Array(count - 1).fill(null).map((_, i) => logFormData.details.familyMembers[i] || { name: '', relationship: '', nik: '' }) : [];
                      setLogFormData({ 
                        ...logFormData, 
                        details: { 
                          ...logFormData.details, 
                          familyCount: count,
                          familyMembers: newMembers
                        } 
                      });
                    }} 
                    className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                    min="1"
                  />
                </div>
              {logFormData.details.familyCount > 1 && (
                <div className="col-span-2 space-y-3 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biodata Anggota Keluarga Lainnya</p>
                  {logFormData.details.familyMembers.map((member, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <input 
                        placeholder="Nama Lengkap"
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                        value={member.name}
                        onChange={e => {
                          const updated = [...logFormData.details.familyMembers];
                          updated[idx].name = e.target.value;
                          setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                        }}
                      />
                      <select 
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
                        value={member.relationship}
                        onChange={e => {
                          const updated = [...logFormData.details.familyMembers];
                          updated[idx].relationship = e.target.value;
                          setLogFormData({ ...logFormData, details: { ...logFormData.details, familyMembers: updated } });
                        }}
                      >
                        <option value="">Hubungan</option>
                        <option value="Istri">Istri</option>
                        <option value="Anak">Anak</option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Status Hunian</label>
                  <select 
                    value={logFormData.details.residenceType} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, residenceType: e.target.value as any } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Rumah Keluarga">Rumah Keluarga / Ikut Saudara</option>
                    <option value="Sewa">Sewa / Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Agama</label>
                  <select 
                    value={logFormData.details.religion} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, religion: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">Pilih Agama...</option>
                    <option value="Islam">Islam</option>
                    <option value="Kristen">Kristen</option>
                    <option value="Katolik">Katolik</option>
                    <option value="Hindu">Hindu</option>
                    <option value="Budha">Budha</option>
                    <option value="Konghucu">Konghucu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">No. KK</label>
                  <input 
                    type="text" 
                    value={logFormData.details.kkNumber} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, kkNumber: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Pendidikan</label>
                  <select 
                    value={logFormData.details.education} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, education: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">Pilih Pendidikan...</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA/SMK">SMA/SMK</option>
                    <option value="D3">D3</option>
                    <option value="S1">S1</option>
                    <option value="S2">S2</option>
                    <option value="S3">S3</option>
                    <option value="Tidak Sekolah">Tidak Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Kategori Pekerjaan</label>
                  <select 
                    value={logFormData.details.jobCategory} 
                    onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, jobCategory: e.target.value } })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                  >
                    <option value="">Pilih Pekerjaan...</option>
                    <option value="PNS">PNS</option>
                    <option value="TNI/POLRI">TNI/POLRI</option>
                    <option value="Karyawan Swasta">Karyawan Swasta</option>
                    <option value="Wiraswasta">Wiraswasta</option>
                    <option value="Buruh">Buruh</option>
                    <option value="Petani">Petani</option>
                    <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                    <option value="Pelajar/Mahasiswa">Pelajar/Mahasiswa</option>
                    <option value="Tidak Bekerja">Tidak Bekerja</option>
                  </select>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Kerentanan (Pilih yang sesuai)</label>
                <div className="flex flex-wrap gap-2">
                  {['Ibu Hamil', 'Bayi', 'Balita', 'Lansia', 'Disabilitas', 'Janda/Duda'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const current = logFormData.details.vulnerability || [];
                        const updated = current.includes(v) 
                          ? current.filter(item => item !== v) 
                          : [...current, v];
                        setLogFormData({ ...logFormData, details: { ...logFormData.details, vulnerability: updated } });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                        (logFormData.details.vulnerability || []).includes(v) 
                          ? 'bg-rose-500 text-white border-rose-500' 
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {logFormData.type === 'MovedOut' && (
            <>
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alamat Tujuan</label>
                <input 
                  type="text" 
                  value={logFormData.details.newAddress} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, newAddress: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Alasan Pindah</label>
                <input 
                  type="text" 
                  value={logFormData.details.reasonForMoving} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, reasonForMoving: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Jumlah Anggota Pindah</label>
                <input 
                  type="number" 
                  value={logFormData.details.familyCount} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, familyCount: parseInt(e.target.value) || 1 } })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                  min="1"
                />
              </div>
            </>
          )}

          {logFormData.type === 'Birth' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Ayah</label>
                <input 
                  type="text" 
                  value={logFormData.details.fatherName} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, fatherName: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Nama Ibu</label>
                <input 
                  type="text" 
                  value={logFormData.details.motherName} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, motherName: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Jenis Kelamin</label>
                <select 
                  value={logFormData.details.gender} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, gender: e.target.value as any } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </>
          )}

          {logFormData.type === 'Death' && (
            <>
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Penyebab Wafat</label>
                <input 
                  type="text" 
                  value={logFormData.details.causeOfDeath} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, causeOfDeath: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
              <div className="col-span-full">
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase">Tempat Wafat</label>
                <input 
                  type="text" 
                  value={logFormData.details.placeOfDeath} 
                  onChange={e => setLogFormData({ ...logFormData, details: { ...logFormData.details, placeOfDeath: e.target.value } })} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" 
                />
              </div>
            </>
          )}

          <div className="col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FileUp size={14} className="text-indigo-600" /> Link / URL Berkas Pendukung (Surat Pindah / Lahir / Wafat)
              </label>
              <input 
                type="url" 
                value={logFormData.documentUrl} 
                onChange={e => setLogFormData({ ...logFormData, documentUrl: e.target.value })} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all font-mono" 
                placeholder="https://drive.google.com/... atau link foto dokumen"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-600" /> Status Verifikasi Dokumen RT
              </label>
              <select 
                value={logFormData.verificationStatus} 
                onChange={e => setLogFormData({ ...logFormData, verificationStatus: e.target.value as any })} 
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
              >
                <option value="Approved">✓ Disetujui / Sah (Lengkap)</option>
                <option value="Pending">⏳ Menunggu Verifikasi Dokumen</option>
                <option value="Rejected">✕ Ditolak / Kurang Syarat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">
                {logFormData.type === 'Newcomer' ? 'Catatan Kedatangan' : 
                 logFormData.type === 'MovedOut' ? 'Catatan Kepindahan' : 
                 logFormData.type === 'Birth' ? 'Catatan Kelahiran' : 
                 'Catatan Kematian'}
              </label>
              <textarea 
                value={logFormData.description} 
                onChange={e => setLogFormData({ ...logFormData, description: e.target.value })} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all min-h-[80px] resize-none" 
                placeholder={
                  logFormData.type === 'Newcomer' ? 'Cth: Pindah karena tugas kerja...' : 
                  logFormData.type === 'MovedOut' ? 'Cth: Pindah ke luar kota...' : 
                  logFormData.type === 'Birth' ? 'Cth: Lahir normal di RS...' : 
                  'Cth: Meninggal karena sakit...'
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3">
          <input 
            type="checkbox" 
            id="autoUpdateHouse"
            checked={autoUpdateHouse}
            onChange={e => setAutoUpdateHouse(e.target.checked)}
            className="w-5 h-5 rounded-lg text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="autoUpdateHouse" className="text-xs font-bold text-indigo-700 cursor-pointer">
            Update data rumah otomatis? (Sinkronisasi ke Data Warga)
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="submit" 
            className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
          >
            Simpan Mutasi
          </button>
        </div>
      </form>
    </Modal>
  );
};
