import React from 'react';
import { 
  Shield, 
  Trash2, 
  Wrench, 
  Users, 
  AlertTriangle, 
  Info, 
  Send 
} from 'lucide-react';
import { Report } from '../../../../types';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { ReportFormData } from '../types';

interface ResidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportForm: ReportFormData;
  setReportForm: React.Dispatch<React.SetStateAction<ReportFormData>>;
  handleSubmitReport: (e: React.FormEvent) => void;
  isSubmittingReport: boolean;
  selectedReportDetail: Report | null;
  onCloseReportDetail: () => void;
}

export const ResidentReportModal: React.FC<ResidentReportModalProps> = ({
  isOpen,
  onClose,
  reportForm,
  setReportForm,
  handleSubmitReport,
  isSubmittingReport,
  selectedReportDetail,
  onCloseReportDetail,
}) => {
  return (
    <>
      {/* Report Issue Modal */}
      <Modal isOpen={isOpen} onClose={onClose} title="Buat Laporan Masalah Baru" maxWidth="max-w-xl">
        <div className="p-6">
          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="space-y-3">
              <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Pilih Kategori Masalah <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'Keamanan', title: 'Keamanan', desc: 'Sengketa, gatal, maling', icon: Shield, color: 'text-rose-600', activeBg: 'bg-rose-50 border-rose-500' },
                  { id: 'Kebersihan', title: 'Kebersihan', desc: 'Sampah liar, got mampet', icon: Trash2, color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500' },
                  { id: 'Fasilitas', title: 'Fasilitas', desc: 'Lampu mati, aspal berlubang', icon: Wrench, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-500' },
                  { id: 'Sosial', title: 'Sosial', desc: 'Keributan, keramaian', icon: Users, color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500' },
                  { id: 'Lainnya', title: 'Lainnya', desc: 'Aspirasi & masalah lainnya', icon: AlertTriangle, color: 'text-slate-600', activeBg: 'bg-slate-100 border-slate-400' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = reportForm.type === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setReportForm({...reportForm, type: item.id as any})}
                      className={`
                        p-3 rounded-xl border text-left flex gap-3 transition-all duration-200 cursor-pointer w-full
                        ${isSelected 
                          ? `${item.activeBg} border border-rose-500 shadow-sm text-slate-900 ring-2 ring-rose-500/10` 
                          : 'bg-slate-50 hover:bg-slate-100/70 text-slate-600 border-slate-200'
                        }
                      `}
                    >
                      <div className={`p-2 bg-white rounded-lg shadow-xs self-start shrink-0 ${item.color} transition-all`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wide">{item.title}</p>
                        <p className="text-[9.5px] text-slate-400 font-semibold mt-0.5 leading-normal">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10.5px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Deskripsi &amp; Kronologi Masalah <span className="text-rose-500">*</span>
              </label>
              <textarea 
                rows={4}
                placeholder="Ceritakan kronologi masalah secara jelas, detail, dan apa saja yang berdampak..."
                className="w-full px-4.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all resize-none shadow-xs placeholder:font-medium leading-relaxed"
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
                required
              />
            </div>

            {/* Note box */}
            <div className="p-3 bg-rose-50/50 border border-rose-100/70 rounded-xl flex gap-3.5">
              <div className="p-2 bg-white rounded-lg shadow-xs self-start text-rose-500">
                <Info size={14} />
              </div>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                Laporan ini akan langsung dikirimkan ke database RT 02 atas nama Anda selaku warga resmi yang terdaftar secara sah di sistem siber kependudukan.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 py-4.5 rounded-xl text-xs font-black uppercase tracking-widest"
                onClick={onClose}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingReport}
                className="flex-[2] py-4.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-200/50 hover:shadow-rose-300 transition-all"
              >
                {isSubmittingReport ? 'Mengirim...' : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={14} /> Kirim Laporan Resmi
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReportDetail} onClose={onCloseReportDetail} title="Detail Laporan">
        {selectedReportDetail && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Laporan</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedReportDetail.status === 'Selesai' ? 'bg-emerald-500' :
                    selectedReportDetail.status === 'Diproses' ? 'bg-indigo-500' :
                    'bg-rose-500'
                  }`} />
                  <span className="text-sm font-black text-slate-800">{selectedReportDetail.status}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kategori</p>
                <span className="text-sm font-black text-slate-800">{selectedReportDetail.type}</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Isi Laporan</p>
              <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 leading-relaxed">
                {selectedReportDetail.description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Laporan</p>
                <p className="text-sm font-bold text-slate-800">
                  {new Date(selectedReportDetail.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Laporan</p>
                <p className="text-sm font-bold text-slate-800">#{selectedReportDetail.id.slice(-8)}</p>
              </div>
            </div>

            <Button onClick={onCloseReportDetail} className="w-full py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-2xl text-xs font-black uppercase tracking-widest">
              Tutup
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
};
