import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { House, OccupantHistoryItem } from '../../../types';
import { 
  UserMinus, UserPlus, AlertTriangle, ArrowRight, 
  Calendar, FileText, CheckCircle2, ShieldAlert, Edit3, HelpCircle 
} from 'lucide-react';

interface OccupantTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldHouse: House;
  newFormData: any;
  onConfirm: (
    action: 'move_out' | 'typo_fix',
    options?: {
      moveOutReason?: OccupantHistoryItem['moveOutReason'];
      moveOutNotes?: string;
      moveOutDate?: string;
    }
  ) => void;
}

export const OccupantTransitionModal: React.FC<OccupantTransitionModalProps> = ({
  isOpen,
  onClose,
  oldHouse,
  newFormData,
  onConfirm
}) => {
  const [selectedAction, setSelectedAction] = useState<'move_out' | 'typo_fix'>('move_out');
  const [moveOutReason, setMoveOutReason] = useState<OccupantHistoryItem['moveOutReason']>('Pindah Keluar (Tanpa Pamit)');
  const [moveOutDate, setMoveOutDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [moveOutNotes, setMoveOutNotes] = useState<string>('Pindah tanpa pamit/lapor ke pengurus RT, digantikan oleh penghuni baru.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAction === 'move_out') {
      onConfirm('move_out', {
        moveOutReason,
        moveOutDate,
        moveOutNotes
      });
    } else {
      onConfirm('typo_fix');
    }
  };

  const oldOccupantsCount = oldHouse.occupants || (1 + (oldHouse.familyMembers?.length || 0));
  const newOccupantsCount = newFormData.occupants || (1 + (newFormData.familyMembers?.length || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deteksi Pergantian Penghuni Rumah"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-1 text-left">
        {/* Alert Header Box */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
          <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
              Perbedaan Kepala Keluarga Terdeteksi
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
              Rumah <strong>Blok {oldHouse.block}-{oldHouse.number}</strong> sebelumnya terdata atas nama penghuni lain. Mohon konfirmasi apakah warga lama telah <strong>pindah keluar</strong> atau hanya koreksi penulisan nama.
            </p>
          </div>
        </div>

        {/* Comparison Cards: Old vs New Resident */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Old Occupant */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-rose-600">
              <UserMinus size={13} />
              <span>Penghuni Sebelumnya (Lama)</span>
            </div>
            <div className="font-extrabold text-slate-800 text-sm">
              {oldHouse.headOfFamily || 'Tidak Tercatat'}
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/60">
              <div>• Status: <strong className="text-slate-700">{oldHouse.residenceType || 'Tetap'}</strong> ({oldOccupantsCount} Jiwa)</div>
              <div>• NIK: <span className="font-mono text-slate-600">{oldHouse.nik || '-'}</span></div>
              <div>• HP: <span className="text-slate-600">{oldHouse.phone || '-'}</span></div>
              <div>• Tinggal sejak: <span className="text-slate-600">{oldHouse.joiningDate ? oldHouse.joiningDate.split('T')[0] : 'Registrasi Awal'}</span></div>
            </div>
          </div>

          {/* New Occupant */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-700">
              <UserPlus size={13} />
              <span>Penghuni Pengganti (Baru)</span>
            </div>
            <div className="font-extrabold text-emerald-950 text-sm">
              {newFormData.headOfFamily || 'Belum Diisi'}
            </div>
            <div className="text-[11px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200/60">
              <div>• Status: <strong className="text-emerald-900">{newFormData.residenceType || 'Tetap'}</strong> ({newOccupantsCount} Jiwa)</div>
              <div>• NIK: <span className="font-mono text-emerald-900">{newFormData.nik || '-'}</span></div>
              <div>• HP: <span className="text-emerald-900">{newFormData.phone || '-'}</span></div>
              <div>• Tanggal masuk: <span className="text-emerald-900">{newFormData.joiningDate ? newFormData.joiningDate.split('T')[0] : 'Hari Ini'}</span></div>
            </div>
          </div>
        </div>

        {/* Selection Options */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
            Pilih Jenis Perubahan:
          </label>

          <div className="grid grid-cols-1 gap-2">
            {/* Option 1: Move out */}
            <button
              type="button"
              onClick={() => setSelectedAction('move_out')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'move_out'
                  ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                selectedAction === 'move_out' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <UserMinus size={16} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Warga Lama Pindah Keluar (Pergantian Penghuni)
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-purple-200 text-purple-800 uppercase">
                    Rekomendasi
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Otomatis catat mutasi <strong>Pindah Keluar (-{oldOccupantsCount} jiwa)</strong> di Buku Mutasi Kependudukan dan simpan profil warga lama ke <strong>Riwayat Penghuni Lampau</strong> kavling ini.
                </p>
              </div>
            </button>

            {/* Option 2: Typo correction */}
            <button
              type="button"
              onClick={() => setSelectedAction('typo_fix')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                selectedAction === 'typo_fix'
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                selectedAction === 'typo_fix' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Edit3 size={16} />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Hanya Koreksi Nama / Salah Ketik (Orang yang Sama)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Hanya memperbarui teks nama tanpa membuat catatan mutasi warga pindah keluar.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Move Out Extra Fields */}
        {selectedAction === 'move_out' && (
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 animate-fadeIn">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 uppercase tracking-wider">
              <ShieldAlert size={14} className="text-purple-600" />
              <span>Detail Kepindahan Penghuni Sebelumnya</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Alasan Kepindahan Warga Lama: *
              </label>
              <select
                value={moveOutReason}
                onChange={(e) => setMoveOutReason(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="Pindah Keluar (Tanpa Pamit)">🚨 Pindah Keluar (Tanpa Pamit / Tidak Lapor RT)</option>
                <option value="Pindah Keluar (Resmi)">Pindah Keluar Resmi (Ada Surat / Lapor Pengurus)</option>
                <option value="Selesai Kontrak/Sewa">Masa Sewa / Kontrak Habis</option>
                <option value="Pindah Rumah Lain">Pindah ke Unit Rumah Lain di Tondo</option>
                <option value="Lainnya">Alasan Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Perkiraan Tanggal Keluar:
                </label>
                <input
                  type="date"
                  value={moveOutDate}
                  onChange={(e) => setMoveOutDate(e.target.value)}
                  className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Catatan RT / Kronologi Lapangan:
                </label>
                <input
                  type="text"
                  placeholder="Misal: Pindah mendadak, tidak berpamitan..."
                  value={moveOutNotes}
                  onChange={(e) => setMoveOutNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Batal
          </Button>

          <Button
            type="submit"
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold px-4 py-2 flex items-center gap-1.5"
          >
            <span>Konfirmasi &amp; Simpan Data</span>
            <ArrowRight size={13} />
          </Button>
        </div>
      </form>
    </Modal>
  );
};
