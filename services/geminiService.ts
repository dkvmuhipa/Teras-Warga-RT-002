import { Announcement, RondaSchedule, Official } from "../types";

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

export const askRit = async (question: string, contextData: { announcements: Announcement[], ronda: RondaSchedule[], officials: Official[] }): Promise<string> => {
  try {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
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

    DATA PENGUMUMAN TERBARU:
    ${announcementContext}

    JADWAL RONDA MINGGUAN:
    ${rondoDays}

    STRUKTUR PENGURUS RT SAAT INI:
    ${officialsContext}

    INFORMASI UMUM RT 02/020:
    - Alamat: Huntap 2 Tondo, Kel. Tondo, Kec. Mantikulore, Kota Palu.
    - Iuran: Rp 25.000/bulan (Keamanan + Sampah).
    - Jadwal Angkut Sampah: Senin dan Kamis pagi.
    - Syarat Surat Pengantar: Bawa KTP & KK Asli, Bukti lunas iuran bulan berjalan.
    - Lokasi Sekretariat: Rumah Ketua RT (Lihat data pengurus). Buka Senin-Jumat 19.00-21.00.

    TUGAS ANDA:
    1. Jawab pertanyaan warga dengan ramah, singkat, dan informatif.
    2. Gunakan data di atas sebagai referensi utama.
    3. Jika warga bertanya "siapa ketua RT?", jawab sesuai data "STRUKTUR PENGURUS" di atas.
    4. Jika warga bertanya "siapa ronda hari ini?", cek hari ini (${today}) dan cocokkan dengan data jadwal ronda di atas.
    5. Jika informasi tidak ada di data, sarankan untuk menghubungi Pak RT atau datang ke sekretariat.
    6. Gunakan bahasa Indonesia yang sopan dan natural.
    7. DILARANG menggunakan karakter asterik (*) atau format bold/italic dalam jawaban Anda.
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
