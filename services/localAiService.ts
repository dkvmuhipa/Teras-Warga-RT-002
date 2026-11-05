import { Announcement, RondaSchedule, Official, House, CashFlow, Report } from '../types';

export type LocalAiProviderType = 'ollama' | 'chrome-ai' | 'local-rag';

export interface LocalAiStatus {
  activeProvider: LocalAiProviderType;
  label: string;
  modelName: string;
  isOfflineCapable: boolean;
  ollamaUrl: string;
  ollamaAvailable: boolean;
  chromeAiAvailable: boolean;
}

const OLLAMA_URL_STORAGE_KEY = 'teras_local_ai_ollama_url';
const OLLAMA_MODEL_STORAGE_KEY = 'teras_local_ai_ollama_model';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:3b';

export const getOllamaConfig = () => {
  if (typeof window === 'undefined') {
    return { url: DEFAULT_OLLAMA_URL, model: DEFAULT_OLLAMA_MODEL };
  }
  return {
    url: localStorage.getItem(OLLAMA_URL_STORAGE_KEY) || DEFAULT_OLLAMA_URL,
    model: localStorage.getItem(OLLAMA_MODEL_STORAGE_KEY) || DEFAULT_OLLAMA_MODEL
  };
};

export const setOllamaConfig = (url: string, model: string) => {
  if (typeof window === 'undefined') return;
  const cleanUrl = (url || DEFAULT_OLLAMA_URL).trim().replace(/\/+$/, '');
  const cleanModel = (model || DEFAULT_OLLAMA_MODEL).trim();
  localStorage.setItem(OLLAMA_URL_STORAGE_KEY, cleanUrl);
  localStorage.setItem(OLLAMA_MODEL_STORAGE_KEY, cleanModel);
};

/**
 * Probe Chrome Built-in AI (Gemini Nano via Prompt API)
 */
export const detectChromeBuiltInAi = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  try {
    const win = window as any;
    if (win.ai?.languageModel) {
      const cap = await win.ai.languageModel.capabilities();
      return cap?.available === 'readily' || cap?.available === 'after-download';
    }
    if (win.LanguageModel?.availability) {
      const avail = await win.LanguageModel.availability();
      return avail === 'available' || avail === 'readily';
    }
  } catch {
    // Ignore probe errors
  }
  return false;
};

/**
 * Probe Local Ollama Server (only when running on localhost or explicitly configured)
 */
export const detectOllamaServer = async (): Promise<{ available: boolean; modelName: string }> => {
  if (typeof window === 'undefined') return { available: false, modelName: DEFAULT_OLLAMA_MODEL };
  const { url, model } = getOllamaConfig();
  const isLocalHostPage =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    Boolean(localStorage.getItem(OLLAMA_URL_STORAGE_KEY));

  if (!isLocalHostPage) {
    return { available: false, modelName: model };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 900);
  try {
    const res = await fetch(`${url}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return { available: false, modelName: model };
    const data = await res.json();
    const models: Array<{ name: string }> = Array.isArray(data?.models) ? data.models : [];
    const matched =
      models.find(m => m.name.toLowerCase().includes(model.toLowerCase()))?.name ||
      models[0]?.name ||
      model;
    return { available: true, modelName: matched };
  } catch {
    clearTimeout(timer);
    return { available: false, modelName: model };
  }
};

/**
 * Inspect active Local AI status across all 3 tiers
 */
export const getLocalAiStatus = async (): Promise<LocalAiStatus> => {
  const { url } = getOllamaConfig();
  const [ollamaProbe, chromeAiAvailable] = await Promise.all([
    detectOllamaServer(),
    detectChromeBuiltInAi()
  ]);

  if (ollamaProbe.available) {
    return {
      activeProvider: 'ollama',
      label: 'AI Lokal (Ollama Server)',
      modelName: ollamaProbe.modelName,
      isOfflineCapable: true,
      ollamaUrl: url,
      ollamaAvailable: true,
      chromeAiAvailable
    };
  }

  if (chromeAiAvailable) {
    return {
      activeProvider: 'chrome-ai',
      label: 'AI Lokal (Chrome Gemini Nano)',
      modelName: 'Gemini Nano On-Device',
      isOfflineCapable: true,
      ollamaUrl: url,
      ollamaAvailable: false,
      chromeAiAvailable: true
    };
  }

  return {
    activeProvider: 'local-rag',
    label: 'AI Lokal (RAG Data RT Real-Time)',
    modelName: 'TerasRAG v2.5 (Zero-Quota)',
    isOfflineCapable: true,
    ollamaUrl: url,
    ollamaAvailable: false,
    chromeAiAvailable: false
  };
};

/**
 * Attempt generation via Local Ollama or Chrome Built-in AI first
 */
export const tryGenerateWithLocalLlm = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string; provider: LocalAiProviderType } | null> => {
  // 1. Try Local Ollama if available
  const ollama = await detectOllamaServer();
  if (ollama.available) {
    const { url } = getOllamaConfig();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollama.modelName,
          system: systemInstruction || 'Anda adalah asisten AI cerdas berbahasa Indonesia untuk warga RT 002 / RW 020 Huntap Tondo 2, Kota Palu.',
          prompt,
          stream: false,
          options: {
            temperature: 0.4,
            num_predict: 450
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const json = await res.json();
        if (json?.response && String(json.response).trim().length > 0) {
          return { text: String(json.response).trim(), provider: 'ollama' };
        }
      }
    } catch {
      clearTimeout(timer);
    }
  }

  // 2. Try Chrome Built-in AI (window.ai / LanguageModel)
  if (await detectChromeBuiltInAi()) {
    try {
      const win = window as any;
      const factory = win.ai?.languageModel || win.LanguageModel;
      if (factory?.create) {
        const session = await factory.create({
          systemPrompt: systemInstruction || 'Anda adalah asisten AI berbahasa Indonesia untuk warga RT 002 Huntap Tondo 2, Kota Palu.'
        });
        const responseText = await session.prompt(prompt);
        if (session.destroy) session.destroy();
        if (responseText && String(responseText).trim().length > 0) {
          return { text: String(responseText).trim(), provider: 'chrome-ai' };
        }
      }
    } catch {
      // Fall through to Local RAG
    }
  }

  return null;
};

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/**
 * Tier 3: Local Live-Data RAG Engine for "Rit" Citizen Assistant
 * Answers questions directly from live Firestore state in <5ms with 0 MB extra download
 */
export const answerWithLocalRag = (
  question: string,
  contextData: {
    announcements: Announcement[];
    ronda: RondaSchedule[];
    officials: Official[];
    houses?: House[];
    cashFlow?: CashFlow[];
    reports?: Report[];
    settings?: any;
  }
): string => {
  const q = question.toLowerCase().trim();
  const houses = contextData.houses || [];
  const cashFlow = contextData.cashFlow || [];
  const officials = contextData.officials || [];
  const ronda = contextData.ronda || [];
  const announcements = contextData.announcements || [];
  const reports = contextData.reports || [];

  const totalDoors = houses.length || 129;
  const occupiedDoors = houses.filter(h => h.status === 'Occupied' || h.status === 'Business').length;
  const emptyDoors = houses.filter(h => h.status === 'Empty').length;
  const totalResidents = houses
    .filter(h => h.status !== 'Empty')
    .reduce((acc, h) => acc + Math.max(Number(h.occupants) || 1, 1 + (h.familyMembers?.length || 0)), 0);

  const totalIncome = cashFlow
    .filter(c => c.type === 'Income' || (c.type as any) === 'income')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalExpense = cashFlow
    .filter(c => c.type === 'Expense' || (c.type as any) === 'expense')
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const cashBalance = totalIncome - totalExpense;

  const chairman = officials.find(o => (o.role || '').toLowerCase().includes('ketua'))?.name || 'Bpk. IRFAN ARIANTO';
  const secretary = officials.find(o => (o.role || '').toLowerCase().includes('sekretaris'))?.name || 'Ibu NUR FARIDA';
  const treasurer = officials.find(o => (o.role || '').toLowerCase().includes('bendahara'))?.name || 'Ibu AISYAH';
  const chairmanPhone = officials.find(o => (o.role || '').toLowerCase().includes('ketua'))?.phone || '0859-6119-4621';

  // 1. Greeting / Identity
  if (
    /^(hai|halo|hi|p|tes|assalamualaikum|selamat\s+(pagi|siang|sore|malam))$/.test(q) ||
    q.includes('kamu siapa') ||
    q.includes('bisa apa')
  ) {
    return (
      `Halo warga! Saya **Rit (AI Lokal RT 002)** yang terhubung langsung ke data *real-time* lingkungan kita 😊✨\n\n` +
      `Saat ini tercatat **${totalDoors} pintu kavling** (${occupiedDoors} dihuni, ${totalResidents} jiwa) dan **Saldo Kas RT Rp ${cashBalance.toLocaleString('id-ID')}**.\n\n` +
      `Silakan tanyakan langsung:\n` +
      `- 👮 **Jadwal ronda malam ini** atau malam tertentu\n` +
      `- 💰 **Saldo kas RT & rincian tarif iuran** bulanan\n` +
      `- 🗑️ **Jadwal angkut sampah** & Bank Sampah\n` +
      `- 📋 **Syarat surat pengantar RT** & pengumuman terbaru\n` +
      `- 📞 **Kontak Ketua RT, Sekretaris, Bendahara** & nomor darurat`
    );
  }

  // 2. Specific Block Lookup (e.g. "blok c10", "c5", "jumlah warga")
  const blockMatch = q.match(/\b(c5|c7|c8|c9|c10|c11|c12)\b/i);
  if (blockMatch) {
    const blockCode = blockMatch[1].toUpperCase();
    const blockHouses = houses.filter(h => String(h.block || h.number || '').toUpperCase().startsWith(blockCode));
    const blockOccupied = blockHouses.filter(h => h.status !== 'Empty').length;
    const blockLunas = blockHouses.filter(h => h.paymentStatus === 'Lunas').length;
    return (
      `🏠 **Data Real-Time Kavling Blok ${blockCode} (RT 002):**\n` +
      `- **Total Terdaftar:** ${blockHouses.length} pintu kavling\n` +
      `- **Status Hunian:** ${blockOccupied} pintu dihuni • ${Math.max(0, blockHouses.length - blockOccupied)} kosong\n` +
      `- **Kepatuhan Iuran:** ${blockLunas} pintu berstatus Lunas\n\n` +
      `Anda dapat melihat peta kavling interaktif untuk Blok ${blockCode} di menu **Peta & Bencana**.`
    );
  }

  // 3. Jadwal Ronda Malam Ini / Spesifik Hari
  if (q.includes('ronda') || q.includes('siskamling') || q.includes('jaga malam')) {
    const todayName = DAYS_ID[new Date().getDay()];
    const requestedDay = DAYS_ID.find(d => q.includes(d.toLowerCase())) || todayName;
    const matchedSchedule = ronda.find(r => (r.day || '').toLowerCase().includes(requestedDay.toLowerCase()));

    if (matchedSchedule && Array.isArray(matchedSchedule.members) && matchedSchedule.members.length > 0) {
      return (
        `👮 **Jadwal Ronda Siskamling Hari ${matchedSchedule.day} (Pukul 22.00 – 04.00 WITA):**\n` +
        matchedSchedule.members.map(m => `- **${m}**`).join('\n') +
        `\n\n📍 Titik kumpul di Pos Siskamling RT 002. Bagi warga yang berhalangan hadir tanpa pengganti, berlaku kesepakatan kontribusi bebas ronda **Rp 50.000** ke kas keamanan.`
      );
    }

    if (ronda.length > 0) {
      const summary = ronda
        .slice(0, 7)
        .map(r => `- **${r.day}:** ${Array.isArray(r.members) ? r.members.slice(0, 5).join(', ') : '-'}`)
        .join('\n');
      return (
        `👮 **Daftar Regu Ronda Malam RT 002 (22.00 – 04.00 WITA):**\n${summary}\n\n` +
        `Kontribusi bebas ronda sesuai kesepakatan warga adalah **Rp 50.000**.`
      );
    }

    return (
      `👮 **Jadwal Ronda Malam RT 002:**\n` +
      `Siskamling aktif setiap malam pukul **22.00 – 04.00 WITA** secara bergiliran per blok C5–C12. Kontribusi bebas ronda bagi yang berhalangan adalah **Rp 50.000**. Cek daftar regu lengkapnya di menu **Pusat Info -> Siskamling**.`
    );
  }

  // 4. Kas RT & Iuran Bulanan
  if (q.includes('iuran') || q.includes('bayar') || q.includes('kas') || q.includes('saldo') || q.includes('rekening') || q.includes('qris')) {
    return (
      `💰 **Transparansi Kas & Struktur Iuran RT 002 (Real-Time):**\n` +
      `- **Saldo Kas Bersih Saat Ini:** **Rp ${cashBalance.toLocaleString('id-ID')}** (Pemasukan Rp ${totalIncome.toLocaleString('id-ID')} • Pengeluaran Rp ${totalExpense.toLocaleString('id-ID')})\n` +
      `- **Iuran Kas RT:** Rp 20.000 / bulan\n` +
      `- **Retribusi Sampah:** Rp 20.000 (Warga Umum) • Rp 10.000 (Subsidi PKH) • Rp 35.000 (ASN/PNS)\n` +
      `- **Iuran Air PDAM Swadaya:** Rp 10.000 / bulan\n\n` +
      `📌 **Metode Pembayaran:** Saat ini pembayaran iuran dilakukan **100% Tunai** langsung melalui **Bendahara RT 002 (${treasurer})** karena rekening bank/QRIS kas RT belum dibuka.`
    );
  }

  // 5. Jadwal Sampah & Bank Sampah
  if (q.includes('sampah') || q.includes('angkut') || q.includes('truk') || q.includes('kebersihan')) {
    return (
      `🗑️ **Jadwal Pengangkutan Sampah & Bank Sampah RT 002:**\n` +
      `- **Jadwal Angkut Armada Sampah:** Setiap hari **Selasa & Sabtu** (WITA)\n` +
      `- **Tarif Retribusi Bulanan:** Umum Rp 20.000 • PKH Rp 10.000 • ASN/PNS Rp 35.000\n` +
      `- **Bank Sampah Digital:** Sampah anorganik terpilah (botol plastik, kardus, logam) dapat ditabung di menu **Bank Sampah** untuk dikonversi menjadi saldo tabungan warga!`
    );
  }

  // 6. Pengurus RT & Kontak Darurat
  if (
    q.includes('pengurus') ||
    q.includes('ketua') ||
    q.includes('sekretaris') ||
    q.includes('bendahara') ||
    q.includes('darurat') ||
    q.includes('polisi') ||
    q.includes('damkar') ||
    q.includes('ambulans') ||
    q.includes('kontak') ||
    q.includes('nomor')
  ) {
    return (
      `📞 **Struktur Pengurus Inti RT 002 & Kontak Darurat Kota Palu:**\n` +
      `- **Ketua RT 002:** ${chairman} (WA: ${chairmanPhone})\n` +
      `- **Sekretaris RT 002:** ${secretary}\n` +
      `- **Bendahara RT 002:** ${treasurer}\n` +
      `- **Sekretariat RT:** Jl. Pue Lombe Blok C10-08 Huntap Tondo 2\n\n` +
      `🚨 **Layanan Darurat Kota Palu:**\n` +
      `- **Polisi / Polsek Mantikulore:** 110\n` +
      `- **Damkar Kota Palu:** 113 / (0451) 423113\n` +
      `- **IGD RSUD Undata Palu:** (0451) 421270\n` +
      `- **PLN Gangguan:** 123`
    );
  }

  // 7. Surat Pengantar & Administrasi
  if (q.includes('surat') || q.includes('syarat') || q.includes('pengantar') || q.includes('ktp') || q.includes('kk') || q.includes('domisili')) {
    return (
      `📋 **Layanan Surat Pengantar Digital RT 002:**\n` +
      `- **Syarat Utama:** Nomor NIK/KK terdaftar di sensus warga RT 002 & memilih jenis keperluan surat.\n` +
      `- **Cara Pengajuan:** Buka menu **Layanan Surat**, pilih jenis surat (Domisili, SKTM, Usaha, Pengantar KTP/KK, Kelahiran, Kematian), lalu kirim.\n` +
      `- **Unduh PDF Resmi:** Setelah disetujui Ketua RT (${chairman}), surat PDF ber-QR Code verifikasi dapat langsung diunduh dari HP Anda.`
    );
  }

  // 8. Pengumuman Terbaru & Laporan Warga
  if (q.includes('pengumuman') || q.includes('berita') || q.includes('info terbaru') || q.includes('agenda') || q.includes('kerja bakti')) {
    if (announcements.length > 0) {
      const top = announcements.slice(0, 3).map(a => `- **[${a.date}] ${a.title}:** ${a.content}`).join('\n');
      return `📢 **Pengumuman Resmi Terbaru RT 002:**\n${top}`;
    }
    return `📢 **Pengumuman RT 002:**\nSaat ini belum ada siaran pengumuman darurat baru. Pantau terus jadwal kerja bakti dan agenda musyawarah di menu **Pusat Info**.`;
  }

  // 9. Demografi / Statistik Warga
  if (q.includes('jumlah warga') || q.includes('populasi') || q.includes('berapa rumah') || q.includes('demografi') || q.includes('statistik')) {
    const activeReports = reports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length;
    return (
      `📊 **Statistik Sensus Real-Time RT 002 / RW 020 Huntap Tondo 2:**\n` +
      `- **Total Kavling:** ${totalDoors} Pintu (Blok C5, C7, C8, C9, C10, C11, C12)\n` +
      `- **Kavling Berpenghuni:** ${occupiedDoors} Pintu (${emptyDoors} Kosong)\n` +
      `- **Total Populasi:** ${totalResidents} Jiwa\n` +
      `- **Laporan Warga Aktif:** ${activeReports} laporan`
    );
  }

  // 10. PLN / PDAM / Tukang / Tamu
  if (q.includes('pln') || q.includes('padam') || q.includes('listrik') || q.includes('air') || q.includes('pdam')) {
    return `⚡ **Info Utilitas PLN & Air PDAM Huntap Tondo 2:**\nStatus gangguan listrik PLN atau distribusi air bersih serta pencatatan meteran air dapat dipantau di menu **Pusat Info** atau dilaporkan melalui menu **Layanan Surat -> Lapor Masalah**.`;
  }

  if (q.includes('tukang') || q.includes('jasa') || q.includes('umkm') || q.includes('warung') || q.includes('kuliner')) {
    return `🛠️ **Pasar UMKM & Direktori Jasa Keahlian Warga RT 002:**\nAnda bisa mencari usaha kuliner tetangga, warung sembako, teknisi listrik/AC, hingga tukang bangunan warga Huntap Tondo 2 lengkap dengan tombol order WhatsApp di menu **Pasar UMKM**.`;
  }

  if (q.includes('tamu') || q.includes('menginap')) {
    return `📑 **Wajib Lapor Tamu 1x24 Jam:**\nSetiap tamu kerabat yang menginap lebih dari 24 jam di lingkungan RT 002 wajib dilaporkan secara online melalui menu **Layanan Surat -> Lapor Tamu** demi ketertiban bersama.`;
  }

  // Default contextual response with live stats
  return (
    `Halo! Saya **Rit (AI Lokal RT 002)**. Berdasarkan data *real-time* saat ini:\n` +
    `- 🏠 **Hunian:** ${occupiedDoors} dari ${totalDoors} pintu terisi (${totalResidents} jiwa)\n` +
    `- 💰 **Saldo Kas RT:** Rp ${cashBalance.toLocaleString('id-ID')} (Pembayaran tunai via Bendahara ${treasurer})\n` +
    `- 🗑️ **Jadwal Sampah:** Selasa & Sabtu WITA\n` +
    `- 👮 **Ketua RT 002:** ${chairman} (${chairmanPhone})\n\n` +
    `Ketik kata kunci seperti **"jadwal ronda malam ini"**, **"rincian iuran"**, **"syarat surat"**, atau **"blok C10"** untuk melihat data lengkapnya!`
  );
};

/**
 * Local AI Generator for Official RT Announcements
 */
export const generateLocalAnnouncementDraft = (topic: string, tone: string = 'Formal'): string => {
  const cleanTopic = (topic || 'Kegiatan Lingkungan RT 002').trim();
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (tone.toLowerCase().includes('santai') || tone.toLowerCase().includes('akrab')) {
    return (
      `Halo Bapak/Ibu & Keluarga Besar Warga RT 002 / RW 020 Huntap Tondo 2! 👋😊\n\n` +
      `Menginfokan kepada seluruh warga terkait **${cleanTopic}** yang akan kita laksanakan bersama di lingkungan Blok C5–C12.\n\n` +
      `Yuk kita sukseskan dan jaga terus kekompakan, kebersihan, serta keamanan lingkungan kita. Jika ada pertanyaan atau masukan, silakan hubungi pengurus RT melalui grup WhatsApp atau Sekretariat Blok C10-08 ya!\n\n` +
      `Terima kasih atas kebersamaannya 🙏✨\n` +
      `— *Pengurus RT 002 Huntap Tondo 2 (${dateStr})*`
    );
  }

  if (tone.toLowerCase().includes('darurat') || tone.toLowerCase().includes('penting')) {
    return (
      `🚨 **PENGUMUMAN PENTING KEWASPADAAN WARGA RT 002 / RW 020**\n\n` +
      `Kepada Yth. Seluruh Kepala Keluarga & Warga Blok C5–C12 Huntap Tondo 2,\n\n` +
      `Sehubungan dengan **${cleanTopic}**, kami mengimbau seluruh warga untuk meningkatkan kewaspadaan, memastikan keamanan rumah masing-masing, serta mengikuti arahan koordinasi dari Pengurus RT dan Regu Siskamling.\n\n` +
      `Apabila terjadi kondisi darurat, segera gunakan fitur **Tombol Panik** di aplikasi Teras Warga atau hubungi Ketua RT 002 (Bpk. Irfan Arianto - 0859-6119-4621).\n\n` +
      `Palu, ${dateStr} WITA\n` +
      `Tertanda,\n` +
      `**Ketua & Pengurus RT 002 / RW 020 Huntap Tondo 2**`
    );
  }

  return (
    `📢 **PEMBERITAHUAN RESMI PENGURUS RT 002 / RW 020 HUNTAP TONDO 2**\n\n` +
    `Kepada Yth.\n` +
    `Bapak/Ibu Warga RT 002 / RW 020 (Blok C5 – C12)\n` +
    `di Tempat\n\n` +
    `Dengan hormat,\n` +
    `Melalui maklumat ini, Pengurus RT 002 / RW 020 Kelurahan Tondo menyampaikan informasi terkait **${cleanTopic}**.\n\n` +
    `Kami mengharapkan partisipasi aktif dan kerja sama dari seluruh Kepala Keluarga demi kelancaran, ketertiban, serta kenyamanan bersama di lingkungan Hunian Tetap (Huntap) Tondo 2.\n\n` +
    `Demikian pemberitahuan ini disampaikan. Atas perhatian dan kerja sama Bapak/Ibu warga sekalian, kami ucapkan terima kasih.\n\n` +
    `Palu, ${dateStr} WITA\n` +
    `Hormat kami,\n` +
    `**Ketua RT 002 / RW 020 — Bpk. IRFAN ARIANTO**`
  );
};

/**
 * Local AI Analyzer for Citizen Complaints & Reports
 */
export const analyzeLocalReports = (reports: string[]): string => {
  if (!reports || reports.length === 0) {
    return '✅ **Analisis AI Lokal:** Saat ini tidak ada antrean laporan keluhan warga yang aktif. Kondisi fasilitas umum, kebersihan, dan ketertiban lingkungan RT 002 terpantau kondusif.';
  }

  let infraCount = 0;
  let waterDrainCount = 0;
  let wasteCount = 0;
  let securityCount = 0;
  let otherCount = 0;

  reports.forEach(r => {
    const lower = (r || '').toLowerCase();
    if (/lampu|jalan|aspal|kabel|pohon|fasilitas|tiang/.test(lower)) infraCount++;
    else if (/air|pdam|pipa|got|drainase|selokan|banjir/.test(lower)) waterDrainCount++;
    else if (/sampah|bau|kotor|angkut|kebersihan/.test(lower)) wasteCount++;
    else if (/aman|maling|ronda|parkir|ribut|tamu|anjing|ternak/.test(lower)) securityCount++;
    else otherCount++;
  });

  return [
    `🤖 **RINGKASAN ANALISIS AI LOKAL (${reports.length} Laporan Warga)**`,
    ``,
    `**1. Pemetaan Kategori Keluhan:**`,
    `• Infrastruktur & Penerangan Jalan: **${infraCount} laporan**`,
    `• Air Bersih PDAM & Drainase/Got: **${waterDrainCount} laporan**`,
    `• Persampahan & Kebersihan Lingkungan: **${wasteCount} laporan**`,
    `• Keamanan, Parkir & Ketertiban: **${securityCount} laporan**`,
    `• Administrasi & Lainnya: **${otherCount} laporan**`,
    ``,
    `**2. Rekomendasi Tindak Lanjut Pengurus RT 002:**`,
    waterDrainCount > 0 || wasteCount > 0
      ? `• Jadwalkan inspeksi kebersihan drainase pada kerja bakti terdekat serta koordinasikan pengangkutan sampah hari Selasa & Sabtu WITA.`
      : `• Pertahankan jadwal pemeliharaan rutin fasilitas blok C5–C12.`,
    infraCount > 0
      ? `• Prioritaskan pengecekan titik lampu jalan / fasilitas umum yang dilaporkan warga bersama seksi perlengkapan RT.`
      : '',
    securityCount > 0
      ? `• Arahkan regu ronda Siskamling malam (22.00–04.00 WITA) untuk memantau blok yang melaporkan gangguan ketertiban.`
      : '',
    `• Perbarui status laporan menjadi **"Diproses"** atau **"Selesai"** agar warga pemohon menerima notifikasi transparansi tindak lanjut.`
  ].filter(Boolean).join('\n');
};

/**
 * Local AI Executive Summary for Admin Dashboard Overview
 */
export const generateLocalDashboardSummary = (data: {
  totalResidents: number;
  cashBalance: number;
  reportsCount: number;
  unpaidCount: number;
  babyCount?: number;
  toddlerCount?: number;
  pregnantCount?: number;
  elderlyCount?: number;
  widowCount?: number;
}): string => {
  const vulnerableTotal =
    (data.babyCount || 0) +
    (data.toddlerCount || 0) +
    (data.pregnantCount || 0) +
    (data.elderlyCount || 0);

  return [
    `📊 **ANALISIS EKSEKUTIF AI LOKAL — RT 002 HUNTAP TONDO 2**`,
    ``,
    `• **Kependudukan & Kelompok Rentan:** Tercatat **${data.totalResidents} jiwa** warga aktif, termasuk **${vulnerableTotal} warga prioritas kesehatan/mitigasi** (${data.babyCount || 0} bayi, ${data.toddlerCount || 0} balita, ${data.pregnantCount || 0} ibu hamil, ${data.elderlyCount || 0} lansia).`,
    `• **Kesehatan Kas & Iuran Tunai:** Saldo kas bersih tercatat **Rp ${(data.cashBalance || 0).toLocaleString('id-ID')}**. Terdapat **${data.unpaidCount || 0} rumah** yang perlu diingatkan secara ramah untuk penyetoran iuran tunai bulanan melalui Bendahara RT.`,
    `• **Responsivitas Layanan Warga:** Terdapat **${data.reportsCount || 0} aduan aktif**. Pastikan permohonan surat pengantar dan aduan warga diverifikasi dalam SLA < 24 jam.`
  ].join('\n');
};
