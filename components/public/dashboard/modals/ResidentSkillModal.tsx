import React from 'react';
import { toast } from 'sonner';
import { House } from '../../../../types';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { addReportToDb } from '../../../../services/databaseService';
import { SkillFormData } from '../types';

interface ResidentSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillForm: SkillFormData;
  setSkillForm: React.Dispatch<React.SetStateAction<SkillFormData>>;
  currentHouse: House | undefined;
  selectedHouseId: string;
}

export const ResidentSkillModal: React.FC<ResidentSkillModalProps> = ({
  isOpen,
  onClose,
  skillForm,
  setSkillForm,
  currentHouse,
  selectedHouseId,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Promosikan Jasa &amp; Keahlian Warga">
      <form onSubmit={async (e) => {
        e.preventDefault();
        if (!skillForm.title || !skillForm.description || !skillForm.phone) {
          return toast.error('Mohon lengkapi judul jasa, deskripsi, dan nomor WA.');
        }

        try {
          await addReportToDb({
            type: 'Keamanan' as any,
            reporterName: currentHouse?.headOfFamily || 'Warga',
            reporterHouseId: selectedHouseId,
            date: new Date().toISOString(),
            description: `[PROMOSI JASA] ${skillForm.category}: ${skillForm.title} - ${skillForm.description} (WA: ${skillForm.phone}, Tarif: ${skillForm.rateInfo || '-'})`,
            status: 'Diproses'
          });

          toast.success('Promosi jasa Anda telah dikirim ke Pengurus RT untuk verifikasi tayang!');
          onClose();
        } catch (error) {
          toast.error('Gagal mengirim data jasa.');
        }
      }} className="space-y-4 text-left">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kategori Layanan / Jasa</label>
          <select
            value={skillForm.category}
            onChange={e => setSkillForm({...skillForm, category: e.target.value as any})}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
          >
            <option value="Pertukangan & Bangunan">Pertukangan &amp; Bangunan</option>
            <option value="Elektronik & Kelistrikan">Elektronik &amp; Kelistrikan (AC, Kulkas, Pompa Air)</option>
            <option value="Pendidikan & Les">Pendidikan &amp; Les Privat Anak</option>
            <option value="Katering & Kuliner">Katering &amp; Kuliner Rumahan</option>
            <option value="Kecantikan & Jahit">Kecantikan &amp; Jahit Baju</option>
            <option value="Otomotif & Transportasi">Otomotif &amp; Jasa Antar / Angkut</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Judul / Nama Jasa</label>
          <input 
            type="text" 
            required
            value={skillForm.title}
            onChange={e => setSkillForm({...skillForm, title: e.target.value})}
            placeholder="Contoh: Servis AC & Cuci AC Bersih"
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rincian Keahlian &amp; Pengalaman</label>
          <textarea 
            required
            rows={3}
            value={skillForm.description}
            onChange={e => setSkillForm({...skillForm, description: e.target.value})}
            placeholder="Jelaskan jenis pekerjaan yang bisa dibantu, garansi, atau ketersediaan waktu..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nomor WhatsApp</label>
            <input 
              type="text" 
              required
              value={skillForm.phone}
              onChange={e => setSkillForm({...skillForm, phone: e.target.value})}
              placeholder="0812xxxxxxxx"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perkiraan Biaya / Tarif</label>
            <input 
              type="text" 
              value={skillForm.rateInfo}
              onChange={e => setSkillForm({...skillForm, rateInfo: e.target.value})}
              placeholder="Contoh: Mulai Rp 50.000 / Nego"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <Button type="submit" className="w-full py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 mt-2">
          Simpan &amp; Publikasikan Jasa
        </Button>
      </form>
    </Modal>
  );
};
