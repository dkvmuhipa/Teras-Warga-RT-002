import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle,
  ArrowRight,
  Baby,
  Activity,
  X,
  Printer,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { PopulationChangeLog, PdfConfig } from '../../../types';
import { generateSingleMutationCertificatePDF } from '../../../services/pdfService';
import { sendWhatsAppViaGateway } from '../../../services/whatsappService';

interface PopulationLogDetailModalProps {
  selectedLog: PopulationChangeLog | null;
  onClose: () => void;
  pdfConfig?: PdfConfig;
}

export const PopulationLogDetailModal: React.FC<PopulationLogDetailModalProps> = ({
  selectedLog,
  onClose,
  pdfConfig
}) => {
  return (
    <AnimatePresence>
      {selectedLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
            onClick={onClose} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }} 
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 z-10 space-y-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl text-white ${
                  selectedLog.type === 'Newcomer' ? 'bg-emerald-600' :
                  selectedLog.type === 'MovedOut' ? 'bg-amber-500' :
                  selectedLog.type === 'Birth' ? 'bg-indigo-600' : 'bg-rose-600'
                }`}>
                  {selectedLog.type === 'Newcomer' ? <CheckCircle size={20} /> :
                   selectedLog.type === 'MovedOut' ? <ArrowRight size={20} /> :
                   selectedLog.type === 'Birth' ? <Baby size={20} /> : <Activity size={20} />}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Rincian Log Mutasi Kependudukan
                  </span>
                  <h3 className="text-lg font-black text-slate-900">{selectedLog.name}</h3>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Tanggal Peristiwa</span>
                <span className="text-slate-800 font-mono font-bold text-sm">{selectedLog.date}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Status Verifikasi</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  (!selectedLog.verificationStatus || selectedLog.verificationStatus === 'Approved') ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedLog.verificationStatus || 'Approved'}
                </span>
              </div>
            </div>

            {selectedLog.details && (
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-2 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-2">Detail Spesifik Mutasi</span>
                {selectedLog.type === 'Newcomer' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-500">Alamat Asal:</span>
                      <span className="font-bold text-indigo-600">{selectedLog.details.previousAddress || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-500">Status Kepemilikan:</span>
                      <span className="font-bold text-slate-800">{selectedLog.details.residenceType || 'Tetap'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jumlah Anggota Keluarga:</span>
                      <span className="font-bold text-slate-800">{selectedLog.details.familyCount || 1} Orang</span>
                    </div>
                  </>
                )}
                {selectedLog.type === 'MovedOut' && (
                  <>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-500">Alamat Tujuan:</span>
                      <span className="font-bold text-amber-600">{selectedLog.details.newAddress || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alasan Kepindahan:</span>
                      <span className="font-bold text-slate-800">{selectedLog.details.reasonForMoving || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => generateSingleMutationCertificatePDF(selectedLog, pdfConfig)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
              >
                <Printer size={16} /> Cetak PDF Surat Pengantar
              </button>
              {selectedLog.phone && selectedLog.phone !== '-' && (
                <button
                  onClick={async () => {
                    const msg = `Halo ${selectedLog.name}, Pengurus RT 02 mengonfirmasi status log mutasi domisili Anda.`;
                    const res = await sendWhatsAppViaGateway(selectedLog.phone || '', msg);
                    if (res?.success) toast.success("WhatsApp berhasil dikirim!");
                    else toast.error("Gagal mengirim pesan.");
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  <MessageCircle size={16} /> Kirim WhatsApp
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
