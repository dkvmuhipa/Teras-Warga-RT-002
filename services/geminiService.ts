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

    const response = await fetch('/api/gemini/ask-rit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question, systemInstruction })
    });
    
    const result = await response.json();
    return result.text || "Maaf, saya tidak mengerti pertanyaan tersebut.";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Maaf, Rit sedang istirahat sebentar (Error koneksi).";
  }
};
