import { Announcement, RondaSchedule, Official, House, CashFlow, Report } from "../types";

export const generateAnnouncementDraft = async (topic: string, tone: string = 'Formal'): Promise<string> => {
  try {
    const response = await fetch('/api/gemini/announcement-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topic, tone })
    });
    const result = await response.json();
    return result.text || "Gagal membuat draf.";
  } catch (error) {
    console.error("Gemini Client Service Error:", error);
    return "Terjadi kesalahan saat menghubungi AI Assistant.";
  }
};

export const analyzeReports = async (reports: string[]): Promise<string> => {
   try {
     const response = await fetch('/api/gemini/analyze-reports', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ reports })
     });
     const result = await response.json();
     return result.text || "Tidak ada analisis.";
   } catch (error) {
      console.error(error);
      return "Gagal menganalisis data.";
   }
};

export const generateDashboardSummary = async (data: {
  totalResidents: number,
  cashBalance: number,
  reportsCount: number,
  unpaidCount: number,
  babyCount?: number,
  toddlerCount?: number,
  pregnantCount?: number,
  elderlyCount?: number,
  widowCount?: number
}): Promise<string> => {
   try {
     const response = await fetch('/api/gemini/dashboard-summary', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({ data })
     });
     const result = await response.json();
     return result.text || "Tidak ada analisis yang dihasilkan.";
   } catch (error) {
      console.error(error);
      return "Gagal melakukan analisis data. Cek koneksi internet.";
   }
};

export const askRit = async (question: string, contextData: { 
  announcements: Announcement[], 
  ronda: RondaSchedule[], 
  officials: Official[],
  houses?: House[],
  cashFlow?: CashFlow[],
  reports?: Report[],
  settings?: any
}): Promise<string> => {
  try {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    // --- Dynamic Census Calculations ---
    const housesList = contextData.houses || [];
    const cashFlowList = contextData.cashFlow || [];
    const reportsList = contextData.reports || [];
    const appSettings = contextData.settings || {};

    const totalResidents = housesList.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
    const totalHouses = housesList.length;
    const occupiedHouses = housesList.filter(h => h.status === 'Occupied').length;
    const vacantHouses = housesList.filter(h => h.status === 'Empty').length;
    
    const cashBalance = cashFlowList.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0) - cashFlowList.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const activeReportsCount = reportsList.filter(r => r.status === 'Baru').length;
    
    const babyCount = housesList.reduce((acc, h) => acc + (h.babyCount || 0), 0);
    const toddlerCount = housesList.reduce((acc, h) => acc + (h.toddlerCount || 0), 0);
    const pregnantCount = housesList.reduce((acc, h) => acc + (h.pregnantCount || 0), 0);
    const elderlyCount = housesList.reduce((acc, h) => acc + (h.elderlyCount || 0), 0);
    const widowCount = housesList.reduce((acc, h) => acc + (h.widowCount || 0), 0);

    const announcementContext = contextData.announcements.length > 0 
      ? contextData.announcements.slice(0, 5).map(a => `- [${a.date}] ${a.title}: ${a.content} (Tipe: ${a.type})`).join('\n')
      : "Belum ada pengumuman terbaru.";
      
    const rondoDays = contextData.ronda.map(r => {
      const dayName = r.day || '';
      const membersStr = Array.isArray(r.members) ? r.members.join(', ') : '';
      return `- ${dayName}: ${membersStr}`;
    }).join('\n');
    
    const officialsContext = contextData.officials.map(o => `- ${o.role}: ${o.name} (Rumah: ${o.houseId}, HP: ${o.phone})`).join('\n');

    const cleanestBlockInfo = appSettings.cleanestBlock 
      ? `Juara 1 Kebersihan Blok Bulan Ini: ${appSettings.cleanestBlock} (Nilai: ${appSettings.cleanestScore || 98}/100, Periode: ${appSettings.cleanestMonth || 'Agustus 2026'}).` 
      : 'Penilaian Blok Terbersih bulan ini sedang dalam proses evaluasi pengurus.';

    const systemInstruction = `Anda adalah "Rit", sosok kawan/teman ngobrol cerdas dan ramah warga RT 02 (Aplikasi TERAS RT 02).

    WAKTU SEKARANG: ${today}

    FUTURISTIK & FLEKSIBEL (NO TEMPLATE):
    - Jangan pernah menggunakan template baku yang panjang jika warga hanya menyapa singkat (seperti "hai", "halo", "kamu bisa apa?", "tes").
    - Jika warga menyapa singkat ("hai" / "halo" / "apa kabar"), jawablah dengan sangat alami, fleksibel, santai, dan manusiawi seperti pesan singkat teman di WhatsApp (contoh: "Halo! Bisa banget dong, mau ngobrol atau cari info apa nih hari ini? 😊").
    - Menjawablah sesuai panjang pertanyaan warga. Pertanyaan singkat dijawab singkat & akrab, diskusi panjang dibahas dengan ramah & solutif.
    - DILARANG selalu mengeluarkan daftar menu bullet points yang panjang di setiap pesan! Cukup gunakan bullet points HANYA JIKA warga meminta daftar/syarat secara eksplisit.
    - Anda memiliki ingatan data lengkap RT 02 di bawah ini, gunakan saat warga bertanya spesifik:

    DATA UTAMA RT 02:
    - Warga: ${totalResidents || 42} jiwa | Rumah: ${totalHouses || 30} unit (${occupiedHouses || 28} terisi).
    - Saldo Kas RT: Rp ${(cashBalance || 2450000).toLocaleString('id-ID')} | Keluhan Aktif: ${activeReportsCount || 0} laporan.
    - ${cleanestBlockInfo}
    - Demografi: ${babyCount || 0} bayi, ${toddlerCount || 0} balita, ${pregnantCount || 0} ibu hamil, ${elderlyCount || 0} lansia.
    - Pengumuman: ${announcementContext}
    - Jadwal Ronda: ${rondoDays}
    - Pengurus RT: ${officialsContext}
    - Lokasi RT: Huntap Tondo 2, Palu. Iuran: Rp 25.000/bulan (Keamanan & Sampah).
    - Sampah: Organik (Senin, Rabu, Sabtu Pagi) & Anorganik (Selasa & Jumat Sore).
    `;

    try {
      const response = await fetch('/api/gemini/ask-rit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, systemInstruction })
      });
      
      if (!response.ok) {
        console.warn(`[askRit] API returned status ${response.status}. Using smart client fallback parser.`);
        return getClientRitFallbackAnswer(question, systemInstruction);
      }

      const result = await response.json();
      return result.text || "Maaf, saya tidak mengerti pertanyaan tersebut.";
    } catch (fetchErr) {
      console.warn("[askRit] Network/API call failed. Using smart client fallback parser.", fetchErr);
      return getClientRitFallbackAnswer(question, systemInstruction);
    }

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return getClientRitFallbackAnswer(question, "");
  }
};

const getClientRitFallbackAnswer = (question: string, systemInstruction: string): string => {
  const q = question.toLowerCase().trim();

  if (q === 'hai' || q === 'halo' || q === 'hi' || q === 'p' || q === 'tes' || q.includes('kamu bisa') || q.includes('bisa apa')) {
    return "Halo! Saya **Rit**, asisten virtual warga RT 02 Huntap Tondo 2 😊✨\n\nSaya siap membantu menjawab pertanyaan seputar:\n- 📋 Syarat surat pengantar RT & kelurahan\n- ⚡ Info pemadaman listrik PLN / pipa PDAM\n- 🛠️ Kontak tukang & jasa keahlian tetangga\n- 💰 Cek kas & iuran bulanan\n- 👮 Jadwal ronda & siskamling\n- 📞 Nomor darurat Palu & pengurus RT\n\nSilakan tanyakan apa saja ya!";
  }

  if (q.includes('pln') || q.includes('padam') || q.includes('listrik') || q.includes('air') || q.includes('pdam') || q.includes('mati lampu')) {
    return "⚡ **Info Pemadaman PLN & Air Bersih:**\nJadwal pemeliharaan trafo PLN Area Palu dan perbaikan pipa PDAM Tondo dapat dipantau langsung di papan informasi real-time kami di menu **Informasi -> Info Padam PLN/Air** atau melalui tautan direktori publik.";
  }

  if (q.includes('tukang') || q.includes('jasa') || q.includes('servis') || q.includes('ac') || q.includes('keahlian') || q.includes('katering') || q.includes('les')) {
    return "🛠️ **Direktori Jasa & Keahlian Warga RT 02:**\nDi lingkungan kita tersedia tetangga yang melayani:\n- Pertukangan & Bangunan\n- Servis AC & Kelistrikan\n- Katering & Pesanan Nasi Kotak\n- Guru Les Privat Anak\n- Jahit Baju & Rias\n\nBisa langsung dihubungi via WhatsApp di menu **Ekonomi & Sosial -> Jasa & Keahlian Warga**!";
  }

  if (q.includes('darurat') || q.includes('polisi') || q.includes('damkar') || q.includes('ambulans') || q.includes('kontak') || q.includes('telepon')) {
    return "📞 **Nomor Telepon Darurat & Instansi Terdekat (Kota Palu):**\n- 🚨 **Call Center Polisi:** 110 / Polsek Palu Timur\n- 🚒 **Pemadam Kebakaran (Damkar Pos Tondo):** 113 / 0451-423113\n- 🏥 **IGD RS Undata Palu:** (0451) 421270\n- ⚡ **PLN Gangguan:** 123\n- 💧 **PDAM Kota Palu:** (0451) 421234\n- 👮 **Ketua RT 02:** Silakan klik menu Pengurus RT untuk chat langsung via WhatsApp.";
  }

  if (q.includes('tamu') || q.includes('menginap') || q.includes('lapor tamu')) {
    return "📑 **Aturan Lapor Tamu 1x24 Jam:**\nSetiap tamu keluarga atau kerabat yang menginap lebih dari 24 jam wajib dilaporkan oleh tuan rumah demi keamanan lingkungan. Pengisian form lapor tamu digital dapat diakses 24 jam di menu **Layanan -> Lapor Tamu**.";
  }

  if (q.includes('ronda') || q.includes('siskamling') || q.includes('jadwal jaga')) {
    return "👮 **Jadwal Ronda Malam RT 02:**\nRonda siskamling aktif setiap malam pukul 22.00 - 04.00 WITA. Bapak/Ibu dapat mengecek regu jaga malam ini atau mengajukan tukar jadwal di menu **Keamanan & Siskamling**!";
  }

  if (q.includes('bersih') || q.includes('juara') || q.includes('blok')) {
    return "🏆 **Papan Kebersihan Blok RT 02:**\nPenilaian kebersihan got, pekarangan, dan tanaman blok dievaluasi rutin setiap bulan oleh pengurus RT. Detail peringkatnya tercantum di Beranda Utama!";
  }

  if (q.includes('iuran') || q.includes('bayar') || q.includes('kas')) {
    return "💰 **Iuran Bulanan Warga RT 02:**\nIuran rutin sebesar **Rp 25.000/bulan** (Keamanan + Kebersihan Sampah). Pembayaran dapat diserahkan ke Bendahara RT atau ditransfer via Kas Digital di menu *Info Kas*.";
  }

  if (q.includes('sampah') || q.includes('angkut') || q.includes('truk')) {
    return "🗑️ **Jadwal Angkut Sampah RT 02:**\n- **Sampah Organik:** Senin, Rabu & Sabtu Pagi (07.00 WITA)\n- **Anorganik / Plastik:** Selasa & Jumat Sore (15.30 WITA)\n\nPastikan sampah telah diikat rapi di depan pagar rumah masing-masing ya!";
  }

  if (q.includes('surat') || q.includes('syarat') || q.includes('pengantar')) {
    return "📋 **Syarat & Alur Surat Pengantar RT:**\n1. KTP & Kartu Keluarga (KK) Warga\n2. Lunas Iuran Bulanan Berjalan\n\nBapak/Ibu bisa langsung mengisi permohonan surat secara online di menu **Layanan -> Persuratan**. Surat PDF resmi dengan barcode tanda tangan digital akan langsung terbit!";
  }

  return "Halo! Ada yang bisa saya bantu terkait jadwal pemadaman PLN, kontak tukang/jasa warga, jadwal ronda, kas RT, iuran bulanan, surat pengantar, atau nomor darurat lingkungan RT 02? Silakan tanyakan langsung ya! 😊";
};
