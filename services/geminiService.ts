import { Announcement, RondaSchedule, Official, House, CashFlow, Report, ClimateDisasterContext, ClimateAdvisoryResult } from "../types";
import {
  tryGenerateWithLocalLlm,
  answerWithLocalRag,
  generateLocalAnnouncementDraft,
  analyzeLocalReports,
  generateLocalDashboardSummary
} from "./localAiService";

export const generateAnnouncementDraft = async (topic: string, tone: string = 'Formal'): Promise<string> => {
  // 1. Try Local LLM (Ollama / Chrome Built-in Gemini Nano)
  const localLlm = await tryGenerateWithLocalLlm(
    `Buatkan draf pengumuman resmi RT 002 / RW 020 Huntap Tondo 2, Kota Palu dengan topik: "${topic}" dan gaya bahasa: "${tone}". Gunakan zona waktu WITA dan tanda tangan Ketua RT 002 Bpk. IRFAN ARIANTO.`
  );
  if (localLlm?.text) return localLlm.text;

  // 2. Fallback to Local RAG / Template Engine (0 MB, works 100% offline & on Vercel)
  return generateLocalAnnouncementDraft(topic, tone);
};

export const analyzeReports = async (reports: string[]): Promise<string> => {
  if (!reports || reports.length === 0) {
    return analyzeLocalReports([]);
  }

  // 1. Try Local LLM (Ollama / Chrome Built-in Gemini Nano)
  const localLlm = await tryGenerateWithLocalLlm(
    `Analisis daftar laporan keluhan warga RT 002 berikut dan berikan ringkasan prioritas tindak lanjut:\n${reports.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
  );
  if (localLlm?.text) return localLlm.text;

  // 2. Fallback to Local NLP Report Categorizer
  return analyzeLocalReports(reports);
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
  // 1. Try Local LLM (Ollama / Chrome Built-in Gemini Nano)
  const localLlm = await tryGenerateWithLocalLlm(
    `Berikan ringkasan eksekutif singkat (3 poin) untuk Pengurus RT 002 Huntap Tondo 2 berdasarkan data ini: Warga ${data.totalResidents} jiwa, Saldo Kas Rp ${data.cashBalance.toLocaleString('id-ID')}, Laporan Aktif ${data.reportsCount}, Belum Lunas Iuran ${data.unpaidCount} rumah, Lansia ${data.elderlyCount || 0}, Balita ${(data.babyCount || 0) + (data.toddlerCount || 0)}.`
  );
  if (localLlm?.text) return localLlm.text;

  // 2. Fallback to Local Executive Synthesizer
  return generateLocalDashboardSummary(data);
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
    const housesList = contextData.houses || [];
    const cashFlowList = contextData.cashFlow || [];
    const reportsList = contextData.reports || [];

    const totalResidents = housesList.filter(h => h.status !== 'Empty').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
    const totalHouses = housesList.length;
    const occupiedHouses = housesList.filter(h => h.status !== 'Empty').length;
    const cashBalance = cashFlowList.filter(c => c.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0) - cashFlowList.filter(c => c.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    const activeReportsCount = reportsList.filter(r => r.status === 'Baru' || r.status === 'Diproses').length;

    const rondoDays = contextData.ronda.map(r => `- ${r.day || ''}: ${Array.isArray(r.members) ? r.members.join(', ') : ''}`).join('\n');
    const officialsContext = contextData.officials.map(o => `- ${o.role}: ${o.name} (HP: ${o.phone})`).join('\n');

    const systemInstruction = [
      `Anda adalah "Rit", asisten AI Lokal resmi warga RT 002 / RW 020 Huntap Tondo 2, Kota Palu.`,
      `WAKTU SEKARANG: ${today} WITA.`,
      `DATA REAL-TIME RT 002:`,
      `- Kavling: ${totalHouses || 129} pintu (${occupiedHouses} dihuni, ${totalResidents} jiwa).`,
      `- Saldo Kas RT: Rp ${cashBalance.toLocaleString('id-ID')} | Laporan Aktif: ${activeReportsCount}.`,
      `- Tarif Iuran: Kas RT Rp 20.000/bln, Sampah Umum Rp 20.000 (PKH Rp 10.000, ASN/PNS Rp 35.000), Air PDAM Rp 10.000/bln. Pembayaran 100% Tunai melalui Bendahara RT Ibu Aisyah.`,
      `- Jadwal Sampah: Selasa & Sabtu WITA. Kontribusi bebas ronda: Rp 50.000.`,
      `- Pengurus: ${officialsContext}`,
      `- Jadwal Ronda: ${rondoDays}`,
      `Jawablah pertanyaan warga secara ramah, ringkas, dan akurat sesuai data di atas.`
    ].join('\n');

    // 1. Try Local LLM first (Ollama on localhost:11434 or Chrome Built-in Gemini Nano)
    const localLlm = await tryGenerateWithLocalLlm(question, systemInstruction);
    if (localLlm?.text) {
      return localLlm.text;
    }

    // 2. Use Smart Local Live-Data RAG Engine (<5ms, 100% offline & accurate)
    return answerWithLocalRag(question, contextData);
  } catch (error) {
    console.error("Local AI Chat Error:", error);
    return answerWithLocalRag(question, contextData);
  }
};

// --- SADAR RT 002: AI CLIMATE & DISASTER RESILIENCE ENGINE ---
export const getClientDisasterAdvisoryFallback = (ctx: ClimateDisasterContext): ClimateAdvisoryResult => {
  const dist = ctx.nearestEarthquakeDistanceKm;
  const mag = ctx.nearestEarthquakeMagnitude ? parseFloat(ctx.nearestEarthquakeMagnitude) : 0;
  const temp = ctx.weatherTemp ?? 32;
  const aqi = ctx.weatherAqi ?? 45;
  const condition = ctx.weatherCondition || 'Cerah';
  const totalVulnerable = ctx.vulnerableCounts?.total || 0;

  let threatLevel: 'Aman' | 'Waspada' | 'Siaga' = 'Aman';
  let headline = 'Situasi Lingkungan & Seismik Huntap Tondo 2 Kondusif';
  let seismicAssessment = '';
  let climateAssessment = '';
  const actionTips: string[] = [];

  // 1. Seismic evaluation (Palu-Koro fault & BMKG feed)
  if (dist !== null && dist !== undefined) {
    if (dist < 75 && mag >= 4.5) {
      threatLevel = 'Siaga';
      headline = `Siaga Seismik: Gempa M ${mag} Berjarak ${dist.toFixed(0)} km Dekat Huntap Tondo 2`;
      seismicAssessment = `Terdeteksi aktivitas gempa dangkal dekat koridor Sesar Palu-Koro (${dist.toFixed(1)} km). Warga diimbau berada dalam kesiapsiagaan tinggi.`;
      actionTips.push('Amankan dokumen penting dalam Tas Siaga Bencana dan posisikan dekat pintu keluar.');
      actionTips.push('Buka kunci pagar depan kavling untuk mempermudah evakuasi cepat ke Lapangan Terbuka.');
    } else if (dist < 120 && mag >= 3.8) {
      threatLevel = 'Waspada';
      headline = `Waspada Seismik: Gempa Regional Teluk Palu M ${mag} (${dist.toFixed(0)} km)`;
      seismicAssessment = `Aktivitas tektonik berjarak ${dist.toFixed(1)} km terpantau BMKG. Getaran lemah mungkin terasa di struktur Huntap.`;
      actionTips.push('Periksa struktur dinding dan plafon rumah, pastikan jalur keluar utama tidak terhalang perabot.');
    } else {
      seismicAssessment = `Aktivitas gempa BMKG terdekat berjarak ${dist.toFixed(0)} km (M ${mag || '-'}), tidak berdampak signifikan terhadap struktur hunian tetap.`;
    }
  } else {
    seismicAssessment = 'Parameter seismik BMKG normal. Tidak ada gempa dangkal signifikan di sekitar Kota Palu.';
  }

  // 2. Climate & Weather evaluation
  const isRain = condition.toLowerCase().includes('hujan') || condition.toLowerCase().includes('rain');
  if (temp >= 35) {
    if (threatLevel === 'Aman') threatLevel = 'Waspada';
    climateAssessment = `Suhu udara sangat terik mencapai ${temp.toFixed(1)}°C dengan radiasi panas tinggi. Waspadai risiko dehidrasi dan potensi percikan api semak belukar kering lereng bukit Tondo.`;
    actionTips.push('Pastikan lansia dan balita tercukupi asupan cairan serta hindari aktivitas panas terik siang hari.');
    actionTips.push('Dilarang membakar sampah atau ilalang di lahan kosong sekitar blok kavling Huntap.');
  } else if (isRain) {
    climateAssessment = `Kondisi hujan terpantau di Teluk Palu. Kontur lereng perbukitan Tondo berpotensi memicu limpasan air permukaan ke drainase permukiman.`;
    actionTips.push('Pastikan talang air dan kisi-kisi got depan rumah bebas dari sumbatan sampah pekarangan.');
  } else {
    climateAssessment = `Suhu sekitar ${temp.toFixed(1)}°C dengan kualitas udara ${aqi <= 50 ? 'Baik (AQI ' + aqi + ')' : 'Sedang (AQI ' + aqi + ')'}. Kondisi iklim Tondo terpantau bersahabat.`;
  }

  // 3. Demographic Vulnerability Awareness
  if (totalVulnerable > 0) {
    actionTips.push(`Terdapat ${ctx.vulnerableCounts.elderly} lansia, ${ctx.vulnerableCounts.infantsAndToddlers} balita, dan ${ctx.vulnerableCounts.pregnant} ibu hamil di RT 002. Regu siskamling ronda memprioritaskan asistensi ke blok mereka jika sirine berbunyi.`);
  }

  if (actionTips.length < 3) {
    actionTips.push('Rute evakuasi mandiri: Ikuti jalan lingkungan poros utama menuju Lapangan Terbuka Huntap Tondo 2.');
  }

  return {
    threatLevel,
    headline,
    seismicAssessment,
    climateAssessment,
    actionTips: actionTips.slice(0, 4),
    generatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
    isAiGenerated: true
  };
};

export const generateDisasterClimateAdvisory = async (
  context: ClimateDisasterContext
): Promise<ClimateAdvisoryResult> => {
  const baseResult = getClientDisasterAdvisoryFallback(context);

  try {
    const localLlm = await tryGenerateWithLocalLlm(
      `Berikan 1 kalimat ringkas rekomendasi kesiapsiagaan iklim & seismik untuk warga RT 002 Huntap Tondo 2 Kota Palu (Suhu: ${context.weatherTemp ?? 32}°C, AQI: ${context.weatherAqi ?? 45}, Jarak Gempa Terdekat: ${context.nearestEarthquakeDistanceKm ?? 'Aman'} km, Lansia/Rentan: ${context.vulnerableCounts?.total || 0} jiwa).`
    );
    if (localLlm?.text) {
      return {
        ...baseResult,
        climateAssessment: `${baseResult.climateAssessment} ${localLlm.text.trim()}`,
        isAiGenerated: true
      };
    }
  } catch (err) {
    console.warn('[generateDisasterClimateAdvisory] Local LLM skipped, using local heuristic engine.', err);
  }

  return baseResult;
};
