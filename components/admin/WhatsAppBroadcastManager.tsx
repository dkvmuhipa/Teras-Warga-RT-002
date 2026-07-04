import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, Sparkles, Send, Copy, RefreshCw, AlertTriangle, 
  CheckCircle, User, Users, Megaphone, FileText, Smartphone,
  Info, HelpCircle, Layers, Check, ExternalLink, Calendar, Receipt
} from 'lucide-react';
import { House, Bill, PdfConfig } from '../../types';
import { toast } from 'sonner';
import { sendWhatsAppViaGateway, broadcastWhatsApp, getWhatsAppGroups, sendWhatsAppMessage } from '../../services/whatsappService';
import { safeJsonStringify } from '../../services/databaseService';

interface WhatsAppBroadcastManagerProps {
  houses: House[];
  bills: Bill[];
  pdfConfig: PdfConfig;
}

const quickTemplates = [
  {
    id: 'kerja-bakti',
    title: '🧹 Kerja Bakti Lingkungan',
    category: 'announcement',
    description: 'Pembersihan selokan & gotong royong warga RT.',
    topic: 'Kerja Bakti Gotong Royong RT 02 bulanan',
    text: `*UNDANGAN KERJA BAKTI WARGA RT 02* 🧹🏡\n\nKepada Yth.\n*Segenap Warga RT 02*\n\nHalo bapak/ibu warga RT 02, semoga sehat selalu. Mari luangkan waktu sejenak demi kenyamanan lingkungan tempat tinggal kita bersama.\n\nKami mengundang seluruh perwakilan KK untuk berpartisipasi dalam kegiatan *Kerja Bakti Gotong Royong*:\n\n📅 *Hari/Tanggal:* [SABTU/MINGGU, TANGGAL]\n⏰ *Waktu:* 07.30 WITA s.d Selesai\n📍 *Titik Kumpul:* Pos Ronda RT 02 / Depan Blok Masing-masing\n🔧 *Agenda:* Pembersihan selokan antispasi demam berdarah, pemotongan dahan pohon liar, dan kebersihan umum.\n\n_Diharapkan membawa peralatan kebersihan pribadi secukupnya (cangkul, sapu lidi, atau sabit)._\n\nKebersihan lingkungan adalah tanggung jawab kita bersama. Atas kehadiran dan kebersamaannya, kami ucapkan banyak terima kasih. 🙏✨\n\n_Hormat Kami,\n*Pengurus RT 02*_\n_Teras Warga Modern_`
  },
  {
    id: 'rapat-rt',
    title: '🤝 Rapat Musyawarah RT',
    category: 'announcement',
    description: 'Musyawarah bulanan & pembahasan kas keuangan RT.',
    topic: 'Rapat Koordinasi Bulanan Warga RT 02',
    text: `*UNDANGAN RAPAT BULANAN WARGA RT 02* 🗣️🗳️\n\nKepada Yth.\n*Bapak/Ibu Segenap Warga RT 02*\n\nSalam silaturahmi,\nMenindaklanjuti beberapa agenda lingkungan, kas keuangan RT, serta pembahasan aspirasi warga offline, kami mengundang Bapak/Ibu/Sdr untuk dapat hadir pada:\n\n📅 *Hari/Tanggal:* [HARI, TANGGAL]\n⏰ *Waktu:* 20.00 WITA (Ba'da Isya)\n📍 *Tempat:* Balai Pertemuan RT 02 / Pos Ronda\n📝 *Agenda:* \n1. Laporan pertanggungjawaban kas keuangan bulanan RT.\n2. Pembahasan keamanan lingkungan dan program pengelolaan sampah.\n3. Diskusi bebas / tanya-jawab warga.\n\nKehadiran Bapak/Ibu sangat menentukan arah pembangunan lingkungan RT kita agar lebih rukun dan modern. \n\nMohon kehadirannya tepat waktu. Atas perhatiannya diucapkan terima kasih. 🙏\n\n_Hormat kami,\n*Pengurus RT 02*_\n_Rukun & Transparan_`
  },
  {
    id: 'iuran-keamanan',
    title: '🛡️ Iuran & Kas Bulanan',
    category: 'announcement',
    description: 'Himbauan umum pembayaran iuran satpam & kebersihan.',
    topic: 'Sosialisasi dan himbauan iuran kas RT bulanan',
    text: `*HIMBAUAN & REMINDER IURAN BULANAN RT 02* 💳🚨\n\nKepada Yth.\n*Seluruh Warga RT 02*\n\nSalam sehat untuk kita semua,\nKami ingin menyampaikan apresiasi yang setinggi-tingginya kepada seluruh warga yang selalu disiplin memenuhi kewajiban iuran bulanan RT.\n\nKembali kami ingatkan bagi warga yang belum menyempatkan waktu, mohon kerja samanya untuk melakukan pembayaran iuran kas bulanan (Keamanan & Kebersihan) periode ini:\n\n💵 *Nominal:* Sesuai tipe hunian (Blok/No)\n🗓️ *Jatuh Tempo:* Tanggal 20 Setiap Bulannya\n🏦 *Metode:* Transfer ke rekening resmi RT / Bayar langsung ke Bendahara RT\n\nKelancaran pembayaran iuran sangat krusial bagi operasional petugas keamanan (Satpam 24 Jam) dan kebersihan angkut sampah harian di lingkungan kita.\n\nBila ada pertanyaan atau konfirmasi pembayaran, silakan hubungi langsung Bendahara RT 02. Terima kasih atas partisipasi aktif Bapak/Ibu sekalian. 🙏✨\n\n_Hormat kami,\n*Bendahara & Pengurus RT 02*_`
  },
  {
    id: 'fogging-dbd',
    title: '🦟 Fogging Pencegahan DBD',
    category: 'announcement',
    description: 'Pemberitahuan fogging area pemukiman warga.',
    topic: 'Fogging Nyamuk Pencegahan DBD RT 02',
    text: `*PEMBERITAHUAN KEGIATAN FOGGING NYAMUK DBD* 🦟💨\n\nKepada Yth.\n*Seluruh Warga RT 02*\n\nMenyikapi musim hujan dan upaya pencegahan penyebaran penyakit Demam Berdarah Dengue (DBD), pengurus RT 02 bekerja sama dengan Puskesmas akan melaksanakan pengasapan (*Fogging*) massal pada:\n\n📅 *Hari/Tanggal:* [HARI, TANGGAL]\n⏰ *Waktu:* 08.00 WITA s.d Selesai\n📍 *Area:* Seluruh lingkungan dan hunian RT 02\n\n*Himbauan Penting untuk Warga selama Proses Fogging:* \n1. Mohon menutup rapat pintu dan jendela rumah saat pengasapan berlangsung.\n2. Tutup makanan, air minum, dan amankan hewan peliharaan di dalam ruangan yang aman.\n3. Balita, ibu hamil, serta lansia disarankan berada di dalam rumah atau menjauhi asap sementara waktu.\n4. Mari juga terapkan gerakan 3M (Menguras, Menutup, Mendaur ulang) genangan air di halaman masing-masing.\n\nMari jaga kesehatan keluarga dan lingkungan kita. Terima kasih atas kerja samanya. 📢🛡️\n\n_Salam Sehat,\n*Pengurus RT 02*_`
  },
  {
    id: 'ronda-malam',
    title: '🚨 Keamanan & Ronda Malam',
    category: 'announcement',
    description: 'Himbauan meningkatkan kewaspadaan siskamling.',
    topic: 'Himbauan Siskamling Ronda Malam RT 02',
    text: `*PENEGAKAN KEAMANAN & SISKAMLING RT 02* 🚨⚔️\n\nYth. Segenap Warga RT 02,\n\nMenjaga kondusivitas, ketertiban, dan keamanan lingkungan adalah tanggung jawab seluruh warga secara kolektif. Menghadapi beberapa laporan keamanan, kami menghimbau:\n\n1. 🏠 *Kunci Pintu & Pagar:* Pastikan rumah terkunci dengan baik apabila bepergian atau menjelang tidur malam.\n2. 👥 *Tamu Wajib Lapor:* Bagi warga yang menerima tamu menginap >24 jam harap melapor ke ketua RT / satpam setempat.\n3. 🗓️ *Jadwal Siskamling:* Mari aktifkan kembali jadwal ronda malam mandiri sesuai regu yang telah disepakati.\n\nMari kita saling menjaga dan waspada terhadap hal-hal mencurigakan di sekitar tempat tinggal kita. Jika menemui kendala darurat, segera hubungi Pos Satpam utama atau pengurus RT.\n\nTerima kasih atas kepedulian Anda terhadap ketenteraman bersama. 🛡️🤝\n\n_Salam Guyub Rukun,\n*Seksi Keamanan RT 02*_`
  },
  {
    id: 'posyandu-kesehatan',
    title: '👶 Posyandu Balita & Lansia',
    category: 'announcement',
    description: 'Jadwal pelayanan posyandu dan pemeriksaan rutin.',
    topic: 'Pelayanan Kegiatan Posyandu RT 02',
    text: `*JADWAL PELAYANAN POSYANDU RT 02* 👶🩺👵\n\nKepada Yth.\n*Bapak/Ibu Warga RT 02 yang memiliki Balita & Lansia*\n\nKami menginformasikan bahwa pelayanan kesehatan bulanan melalui Posyandu RT 02 akan kembali diselenggarakan pada:\n\n📅 *Hari/Tanggal:* [HARI, TANGGAL]\n⏰ *Waktu:* 09.00 - 12.00 WITA\n📍 *Tempat:* Balai RT 02 (Pos Sebelah Taman)\n\n*Jenis Pelayanan:* \n• Penimbangan berat badan & pengukuran tinggi anak.\n• Imunisasi rutin & pemberian vitamin A / PMT.\n• Cek tensi darah, gula darah, dan konsultasi kesehatan Lansia.\n\nMohon membawa buku KIA/Posyandu anak masing-masing. Mari pastikan tumbuh kembang anak-anak kita terpantau dengan optimal dan kesehatan lansia terjaga.\n\nAtas partisipasinya, kami ucapkan terima kasih. Stay healthy! ❤️🌟\n\n_Salam Hangat,\n*Kader Posyandu & Pengurus RT 02*_`
  }
];

export const WhatsAppBroadcastManager: React.FC<WhatsAppBroadcastManagerProps> = ({
  houses = [],
  bills = [],
  pdfConfig
}) => {
  const [broadcastType, setBroadcastType] = useState<'announcement' | 'billing'>('announcement');
  const [tone, setTone] = useState<'Formal' | 'Kasual' | 'Mendesak'>('Formal');
  
  // Announcement states
  const [announcementTopic, setAnnouncementTopic] = useState('');
  
  // Billing states
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().slice(0, 7); // e.g., "2026-05"
  });
  
  // App states
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [targetType, setTargetType] = useState<'individual' | 'all' | 'arrears' | 'group'>('individual');
  const [manuallyEnteredPhone, setManuallyEnteredPhone] = useState('');
  const [whatsappGroups, setWhatsappGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  
  // Fetch WhatsApp groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoadingGroups(true);
      try {
        const response = await getWhatsAppGroups();
        if (response?.success && Array.isArray(response.data)) {
          setWhatsappGroups(response.data);
        } else if (response?.success && Array.isArray(response.results)) {
          setWhatsappGroups(response.results);
        } else {
          // Fallback group from config if fetch fails or is unconfigured
          if (pdfConfig?.whatsappGroupId) {
            setWhatsappGroups([{ 
              id: pdfConfig.whatsappGroupId, 
              name: `Grup RT Utama (Dari Pengaturan)` 
            }]);
            setSelectedGroupId(pdfConfig.whatsappGroupId);
          }
        }
      } catch (error) {
        console.error('Failed to load WhatsApp groups:', error);
      } finally {
        setIsLoadingGroups(false);
      }
    };
    
    fetchGroups();
  }, [pdfConfig]);

  // Derived: Filter houses that are occupied
  const occupiedHouses = useMemo(() => {
    return houses.filter(h => h.status === 'Occupied');
  }, [houses]);

  // Derived: Find houses that have unpaid bills for the selected month
  const housesWithArrears = useMemo(() => {
    if (!bills.length) return [];
    
    // Find houses with at least one unpaid item in bills of the selected month
    const arrearsHouseIds = new Set(
      bills
        .filter(b => b.month === selectedMonth && b.items.some(i => i.status === 'Unpaid'))
        .map(b => b.houseId)
    );
    
    return occupiedHouses.filter(h => arrearsHouseIds.has(h.id));
  }, [bills, occupiedHouses, selectedMonth]);

  // Derived: Target phone numbers based on target type
  const targetPhoneNumbers = useMemo(() => {
    if (targetType === 'individual') {
      if (broadcastType === 'billing' && selectedHouseId) {
        const found = occupiedHouses.find(h => h.id === selectedHouseId);
        return found?.phone ? [found.phone] : [];
      } else {
        return manuallyEnteredPhone ? [manuallyEnteredPhone] : [];
      }
    } else if (targetType === 'all') {
      return occupiedHouses.map(h => h.phone).filter((p): p is string => !!p && p.length > 5);
    } else if (targetType === 'arrears') {
      return housesWithArrears.map(h => h.phone).filter((p): p is string => !!p && p.length > 5);
    } else if (targetType === 'group') {
      return selectedGroupId ? [selectedGroupId] : [];
    }
    return [];
  }, [targetType, broadcastType, selectedHouseId, manuallyEnteredPhone, occupiedHouses, housesWithArrears, selectedGroupId]);

  // Automatically update target destination type when broadcast type flips
  useEffect(() => {
    if (broadcastType === 'billing') {
      setTargetType('individual');
    } else {
      setTargetType('group');
    }
    setDraft('');
  }, [broadcastType]);

  // Auto-generate target selection defaults
  useEffect(() => {
    if (broadcastType === 'billing' && selectedHouseId) {
      generateLocalBillingTemplate();
    }
  }, [selectedHouseId, selectedMonth]);

  // Compile a local clean template for billing in case AI is loading or as default
  const generateLocalBillingTemplate = () => {
    if (!selectedHouseId) return;
    const house = occupiedHouses.find(h => h.id === selectedHouseId);
    if (!house) return;
    
    const houseBill = bills.find(b => b.houseId === listHouseId(selectedHouseId) && b.month === selectedMonth);
    const unpaidItems = houseBill?.items.filter(i => i.status === 'Unpaid') || [];
    const totalArrears = unpaidItems.reduce((acc, item) => acc + item.amount, 0);
    const dueDateStr = houseBill?.dueDate ? new Date(houseBill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal 20 setiap bulannya';
    const itemsDetail = unpaidItems.map(i => `• ${i.name}: Rp ${i.amount.toLocaleString('id-ID')}`).join('\n') || '• Iuran Bulanan Umum';

    let localDraft = '';
    
    if (tone === 'Formal') {
      localDraft = `*TAGIHAN IURAN BULANAN RT 02* 📝\n\nKepada Yth.\n*Bapak/Ibu ${house.headOfFamily}*\nHunian Blok/No: ${house.block}/${house.number}\n\nDengan hormat,\nKami selaku pengurus RT 02 menginformasikan rincian tagihan iuran bulanan warga periode *${formatMonthId(selectedMonth)}* yang belum terselesaikan:\n\n${itemsDetail}\n\n*Total Tunggakan:* Rp ${totalArrears.toLocaleString('id-ID')}\n*Batas Pelunasan:* ${dueDateStr}\n\nPembayaran dapat disalurkan melalui Kas Bendahara RT secara langsung atau transfer ke rekening RT yang sah.\n\nAtas perhatian dan kerjasamanya demi kenyamanan lingkungan RT kita, kami ucapkan terima kasih. 🙏`;
    } else if (tone === 'Kasual') {
      localDraft = `Halo pak/bu *${house.headOfFamily}* (Hunian ${house.block}/${house.number}) 👋\n\nSemoga sehat selalu, ya! \nMau ingetin nih untuk iuran bulanan RT periode *${formatMonthId(selectedMonth)}* rinciannya:\n\n${itemsDetail}\n\n*Total Tagihan:* Rp ${totalArrears.toLocaleString('id-ID')}\n*Jatuh Tempo:* ${dueDateStr} 🗓️\n\nBiar lingkungan kita tetap aman & bersih, mohon segera ditransfer ke rekening RT atau bayar langsung ke Bendahara RT yaa. \n\nMakasih banyak sebelumnya atas partisipasinya! 😊✨`;
    } else {
      localDraft = `*⚠️ PENTING: NOTIFIKASI MENDESAK PELUNASAN IURAN RT 02 ⚠️*\n\nKepada Bapak/Ibu *${house.headOfFamily}* (Blok/No: ${house.block}/${house.number}),\n\nKami mengimbau keras perihal kewajiban iuran warga untuk periode *${formatMonthId(selectedMonth)}* yang hingga saat ini tercatat belum lunas:\n\n${itemsDetail}\n\n*TOTAL TUNGGAKAN:* Rp ${totalArrears.toLocaleString('id-ID')}\n*TENGGAT WAKTU:* *SEGERA* (Paling lambat jatuh tempo ${dueDateStr})\n\nKeberlangsungan operasional satpam, kebersihan sampah, dan kegiatan sosial RT sangat bergantung pada iuran warga. Mohon kerja samanya untuk segera melunasi iuran hari ini.\n\nHarap hubungi Bendahara RT setelah melakukan transaksi. Terima kasih. 📢`;
    }
    
    setDraft(localDraft);
  };

  const listHouseId = (id: string) => {
    // Return sanitized database ID
    return id.replace('house-', '');
  };

  // Modern helper to format "YYYY-MM" into readable Indonesian Month Year
  const formatMonthId = (monthStr: string) => {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${monthNames[mIdx] || month} ${year}`;
  };

  // Generate draft using intelligent Gemini assistance
  const handleGenerateDraftWithAI = async () => {
    if (broadcastType === 'announcement' && !announcementTopic.trim()) {
      return toast.error('Harap masukkan topik pengumuman terlebih dahulu.');
    }
    if (broadcastType === 'billing' && !selectedHouseId) {
      return toast.error('Harap pilih warga yang menunggak terlebih dahulu.');
    }

    setIsGenerating(true);
    toast.info('Menghubungkan ke Gemini Smart Draft Generator...');

    try {
      let payload: any = {
        type: broadcastType,
        tone: tone,
      };

      if (broadcastType === 'announcement') {
        payload.topic = announcementTopic;
      } else {
        const house = occupiedHouses.find(h => h.id === selectedHouseId);
        if (!house) throw new Error('Warga tidak ditemukan');

        const houseBill = bills.find(b => b.houseId === listHouseId(selectedHouseId) && b.month === selectedMonth);
        const unpaidItems = houseBill?.items.filter(i => i.status === 'Unpaid') || [];
        const totalArrears = unpaidItems.reduce((acc, item) => acc + item.amount, 0);
        const itemsDetail = unpaidItems.map(i => `${i.name}: Rp ${i.amount.toLocaleString('id-ID')}`).join(', ');

        payload.topic = `Billing reminder for ${house.headOfFamily}`;
        payload.dataContext = {
          headOfFamily: house.headOfFamily,
          block: house.block,
          number: house.number,
          unpaidMonths: formatMonthId(selectedMonth),
          totalAmount: totalArrears,
          itemsDetail: itemsDetail || 'Iuran rutin Keamanan & Kebersihan',
        };
      }

      // Hit our newly integrated server-side Gemini API route
      const response = await fetch('/api/gemini/generate-broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: safeJsonStringify(payload),
      });

      const result = await response.json();
      if (result.success && result.text) {
        setDraft(result.text);
        toast.success(`Draf ${tone} berhasil dirancang oleh Gemini ✨`);
      } else {
        throw new Error(result.error || 'Gagal merancang teks.');
      }
    } catch (error: any) {
      console.error('AI Draft Error:', error);
      toast.error(`Koneksi AI sibuk. Merancang draf secara lokal...`);
      // Fallback to local template matching selected settings
      if (broadcastType === 'billing') {
        generateLocalBillingTemplate();
      } else {
        // Simple default announcement fallback
        const titleAnn = announcementTopic.toUpperCase();
        setDraft(`*PENGUMUMAN RT 02: ${titleAnn}* 📢\n\nYth. Segenap Warga RT 02,\n\nSehubungan dengan "${announcementTopic}", diimbau demi kebersamaan kita untuk memperhatikan rincian berikut ini.\n\nSilakan bersiap dan berpartisipasi aktif demi kemakmuran Rukun Tetangga 02.\n\nTerima kasih atas segala perhatiannya. 🙏\n\n_Hormat kami,\nPengurus RT 02_`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyDraft = () => {
    if (!draft.trim()) {
      return toast.error('Belum ada teks draf untuk disalin.');
    }
    navigator.clipboard.writeText(draft);
    toast.success('Draf pesan berhasil disalin ke clipboard! 📋');
  };

  const handleSendViaGateway = async () => {
    if (!draft.trim()) {
      return toast.error('Harap rancang draf pesan terlebih dahulu.');
    }
    if (targetPhoneNumbers.length === 0) {
      return toast.error('Tidak ada nomor target tujuan yang valid.');
    }

    setIsSending(true);
    const targetCount = targetPhoneNumbers.length;
    toast.info(`Mengirim siaran ke ${targetCount} target via WhatsApp Gateway...`);

    try {
      // Use comma-joined target values
      const targetStr = targetPhoneNumbers.join(',');
      const response = await sendWhatsAppViaGateway(targetStr, draft);
      
      if (response && response.success) {
        toast.success(`Berhasil! Siaran dikirim ke ${targetCount} target. 🚀`);
      } else {
        toast.error(`Gagal mengirim via gateway: ${response?.error || 'Sedang sibuk'}`);
      }
    } catch (error: any) {
      console.error('Send broadcast gateway error:', error);
      toast.error('Gagal memproses siaran otomatis. Silakan coba kembali.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDirectWhatsAppApp = () => {
    if (!draft.trim()) {
      return toast.error('Harap rancang draf pesan terlebih dahulu.');
    }
    
    // Choose the first phone number or trigger the prompt if multiple
    let phoneNum = '';
    if (targetPhoneNumbers.length > 0) {
      phoneNum = targetPhoneNumbers[0];
    } else {
      phoneNum = manuallyEnteredPhone;
    }

    if (!phoneNum && targetType !== 'all' && targetType !== 'arrears') {
      return toast.error('Target nomor telepon warga belum disiapkan.');
    }

    toast.info('Membuka aplikasi WhatsApp...');
    sendWhatsAppMessage(phoneNum, draft);
  };

  // Quick preset announcement ideas
  const placeholderIdeas = [
    { label: 'Kerja Bakti Bersama', text: 'Kerja bakti bulanan membersihkan jalan utama dan got saluran air.' },
    { label: 'Rapat RT Bulanan', text: 'Musyawarah RT bulanan membahas laporan keuangan kas dan rencana sosial.' },
    { label: 'Fogging Nyamuk DBD', text: 'Kegiatan fogging lingkungan mengantisipasi demam berdarah yang mulai mewabah.' },
    { label: 'Iuran Wajib Ronda', text: 'Imbauan penertiban ronda malam mingguan serta pengumpulan iuran keamanan.' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Column */}
      <div className="lg:col-span-5 space-y-6">
        {/* Template Cepat Sekali Klik */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm leading-tight">Template Siaran Sekali Klik</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Draf instan tanpa ketik manual</p>
              </div>
            </div>
            {activeTemplateId && (
              <button
                onClick={() => {
                  setActiveTemplateId(null);
                  setDraft('');
                  setAnnouncementTopic('');
                }}
                className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-lg transition-all"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[290px] overflow-y-auto pr-1">
            {quickTemplates.map((tmpl) => {
              const isActive = activeTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setActiveTemplateId(tmpl.id);
                    setBroadcastType('announcement');
                    setAnnouncementTopic(tmpl.topic);
                    setDraft(tmpl.text);
                    toast.success(`Template "${tmpl.title}" dimuat! 🚀 Silakan sesuaikan detail tanggal/waktu di kolom kanan.`);
                  }}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                      : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-800 text-xs truncate">
                        {tmpl.title}
                      </span>
                      {isActive && (
                        <span className="bg-emerald-500 text-white p-0.5 rounded-full">
                          <Check size={8} className="stroke-[4]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5">
                      {tmpl.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Layers size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">Konfigurasi Siaran</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tentukan subjek pesan</p>
            </div>
          </div>

          {/* Toggle Type */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Subjek Siaran</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                type="button"
                onClick={() => setBroadcastType('announcement')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${broadcastType === 'announcement' ? 'bg-white shadow-sm text-indigo-600 border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Megaphone size={14} />
                Pengumuman RT
              </button>
              <button 
                type="button"
                onClick={() => setBroadcastType('billing')}
                className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${broadcastType === 'billing' ? 'bg-white shadow-sm text-indigo-600 border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText size={14} />
                Tagihan Iuran
              </button>
            </div>
          </div>

          {/* Dynamic Inputs based on type */}
          {broadcastType === 'announcement' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Topik Pengumuman</label>
                <textarea 
                  rows={3}
                  value={announcementTopic}
                  onChange={(e) => setAnnouncementTopic(e.target.value)}
                  placeholder="Contoh: Kerja bakti gotong royong hari minggu jam 07.30 pagi dilarang buang sampah sembarangan..."
                  className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Ideas / Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inspirasi Topik Cepat</span>
                <div className="flex flex-wrap gap-1.5">
                  {placeholderIdeas.map((idea, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAnnouncementTopic(idea.text)}
                      className="text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200/65 py-1 px-2.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-left"
                    >
                      {idea.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Periode Bulan</label>
                  <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Pilih Warga</label>
                  <select
                    value={selectedHouseId}
                    onChange={(e) => setSelectedHouseId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Cari Nama Warga --</option>
                    {occupiedHouses.map(h => {
                      const overdue = bills.find(b => b.houseId === listHouseId(h.id) && b.month === selectedMonth && b.items.some(i => i.status === 'Unpaid'));
                      const label = overdue ? `(Tunggak) ${h.headOfFamily}` : h.headOfFamily;
                      return (
                        <option key={h.id} value={h.id}>
                          {h.block}/{h.number} - {label}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Arrears Context Alert */}
              {selectedHouseId && (
                <div className="p-4 bg-amber-50 border border-amber-100/50 rounded-2xl flex gap-3 text-amber-800">
                  <Receipt size={20} className="shrink-0 text-amber-600 mt-0.5" />
                  <div className="text-xs">
                    <h5 className="font-bold">Info Tagihan Warga</h5>
                    {(() => {
                      const bill = bills.find(b => b.houseId === listHouseId(selectedHouseId) && b.month === selectedMonth);
                      if (!bill) {
                        return <p className="mt-1">Belum ada tagihan terdaftar untuk keluarga ini di bulan {formatMonthId(selectedMonth)}. Menggunakan template iuran standar.</p>;
                      }
                      const unpaid = bill.items.filter(i => i.status === 'Unpaid');
                      if (unpaid.length === 0) {
                        return <p className="mt-1 text-emerald-700 font-bold">Lunas! Keluarga ini sudah memenuhi seluruh iuran untuk bulan {formatMonthId(selectedMonth)}.</p>;
                      }
                      return (
                        <ul className="list-disc list-inside mt-1 font-medium space-y-0.5">
                          {unpaid.map((item, idx) => (
                            <li key={idx}>{item.name}: Rp {item.amount.toLocaleString('id-ID')}</li>
                          ))}
                        </ul>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tone Selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Variasi Suasana (Gaya Bahasa)</label>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">RT Modern</span>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button 
                type="button"
                onClick={() => { setTone('Formal'); if (broadcastType === 'billing') setTimeout(() => generateLocalBillingTemplate(), 50); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${tone === 'Formal' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Formal 💼
              </button>
              <button 
                type="button"
                onClick={() => { setTone('Kasual'); if (broadcastType === 'billing') setTimeout(() => generateLocalBillingTemplate(), 50); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${tone === 'Kasual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Kasual 😊
              </button>
              <button 
                type="button"
                onClick={() => { setTone('Mendesak'); if (broadcastType === 'billing') setTimeout(() => generateLocalBillingTemplate(), 50); }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${tone === 'Mendesak' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Mendesak 📢
              </button>
            </div>
          </div>

          {/* Generate Draft Button */}
          <button
            type="button"
            onClick={handleGenerateDraftWithAI}
            disabled={isGenerating}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase shadow-md flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white hover:scale-[1.01] active:scale-[0.99] shadow-indigo-200'}`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Sedang Merancang Draf...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Rancang Draf dengan Gemini AI
              </>
            )}
          </button>
        </div>

        {/* Target Destination Settings */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">Sasaran & Tujuan No</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Siapa target siaran ini?</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Target Options */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Metode Penerima</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('individual')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${targetType === 'individual' ? 'bg-indigo-50/50 border-indigo-200 text-indigo-600' : 'bg-transparent border-slate-100 text-slate-500 hover:bg-slate-50/50'}`}
                >
                  <User size={16} />
                  <span>Warga Spesifik</span>
                </button>
                
                {broadcastType === 'billing' ? (
                  <button
                    type="button"
                    onClick={() => setTargetType('arrears')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${targetType === 'arrears' ? 'bg-indigo-50/50 border-indigo-200 text-indigo-600' : 'bg-transparent border-slate-100 text-slate-500 hover:bg-slate-50/50'}`}
                  >
                    <AlertTriangle size={16} />
                    <span>Hanya yang Menunggak ({housesWithArrears.length})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTargetType('group')}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${targetType === 'group' ? 'bg-indigo-50/50 border-indigo-200 text-indigo-600' : 'bg-transparent border-slate-100 text-slate-500 hover:bg-slate-50/50'}`}
                  >
                    <MessageSquare size={16} />
                    <span>Grup WhatsApp RT</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${targetType === 'all' ? 'bg-indigo-50/50 border-indigo-200 text-indigo-600' : 'bg-transparent border-slate-100 text-slate-500 hover:bg-slate-50/50'}`}
                >
                  <Users size={16} />
                  <span>Semua Warga ({occupiedHouses.length})</span>
                </button>
              </div>
            </div>

            {/* Target Details Forms based on choice */}
            {targetType === 'individual' && (
              <>
                {broadcastType === 'announcement' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Masukkan No Telepon Manual</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text"
                        value={manuallyEnteredPhone}
                        onChange={(e) => setManuallyEnteredPhone(e.target.value)}
                        placeholder="Contoh: 081234567890 atau 628..."
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-2xl text-xs font-medium text-slate-500 border border-slate-100 space-y-1.5">
                    <span className="font-black text-slate-600 block uppercase text-[10px]">Penerima Terkait Kepala Keluarga:</span>
                    {selectedHouseId ? (
                      (() => {
                        const h = occupiedHouses.find(house => house.id === selectedHouseId);
                        return (
                          <div className="font-bold text-slate-700">
                            <p>Nama: {h?.headOfFamily}</p>
                            <p>Handphone: {h?.phone || '(Tidak ada nomor)'}</p>
                            <p>Lokasi: Blok {h?.block} No. {h?.number}</p>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="italic">Belum ada warga yang Anda pilih di atas.</p>
                    )}
                  </div>
                )}
              </>
            )}

            {targetType === 'group' && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Pilih Grup Utama</label>
                {isLoadingGroups ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-2">
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Mencari daftar grup aktif dari gateway...</span>
                  </div>
                ) : whatsappGroups.length > 0 ? (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="">-- Pilih Grup WhatsApp --</option>
                    {whatsappGroups.map(g => (
                      <option key={g.id} value={g.id}>{g.name || g.subject}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-100/50 rounded-2xl text-xs text-rose-800 space-y-1">
                    <p className="font-bold">Gateway belum terhubung penuh.</p>
                    <p>Warga akan menerima pesan langsung satu per satu di nomor pribadinya bila Anda beralih ke "Semua Warga" atau "Warga Spesifik".</p>
                  </div>
                )}
              </div>
            )}

            {targetType === 'all' && (
              <div className="p-4 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl text-xs text-indigo-900 leading-relaxed font-medium">
                📢 Pesan akan disiarkan langsung ke seluruh <strong>{occupiedHouses.length} KK warga terdaftar</strong> yang memiliki nomor telepon aktif dalam database.
              </div>
            )}

            {targetType === 'arrears' && (
              <div className="p-4 bg-amber-50/30 border border-amber-100/50 rounded-2xl text-xs text-amber-900 leading-relaxed font-medium">
                ⚠️ Pengingat tagihan akan dikirim massal satu per satu ke <strong>{housesWithArrears.length} KK warga yang menunggak</strong> iuran periode {formatMonthId(selectedMonth)}.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Actions Column */}
      <div className="lg:col-span-7 flex flex-col h-full space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight">Visualisasi & Draf Pesan</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Pratinjau pesan WhatsApp</p>
              </div>
            </div>
            {draft && (
              <button 
                onClick={() => setDraft('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline px-2 py-1"
              >
                Hapus Draf
              </button>
            )}
          </div>

          {/* Prompt/Guide if draft is empty */}
          {!draft ? (
            <div className="flex-1 min-h-[300px] border border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/30">
              <Sparkles className="text-indigo-600/30 mb-4 animate-pulse" size={48} />
              <h4 className="font-black text-slate-700 text-base">Rancang Draf Anda dengan AI</h4>
              <p className="text-xs text-slate-400 font-bold max-w-sm mt-1.5 leading-relaxed">
                Tulis topik atau pilih warga penerima di kolom sebelah kiri, lalu tekan tombol "Rancang Draf dengan Gemini AI" untuk membuat naskah WhatsApp yang terstruktur indah lengkap dengan barisan emoji rapi.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3">
              <textarea 
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full flex-1 min-h-[300px] bg-slate-50/70 border border-slate-100 hover:border-slate-200 rounded-2xl p-4 text-sm font-medium leading-relaxed font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white resize-none transition-all text-slate-800"
                placeholder="Rancang teks pengumuman di sini..."
              />
              
              <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Panjang Karakter: {draft.length}</span>
                <span>Jumlah Target: {targetPhoneNumbers.length} Nomor</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyDraft}
                className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Salin Format Siaran
              </button>
              <button
                type="button"
                onClick={handleDirectWhatsAppApp}
                className="w-full py-3.5 px-6 rounded-2xl border border-emerald-200 font-bold text-xs uppercase tracking-wider text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                WhatsApp Direct (wa.me)
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendViaGateway}
              disabled={isSending || !draft.trim()}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase shadow-md flex items-center justify-center gap-2 transition-all ${isSending || !draft.trim() ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100 shadow-none' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white hover:scale-[1.01] active:scale-[0.99] shadow-emerald-200'}`}
            >
              {isSending ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Sedang Menyiarkan Pesan Warga...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim ke WhatsApp Warga (Gateway Otomatis)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
