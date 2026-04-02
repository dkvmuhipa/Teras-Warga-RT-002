import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Clock, 
  User, 
  FileText, 
  Home, 
  Calendar, 
  Info,
  ArrowLeft,
  Download,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { getLetterById } from '../../services/databaseService';
import { Button } from '../ui/Button';

export const PublicVerification = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [letter, setLetter] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLetter = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getLetterById(id);
        if (data) {
          setLetter(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLetter();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memverifikasi Dokumen...</p>
        </div>
      </div>
    );
  }

  if (error || !letter) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl shadow-rose-100 border border-rose-100 text-center"
        >
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <XCircle size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Verifikasi Gagal</h2>
          <p className="text-slate-500 font-medium mb-8">
            ID Dokumen tidak ditemukan atau tidak valid. Pastikan Anda memindai QR Code dari dokumen asli yang diterbitkan oleh RT 02.
          </p>
          <Button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 hover:bg-slate-800">
            Kembali ke Beranda
          </Button>
        </motion.div>
      </div>
    );
  }

  const isApproved = letter.status === 'Disetujui' || letter.status === 'Approved';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:py-24">
      <div className="max-w-3xl mx-auto">
        {/* Header Logo/Brand */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-slate-100 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-widest text-slate-900">Sistem Otentikasi Digital RT 02</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Verifikasi Keaslian Dokumen</h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden"
        >
          {/* Status Banner */}
          <div className={`p-8 md:p-12 text-center ${isApproved ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${isApproved ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-amber-500 text-white shadow-amber-200'}`}>
              {isApproved ? <CheckCircle2 size={40} /> : <Clock size={40} />}
            </div>
            <h2 className={`text-2xl font-black mb-2 ${isApproved ? 'text-emerald-900' : 'text-amber-900'}`}>
              {isApproved ? 'Dokumen Terverifikasi Sah' : 'Dokumen Sedang Diproses'}
            </h2>
            <p className={`text-sm font-medium ${isApproved ? 'text-emerald-700/70' : 'text-amber-700/70'}`}>
              ID Otentikasi: <span className="font-mono font-bold">{letter.id.toUpperCase()}</span>
            </p>
          </div>

          {/* Document Details */}
          <div className="p-8 md:p-12 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Dokumen</label>
                  <div className="flex items-center gap-3 text-slate-900">
                    <FileText size={18} className="text-indigo-500" />
                    <span className="font-bold">Surat {letter.type}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Pemohon</label>
                  <div className="flex items-center gap-3 text-slate-900">
                    <User size={18} className="text-indigo-500" />
                    <span className="font-bold">{letter.applicantName}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">NIK / No. KTP</label>
                  <div className="flex items-center gap-3 text-slate-900">
                    <ShieldCheck size={18} className="text-indigo-500" />
                    <span className="font-bold">
                      {letter.nik ? (typeof letter.nik === 'string' ? `${letter.nik.substring(0, 6)}**********` : 'Terdata') : 'Tidak Terlampir'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asal Rumah</label>
                  <div className="flex items-center gap-3 text-slate-900">
                    <Home size={18} className="text-indigo-500" />
                    <span className="font-bold">Blok {letter.houseId}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Terbit</label>
                  <div className="flex items-center gap-3 text-slate-900">
                    <Calendar size={18} className="text-indigo-500" />
                    <span className="font-bold">{new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status Validasi</label>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className={`text-sm font-black uppercase tracking-widest ${isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {letter.status || 'Menunggu'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Note */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-4">
              <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm">
                <Info size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 mb-1">Catatan Keamanan</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Data yang ditampilkan di atas ditarik langsung dari database kependudukan RT 02. Jika informasi pada dokumen fisik berbeda dengan data di halaman ini, maka dokumen tersebut dinyatakan <b>TIDAK SAH</b> atau palsu.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1 py-4 rounded-2xl border-slate-200 text-slate-600">
                <ArrowLeft size={18} className="mr-2" /> Kembali ke Portal
              </Button>
              <Button onClick={() => window.print()} className="flex-1 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-100">
                <Download size={18} className="mr-2" /> Cetak Bukti Verifikasi
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Powered by Teras Warga Digital Ecosystem</p>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldAlert size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Anti-Fraud System</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <ExternalLink size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Official Verification</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
