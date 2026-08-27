import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  Calendar, 
  User, 
  Home, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Share2,
  Printer,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { getLetterById } from '../../services/databaseService';
import { generateSuratPengantar } from '../../services/pdfService';
import { PdfConfig } from '../../types';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface PublicLetterDownloadProps {
  pdfConfig: PdfConfig;
}

export const PublicLetterDownload: React.FC<PublicLetterDownloadProps> = ({ pdfConfig }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<any>(null);
  const [error, setError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract ID from path params or URL query string (hash router fallback)
  const getCleanId = () => {
    if (paramId && paramId !== ':id') return paramId;
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const trackQuery = url.searchParams.get('track') || url.searchParams.get('id');
      if (trackQuery) return trackQuery;
      
      // Hash query fallback: /#/surat?track=...
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const hashParams = new URLSearchParams(hashParts[1]);
        const hashTrack = hashParams.get('track') || hashParams.get('id');
        if (hashTrack) return hashTrack;
      }
    }
    return null;
  };

  const id = getCleanId();

  useEffect(() => {
    const fetchLetter = async () => {
      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getLetterById(id);
        if (data) {
          setLetter(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Fetch letter download error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!letter) return;
    setIsDownloading(true);
    const toastId = toast.loading('Menyiapkan dokumen PDF resmi...');
    try {
      await generateSuratPengantar(letter, pdfConfig, false);
      toast.dismiss(toastId);
      toast.success('Surat digital berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error('Gagal mengunduh dokumen PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Memuat Berkas Surat Resmi...</p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-slate-800 text-center"
        >
          <div className="w-20 h-20 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
            <XCircle size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Surat Tidak Ditemukan</h2>
          <p className="text-slate-400 text-xs font-medium mb-8 leading-relaxed">
            Tautan surat tidak valid atau dokumen telah kedaluwarsa / dihapus dari sistem pengarsipan RT 02.
          </p>
          <Button onClick={() => navigate('/')} className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl">
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    );
  }

  const isApproved = letter.status === 'Disetujui' || letter.status === 'Approved' || letter.status === 'Selesai' || letter.status === 'Completed';

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 px-4 md:py-20 flex flex-col justify-center items-center relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl w-full mx-auto relative z-10 space-y-6">
        
        {/* Top Header Identity */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full shadow-inner">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">
              PORTAL RESMI PERSURATAN RT 02
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Unduh Surat Pengantar Digital
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-medium">
            Dokumen resmi terbitan Rukun Tetangga 02 yang telah disahkan dan siap digunakan.
          </p>
        </div>

        {/* Main Document Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl space-y-6"
        >
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                isApproved 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                <FileText size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Dokumen</p>
                <h3 className="text-lg font-black text-white leading-tight">
                  {letter.type || letter.requestType || 'Surat Pengantar'}
                </h3>
              </div>
            </div>

            <div className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border ${
              isApproved 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isApproved ? 'TERVERIFIKASI & SAH' : 'DALAM PROSES'}
            </div>
          </div>

          {/* Letter Info Grid */}
          <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 space-y-3.5 text-xs font-medium">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
              <span className="text-slate-400">Nomor Surat Resmi</span>
              <span className="font-mono font-black text-amber-400">
                {letter.letterNumber || 'Menunggu Penomoran'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
              <span className="text-slate-400">Nama Pemohon</span>
              <span className="font-bold text-white uppercase">{letter.applicantName || letter.name || '-'}</span>
            </div>

            {letter.nik && (
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <span className="text-slate-400">NIK Pemohon</span>
                <span className="font-mono font-bold text-slate-300">
                  {letter.nik.replace(/(\d{4})\d+(\d{4})/, '$1-******-$2')}
                </span>
              </div>
            )}

            {letter.houseId && (
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60">
                <span className="text-slate-400">Alamat Kavling</span>
                <span className="font-bold text-slate-200">Rumah Blok {letter.houseId}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Keperluan</span>
              <span className="font-bold text-emerald-300 text-right max-w-xs truncate">
                {letter.purposeDetail || letter.purpose || 'Administrasi Kependudukan'}
              </span>
            </div>
          </div>

          {/* Download Action Primary Banner */}
          {isApproved ? (
            <div className="space-y-3 pt-2">
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Download size={18} className="animate-bounce-short" /> 
                {isDownloading ? 'Sedang Memproses...' : 'Unduh Berkas Surat (PDF Resmi)'}
              </button>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <p className="text-[11px] text-emerald-300 font-medium leading-relaxed">
                  ✓ Dokumen PDF telah dilengkapi <b>Tanda Tangan Digital &amp; Stempel Sah RT 02</b>. Siap dicetak atau dilampirkan secara online.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center space-y-1">
              <p className="text-xs font-black text-amber-300 uppercase tracking-wider">Surat Sedang Diverifikasi Pengurus RT</p>
              <p className="text-[11px] text-slate-400 font-medium">Tombol unduh PDF akan aktif otomatis begitu surat disetujui oleh Ketua RT.</p>
            </div>
          )}

          {/* Secondary Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={() => navigate('/')}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft size={14} /> Beranda Portal
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Surat Pengantar RT 02 - ${letter.applicantName}`,
                    url: window.location.href
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Tautan surat disalin ke clipboard!');
                }
              }}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              title="Bagikan Tautan Surat"
            >
              <Share2 size={14} />
            </button>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          Teras Warga RT 02 &bull; Sistem Otentikasi Digital
        </p>
      </div>
    </div>
  );
};
