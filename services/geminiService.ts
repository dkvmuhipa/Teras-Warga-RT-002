

import { GoogleGenAI } from "@google/genai";
import { Announcement, RondaSchedule, Official } from "../types";

// Safe Initialization
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey: apiKey });

export const generateAnnouncementDraft = async (topic: string, tone: string = 'Formal'): Promise<string> => {
  if (!apiKey) return "API Key AI belum dikonfigurasi.";
  
  try {
    const prompt = `Buatkan draf pengumuman untuk warga RT (Rukun Tetangga) dengan topik: "${topic}".
    Gaya bahasa: ${tone}.
    Struktur: Judul menarik, Salam pembuka, Isi pengumuman (singkat & jelas), Detail (Waktu/Tempat jika perlu), Salam penutup.
    Format: Plain text (Markdown allowed). Bahasa Indonesia yang baik dan benar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Gagal membuat draf.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi AI Assistant.";
  }
};

export const analyzeReports = async (reports: string[]): Promise<string> => {
   if (!apiKey) return "Fitur AI belum aktif.";

   try {
     const prompt = `Berikut adalah daftar laporan warga minggu ini:
     ${reports.join('\n- ')}
     
     Berikan ringkasan eksekutif singkat (maksimal 3 poin) mengenai isu utama yang perlu ditangani oleh Ketua RT.`;
     
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
     });
     
     return response.text || "Tidak ada analisis.";
   } catch (error) {
      console.error(error);
      return "Gagal menganalisis data.";
   }
}

export const askRit = async (question: string, contextData: { announcements: Announcement[], ronda: RondaSchedule[], officials: Official[] }): Promise<string> => {
  if (!apiKey) return "Maaf, fitur Chatbot sedang non-aktif (Missing API Key).";

  try {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    // Mempersiapkan konteks data untuk AI
    const announcementContext = contextData.announcements.length > 0 
      ? contextData.announcements.slice(0, 5).map(a => `- [${a.date}] ${a.title}: ${a.content} (Tipe: ${a.type})`).join('\n')
      : "Belum ada pengumuman terbaru.";
      
    const rondaContext = contextData.ronda.map(r => `- ${r.day}: ${r.members.join(', ')}`).join('\n');
    
    // Dynamic Officials Context
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
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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