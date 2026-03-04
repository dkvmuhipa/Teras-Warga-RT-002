import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, AlertTriangle, History, Send, User, MapPin, 
  Calendar, Briefcase, Heart, Flag, Home, Lock, CheckCircle2, Clock, XCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PdfConfig, LetterRequest, Report, House } from '../../types';
import { generateSuratPengantar, generateReportReceiptPDF } from '../../services/pdfService';
import { addLetterToDb, addReportToDb, validateResidentAccess } from '../../services/databaseService';
import { HouseMap } from '../HouseMap';
import { Button } from '../ui/Button';

interface PublicServicesProps {
  pdfConfig: PdfConfig;
  houses?: House[]; // Optional for map
}

export const PublicServices: React.FC<PublicServicesProps> = ({ pdfConfig, houses = [] }) => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'lapor' ? 'lapor' : 'surat';
  const initialHouseId = searchParams.get('houseId') || '';
  
  const [activeTab, setActiveTab] = useState<'surat' | 'lapor' | 'history'>(initialTab as any);
  const [localHistory, setLocalHistory] = useState<any[]>([]);
  const [accessCode, setAccessCode] = useState('');
  
  // Form States
  const [reportType, setReportType] = useState<Report['type']>('Fasilitas');
  const [reportDesc, setReportDesc] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reportHouseId, setReportHouseId] = useState(initialHouseId); 
  const [reporterHouseId, setReporterHouseId] = useState(''); 

  const [requestType, setRequestType] = useState<LetterRequest['type']>('Surat Izin Keramaian');
  const [applicantName, setApplicantName] = useState('');
  const [nik, setNik] = useState('');
  const [familyHeadName, setFamilyHeadName] = useState(''); 
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [religion, setReligion] = useState('Islam');
  const [job, setJob] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<LetterRequest['maritalStatus']>('Kawin');
  const [nationality, setNationality] = useState('Indonesia'); 
  const [addressKtp, setAddressKtp] = useState('');
  const [houseId, setHouseId] = useState(initialHouseId);
  const [purposeDetail, setPurposeDetail] = useState(''); 
  
  // New Fields State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [education, setEducation] = useState('SMA/Sederajat');
  const [familyStatus, setFamilyStatus] = useState<LetterRequest['familyStatus']>('Kepala Keluarga');
  const [bloodType, setBloodType] = useState<LetterRequest['bloodType']>('-');

  useEffect(() => { 
    try { 
      const stored = localStorage.getItem('userRequestHistory'); 
      if (stored) setLocalHistory(JSON.parse(stored)); 
    } catch (e) { console.error("Error reading history", e); } 
  }, []);

  useEffect(() => { 
    if(initialHouseId) { 
      if (activeTab === 'lapor') setReportHouseId(initialHouseId); 
      if (activeTab === 'surat') setHouseId(initialHouseId); 
    } 
  }, [initialHouseId, activeTab]);

  const saveToHistory = (item: any) => { 
    try { 
      const updated = [item, ...localHistory]; 
      setLocalHistory(updated); 
      localStorage.setItem('userRequestHistory', JSON.stringify(updated)); 
    } catch (e) { console.error("Error saving history", e); } 
  };

  const handleSubmitSurat = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const isValid = await validateResidentAccess(houseId, accessCode);
    if (!isValid) {
      alert("Verifikasi Gagal! Kode Akses Rumah tidak valid. Silakan hubungi Ketua RT jika lupa kode.");
      return;
    }

    const letterData: LetterRequest = { 
      id: Date.now().toString(), 
      type: requestType, 
      applicantName, 
      nik, 
      familyHeadName, 
      birthPlace, 
      birthDate, 
      gender, 
      religion, 
      job, 
      maritalStatus, 
      nationality, 
      addressKtp, 
      houseId, 
      purposeDetail, 
      phone,
      email,
      education,
      familyStatus,
      bloodType,
      status: 'Pending', 
      date: new Date().toISOString().split('T')[0] 
    }; 
    
    generateSuratPengantar(letterData, pdfConfig, true); 
    await addLetterToDb(letterData); 
    saveToHistory({...letterData, category: 'Surat', title: `Surat ${requestType}`}); 
    alert("Permohonan berhasil dikirim! Bukti DRAFT surat telah diunduh. Silakan hubungi Ketua RT untuk validasi."); 
    
    // Reset form
    setApplicantName(''); setNik(''); setFamilyHeadName(''); setBirthPlace(''); setBirthDate(''); setJob(''); setAddressKtp(''); setHouseId(''); setPurposeDetail(''); setAccessCode('');
    setNationality('Indonesia'); setMaritalStatus('Kawin'); setPhone(''); setEmail('');
  };

  const handleSubmitLapor = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    const isValid = await validateResidentAccess(reporterHouseId, accessCode);
    if (!isValid) {
      alert("Verifikasi Gagal! Kode Akses Rumah tidak valid.");
      return;
    }

    const reportData: Report = { 
      id: Date.now().toString(), 
      type: reportType, 
      description: reportDesc, 
      reporterName, 
      houseId: reportHouseId, 
      reporterHouseId, 
      status: 'Baru', 
      date: new Date().toISOString() 
    };
    
    generateReportReceiptPDF(reportData, pdfConfig);
    await addReportToDb(reportData);
    saveToHistory({...reportData, category: 'Laporan', title: `Laporan ${reportType}`});
    alert("Laporan berhasil dikirim! Bukti laporan telah diunduh.");
    
    // Reset form
    setReportDesc(''); setReporterName(''); setReportHouseId(''); setReporterHouseId(''); setAccessCode('');
  };

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
      className="max-w-5xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Layanan Digital <span className="text-indigo-600">RT 002</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
          Urus surat pengantar dan sampaikan laporan warga secara online. Cepat, mudah, dan transparan.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 p-1.5 rounded-[2rem] inline-flex shadow-inner border border-slate-200/50">
          {[
            { id: 'surat', label: 'Buat Surat', icon: FileText },
            { id: 'lapor', label: 'Lapor Warga', icon: AlertTriangle },
            { id: 'history', label: 'Riwayat', icon: History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
              `}
            >
              <tab.icon size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'surat' && (
          <motion.div 
            key="surat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-100/50"
          >
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <FileText size={32} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Permohonan Surat Pengantar</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Isi formulir berikut untuk mengajukan surat pengantar RT.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitSurat} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <User size={14}/> Data Diri Pemohon
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Lengkap</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={applicantName} onChange={e=>setApplicantName(e.target.value)} required placeholder="Sesuai KTP"/>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">NIK</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={nik} onChange={e=>setNik(e.target.value)} required placeholder="16 digit NIK"/>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Kepala Keluarga</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={familyHeadName} onChange={e=>setFamilyHeadName(e.target.value)} required placeholder="Sesuai KK"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tempat Lahir</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={birthPlace} onChange={e=>setBirthPlace(e.target.value)} required/>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Tanggal Lahir</label>
                        <input type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={birthDate} onChange={e=>setBirthDate(e.target.value)} required/>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Kelamin</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={gender} onChange={e=>setGender(e.target.value as any)}>
                          <option>Laki-laki</option>
                          <option>Perempuan</option>
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Agama</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={religion} onChange={e=>setReligion(e.target.value)}>
                          <option>Islam</option>
                          <option>Kristen</option>
                          <option>Katolik</option>
                          <option>Hindu</option>
                          <option>Buddha</option>
                          <option>Konghucu</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Perkawinan</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={maritalStatus} onChange={e=>setMaritalStatus(e.target.value as any)}>
                          <option>Kawin</option>
                          <option>Belum Kawin</option>
                          <option>Cerai Hidup</option>
                          <option>Cerai Mati</option>
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Kewarganegaraan</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={nationality} onChange={e=>setNationality(e.target.value)} required placeholder="Indonesia"/>
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pekerjaan</label>
                      <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={job} onChange={e=>setJob(e.target.value)} required/>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Alamat Sesuai KTP</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none h-24" value={addressKtp} onChange={e=>setAddressKtp(e.target.value)} required placeholder="Alamat lengkap sesuai KTP"/>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">No. HP / WhatsApp</label>
                        <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="08..."/>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Email (Opsional)</label>
                        <input type="email" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@contoh.com"/>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Pendidikan Terakhir</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={education} onChange={e=>setEducation(e.target.value)}>
                          <option>SD/Sederajat</option>
                          <option>SMP/Sederajat</option>
                          <option>SMA/Sederajat</option>
                          <option>D3</option>
                          <option>S1</option>
                          <option>S2</option>
                          <option>S3</option>
                          <option>Tidak Sekolah</option>
                        </select>
                      </div>
                      <div className="group">
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Golongan Darah</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={bloodType} onChange={e=>setBloodType(e.target.value as any)}>
                          <option>-</option>
                          <option>A</option>
                          <option>B</option>
                          <option>AB</option>
                          <option>O</option>
                        </select>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Status Hubungan Dalam Keluarga</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={familyStatus} onChange={e=>setFamilyStatus(e.target.value as any)}>
                        <option>Kepala Keluarga</option>
                        <option>Istri</option>
                        <option>Anak</option>
                        <option>Lainnya</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Request Info */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FileText size={14}/> Detail Permohonan
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Surat</label>
                      <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all appearance-none" value={requestType} onChange={e=>setRequestType(e.target.value as any)}>
                        <option>Surat Pengantar KTP</option>
                        <option>Surat Pengantar KK</option>
                        <option>Surat Keterangan Domisili</option>
                        <option>Surat Keterangan Tidak Mampu</option>
                        <option>Surat Izin Keramaian</option>
                        <option>Surat Keterangan Usaha</option>
                        <option>Surat Keterangan Berkelakuan Baik</option>
                        <option>Lainnya</option>
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Keperluan Spesifik</label>
                      <textarea className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none" value={purposeDetail} onChange={e=>setPurposeDetail(e.target.value)} required placeholder="Jelaskan keperluan pembuatan surat..."/>
                    </div>
                    
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-[2rem] space-y-4 mt-8">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-200 text-slate-600 rounded-xl">
                          <Lock size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">Verifikasi Warga</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wajib Diisi</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blok Rumah</label>
                          <input 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-slate-400 outline-none transition-all text-center uppercase placeholder:normal-case" 
                            placeholder="Cth: C7-02" 
                            value={houseId} 
                            onChange={e=>setHouseId(e.target.value)} 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Akses</label>
                          <input 
                            type="password" 
                            placeholder="PIN Rumah" 
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-slate-400 outline-none transition-all text-center placeholder:normal-case" 
                            value={accessCode} 
                            onChange={e=>setAccessCode(e.target.value)} 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all">
                  <Send size={18} /> Kirim Permohonan
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'lapor' && (
          <motion.div 
            key="lapor"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-rose-100/50"
          >
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertTriangle size={32} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Laporan & Pengaduan</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Sampaikan keluhan atau laporan kejadian di lingkungan RT 002.</p>
              </div>
            </div>

            <form onSubmit={handleSubmitLapor} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Jenis Laporan</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Keamanan', 'Kebersihan', 'Fasilitas', 'Sosial', 'Lainnya'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReportType(type as any)}
                          className={`
                            p-3 rounded-xl text-xs font-bold border transition-all text-left
                            ${reportType === type 
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md' 
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-rose-50 hover:text-rose-600'}
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Lokasi Kejadian (Blok Rumah)</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all uppercase placeholder:normal-case" 
                      value={reportHouseId} 
                      onChange={e=>setReportHouseId(e.target.value)} 
                      placeholder="Cth: C7-02 (Kosongkan jika fasilitas umum)"
                    />
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Detail Laporan</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all min-h-[150px] resize-none" 
                      value={reportDesc} 
                      onChange={e=>setReportDesc(e.target.value)} 
                      required 
                      placeholder="Jelaskan kronologi, lokasi detail, atau keluhan Anda..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6 h-full">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={14}/> Identitas Pelapor
                    </h3>
                    
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1">Nama Pelapor</label>
                      <input 
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:border-rose-500 outline-none transition-all" 
                        value={reporterName} 
                        onChange={e=>setReporterName(e.target.value)} 
                        required 
                        placeholder="Nama Anda"
                      />
                    </div>

                    <div className="p-6 bg-white border border-slate-200 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                          <Lock size={16} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">Verifikasi Warga</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wajib Diisi</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Blok Rumah Anda</label>
                          <input 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all text-center uppercase placeholder:normal-case" 
                            placeholder="Cth: C7-02" 
                            value={reporterHouseId} 
                            onChange={e=>setReporterHouseId(e.target.value)} 
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">PIN Akses</label>
                          <input 
                            type="password" 
                            placeholder="PIN Rumah" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-rose-500 outline-none transition-all text-center placeholder:normal-case" 
                            value={accessCode} 
                            onChange={e=>setAccessCode(e.target.value)} 
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="danger" size="lg" className="w-full md:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:shadow-rose-500/30 hover:-translate-y-1 transition-all">
                  <Send size={18} /> Kirim Laporan
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {localHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {localHistory.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${item.category === 'Surat' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                        {item.category === 'Surat' ? <FileText size={20}/> : <AlertTriangle size={20}/>}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {item.status || 'Terkirim'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">{item.title}</h3>
                    <p className="text-xs text-slate-400 font-bold mb-4">{new Date(item.date).toLocaleDateString()}</p>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500">ID: #{item.id.slice(-6)}</span>
                      <button className="text-xs font-bold text-indigo-600 hover:underline">Lihat Detail</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-12 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                  <History size={40} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">Belum Ada Riwayat</h3>
                <p className="text-slate-400 font-medium">Riwayat pengajuan surat dan laporan Anda akan muncul di sini.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
