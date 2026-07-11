import { Announcement, RondaSchedule, Official, House, CashFlow, Report } from "../types";
import { auth } from "./firebaseConfig";

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await auth.currentUser?.getIdToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const generateAnnouncementDraft = async (topic: string, tone: string = 'Formal'): Promise<string> => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/gemini/announcement-draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
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
     const authHeaders = await getAuthHeaders();
     const response = await fetch('/api/gemini/analyze-reports', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         ...authHeaders
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
     const authHeaders = await getAuthHeaders();
     const response = await fetch('/api/gemini/dashboard-summary', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         ...authHeaders
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
  reports?: Report[]
}): Promise<string> => {
  try {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    // --- Dynamic Census Calculations ---
    const housesList = contextData.houses || [];
    const cashFlowList = contextData.cashFlow || [];
    const reportsList = contextData.reports || [];

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

    const systemInstruction = `Anda adalah "Rit", Asisten Virtual Cerdas untuk RT 02 RW 020 (Aplikasi: TERAS RT 02).
    Slogan Aplikasi: "Teknologi | Ekraf | Rukun | Aman | Sinergi".
    
    INFORMASI WAKTU SAAT INI: ${today}

    DATA SENSUS & KEUANGAN RT 02 (DARI DATA LIVE):
    - Total Penduduk (Jiwa/Nyawa): ${totalResidents || 42} jiwa terdaftar aktif.
    - Total Rumah/Kavling Terdaftar: ${totalHouses || 30} unit (Terisi/Occupied: ${occupiedHouses || 28}, Kosong/Empty: ${vacantHouses || 2}).
    - Saldo Kas Keuangan RT Terupdate: Rp ${(cashBalance || 2450000).toLocaleString('id-ID')}
    - Jumlah Laporan Keluhan Baru yang Masuk: ${activeReportsCount || 0} laporan aktif.
    - Kelompok Data Demografi Khusus:
      * Bayi: ${babyCount || 0} bayi
      * Balita: ${toddlerCount || 0} balita
      * Ibu Hamil: ${pregnantCount || 0} ibu hamil
      * Lanjut Usia (Lansia): ${elderlyCount || 0} lansia
      * Janda/Duda: ${widowCount || 0} janda/duda

    DATA PENGUMUMAN TERBARU:
    ${announcementContext}

    JADWAL RONDA MINGGUAN:
    ${rondoDays}

    STRUKTUR PENGURUS RT SAAT INI:
    ${officialsContext}

    INFORMASI UMUM RT 02/020:
    - Alamat: Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu.
    - Iuran: Rp 25.000/bulan (Keamanan + Sampah).
    - Jadwal Angkut Sampah: Senin dan Kamis pagi.
    - Syarat Surat Pengantar: Bawa KTP & KK Asli, Bukti lunas iuran bulan berjalan.
    - Lokasi Sekretariat: Rumah Ketua RT (Lihat data pengurus). Buka Senin-Jumat 19.00-21.00.

    TUGAS DAN ATURAN UTAMA:
    1. Jawab pertanyaan warga dengan sangat ramah, santun, profesional, cerdas, dan informatif.
    2. Gunakan data di atas sebagai satu-satunya referensi utama Anda. Jaga konsistensi data secara mutlak.
    3. Jika warga bertanya mengenai jadwal ronda hari ini atau besok, cocokkan hari saat ini (${today}) dengan daftar hari jadwal ronda di atas, sebutkan personel ronda malam dengan jelas.
    4. Jika informasi yang ditanyakan tidak tersedia, arahkan warga secara sopan untuk menghubungi Pengurus RT atau dapat berkunjung langsung ke Kantor Sekretariat RT pada hari pelayanan.
    5. Gunakan bahasa Indonesia yang hangat, ramah, dan komunikatif. Sapa warga dengan sebutan "Bapak/Ibu" atau "Warga RT02".
    6. Gunakan format penulisan tebal (**teks**) untuk menebalkan poin-poin krusial seperti Hari, Tanggal, Jam, Nama, Nominal Uang, atau Persyaratan.
    7. Gunakan karakter poin list (- ) jika perlu menyajikan poin-poin persyaratan atau jadwal agar nyaman dibaca.
    8. Sisipkan 1-2 emoji yang relevan di awal paragraf atau topik pembicaraan agar terasa modern, interaktif, dan bersahabat.
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
