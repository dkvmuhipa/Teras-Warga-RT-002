import React, { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2, XCircle, Clock, Search, Filter, Eye, MessageCircle, Sparkles, Trash2, Printer } from 'lucide-react';
import { LetterRequest, Report, PdfConfig } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { updateLetterStatus, updateReportStatus, deleteLetterFromDb } from '../../services/databaseService';
import { sendWhatsAppMessage, formatLetterStatusForWhatsApp } from '../../services/whatsappService';
import { analyzeReports } from '../../services/geminiService';
import { generateSuratPengantar } from '../../services/pdfService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ServiceManagerProps {
  reports: Report[];
  letters: LetterRequest[];
  pdfConfig: PdfConfig;
  setPdfConfig: (config: PdfConfig) => void;
}

export const ServiceManager: React.FC<ServiceManagerProps> = ({ reports, letters, pdfConfig, setPdfConfig }) => {
  const [activeTab, setActiveTab] = useState<'letters' | 'reports'>('letters');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [selectedLetter, setSelectedLetter] = useState<LetterRequest | null>(null);
  const [letterNumberInput, setLetterNumberInput] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  React.useEffect(() => {
    if (selectedLetter && selectedLetter.status === 'Pending') {
      const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
      const currentYear = new Date().getFullYear();
      const nextNum = (pdfConfig.lastLetterNumber || 0) + 1;
      const paddedNum = nextNum.toString().padStart(3, '0');
      setLetterNumberInput(`${paddedNum}/${pdfConfig.rtName.replace(/\s/g, '')}/${currentMonthRoman}/${currentYear}`);
    } else if (selectedLetter && selectedLetter.letterNumber) {
      setLetterNumberInput(selectedLetter.letterNumber);
    }
  }, [selectedLetter, pdfConfig]);

  const handleAnalyzeReports = async () => {
    setIsAiLoading(true);
    const reportTexts = reports.map(r => r.description);
    const analysis = await analyzeReports(reportTexts);
    setAiAnalysis(analysis);
    setIsAiLoading(false);
  };

  const handleUpdateLetterStatus = async (id: string, status: 'Approved' | 'Rejected', letter?: LetterRequest) => {
    if (confirm(`Ubah status surat menjadi ${status}?`)) {
      await updateLetterStatus(id, status, status === 'Approved' ? letterNumberInput : undefined);
      
      if (status === 'Approved' && letter) {
        // Generate official PDF with stamp and signature
        const updatedLetter = { ...letter, letterNumber: letterNumberInput };
        await generateSuratPengantar(updatedLetter, pdfConfig, false);

        // Update lastLetterNumber in config
        const nextNum = (pdfConfig.lastLetterNumber || 0) + 1;
        const newConfig = { ...pdfConfig, lastLetterNumber: nextNum };
        setPdfConfig(newConfig);
        localStorage.setItem('pdf_config', JSON.stringify(newConfig));
      }
      
      setSelectedLetter(null);
      setLetterNumberInput('');
    }
  };

  const handleUpdateReportStatus = async (id: string, status: 'Diproses' | 'Selesai') => {
    if (confirm(`Ubah status laporan menjadi ${status}?`)) {
      await updateReportStatus(id, status);
      setSelectedReport(null);
    }
  };

  const handleDeleteLetter = async (id: string) => {
    if (confirm('Hapus pengajuan surat ini secara permanen?')) {
      await deleteLetterFromDb(id);
    }
  };

  const filteredLetters = letters.filter(l => {
    const matchSearch = l.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        l.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredReports = reports.filter(r => {
    const matchSearch = r.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Layanan & Aduan</h2>
          <p className="text-slate-500 font-medium mt-1">Pusat pengelolaan surat pengantar dan laporan warga.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] border border-slate-200/50 shadow-inner w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('letters')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'letters' 
                ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <FileText size={16} />
            <span>Surat ({letters.filter(l => l.status === 'Pending').length})</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'reports' 
                ? 'bg-white text-rose-600 shadow-md ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <AlertTriangle size={16} />
            <span>Laporan ({reports.filter(r => r.status === 'Baru').length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <p className="text-sm font-bold text-slate-600">Butuh bantuan menganalisis laporan warga?</p>
          <Button onClick={handleAnalyzeReports} className="bg-indigo-600 hover:bg-indigo-700">
            <Sparkles size={18} className="mr-2" /> {isAiLoading ? 'Menganalisis...' : 'Analisis dengan AI'}
          </Button>
        </div>
      )}

      {aiAnalysis && (
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
          <h4 className="font-bold text-lg mb-4 text-indigo-300">Hasil Analisis AI:</h4>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="relative flex-1 md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'letters' ? "Cari pemohon atau jenis surat..." : "Cari pelapor atau isi laporan..."}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
             <Filter size={14} className="text-slate-400"/>
             <select className="bg-transparent border-none text-xs font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer" value={filterStatus} onChange={(e:any) => setFilterStatus(e.target.value)}>
               <option value="All">Semua Status</option>
               {activeTab === 'letters' ? (
                 <>
                   <option value="Pending">Pending</option>
                   <option value="Approved">Disetujui</option>
                   <option value="Rejected">Ditolak</option>
                 </>
               ) : (
                 <>
                   <option value="Baru">Baru</option>
                   <option value="Diproses">Diproses</option>
                   <option value="Selesai">Selesai</option>
                 </>
               )}
             </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'letters' ? (
          <motion.div 
            key="letters"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredLetters.map((letter) => (
              <motion.div 
                key={letter.id}
                layout
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[2.5rem] flex items-center justify-center ${
                  letter.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                  letter.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {letter.status === 'Pending' && <Clock size={24} />}
                  {letter.status === 'Approved' && <CheckCircle2 size={24} />}
                  {letter.status === 'Rejected' && <XCircle size={24} />}
                </div>

                <div className="mb-6 relative z-10">
                  <span className="inline-block px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-3 border border-indigo-100">
                    {letter.type}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{letter.applicantName}</h3>
                  <p className="text-sm font-medium text-slate-500">Blok {letter.houseId}</p>
                </div>

                <div className="space-y-3 mb-6 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <Clock size={14} />
                    <span>Diajukan: {new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 leading-relaxed border border-slate-100">
                    <span className="font-bold block mb-1 text-slate-400 uppercase tracking-wider text-[10px]">Keperluan:</span>
                    {letter.purposeDetail || '-'}
                  </div>
                </div>

                <div className="flex gap-2 relative z-10">
                  <button 
                    onClick={() => setSelectedLetter(letter)}
                    className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2"
                  >
                    <Eye size={14} /> Detail
                  </button>
                  
                  {letter.status === 'Approved' && (
                    <button 
                      onClick={() => generateSuratPengantar(letter, pdfConfig, false)}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                      title="Cetak Surat"
                    >
                      <Printer size={16} />
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeleteLetter(letter.id)}
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                    title="Hapus Pengajuan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {filteredReports.map((report) => (
              <motion.div 
                key={report.id}
                layout
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-rose-100/50 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group"
              >
                <div className={`p-4 rounded-2xl shrink-0 ${
                  report.type === 'Keamanan' ? 'bg-rose-50 text-rose-600' :
                  report.type === 'Kebersihan' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      report.status === 'Baru' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                      report.status === 'Diproses' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-bold text-slate-500">{report.type}</span>
                    <span className="text-xs font-bold text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-400">{new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1 truncate">{report.description}</h3>
                  <p className="text-sm font-medium text-slate-500">Pelapor: <span className="text-slate-800">{report.reporterName}</span> {report.houseId && `(Blok ${report.houseId})`}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button 
                    onClick={() => setSelectedReport(report)}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap flex items-center gap-2 w-full md:w-auto justify-center"
                  >
                    <Eye size={14} /> Lihat Detail
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Letter Detail Modal */}
      <Modal isOpen={!!selectedLetter} onClose={() => setSelectedLetter(null)} title="Detail Permohonan Surat">
            {selectedLetter && (
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jenis Surat</p>
                      <p className="font-bold text-slate-800">{selectedLetter.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Saat Ini</p>
                      <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                        selectedLetter.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        selectedLetter.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {selectedLetter.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Pemohon</p>
                      <p className="font-bold text-slate-800">{selectedLetter.applicantName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NIK</p>
                      <p className="font-bold text-slate-800">{selectedLetter.nik}</p>
                    </div>
                    
                    {/* New Fields */}
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No. HP / WA</p>
                      <p className="font-bold text-slate-800">{selectedLetter.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                      <p className="font-bold text-slate-800">{selectedLetter.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendidikan</p>
                      <p className="font-bold text-slate-800">{selectedLetter.education || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gol. Darah</p>
                      <p className="font-bold text-slate-800">{selectedLetter.bloodType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keluarga</p>
                      <p className="font-bold text-slate-800">{selectedLetter.familyStatus || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pekerjaan</p>
                      <p className="font-bold text-slate-800">{selectedLetter.job || '-'}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat KTP</p>
                      <p className="font-medium text-slate-700">{selectedLetter.addressKtp || '-'}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                      <p className="font-medium text-slate-700 bg-white p-3 rounded-xl border border-slate-200">{selectedLetter.purposeDetail}</p>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-slate-200">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Surat (Dapat Diedit)</label>
                      <input 
                        type="text"
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        value={letterNumberInput}
                        onChange={(e) => setLetterNumberInput(e.target.value)}
                        placeholder="Contoh: 001/RT002/III/2026"
                      />
                      <p className="text-[10px] font-medium text-slate-400 mt-2 italic">* Nomor ini akan dicetak pada dokumen resmi.</p>
                    </div>
                  </div>
                </div>

                {selectedLetter.status === 'Pending' && (
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => handleUpdateLetterStatus(selectedLetter.id, 'Rejected')}
                      className="bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 shadow-none"
                    >
                      <XCircle size={18} className="mr-2" /> Tolak
                    </Button>
                    <Button 
                      onClick={() => handleUpdateLetterStatus(selectedLetter.id, 'Approved', selectedLetter)}
                      className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                    >
                      <CheckCircle2 size={18} className="mr-2" /> Setujui & Cetak
                    </Button>
                  </div>
                )}
                <Button 
                  onClick={() => sendWhatsAppMessage(selectedLetter.phone, formatLetterStatusForWhatsApp(selectedLetter.applicantName, selectedLetter.type, selectedLetter.status))}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 mt-4"
                >
                  <MessageCircle size={18} className="mr-2" /> Kirim Update via WhatsApp
                </Button>
              </div>
            )}
      </Modal>

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Detail Laporan Warga">
        {selectedReport && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  selectedReport.type === 'Keamanan' ? 'bg-rose-100 text-rose-600' :
                  selectedReport.type === 'Kebersihan' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">{selectedReport.type}</h4>
                  <p className="text-xs font-medium text-slate-500">{new Date(selectedReport.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Isi Laporan</p>
                <p className="font-medium text-slate-800 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                  "{selectedReport.description}"
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pelapor</p>
                  <p className="font-bold text-slate-800">{selectedReport.reporterName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lokasi/Blok</p>
                  <p className="font-bold text-slate-800">{selectedReport.houseId || '-'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedReport.status === 'Baru' && (
                <Button 
                  onClick={() => handleUpdateReportStatus(selectedReport.id, 'Diproses')}
                  className="col-span-2 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                >
                  <Clock size={18} className="mr-2" /> Tandai Sedang Diproses
                </Button>
              )}
              {selectedReport.status === 'Diproses' && (
                <Button 
                  onClick={() => handleUpdateReportStatus(selectedReport.id, 'Selesai')}
                  className="col-span-2 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                >
                  <CheckCircle2 size={18} className="mr-2" /> Tandai Selesai
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
