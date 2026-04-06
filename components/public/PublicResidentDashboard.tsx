import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  ArrowLeft, 
  QrCode, 
  FileEdit, 
  History, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Phone,
  Users,
  Home,
  Calendar,
  LogOut,
  ChevronRight,
  Info,
  X,
  CreditCard,
  Trash2,
  Droplets,
  Globe,
  MapPin,
  Heart,
  GraduationCap,
  Briefcase,
  Activity,
  DollarSign,
  Baby,
  Accessibility,
  Plus,
  Stethoscope,
  AlertTriangle,
  Send,
  Camera,
  FileText
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { getIndonesianMonthYear } from '../../src/utils/dateUtils';
import { House, GuestReport, UpdateRequest, PaymentStatus, Report, LetterRequest } from '../../types';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  subscribeToHouseGuestReports,
  addUpdateRequest,
  subscribeToHouseUpdateRequests,
  subscribeToHouseReports,
  subscribeToHouseLetters,
  addReportToDb,
  handleFirestoreError,
  OperationType
} from '../../services/databaseService';
import { NotificationToggle } from '../PushNotificationManager';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface PublicResidentDashboardProps {
  houses: House[];
}

export const PublicResidentDashboard: React.FC<PublicResidentDashboardProps> = ({ houses }) => {
  const [selectedHouseId, setSelectedHouseId] = useState<string>(localStorage.getItem('resident_house_id') || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tempHouseId, setTempHouseId] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'eid' | 'update' | 'guests' | 'reports' | 'letters'>('eid');
  const [guestReports, setGuestReports] = useState<GuestReport[]>([]);
  const [updateRequests, setUpdateRequests] = useState<UpdateRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  
  const { getPaymentStatus, settings } = useFinancial();
  const currentHouse = houses.find(h => h.id === selectedHouseId);

  const currentMonth = getIndonesianMonthYear(new Date());
  const isPaidAir = currentHouse ? getPaymentStatus(currentHouse, 'Air', currentMonth) === PaymentStatus.PAID : true;
  const isPaidSampah = currentHouse ? getPaymentStatus(currentHouse, 'Sampah', currentMonth) === PaymentStatus.PAID : true;
  const isAllPaid = isPaidAir && isPaidSampah;
  const dayOfMonth = new Date().getDate();
  const isMandatory = dayOfMonth >= 20;

  const airFee = settings?.airFee || 10000;
  const sampahFee = settings?.sampahFee || 5000;
  const totalFee = airFee + sampahFee;

  useEffect(() => {
    if (!selectedHouseId) return;
    
    const unsubGuests = subscribeToHouseGuestReports(selectedHouseId, setGuestReports);
    const unsubUpdates = subscribeToHouseUpdateRequests(selectedHouseId, setUpdateRequests);
    const unsubReports = subscribeToHouseReports(selectedHouseId, setReports);
    const unsubLetters = subscribeToHouseLetters(selectedHouseId, setLetters);
    
    return () => {
      unsubGuests();
      unsubUpdates();
      unsubReports();
      unsubLetters();
    };
  }, [selectedHouseId]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const house = houses.find(h => h.id === tempHouseId);
    if (house && house.accessCode === pinInput) {
      setSelectedHouseId(tempHouseId);
      localStorage.setItem('resident_house_id', tempHouseId);
      localStorage.setItem('resident_name', house.headOfFamily);
      localStorage.setItem('resident_location', `Blok ${house.block}-${house.number}`);
      setIsPinModalOpen(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
      setTimeout(() => setPinError(false), 2000);
    }
  };

  const handleLogout = () => {
    setSelectedHouseId('');
    localStorage.removeItem('resident_house_id');
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(null);
  const [updateForm, setUpdateForm] = useState({
    headOfFamily: '',
    gender: 'Laki-laki' as any,
    birthPlace: '',
    birthDate: '',
    phone: '',
    occupants: 0,
    residenceType: 'Tetap' as any,
    nik: '',
    kkNumber: '',
    maritalStatus: 'Belum Kawin' as any,
    religion: '',
    education: '',
    job: '',
    jobCategory: '',
    bloodType: '-' as any,
    nationality: 'WNI',
    addressKtp: '',
    bpjsStatus: 'Tidak Ada' as any,
    vehicleCount: 0,
    isPKH: false,
    isBLT: false,
    isBPNT: false,
    isBansosLain: false,
    bansosLainName: '',
    economicStatus: 'Sejahtera' as any,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 0,
    teenagerCount: 0,
    adultCount: 0,
    elderlyCount: 0,
    widowCount: 0,
    childCount: 0,
    familyMembers: [] as any[],
    reason: ''
  });

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isIuranModalOpen, setIsIuranModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<Report | null>(null);
  const [reportForm, setReportForm] = useState({
    type: 'Keamanan' as Report['type'],
    description: '',
  });

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description) {
      toast.error("Mohon isi deskripsi laporan");
      return;
    }

    setIsSubmittingReport(true);
    try {
      await addReportToDb({
        ...reportForm,
        reporterName: currentHouse?.headOfFamily || 'Warga',
        reporterHouseId: selectedHouseId,
        date: new Date().toISOString(),
        status: 'Baru'
      });
      toast.success("Laporan berhasil dikirim!");
      setIsReportModalOpen(false);
      setReportForm({ type: 'Keamanan', description: '' });
    } catch (error) {
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (currentHouse) {
      setUpdateForm({
        headOfFamily: currentHouse.headOfFamily,
        gender: currentHouse.gender || 'Laki-laki',
        birthPlace: currentHouse.birthPlace || '',
        birthDate: currentHouse.birthDate || '',
        phone: currentHouse.phone || '',
        occupants: currentHouse.occupants,
        residenceType: currentHouse.residenceType || 'Tetap',
        nik: currentHouse.nik || '',
        kkNumber: currentHouse.kkNumber || '',
        maritalStatus: currentHouse.maritalStatus || 'Belum Kawin',
        religion: currentHouse.religion || '',
        education: currentHouse.education || '',
        job: currentHouse.job || '',
        jobCategory: currentHouse.jobCategory || '',
        bloodType: currentHouse.bloodType || '-',
        nationality: currentHouse.nationality || 'WNI',
        addressKtp: currentHouse.addressKtp || '',
        bpjsStatus: currentHouse.bpjsStatus || 'Tidak Ada',
        vehicleCount: currentHouse.vehicleCount || 0,
        isPKH: currentHouse.isPKH || false,
        isBLT: currentHouse.isBLT || false,
        isBPNT: currentHouse.isBPNT || false,
        isBansosLain: currentHouse.isBansosLain || false,
        bansosLainName: currentHouse.bansosLainName || '',
        economicStatus: currentHouse.economicStatus || 'Sejahtera',
        pregnantCount: currentHouse.pregnantCount || 0,
        babyCount: currentHouse.babyCount || 0,
        toddlerCount: currentHouse.toddlerCount || 0,
        teenagerCount: currentHouse.teenagerCount || 0,
        adultCount: currentHouse.adultCount || 0,
        elderlyCount: currentHouse.elderlyCount || 0,
        widowCount: currentHouse.widowCount || 0,
        childCount: currentHouse.childCount || 0,
        familyMembers: currentHouse.familyMembers || [],
        reason: ''
      });
    }
  }, [currentHouse, isUpdateModalOpen]);

  const addFamilyMember = () => {
    setUpdateForm({
      ...updateForm,
      familyMembers: [
        ...updateForm.familyMembers,
        { name: '', nik: '', relation: 'Anak', gender: 'Laki-laki', birthDate: '', job: '' }
      ]
    });
  };

  const removeFamilyMember = (index: number) => {
    const newMembers = [...updateForm.familyMembers];
    newMembers.splice(index, 1);
    setUpdateForm({ ...updateForm, familyMembers: newMembers });
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    const newMembers = [...updateForm.familyMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setUpdateForm({ ...updateForm, familyMembers: newMembers });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addUpdateRequest({
        houseId: selectedHouseId,
        ...updateForm
      });
      setIsUpdateModalOpen(false);
      toast.success('Permohonan pembaruan data berhasil dikirim!', {
        description: 'Admin akan meninjau permohonan Anda.'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "updateRequests");
      toast.error('Gagal mengirim permohonan.');
    }
  };

  if (!selectedHouseId) {
    const sortedHouses = [...houses]
      .filter(h => h.status === 'Occupied')
      .sort((a, b) => {
        if (a.block !== b.block) return a.block.localeCompare(b.block);
        return parseInt(a.number) - parseInt(b.number);
      });

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <User size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Dashboard Warga</h2>
        <p className="text-slate-500 font-medium mb-8">Akses Kartu Warga Digital, update data, dan pantau log tamu rumah Anda.</p>
        
        <div className="space-y-4">
          <select 
            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm"
            value={tempHouseId}
            onChange={(e) => {
              setTempHouseId(e.target.value);
              if (e.target.value) setIsPinModalOpen(true);
            }}
          >
            <option value="">Pilih Nomor Rumah...</option>
            {sortedHouses.map(h => (
              <option key={h.id} value={h.id}>{h.block}-{h.number} - {h.headOfFamily}</option>
            ))}
          </select>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gunakan PIN rumah untuk masuk.</p>
        </div>

        <Modal isOpen={isPinModalOpen} onClose={() => {
          setIsPinModalOpen(false);
          setTempHouseId('');
          setPinInput('');
        }} title="Verifikasi PIN Akses">
          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-black text-slate-800">Masukkan PIN Rumah</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Verifikasi akses untuk rumah <span className="font-bold text-indigo-600">{houses.find(h => h.id === tempHouseId)?.block}-{houses.find(h => h.id === tempHouseId)?.number}</span>
              </p>
            </div>

            <input 
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              className={`w-full px-6 py-4 bg-slate-50 border ${pinError ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'} rounded-2xl text-center text-2xl font-black tracking-[1em] outline-none transition-all`}
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              placeholder="••••••"
            />

            <Button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
              Masuk ke Dashboard
            </Button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 mb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Warga</h2>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-200">
              Blok {currentHouse?.block}-{currentHouse?.number}
            </span>
          </div>
          <p className="text-slate-500 font-medium">Selamat datang, Bpk/Ibu {currentHouse?.headOfFamily}.</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
        >
          <LogOut size={16} /> Keluar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 border border-slate-200 rounded-3xl shadow-sm mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'eid', label: 'E-ID Warga', icon: QrCode },
          { id: 'letters', label: 'Status Surat', icon: FileText },
          { id: 'update', label: 'Update Data', icon: FileEdit },
          { id: 'guests', label: 'Log Tamu', icon: History },
          { id: 'reports', label: 'Laporan', icon: AlertTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'eid' && (
          <motion.div 
            key="eid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* E-ID Card */}
            <div className="lg:col-span-2">
              <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white border-none shadow-2xl p-0 min-h-[350px]">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                
                <div className="relative h-full flex flex-col p-8 md:p-12">
                  <div className="flex justify-between items-start mb-auto">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black tracking-tighter uppercase">Kartu Warga Digital</h3>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] opacity-60">Rukun Tetangga 02 / RW 05</p>
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <Home size={24} className="md:hidden" />
                      <Home size={32} className="hidden md:block" />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-8">
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Nama Kepala Keluarga</p>
                        <p className="text-2xl md:text-4xl font-black tracking-tight">{currentHouse?.headOfFamily}</p>
                      </div>
                      <div className="flex flex-wrap gap-4 md:gap-12">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">ID Rumah</p>
                          <p className="text-lg md:text-xl font-black">{currentHouse?.block}-{currentHouse?.number}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Status Iuran ({currentMonth})</p>
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            isAllPaid 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                            : (isMandatory ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30')
                          }`}>
                            {isAllPaid ? 'Lunas' : (isMandatory ? 'Wajib Bayar' : 'Tagihan Baru')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl shadow-2xl">
                      <QRCodeSVG 
                        value={`RESIDENT:${selectedHouseId}`} 
                        size={100} 
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Info */}
            <div className="space-y-6">
              {/* Iuran Warning */}
              {!isAllPaid && (
                <div className={`p-6 rounded-[2rem] border-2 ${isMandatory ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex flex-col sm:flex-row items-start gap-5">
                    <div className={`p-4 rounded-2xl shadow-sm shrink-0 ${isMandatory ? 'bg-white text-rose-600' : 'bg-white text-amber-600'}`}>
                      <AlertTriangle size={28} />
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-base font-black uppercase tracking-widest mb-2 ${isMandatory ? 'text-rose-900' : 'text-amber-900'}`}>
                        {isMandatory ? 'Layanan Ditangguhkan' : 'Tagihan Iuran Tersedia'}
                      </h4>
                      <p className={`text-sm font-medium leading-relaxed mb-6 ${isMandatory ? 'text-rose-700' : 'text-amber-700'}`}>
                        {isMandatory 
                          ? `Mohon maaf, layanan pengajuan surat dan mutasi ditangguhkan karena iuran bulan ${currentMonth} belum diselesaikan (melewati tgl 20).` 
                          : `Tagihan iuran bulan ${currentMonth} sudah tersedia. Mohon selesaikan sebelum tanggal 20 untuk tetap dapat mengakses layanan digital.`}
                      </p>
                      <div className="flex flex-col xl:flex-row gap-3 flex-wrap">
                        <Button 
                          onClick={() => setIsIuranModalOpen(true)}
                          className={`h-12 sm:h-10 px-8 sm:px-6 text-[10px] font-black uppercase tracking-widest w-full xl:w-auto shadow-lg ${isMandatory ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
                        >
                          Lihat Rincian
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.open(`https://wa.me/${(currentHouse?.phone || '6285961194621').toString().replace(/^0/, '62').replace(/\D/g, '')}`, '_blank')}
                          className="h-12 sm:h-10 px-8 sm:px-6 text-[10px] font-black uppercase tracking-widest w-full xl:w-auto bg-white border-slate-200"
                        >
                          Hubungi Pengurus RT
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Card className="bg-white border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Informasi Hunian
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah Penghuni</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.occupants} Orang</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status Tinggal</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.residenceType || 'Tetap'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No. Telepon</span>
                    <span className="text-sm font-black text-slate-800">{currentHouse?.phone || '-'}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-indigo-50 border-indigo-100 shadow-sm">
                <h4 className="font-black text-indigo-900 mb-2">Manfaat E-ID</h4>
                <p className="text-xs text-indigo-700 font-medium leading-relaxed mb-4">
                  Gunakan QR Code di atas untuk verifikasi identitas saat kegiatan RT, pengambilan bantuan, atau akses fasilitas lingkungan.
                </p>
                <div className="space-y-3">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest">
                    Unduh Kartu (PDF)
                  </Button>
                  <div className="pt-2 border-t border-indigo-200/50">
                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Pengaturan Notifikasi</p>
                    <NotificationToggle userId={selectedHouseId} />
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'letters' && (
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
                letters.map(letter => (
                  <Card key={letter.id} className="bg-white border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                          <FileText size={20} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">{letter.type}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        letter.status === 'Disetujui' || letter.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        letter.status === 'Ditolak' || letter.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                        'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {letter.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                        <p className="text-xs font-bold text-slate-700 line-clamp-2">{letter.purposeDetail}</p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'update' && (
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
                      <User size={14} /> Identitas Kepala Keluarga
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Nama Kepala Keluarga</label>
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
                          <option value="Kontrak">Kontrak</option>
                          <option value="Kost">Kost</option>
                          <option value="Rumah Keluarga">Rumah Keluarga</option>
                        </select>
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
                      <Activity size={14} /> Data Sosial & Ekonomi
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
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Kendaraan</label>
                        <input type="number" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" value={updateForm.vehicleCount} onChange={e => setUpdateForm({...updateForm, vehicleCount: parseInt(e.target.value) || 0})} />
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
                        updateForm.familyMembers.map((member, index) => (
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
                                  onChange={e => updateFamilyMember(index, 'nik', e.target.value)}
                                  placeholder="16 digit NIK"
                                />
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
                        <User size={12} /> Identitas Kepala Keluarga
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
                          <p className="text-xs font-black text-slate-800">{selectedRequest.nik || '-'}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">No. KK</p>
                          <p className="text-xs font-black text-slate-800">{selectedRequest.kkNumber || '-'}</p>
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
                        <Activity size={12} /> Sosial & Ekonomi
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
                                {member.nik && <p className="text-[9px] font-bold text-slate-400">NIK: {member.nik}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
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
        )}

        {activeTab === 'guests' && (
          <motion.div 
            key="guests"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-black text-slate-800">Log Kunjungan Tamu</h3>
              <p className="text-sm text-slate-500 font-medium">Daftar tamu yang melapor berkunjung ke rumah Anda melalui sistem Keamanan RT.</p>
            </div>

            <div className="space-y-4">
              {guestReports.length > 0 ? (
                guestReports.map((guest) => (
                  <Card key={guest.id} className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${guest.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Users size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">{guest.guestName}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            guest.status === 'Active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {guest.status === 'Active' ? 'Masih Berkunjung' : 'Sudah Pulang'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {guest.stayDuration}</span>
                          <span className="flex items-center gap-1"><Info size={12} /> {guest.relationship}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dilaporkan Pada</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(guest.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <History size={32} />
                  </div>
                  <h4 className="font-black text-slate-800 mb-1">Belum Ada Data Tamu</h4>
                  <p className="text-xs text-slate-400 font-medium">Tidak ada riwayat tamu yang melapor berkunjung ke rumah Anda.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {activeTab === 'reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-800">Laporan Masalah</h3>
                <p className="text-sm text-slate-500 font-medium">Laporkan masalah keamanan, kebersihan, atau fasilitas di lingkungan.</p>
              </div>
              <Button onClick={() => setIsReportModalOpen(true)} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100">
                <AlertTriangle size={18} className="mr-2" /> Buat Laporan
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {reports.length > 0 ? (
                reports.map((report) => (
                  <Card 
                    key={report.id} 
                    className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedReportDetail(report)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl ${
                        report.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' :
                        report.status === 'Diproses' ? 'bg-indigo-50 text-indigo-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {report.status === 'Selesai' ? <CheckCircle size={24} /> : 
                         report.status === 'Diproses' ? <Clock size={24} /> : 
                         <AlertCircle size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-800">Laporan {report.type}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                            report.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600' :
                            report.status === 'Diproses' ? 'bg-indigo-100 text-indigo-600' :
                            'bg-rose-100 text-rose-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1">{report.description}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                          Diajukan: {new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <AlertTriangle size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada laporan</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Iuran Detail Modal */}
      <Modal isOpen={isIuranModalOpen} onClose={() => setIsIuranModalOpen(false)} title="Rincian Tagihan Iuran">
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tagihan {currentMonth}</p>
            <h3 className="text-3xl font-black text-slate-900">Rp {totalFee.toLocaleString('id-ID')}</h3>
            <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-widest">Jatuh Tempo: Tgl 20 {currentMonth}</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Trash2 size={16} /></div>
                <span className="text-sm font-bold text-slate-700">Retribusi Sampah</span>
              </div>
              <span className="text-sm font-black text-slate-900">Rp {sampahFee.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Droplets size={16} /></div>
                <span className="text-sm font-bold text-slate-700">Iuran Air Bersih</span>
              </div>
              <span className="text-sm font-black text-slate-900">Rp {airFee.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={12} /> Cara Pembayaran
            </h4>
            <ul className="text-xs text-amber-800 space-y-2 font-medium">
              <li className="flex gap-2">
                <span className="font-black">1.</span>
                <span>Pembayaran dapat dilakukan secara tunai kepada Pengurus RT.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-black">2.</span>
                <span>Hubungi Pengurus RT melalui WhatsApp untuk koordinasi atau konfirmasi pembayaran.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => setIsIuranModalOpen(false)} variant="outline" className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest">
              Tutup
            </Button>
            <Button 
              onClick={() => window.open(`https://wa.me/6285961194621?text=Halo%20Pengurus%20RT%2002%2C%20saya%20ingin%20konfirmasi%20pembayaran%20iuran%20rumah%20${currentHouse?.block}-${currentHouse?.number}`, '_blank')}
              className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100"
            >
              Konfirmasi Bayar (WA)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report Issue Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Buat Laporan Masalah" maxWidth="max-w-xl">
        <div className="p-6">
          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Laporan</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Keamanan', 'Kebersihan', 'Fasilitas', 'Sosial', 'Lainnya'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setReportForm({...reportForm, type: type as any})}
                    className={`
                      p-4 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all duration-300
                      ${reportForm.type === type 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300 hover:text-rose-600'}
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Masalah</label>
              <textarea 
                rows={4}
                placeholder="Jelaskan secara detail masalah yang Anda temukan..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReportModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmittingReport}
                className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100"
              >
                {isSubmittingReport ? 'Mengirim...' : (
                  <span className="flex items-center gap-2">
                    <Send size={16} /> Kirim Laporan
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Report Detail Modal */}
      <Modal isOpen={!!selectedReportDetail} onClose={() => setSelectedReportDetail(null)} title="Detail Laporan">
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

            <Button onClick={() => setSelectedReportDetail(null)} className="w-full py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none rounded-2xl text-xs font-black uppercase tracking-widest">
              Tutup
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
