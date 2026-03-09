
// Fix: Use the correct import for GoogleGenAI and ensure initialization follows the latest guidelines
import { GoogleGenAI } from "@google/genai";
import { Announcement, RondaSchedule, Official } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key must be set when using the Gemini API.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

// Fix: Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) to initialize the client
export const generateAnnouncementDraft = async (topic: string, tone: string = 'Formal'): Promise<string> => {
  try {
    const ai = getAiInstance();
    const prompt = `Buatkan draf pengumuman untuk warga RT (Rukun Tetangga) dengan topik: "${topic}".
    Gaya bahasa: ${tone}.
    Struktur: Judul menarik, Salam pembuka, Isi pengumuman (singkat & jelas), Detail (Waktu/Tempat jika perlu), Salam penutup.
    Format: Plain text. DILARANG menggunakan karakter asterik (*) atau format bold/italic. Bahasa Indonesia yang baik dan benar.`;

    // Fix: Use ai.models.generateContent with the model name directly
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Fix: Access response.text as a property, not a method
    return response.text || "Gagal membuat draf.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi AI Assistant.";
  }
};

export const analyzeReports = async (reports: string[]): Promise<string> => {
   try {
     const ai = getAiInstance();
     const prompt = `Berikut adalah daftar laporan warga minggu ini:
     ${reports.join('\n- ')}
     
     Berikan ringkasan eksekutif singkat (maksimal 3 poin) mengenai isu utama yang perlu ditangani oleh Ketua RT. DILARANG menggunakan karakter asterik (*) atau format bold/italic.`;
     
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
     });
     
     return response.text || "Tidak ada analisis.";
   } catch (error) {
      console.error(error);
      return "Gagal menganalisis data.";
   }
}

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
     const ai = getAiInstance();
     const prompt = `Bertindaklah sebagai Konsultan Manajemen Lingkungan profesional untuk Ketua RT.
     Analisis data realtime dashboard RT 002 berikut:
     - Jumlah Penduduk: ${data.totalResidents} jiwa
     - Kas Keuangan: Rp ${data.cashBalance.toLocaleString('id-ID')}
     - Laporan Masalah Baru (Aktif): ${data.reportsCount}
     - Warga Menunggak Iuran: ${data.unpaidCount} KK
     - Kelompok Rentan: ${data.babyCount || 0} Bayi, ${data.toddlerCount || 0} Balita, ${data.pregnantCount || 0} Ibu Hamil, ${data.elderlyCount || 0} Lansia, ${data.widowCount || 0} Janda
     
     Berikan laporan singkat dan padat (maksimal 150 kata) yang mencakup:
     1. 💰 Status Kesehatan Keuangan (Aman/Waspada)
     2. 🛡️ Tingkat Keresahan Warga (berdasarkan jumlah laporan)
     3. 👶 Analisis Kelompok Rentan (apakah perlu perhatian khusus minggu ini)
     4. 💡 Satu rekomendasi aksi prioritas untuk pengurus RT minggu ini.

     Format output menggunakan daftar poin (list) agar mudah dibaca. DILARANG menggunakan karakter asterik (*) atau format bold/italic. Gunakan bahasa Indonesia yang formal, solutif, dan menyemangati.`;
     
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
     });
     
     return response.text || "Tidak ada analisis yang dihasilkan.";
   } catch (error) {
      console.error(error);
      return "Gagal melakukan analisis data. Cek koneksi internet.";
   }
}

export const askRit = async (question: string, contextData: { announcements: Announcement[], ronda: RondaSchedule[], officials: Official[] }): Promise<string> => {
  try {
    const ai = getAiInstance();
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    const announcementContext = contextData.announcements.length > 0 
      ? contextData.announcements.slice(0, 5).map(a => `- [${a.date}] ${a.title}: ${a.content} (Tipe: ${a.type})`).join('\n')
      : "Belum ada pengumuman terbaru.";
      
    const rondaContext = contextData.ronda.map(r => `- ${r.day}: ${r.members.join(', ')}`).join('\n');
    const officialsContext = contextData.officials.map(o => `- ${o.role}: ${o.name} (Rumah: ${o.houseId}, HP: ${o.phone})`).join('\n');

    const systemInstruction = `Anda adalah "Rit", Asisten Virtual Cerdas untuk RT 002 RW 020 (Aplikasi: TERAS RT 002).
    Slogan Aplikasi: "Teknologi | Ekraf | Rukun | Aman | Sinergi".
    
    INFORMASI WAKTU SAAT INI: ${today}

    DATA PENGUMUMAN TERBARU:
    ${announcementContext}

    JADWAL RONDA MINGGUAN:
    ${rondaContext}

    STRUKTUR PENGURUS RT SAAT INI:
    ${officialsContext}

    INFORMASI UMUM RT 002/020:
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

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Maaf, saya tidak mengerti pertanyaan tersebut.";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Maaf, Rit sedang istirahat sebentar (Error koneksi).";
  }
};
