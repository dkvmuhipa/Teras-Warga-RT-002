import React from 'react';
import { motion } from 'motion/react';
import { 
  FileEdit, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight, 
  User, 
  Shield, 
  Activity, 
  Users, 
  X, 
  Check, 
  Store, 
  Info, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { toast } from 'sonner';
import { House, UpdateRequest } from '../../../../types';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { checkNikDuplicate } from '../../../../services/databaseService';

interface ResidentUpdateDataTabProps {
  updateRequests: UpdateRequest[];
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (open: boolean) => void;
  selectedRequest: UpdateRequest | null;
  setSelectedRequest: (req: UpdateRequest | null) => void;
  updateForm: any;
  setUpdateForm: any;
  handleUpdateSubmit: (e: React.FormEvent) => void;
  addFamilyMember: () => void;
  removeFamilyMember: (index: number) => void;
  updateFamilyMember: (index: number, field: string, value: any) => void;
  currentHouse: House | undefined;
  selectedHouseId: string;
  houses: House[];
  showFullNiks: Record<string, boolean>;
  toggleNikVisibility: (key: string) => void;
  formatSensitiveNik: (nik: string, isVisible: boolean) => string;
}

export const ResidentUpdateDataTab: React.FC<ResidentUpdateDataTabProps> = ({
  updateRequests,
  isUpdateModalOpen,
  setIsUpdateModalOpen,
  selectedRequest,
  setSelectedRequest,
  updateForm,
  setUpdateForm,
  handleUpdateSubmit,
  addFamilyMember,
  removeFamilyMember,
  updateFamilyMember,
  currentHouse,
  selectedHouseId,
  houses,
  showFullNiks,
  toggleNikVisibility,
  formatSensitiveNik,
}) => {
  return (
    <motion.div 
      key="update"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Pembaruan Data Mandiri</h3>
          <p className="text-sm text-slate-500 font-medium">Ajukan perubahan data jika ada ketidaksesuaian atau penambahan penghuni.</p>
        </div>
        <Button onClick={() => setIsUpdateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
          <FileEdit size={18} className="mr-2" /> Ajukan Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {updateRequests.length > 0 ? (
          updateRequests.map((req) => (
            <Card 
              key={req.id} 
              className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${
                  req.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600' :
                  req.status === 'Ditolak' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {req.status === 'Disetujui' ? <CheckCircle size={24} /> : 
                   req.status === 'Ditolak' ? <AlertCircle size={24} /> : 
                   <Clock size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800">Permohonan Update Data</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      req.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-600' :
                      req.status === 'Ditolak' ? 'bg-rose-100 text-rose-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {req.status === 'Menunggu' ? 'Menunggu Review' : req.status === 'Disetujui' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{req.reason}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {req.updatedAt && (
                      <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
                        Diproses: {new Date(req.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
              <FileEdit size={32} />
            </div>
            <h4 className="font-black text-slate-800 mb-1">Belum Ada Pengajuan</h4>
            <p className="text-xs text-slate-400 font-medium">Data Anda saat ini sudah sesuai dengan catatan RT.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Formulir Update Data">
        <form onSubmit={handleUpdateSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <User size={14} /> Identitas Kepala Keluarga / Penghuni
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Kepala Keluarga / Penghuni</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.headOfFamily}
                    onChange={e => setUpdateForm({...updateForm, headOfFamily: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Jenis Kelamin</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.gender}
                    onChange={e => setUpdateForm({...updateForm, gender: e.target.value as any})}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tempat Lahir</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.birthPlace}
                    onChange={e => setUpdateForm({...updateForm, birthPlace: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.birthDate}
                    onChange={e => setUpdateForm({...updateForm, birthDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. Telepon (WA)</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.phone}
                    onChange={e => setUpdateForm({...updateForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Golongan Darah</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.bloodType}
                    onChange={e => setUpdateForm({...updateForm, bloodType: e.target.value as any})}
                  >
                    <option value="-">-</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Shield size={14} /> Data Kependudukan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">NIK</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.nik}
                    onChange={e => setUpdateForm({...updateForm, nik: e.target.value})}
                    placeholder="16 digit NIK"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">No. KK</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.kkNumber}
                    onChange={e => setUpdateForm({...updateForm, kkNumber: e.target.value})}
                    placeholder="16 digit No. KK"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Tinggal</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.residenceType}
                    onChange={e => setUpdateForm({...updateForm, residenceType: e.target.value as any})}
                  >
                    <option value="Tetap">Tetap</option>
                    <option value="Sewa">Sewa</option>
                    <option value="Rumah Keluarga">Rumah Keluarga</option>
                  </select>
                </div>

                {/* Status Kesesuaian KTP & Alamat Sesuai KTP */}
                <div className="md:col-span-2 p-3.5 sm:p-4 bg-slate-100/70 border border-slate-200/80 rounded-2xl space-y-3.5 overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-0.5">
                      <label className="text-xs font-black text-slate-700">
                        Status Kesesuaian KTP
                      </label>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Apakah KTP sudah beralamat setempat di Huntap Tondo 2 atau masih luar wilayah.
                      </p>
                    </div>

                    {/* Full-width responsive segmented selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const localAddr = `Jl. Pue Lombe, Huntap Tondo 2 Blok ${currentHouse?.block || ''}-${currentHouse?.number || ''}`.trim();
                          setUpdateForm({
                            ...updateForm,
                            ktpStatus: 'Sesuai Domisili',
                            addressKtp: (!updateForm.addressKtp || updateForm.addressKtp.toLowerCase().includes('tondo') || updateForm.addressKtp.toLowerCase().includes('pue lombe')) ? localAddr : updateForm.addressKtp
                          });
                        }}
                        className={`w-full py-2 px-3 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                          updateForm.ktpStatus === 'Sesuai Domisili' || (!updateForm.ktpStatus && updateForm.addressKtp?.toLowerCase().includes('tondo'))
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span>✅</span>
                        <span>Sesuai Domisili (RT 02)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpdateForm({ ...updateForm, ktpStatus: 'Luar Wilayah (Belum Mutasi)' })}
                        className={`w-full py-2 px-3 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                          updateForm.ktpStatus === 'Luar Wilayah (Belum Mutasi)'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        <span>🪪</span>
                        <span>Luar Wilayah (Belum Mutasi)</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Alamat Sesuai KTP
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const localAddr = `Jl. Pue Lombe, Huntap Tondo 2 Blok ${currentHouse?.block || ''}-${currentHouse?.number || ''}`.trim();
                          setUpdateForm({
                            ...updateForm,
                            ktpStatus: 'Sesuai Domisili',
                            addressKtp: localAddr
                          });
                          toast.success(`Alamat KTP diset: ${localAddr}`);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center justify-center gap-1 cursor-pointer transition-colors self-start sm:self-auto active:scale-95"
                      >
                        📍 Gunakan Alamat Huntap Tondo 2 (Jl. Pue Lombe)
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={updateForm.addressKtp}
                      onChange={e => setUpdateForm({ ...updateForm, addressKtp: e.target.value })}
                      placeholder={
                        updateForm.ktpStatus === 'Sesuai Domisili'
                          ? `Contoh: Jl. Pue Lombe, Huntap Tondo 2 Blok ${currentHouse?.block || ''}-${currentHouse?.number || ''}`
                          : 'Tuliskan alamat lengkap asal sesuai yang tertera di KTP fisik Anda...'
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none leading-relaxed"
                    />
                    {(updateForm.ktpStatus === 'Sesuai Domisili' || (!updateForm.ktpStatus && updateForm.addressKtp?.toLowerCase().includes('tondo'))) && (
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <span>✓</span> Alamat KTP sesuai domisili RT 02 di Huntap Tondo 2 Jl. Pue Lombe.
                      </p>
                    )}
                    {updateForm.ktpStatus === 'Luar Wilayah (Belum Mutasi)' && (
                      <p className="text-[10px] text-amber-600 font-medium flex items-center gap-1">
                        <span>ℹ️</span> KTP Anda masih beralamat di luar wilayah dan belum melakukan mutasi kependudukan ke RT 02.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Perkawinan</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.maritalStatus}
                    onChange={e => setUpdateForm({...updateForm, maritalStatus: e.target.value as any})}
                  >
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Agama</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.religion}
                    onChange={e => setUpdateForm({...updateForm, religion: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pendidikan Terakhir</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.education}
                    onChange={e => setUpdateForm({...updateForm, education: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Pekerjaan</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.job}
                    onChange={e => setUpdateForm({...updateForm, job: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Kewarganegaraan</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.nationality}
                    onChange={e => setUpdateForm({...updateForm, nationality: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Activity size={14} /> Data Sosial &amp; Ekonomi
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status BPJS</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.bpjsStatus}
                    onChange={e => setUpdateForm({...updateForm, bpjsStatus: e.target.value as any})}
                  >
                    <option value="Tidak Ada">Tidak Ada</option>
                    <option value="PPU">PPU (Pekerja Penerima Upah)</option>
                    <option value="PBPU">PBPU (Pekerja Bukan Penerima Upah)</option>
                    <option value="PBI">PBI (Penerima Bantuan Iuran)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Status Ekonomi</label>
                  <select 
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={updateForm.economicStatus}
                    onChange={e => setUpdateForm({...updateForm, economicStatus: e.target.value as any})}
                  >
                    <option value="Pra-Sejahtera">Pra-Sejahtera</option>
                    <option value="Sejahtera">Sejahtera</option>
                    <option value="Mampu">Mampu</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Bantuan Sosial (Ceklis jika menerima)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                      <input type="checkbox" checked={updateForm.isPKH} onChange={e => setUpdateForm({...updateForm, isPKH: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">PKH</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                      <input type="checkbox" checked={updateForm.isBLT} onChange={e => setUpdateForm({...updateForm, isBLT: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">BLT</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                      <input type="checkbox" checked={updateForm.isBPNT} onChange={e => setUpdateForm({...updateForm, isBPNT: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">BPNT</span>
                    </label>
                    <label className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-200 transition-colors">
                      <input type="checkbox" checked={updateForm.isBansosLain} onChange={e => setUpdateForm({...updateForm, isBansosLain: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-xs font-bold text-slate-700">Lainnya</span>
                    </label>
                  </div>
                  {updateForm.isBansosLain && (
                    <input 
                      type="text" 
                      className="w-full mt-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Nama Bantuan Lainnya"
                      value={updateForm.bansosLainName}
                      onChange={e => setUpdateForm({...updateForm, bansosLainName: e.target.value})}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Users size={14} /> Demografi Keluarga
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Penghuni</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.occupants} onChange={e => setUpdateForm({...updateForm, occupants: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motor (Roda 2)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                    value={updateForm.twoWheelCount ?? 0} 
                    onChange={e => {
                      const w2 = parseInt(e.target.value) || 0;
                      setUpdateForm({
                        ...updateForm, 
                        twoWheelCount: w2, 
                        vehicleCount: w2 + (updateForm.fourWheelCount || 0)
                      });
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobil (Roda 4)</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" 
                    value={updateForm.fourWheelCount ?? 0} 
                    onChange={e => {
                      const w4 = parseInt(e.target.value) || 0;
                      setUpdateForm({
                        ...updateForm, 
                        fourWheelCount: w4, 
                        vehicleCount: (updateForm.twoWheelCount || 0) + w4
                      });
                    }} 
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ibu Hamil</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.pregnantCount} onChange={e => setUpdateForm({...updateForm, pregnantCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bayi (0-1th)</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.babyCount} onChange={e => setUpdateForm({...updateForm, babyCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balita (1-5th)</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.toddlerCount} onChange={e => setUpdateForm({...updateForm, toddlerCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Anak-anak</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.childCount} onChange={e => setUpdateForm({...updateForm, childCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaja</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.teenagerCount} onChange={e => setUpdateForm({...updateForm, teenagerCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dewasa</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.adultCount} onChange={e => setUpdateForm({...updateForm, adultCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lansia</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.elderlyCount} onChange={e => setUpdateForm({...updateForm, elderlyCount: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Janda/Duda</label>
                  <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.widowCount} onChange={e => setUpdateForm({...updateForm, widowCount: parseInt(e.target.value) || 0})} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Users size={14} /> Anggota Keluarga
                </h4>
                <Button 
                  type="button" 
                  onClick={addFamilyMember}
                  className="h-7 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none shadow-none text-[10px] font-black"
                >
                  + Tambah Anggota
                </Button>
              </div>
              
              <div className="space-y-4">
                {updateForm.familyMembers.length > 0 ? (
                  updateForm.familyMembers.map((member: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm relative group">
                      <button 
                        type="button" 
                        onClick={() => removeFamilyMember(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                      >
                        <X size={12} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.name}
                            onChange={e => updateFamilyMember(index, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">NIK</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.nik || ''}
                            onChange={e => updateFamilyMember(index, 'nik', e.target.value.replace(/\D/g, ''))}
                            placeholder="16 digit NIK"
                            maxLength={16}
                          />
                          {member.nik && member.nik.length === 16 && (() => {
                            const dup = checkNikDuplicate(member.nik, selectedHouseId, houses);
                            if (dup.isDuplicate) {
                              return (
                                <p className="text-[9px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                                  <AlertCircle size={10} className="shrink-0" />
                                  NIK sudah terdaftar di Blok {dup.houseId} ({dup.residentName})
                                </p>
                              );
                            }
                            return (
                              <p className="text-[9px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                <Check size={10} className="shrink-0 stroke-[3]" />
                                NIK valid &amp; belum terdaftar
                              </p>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hubungan</label>
                          <select 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.relation}
                            onChange={e => updateFamilyMember(index, 'relation', e.target.value)}
                          >
                            <option value="Istri">Istri</option>
                            <option value="Anak">Anak</option>
                            <option value="Orang Tua">Orang Tua</option>
                            <option value="Famili Lain">Famili Lain</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Kelamin</label>
                          <select 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.gender}
                            onChange={e => updateFamilyMember(index, 'gender', e.target.value)}
                          >
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Lahir</label>
                          <input 
                            type="date" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.birthDate || ''}
                            onChange={e => updateFamilyMember(index, 'birthDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pekerjaan</label>
                          <input 
                            type="text" 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            value={member.job || ''}
                            onChange={e => updateFamilyMember(index, 'job', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400">Belum ada anggota keluarga tambahan.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pendataan Usaha / UMKM Warga */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Store size={16} className="text-amber-600" />
                  <div>
                    <h4 className="text-xs font-black text-amber-950 uppercase tracking-widest">
                      Pendataan Usaha / UMKM Warga
                    </h4>
                    <p className="text-[10px] text-amber-800/80 font-semibold">
                      Survey pelaku usaha rumahan &amp; UMKM di lingkungan RT 02
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateForm.hasBusiness}
                    onChange={(e) => setUpdateForm({ ...updateForm, hasBusiness: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {updateForm.hasBusiness ? (
                <div className="space-y-4 pt-2 border-t border-amber-200/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                        Nama Usaha / Toko / Merek
                      </label>
                      <input
                        type="text"
                        required={updateForm.hasBusiness}
                        placeholder="Contoh: Dapur Mama Tondo, Kios Barokah..."
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={updateForm.businessName}
                        onChange={(e) => setUpdateForm({ ...updateForm, businessName: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                        Kategori Usaha
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={updateForm.businessCategory}
                        onChange={(e) => setUpdateForm({ ...updateForm, businessCategory: e.target.value })}
                      >
                        <option value="Kuliner & Makanan">Kuliner &amp; Makanan</option>
                        <option value="Sembako & Kelontong">Sembako &amp; Kelontong</option>
                        <option value="Jasa & Servis">Jasa &amp; Servis</option>
                        <option value="Pakaian & Fashion">Pakaian &amp; Fashion</option>
                        <option value="Kerajinan & Kreatif">Kerajinan &amp; Kreatif</option>
                        <option value="Pertanian & Tanaman">Pertanian &amp; Tanaman</option>
                        <option value="Kesehatan & Kecantikan">Kesehatan &amp; Kecantikan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                        Lokasi Usaha
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={updateForm.businessLocation}
                        onChange={(e) => setUpdateForm({ ...updateForm, businessLocation: e.target.value })}
                      >
                        <option value="Di Rumah (Hunian Tetap)">Di Rumah (Hunian Tetap)</option>
                        <option value="Luar Perumahan / Pasar">Luar Perumahan / Pasar</option>
                        <option value="Online / Keliling">Online / Keliling</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                        No. WhatsApp Bisnis
                      </label>
                      <input
                        type="tel"
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                        value={updateForm.businessPhone}
                        onChange={(e) => setUpdateForm({ ...updateForm, businessPhone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 pl-1">
                      Deskripsi Produk / Jasa
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Jelaskan produk atau jasa yang ditawarkan kepada tetangga dan masyarakat..."
                      className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all resize-none"
                      value={updateForm.businessDescription}
                      onChange={(e) => setUpdateForm({ ...updateForm, businessDescription: e.target.value })}
                    />
                  </div>

                  <label className="flex items-center gap-2.5 p-3 bg-white/80 border border-amber-200 rounded-xl cursor-pointer hover:bg-white transition-colors">
                    <input
                      type="checkbox"
                      checked={updateForm.isUmkmRegistered}
                      onChange={(e) => setUpdateForm({ ...updateForm, isUmkmRegistered: e.target.checked })}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800">
                        Promosikan di Katalog UMKM RT 02 Huntap Tondo
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Tampilkan toko &amp; produk Anda di direktori publik agar tetangga mudah berbelanja.
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 font-semibold italic">
                  Aktifkan switch jika kepala keluarga atau anggota keluarga memiliki unit usaha rumahan/UMKM.
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Info size={14} /> Informasi Tambahan
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Alasan Perubahan</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Contoh: Penambahan anggota keluarga baru atau koreksi ejaan nama..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                    value={updateForm.reason}
                    onChange={e => setUpdateForm({...updateForm, reason: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
              Data tidak akan langsung berubah. Admin akan memverifikasi pengajuan Anda terlebih dahulu sebelum memperbarui database utama.
            </p>
          </div>

          <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 mt-4">
            Kirim Permohonan
          </Button>
        </form>
      </Modal>

      {/* Request Detail Modal */}
      <Modal isOpen={!!selectedRequest} onClose={() => setSelectedRequest(null)} title="Detail Permohonan Update">
        {selectedRequest && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex justify-between items-start">
              <div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  selectedRequest.status === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                  selectedRequest.status === 'Ditolak' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                  'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {selectedRequest.status}
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                  Diajukan pada {new Date(selectedRequest.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={12} /> Identitas Kepala Keluarga / Penghuni
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 bg-white/50 rounded-lg">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nama Lengkap</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.headOfFamily}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded-lg">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Jenis Kelamin</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.gender || '-'}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded-lg">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">TTL</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.birthPlace || '-'}, {selectedRequest.birthDate || '-'}</p>
                  </div>
                  <div className="p-2 bg-white/50 rounded-lg">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Telepon</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.phone}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Shield size={12} /> Data Kependudukan
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">NIK</p>
                    <p className="text-xs font-black text-slate-800 font-mono flex items-center justify-between">
                      <span>{formatSensitiveNik(selectedRequest.nik || '', !!showFullNiks[`req-${selectedRequest.id}`])}</span>
                      {selectedRequest.nik && (
                        <button 
                          onClick={() => toggleNikVisibility(`req-${selectedRequest.id}`)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showFullNiks[`req-${selectedRequest.id}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No. KK</p>
                    <p className="text-xs font-black text-slate-800 font-mono flex items-center justify-between">
                      <span>{formatSensitiveNik(selectedRequest.kkNumber || '', !!showFullNiks[`kk-${selectedRequest.id}`])}</span>
                      {selectedRequest.kkNumber && (
                        <button 
                          onClick={() => toggleNikVisibility(`kk-${selectedRequest.id}`)}
                          className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showFullNiks[`kk-${selectedRequest.id}`] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Agama</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.religion || '-'}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pendidikan</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.education || '-'}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pekerjaan</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.job || '-'}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status Tinggal</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.residenceType || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity size={12} /> Sosial &amp; Ekonomi
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">BPJS</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.bpjsStatus || '-'}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ekonomi</p>
                    <p className="text-xs font-black text-slate-800">{selectedRequest.economicStatus || '-'}</p>
                  </div>
                  <div className="col-span-2 p-2 bg-white rounded-lg border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Bantuan Sosial</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.isPKH && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">PKH</span>}
                      {selectedRequest.isBLT && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">BLT</span>}
                      {selectedRequest.isBPNT && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">BPNT</span>}
                      {selectedRequest.isBansosLain && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black">{selectedRequest.bansosLainName || 'Lainnya'}</span>}
                      {!selectedRequest.isPKH && !selectedRequest.isBLT && !selectedRequest.isBPNT && !selectedRequest.isBansosLain && <span className="text-xs font-bold text-slate-400">Tidak ada bantuan</span>}
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.familyMembers && selectedRequest.familyMembers.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Users size={12} /> Anggota Keluarga
                  </h4>
                  <div className="space-y-2">
                    {selectedRequest.familyMembers.map((member, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-100">
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-black text-slate-800">{member.name}</p>
                          <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded">{member.relation}</span>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <p className="text-[9px] font-bold text-slate-400">{member.job || '-'}</p>
                          <p className="text-[9px] font-bold text-slate-400">{member.gender}</p>
                          {member.nik && (
                            <div className="flex items-center gap-1">
                              <p className="text-[9px] font-bold text-slate-400 font-mono">NIK: {formatSensitiveNik(member.nik, !!showFullNiks[`req-member-${idx}`])}</p>
                              <button 
                                onClick={() => toggleNikVisibility(`req-member-${idx}`)}
                                className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              >
                                {showFullNiks[`req-member-${idx}`] ? <EyeOff size={10} /> : <Eye size={10} />}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedRequest.hasBusiness || selectedRequest.businessName) && (
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80">
                  <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Store size={12} className="text-amber-600" /> Profil Usaha / UMKM Warga
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Nama Usaha</p>
                      <p className="text-xs font-black text-slate-800">{selectedRequest.businessName || '-'}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Kategori</p>
                      <p className="text-xs font-black text-slate-800">{selectedRequest.businessCategory || '-'}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lokasi Operasional</p>
                      <p className="text-xs font-black text-slate-800">{selectedRequest.businessLocation || '-'}</p>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-amber-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No. WhatsApp</p>
                      <p className="text-xs font-black text-slate-800">{selectedRequest.businessPhone || '-'}</p>
                    </div>
                  </div>
                  {selectedRequest.businessDescription && (
                    <div className="p-2 bg-white rounded-lg border border-amber-100 mb-2">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deskripsi Produk/Jasa</p>
                      <p className="text-xs font-medium text-slate-700">{selectedRequest.businessDescription}</p>
                    </div>
                  )}
                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    selectedRequest.isUmkmRegistered ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedRequest.isUmkmRegistered ? '✓ Terdaftar di Katalog UMKM' : 'Internal RT Saja'}
                  </span>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Info size={12} /> Alasan Perubahan
                </h4>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.adminNote && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <h4 className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={12} /> Catatan Admin
                  </h4>
                  <p className="text-xs font-bold text-rose-700 leading-relaxed">{selectedRequest.adminNote}</p>
                </div>
              )}
            </div>

            <Button onClick={() => setSelectedRequest(null)} className="w-full bg-slate-800 hover:bg-slate-900">
              Tutup Detail
            </Button>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
