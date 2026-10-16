import React from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { 
  FileText, 
  Plus, 
  Clock, 
  Check, 
  X, 
  Phone, 
  Download, 
  Copy, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { House, LetterRequest } from '../../../../types';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';
import { generateSuratPengantar } from '../../../../services/pdfService';

interface ResidentLettersTabProps {
  letters: LetterRequest[];
  currentHouse: House | undefined;
  pdfConfig: any;
  showFullNiks: Record<string, boolean>;
  toggleNikVisibility: (key: string) => void;
  formatSensitiveNik: (nik: string, isVisible: boolean) => string;
}

export const ResidentLettersTab: React.FC<ResidentLettersTabProps> = ({
  letters,
  currentHouse,
  pdfConfig,
  showFullNiks,
  toggleNikVisibility,
  formatSensitiveNik,
}) => {
  return (
    <motion.div 
      key="letters"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Status Pengajuan Surat</h3>
          <p className="text-sm text-slate-500 font-medium">Pantau status surat pengantar yang Anda ajukan melalui menu Layanan.</p>
        </div>
        <Button onClick={() => window.location.hash = '#/services'} className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
          <Plus size={18} className="mr-2" /> Buat Pengajuan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {letters.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">Belum ada pengajuan surat.</p>
          </div>
        ) : (
          [...letters].sort((a, b) => {
            const isNewA = a.status === 'Menunggu' || a.status === 'Pending';
            const isNewB = b.status === 'Menunggu' || b.status === 'Pending';
            if (isNewA && !isNewB) return -1;
            if (!isNewA && isNewB) return 1;
            
            const timeA = a.date ? new Date(a.date).getTime() : 0;
            const timeB = b.date ? new Date(b.date).getTime() : 0;
            return timeB - timeA;
          }).map(letter => {
            const dateObj = new Date(letter.date);
            const formattedDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' });
            const hasTime = letter.date && (letter.date.includes('T') || letter.date.includes(':'));
            const formattedTime = hasTime && !isNaN(dateObj.getTime()) ? dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Makassar' }) + ' WITA' : '';
            
            return (() => {
              const isApproved = letter.status === 'Disetujui' || letter.status === 'Approved';
              const isRejected = letter.status === 'Ditolak' || letter.status === 'Rejected';
              const isPending = !isApproved && !isRejected;

              const timelineSteps = [
                {
                  title: 'Pengajuan Dikirim',
                  description: 'Permohonan surat pengantar berhasil dikirim oleh warga.',
                  status: 'completed',
                  date: formattedDate,
                  time: formattedTime,
                },
                {
                  title: 'Verifikasi Administrasi',
                  description: isPending 
                    ? 'Ketua RT sedang meninjau kelengkapan berkas dan NIK Pemohon.' 
                    : 'Berkas dan keaslian NIK warga telah dikonfirmasi oleh Ketua RT.',
                  status: isPending ? 'active' : 'completed',
                },
                {
                  title: 'Penomoran & Tanda Tangan',
                  description: isApproved 
                    ? `Ketua RT telah menandatangani surat dengan No: ${letter.letterNumber || '-'}.` 
                    : isRejected 
                    ? 'Proses penomoran dibatalkan karena pengajuan ditolak.' 
                    : 'Sedang menunggu antrean penomoran surat resmi.',
                  status: isApproved ? 'completed' : isRejected ? 'failed' : 'pending',
                },
                {
                  title: isRejected ? 'Pengajuan Ditolak' : 'Surat Selesai',
                  description: isApproved 
                    ? 'Surat pengantar selesai diproses dan siap untuk diunduh / dicetak.' 
                    : isRejected 
                    ? `Maaf, permohonan ditolak. Alasan: ${letter.estimatedTime || 'Dokumen kurang lengkap atau tidak sesuai.'}`
                    : 'Surat akan otomatis terbit setelah disetujui.',
                  status: isApproved ? 'completed' : isRejected ? 'failed' : 'pending',
                }
              ];

              return (
                <Card key={letter.id} className="bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{letter.type}</h4>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col mt-0.5">
                            <span>Diajukan: {formattedDate}</span>
                            {formattedTime && <span className="text-indigo-600 font-extrabold mt-0.5">{formattedTime}</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        isRejected ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {letter.status === 'Approved' ? 'Disetujui' : letter.status === 'Rejected' ? 'Ditolak' : letter.status === 'Pending' ? 'Menunggu' : letter.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{letter.purposeDetail}</p>
                      </div>
                      {letter.nik && (
                        <p className="text-[11px] font-bold text-slate-500 inline-flex items-center gap-1.5">
                          NIK Pemohon: <span className="text-slate-700 font-mono">{formatSensitiveNik(letter.nik, !!showFullNiks[`letter-${letter.id}`])}</span>
                          <button 
                            onClick={() => toggleNikVisibility(`letter-${letter.id}`)}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title={showFullNiks[`letter-${letter.id}`] ? "Sembunyikan NIK" : "Tampilkan NIK"}
                          >
                            {showFullNiks[`letter-${letter.id}`] ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                        </p>
                      )}
                      {letter.letterNumber && (
                        <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs">
                          <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Nomor Surat Resmi</p>
                          <p className="font-black text-indigo-700">{letter.letterNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Timeline Status Pelacakan */}
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-1.5 font-sans">
                        <Clock size={12} className="text-indigo-500" /> ALUR PELACAKAN STATUS SURAT
                      </p>
                      <div className="space-y-4 relative pl-3.5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                        {timelineSteps.map((step, idx) => {
                          let iconBg = 'bg-slate-100 text-slate-400';
                          let titleColor = 'text-slate-400 font-bold';
                          let iconElement = <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />;
                          
                          if (step.status === 'completed') {
                            iconBg = 'bg-emerald-500 text-white';
                            titleColor = 'text-slate-800 font-extrabold';
                            iconElement = <Check size={10} className="stroke-[3]" />;
                          } else if (step.status === 'active') {
                            iconBg = 'bg-indigo-600 text-white animate-pulse';
                            titleColor = 'text-indigo-700 font-extrabold';
                            iconElement = <Clock size={10} className="stroke-[3]" />;
                          } else if (step.status === 'failed') {
                            iconBg = 'bg-rose-500 text-white';
                            titleColor = 'text-rose-600 font-extrabold';
                            iconElement = <X size={10} className="stroke-[3]" />;
                          }

                          return (
                            <div key={idx} className="relative flex gap-3 text-xs">
                              <div className={`absolute -left-[23px] top-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-xs z-10 ${iconBg}`}>
                                {iconElement}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                  <span className={titleColor}>{step.title}</span>
                                  {step.date && (
                                    <span className="text-[9px] font-bold text-slate-400 font-mono whitespace-nowrap">
                                      {step.date} {step.time ? `• ${step.time}` : ''}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  {isPending && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Halo Ketua RT 002, saya ingin menanyakan status permohonan surat pengantar:
• Jenis Surat: ${letter.type}
• Pemohon: ${letter.applicantName || currentHouse?.headOfFamily || 'Warga'} (Blok ${currentHouse?.block}-${currentHouse?.number})
• Tanggal Pengajuan: ${formattedDate}
Mohon bantuan informasi tindak lanjutnya. Terima kasih!`;
                          window.open(`https://wa.me/6285961194621?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-indigo-200 transition-all cursor-pointer"
                      >
                        <Phone size={14} /> Tanya Ketua RT via WhatsApp
                      </button>
                    </div>
                  )}

                  {/* Download PDF Section */}
                  {isApproved && (
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={async () => {
                          try {
                            toast.info('Menyiapkan berkas PDF resmi...');
                            await generateSuratPengantar(letter, pdfConfig, false);
                            toast.success('Surat Pengantar berhasil diunduh!');
                          } catch (error) {
                            console.error(error);
                            toast.error('Gagal mengunduh Surat Pengantar PDF.');
                          }
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/15"
                      >
                        <Download size={14} /> Unduh Surat Pengantar Resmi (PDF)
                      </Button>
                      {letter.letterNumber && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(letter.letterNumber || '');
                            toast.success('Nomor surat berhasil disalin!');
                          }}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          title="Salin Nomor Surat"
                        >
                          <Copy size={13} />
                          <span>Salin No</span>
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })();
          })
        )}
      </div>
    </motion.div>
  );
};
