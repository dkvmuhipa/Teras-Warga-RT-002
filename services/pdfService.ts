
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import QRCode from "qrcode";
import { toast } from "sonner";
import { LetterRequest, PdfConfig, House, PaymentStatus, Report, PopulationReport, OfficialLetter, CashFlow } from "../types";
import { DEFAULT_PDF_CONFIG } from "../constants";
import { isMonthMatch, getIndonesianMonthYear } from "../src/utils/dateUtils";
import { naturalSortBlockAndNumber } from "./excelService";

// Override jsPDF setFont prototype to replace "times" with "helvetica" for a clean, modern look
const originalSetFont = jsPDF.prototype.setFont;
jsPDF.prototype.setFont = function (this: any, fontName: string, fontStyle?: string, ...args: any[]) {
    const resolvedFont = fontName === "times" ? "helvetica" : fontName;
    return originalSetFont.call(this, resolvedFont, fontStyle, ...args);
};

// ... (existing helper functions) ...

export const generatePopulationReportPDF = async (report: PopulationReport, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // --- Professional Header (Kop Surat) ---
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    if (logoData) {
        doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
    }

    doc.setFont("times", "normal"); 
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
    doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
    doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
    doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

    doc.setLineWidth(1.0);
    doc.line(20, 42, 190, 42);
    doc.setLineWidth(0.3);
    doc.line(20, 43, 190, 43);

    // --- Title ---
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN KEPENDUDUKAN BULANAN", centerX, 52, { align: "center" });
    const titleWidth = doc.getTextWidth("LAPORAN KEPENDUDUKAN BULANAN");
    doc.line(centerX - (titleWidth / 2), 53, centerX + (titleWidth / 2), 53);
    
    doc.setFont("times", "normal");
    doc.text(`Periode: ${report.month} ${report.year}`, centerX, 58, { align: "center" });

    // Add Page Numbers
    const addPageNumbers = (pdf: jsPDF) => {
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(8);
            pdf.setFont("times", "italic");
            pdf.setTextColor(150);
            pdf.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
            pdf.text(`Dicetak otomatis melalui Sistem Teras Warga pada ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10);
        }
    };

    let y = 70;
    const rowHeight = 8;

    // --- Summary Blocks (Highlights) ---
    const drawSummaryCard = (label: string, value: string | number, x: number, width: number, bgColor: [number, number, number], textColor: [number, number, number] = [255, 255, 255]) => {
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(x, y, width, 25, 2, 2, 'F');
        doc.setFont("times", "normal");
        doc.setFontSize(9);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(label, x + (width / 2), y + 8, { align: "center" });
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text(value.toString(), x + (width / 2), y + 18, { align: "center" });
        doc.setTextColor(0);
    };

    const cardWidth = (contentWidth - 10) / 3;
    const finalPop = report.initialPopulation + report.birthCount + report.newcomerCount - report.movedOutCount - (report.deathCount || 0);
    
    drawSummaryCard("PENDUDUK AWAL", report.initialPopulation, margin, cardWidth, [71, 85, 105]);
    drawSummaryCard("MUTASI (NET)", (report.birthCount + report.newcomerCount - report.movedOutCount - (report.deathCount || 0)), margin + cardWidth + 5, cardWidth, [100, 116, 139]);
    drawSummaryCard("TOTAL AKHIR", finalPop, margin + (cardWidth * 2) + 10, cardWidth, [79, 70, 229]);
    
    y += 35;

    // --- Section 1: Mutasi Penduduk ---
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 8, 'F');
    doc.setTextColor(255);
    doc.text("I. DATA MUTASI PENDUDUK", margin + 2, y);
    doc.setTextColor(0);
    y += 10;

    const addStatRow = (label: string, value: string | number, isBold = false, color?: [number, number, number], bg?: boolean) => {
        if (bg) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 5, contentWidth, rowHeight, 'F');
        }
        doc.setFont("times", isBold ? "bold" : "normal");
        doc.setFontSize(10);
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, margin + 5, y);
        doc.text(value.toString(), pageWidth - margin - 5, y, { align: "right" });
        doc.setTextColor(0);
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += rowHeight;
    };

    addStatRow("1. Penduduk Awal Bulan", report.initialPopulation, false, undefined, true);
    addStatRow("2. Kelahiran (+)", `+ ${report.birthCount}`, false, [16, 185, 129]);
    addStatRow("3. Kematian (-)", `- ${report.deathCount || 0}`, false, [239, 68, 68], true);
    addStatRow("4. Pendatang (+)", `+ ${report.newcomerCount}`, false, [37, 99, 235]);
    addStatRow("5. Pindah Keluar (-)", `- ${report.movedOutCount}`, false, [245, 158, 11], true);
    
    addStatRow("TOTAL PENDUDUK AKHIR", finalPop, true, [79, 70, 229]);

    y += 8;

    // --- Section 2: Kelompok Rentan ---
    if (y > pageHeight - 60) { doc.addPage(); y = 30; }
    doc.setFont("times", "bold");
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 8, 'F');
    doc.setTextColor(255);
    doc.text("II. DATA KELOMPOK RENTAN & UMUR", margin + 2, y);
    doc.setTextColor(0);
    y += 10;

    const stats = [
        { l: "1. Ibu Hamil", v: report.pregnantCount || 0 },
        { l: "2. Bayi (0-12 bln)", v: report.babyCount || 0 },
        { l: "3. Balita (1-5 thn)", v: report.toddlerCount || 0 },
        { l: "4. Anak-anak", v: report.childCount || 0 },
        { l: "5. Remaja", v: report.teenagerCount || 0 },
        { l: "6. Dewasa", v: report.adultCount || 0 },
        { l: "7. Lansia", v: report.elderlyCount || 0 },
        { l: "8. Janda/Duda", v: report.widowCount || 0 },
        { l: "9. Penyandang Disabilitas", v: report.disabilityCount || 0 },
        { l: "10. Anak Yatim/Piatu", v: report.orphanCount || 0 }
    ];

    stats.forEach((s, i) => addStatRow(s.l, s.v, false, undefined, i % 2 === 0));

    y += 8;

    // --- Section 3: Data Musiman ---
    if (y > pageHeight - 60) { doc.addPage(); y = 30; }
    doc.setFont("times", "bold");
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 8, 'F');
    doc.setTextColor(255);
    doc.text("III. DATA WARGA MUSIMAN (KONTRAK/KOST)", margin + 2, y);
    doc.setTextColor(0);
    y += 10;

    addStatRow("1. Total Warga Musiman", report.seasonalCount || 0, true, undefined, true);
    addStatRow("- Laki-laki (Musiman)", report.seasonalMaleCount || 0);
    addStatRow("- Perempuan (Musiman)", report.seasonalFemaleCount || 0, false, undefined, true);

    y += 10;
    if (y > pageHeight - 50) {
        doc.addPage();
        y = 30;
    }

    const signX = pageWidth - 60;
    doc.setFontSize(11);
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    
    const signSpaceY = y + 2;
    y += 25;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 25, y + 1, signX + 25, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    addPageNumbers(doc);
    doc.save(`Laporan_Penduduk_${report.month}_${report.year}.pdf`);
};

// --- Shared Helper Functions ---
// Fungsi universal untuk mengambil ID file dari berbagai format link Google Drive
export const getDriveId = (url: string): string | null => {
  if (!url) return null;
  const driveRegex = /\/d\/([a-zA-Z0-9_-]+)|\?id=([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  return match ? (match[1] || match[2]) : null;
};

export const convertToDirectLink = (url: string): string => {
  const id = getDriveId(url);
  if (id) {
    // URL untuk direct image stream (cocok untuk jspdf/img src)
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }
  return url;
};

// URL untuk thumbnail/preview (lebih ringan dan cepat untuk UI)
export const getDriveThumbnail = (url: string, width: number = 800): string => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
  }
  return url;
};

const getImageData = (source: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!source) { resolve(''); return; }
    if (source.startsWith('data:image')) { resolve(source); return; }
    const directUrl = convertToDirectLink(source);
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      // Optimize image size: Max 800px for logos/stamps to reduce PDF size
      const MAX_DIM = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = (height / width) * MAX_DIM;
          width = MAX_DIM;
        } else {
          width = (width / height) * MAX_DIM;
          height = MAX_DIM;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          try {
            ctx.drawImage(img, 0, 0, width, height);
            // Use JPEG for non-transparent or PNG with compression if needed
            // For stamps/logos we usually want PNG for transparency, but we can use a lower bit depth or just the resized version
            resolve(canvas.toDataURL('image/png')); 
          } catch (e) { resolve(''); }
      } else { resolve(''); }
    };
    img.onerror = () => { resolve(''); };
    img.src = directUrl.includes('?') ? `${directUrl}&t=${Date.now()}` : `${directUrl}?t=${Date.now()}`;
  });
};

export const generateSuratPengantar = async (letter: LetterRequest, customConfig?: PdfConfig, isDraft: boolean = true) => {
  try {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true // Enable PDF compression
    });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - (marginX * 2);
  const centerX = pageWidth / 2;

  if (isDraft) {
      doc.saveGraphicsState();
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      doc.text("DRAFT / MENUNGGU VALIDASI", centerX, pageHeight / 2, { align: "center", angle: 45 });
      doc.restoreGraphicsState();
      doc.setTextColor(0, 0, 0);
  }

  let logoDrawn = false;
  try {
    const logoData = await getImageData(config.logo);
    if (logoData) {
      doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
      logoDrawn = true;
    }
  } catch (e) { console.error(e); }

  if (!logoDrawn) {
     const lx = 30; const ly = 22;
     doc.setDrawColor(0); doc.setLineWidth(0.5);
     doc.lines([[10,0], [0,12], [-10,0], [0,-12]], lx, ly - 6, [1,1], 'S', true);
  }

  doc.setFont("times", "normal"); 
  doc.setFontSize(14);
  doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
  doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
  doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
  doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

  doc.setLineWidth(1.0);
  doc.line(20, 42, 190, 42);
  doc.setLineWidth(0.3);
  doc.line(20, 43, 190, 43);

  const title = letter.type === 'Surat Izin Keramaian' ? "SURAT IZIN KERAMAIAN" : "SURAT PENGANTAR";
  
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text(title, centerX, 52, { align: "center" });
  const textWidth = doc.getTextWidth(title);
  doc.line(centerX - (textWidth / 2), 53, centerX + (textWidth / 2), 53);
  
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const nomorSurat = letter.letterNumber || `.../RT. 02/RW. 020/${currentMonthRoman}/${currentYear}`;
  doc.text(`Nomor : ${nomorSurat}`, centerX, 57, { align: "center" });

  let cursorY = 66;
  const lineHeight = 6;

  const introText = config.introText || `Yang bertanda tangan di bawah ini Ketua ${config.rtName}, Kel. ${config.kelurahan || 'Tondo'}, Kec. ${config.kecamatan || 'Mantikulore'}, Kota ${config.kota || 'Palu'}, Provinsi Sulawesi Tengah menerangkan dengan sebenarnya bahwa :`;
  doc.text(introText, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });
  cursorY += 12;

  const labelX = 28;
  const colonX = 72;
  const valueX = 75;

  const fieldDefinitions = [
      { id: 'applicantName', label: config.fieldLabels?.applicantName || "Nama Lengkap", value: letter.applicantName.toUpperCase() },
      { id: 'nik', label: config.fieldLabels?.nik || "NIK / No KTP", value: letter.nik },
      { id: 'familyHeadName', label: config.fieldLabels?.familyHeadName || "Kepala Keluarga", value: letter.familyHeadName.toUpperCase() },
      { id: 'birthPlaceDate', label: config.fieldLabels?.birthPlaceDate || "Tempat/Tanggal Lahir", value: `${letter.birthPlace.toUpperCase()}, ${letter.birthDate.split('-').reverse().join('-')}` },
      { id: 'gender', label: config.fieldLabels?.gender || "Jenis Kelamin", value: letter.gender },
      { id: 'addressKtp', label: config.fieldLabels?.addressKtp || "Alamat Sesuai KTP", value: letter.addressKtp }, 
      { id: 'currentAddress', label: config.fieldLabels?.currentAddress || "Alamat Domisili", value: letter.currentAddress || letter.addressKtp }, 
      { id: 'religion', label: config.fieldLabels?.religion || "Agama", value: letter.religion },
      { id: 'maritalStatus', label: config.fieldLabels?.maritalStatus || "Status", value: letter.maritalStatus },
      { id: 'job', label: config.fieldLabels?.job || "Pekerjaan", value: letter.job },
      { id: 'education', label: config.fieldLabels?.education || "Pendidikan", value: letter.education || "-" },
      { id: 'familyStatus', label: config.fieldLabels?.familyStatus || "Hub. Keluarga", value: letter.familyStatus || "-" },
      { id: 'bloodType', label: config.fieldLabels?.bloodType || "Gol. Darah", value: letter.bloodType || "-" },
      { id: 'nationality', label: config.fieldLabels?.nationality || "Kewarganegaraan", value: letter.nationality || "Indonesia" },
      { id: 'purposeDetail', label: config.fieldLabels?.purposeDetail || "Keperluan", value: letter.purposeDetail || letter.type } 
  ];

  const fields = fieldDefinitions.filter(f => config.visibleFields ? config.visibleFields[f.id] !== false : true);

  fields.forEach((field, index) => {
      const num = `${index + 1}.`;
      doc.text(num, marginX, cursorY);
      doc.text(field.label, labelX, cursorY);
      doc.text(":", colonX, cursorY);
      
      const splitValue = doc.splitTextToSize(field.value, contentWidth - 55);
      doc.text(splitValue, valueX, cursorY);
      
      cursorY += (lineHeight * splitValue.length); 
      if(splitValue.length > 1) cursorY += 2;
  });

  cursorY += 4;

  const confirmationText = `Orang tersebut adalah benar-benar warga ${config.rtName}, Kel. ${config.kelurahan || 'Tondo'}, Kec. ${config.kecamatan || 'Mantikulore'}, Kota ${config.kota || 'Palu'} dengan data seperti di atas.`;
  doc.text(confirmationText, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });
  
  cursorY += 10;
  const closingText = config.closingText || "Demikian surat keterangan ini dibuat, untuk dipergunakan sebagaimana mestinya.";
  doc.text(closingText, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });

  // Digital Verification Footer for Official Letters
  if (!isDraft) {
    const footerY = pageHeight - 40;
    doc.setDrawColor(200);
    doc.setLineWidth(0.2);
    doc.line(marginX, footerY, pageWidth - marginX, footerY);
    
    // Real QR Code generation
    const qrSize = 22;
    const qrX = marginX;
    const qrY = footerY + 6;

    try {
      const baseUrl = 'https://terasrt02.vercel.app';
      const verificationUrl = `${baseUrl}/#/verify/${letter.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { 
        margin: 1,
        width: 200,
        color: {
          dark: '#1e293b', // Slate-800
          light: '#f8fafc' // Slate-50
        }
      });
      doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch (qrError) {
      console.error("Failed to generate QR Code:", qrError);
      // Fallback to a simple box if QR fails
      doc.setDrawColor(220, 220, 220);
      doc.rect(qrX, qrY, qrSize, qrSize, 'S');
    }

    const infoX = qrX + qrSize + 6;
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text("SISTEM OTENTIKASI DOKUMEN DIGITAL (SODD)", infoX, footerY + 10);
    
    doc.setFont("times", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`ID Otentikasi : ${letter.id.toUpperCase()}`, infoX, footerY + 14);
    doc.text(`Kode Rumah    : ${letter.houseId}`, infoX, footerY + 17.5);
    doc.text(`Waktu Terbit  : ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WITA`, infoX, footerY + 21);
    
    doc.setFont("times", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184); // Slate-400
    const disclaimer = "Dokumen ini diterbitkan secara elektronik melalui Sistem Teras Warga dan merupakan dokumen sah yang tidak memerlukan tanda tangan basah. Keaslian dokumen dapat diverifikasi melalui pemindaian QR Code di atas atau melalui portal resmi layanan warga.";
    const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth - qrSize - 10);
    doc.text(splitDisclaimer, infoX, footerY + 26);
    
    doc.setTextColor(0);
  }

  cursorY += 15;
  const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const leftSignX = 50;
  doc.setFontSize(11); // Perbaiki ukuran font
  doc.text("Pemohon", leftSignX, cursorY, { align: "center" });

  const rightSignX = 150;
  doc.text(`Palu, ${dateString}`, rightSignX, cursorY, { align: "center" });
  cursorY += 6;
  doc.text(`Ketua ${config.rtName}`, rightSignX, cursorY, { align: "center" });

  const signSpaceY = cursorY + 2; 
  cursorY += 25; 

  doc.text(letter.applicantName, leftSignX, cursorY, { align: "center" });
  doc.text(config.rtChairman, rightSignX, cursorY, { align: "center" });

  if (!isDraft) {
      if (config.signature) {
          try {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', rightSignX - 15, signSpaceY, 30, 20);
          } catch(e) {}
      }

      if (config.stamp) {
          try {
             const stampImg = await getImageData(config.stamp);
             // Ukuran stempel diperkecil lagi (20x20) dan posisi disesuaikan
             if (stampImg) doc.addImage(stampImg, 'PNG', rightSignX - 25, signSpaceY - 2, 25, 25);
          } catch(e) {}
      }
  }

  const filenamePrefix = isDraft ? "DRAFT_" : "RESMI_";
  const safeApplicantName = letter.applicantName.replace(/[^a-z0-9]/gi, '_');
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_');
  doc.save(`${filenamePrefix}Surat_${safeTitle}_${safeApplicantName}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    toast.error("Gagal membuat PDF: " + (error instanceof Error ? error.message : "Unknown error"));
  }
};

export const generateOfficialLetterPDF = async (letter: OfficialLetter, customConfig?: PdfConfig) => {
  try {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 25;
    const contentWidth = pageWidth - (marginX * 2);
    const centerX = pageWidth / 2;

    // --- Watermark for Draft ---
    if (letter.status === 'Draft') {
      doc.saveGraphicsState();
      doc.setTextColor(235, 235, 235);
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      doc.text("DRAFT / KONSEP", centerX, pageHeight / 2, { align: "center", angle: 45 });
      doc.restoreGraphicsState();
      doc.setTextColor(0, 0, 0);
    }

    // --- Professional Header (Kop Surat) ---
    let logoDrawn = false;
    try {
      const logoData = await getImageData(config.logo);
      if (logoData) {
        doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
        logoDrawn = true;
      }
    } catch (e) { console.error(e); }

    doc.setFont("times", "bold"); 
    doc.setFontSize(14);
    doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
    doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
    doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
    doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

    doc.setLineWidth(1.0);
    doc.line(20, 42, 190, 42);
    doc.setLineWidth(0.3);
    doc.line(20, 43, 190, 43);

    // --- Date (Top Right) ---
    let cursorY = 55;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const dateStr = new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Palu, ${dateStr}`, pageWidth - marginX, cursorY, { align: "right" });
    cursorY += 10;

    // --- Metadata (Nomor, Lampiran, Perihal) ---
    const labelX = marginX;
    const colonX = marginX + 25;
    const valueX = marginX + 28;

    const drawMetaRow = (label: string, value: string, isBoldValue = false) => {
      doc.setFont("times", "normal");
      doc.text(label, labelX, cursorY);
      doc.text(":", colonX, cursorY);
      if (isBoldValue) doc.setFont("times", "bold");
      doc.text(value, valueX, cursorY);
      doc.setFont("times", "normal");
      cursorY += 6;
    };

    drawMetaRow("Nomor", letter.letterNumber);
    drawMetaRow("Lampiran", "-");
    drawMetaRow("Perihal", letter.subject.toUpperCase(), true);
    cursorY += 6;

    // --- Recipient ---
    doc.text("Kepada Yth,", marginX, cursorY);
    cursorY += 6;
    doc.setFont("times", "bold");
    doc.text(letter.recipient, marginX, cursorY);
    doc.setFont("times", "normal");
    cursorY += 6;
    doc.text("di -", marginX, cursorY);
    cursorY += 6;
    doc.text("   Tempat", marginX, cursorY);
    cursorY += 15;

    // --- Content ---
    doc.text("Dengan hormat,", marginX, cursorY);
    cursorY += 10;

    const renderJustifiedText = (text: string, x: number, y: number, width: number) => {
      // Simple HTML to text conversion for PDF
      // Replace <p> and <br> with newlines, then strip all other tags
      const cleanText = text
        .replace(/<\/p>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li>/gi, '• ')
        .replace(/<\/li>/gi, '\n')
        .replace(/<[^>]+>/g, '');

      // Decode HTML entities
      const decodedText = cleanText
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      const paragraphs = decodedText.split('\n');
      let currentY = y;
      const bottomMargin = 45; // Leave space for footer/SODD
      
      paragraphs.forEach(para => {
        const trimmedPara = para.trim();
        if (!trimmedPara) {
          currentY += 5;
          return;
        }
        
        const lines = doc.splitTextToSize(trimmedPara, width);
        lines.forEach((line: string, index: number) => {
          // Check for page break
          if (currentY > pageHeight - bottomMargin) {
            doc.addPage();
            currentY = 25; // Top margin for subsequent pages
            
            // Re-apply watermark if it's a draft
            if (letter.status === 'Draft') {
              doc.saveGraphicsState();
              doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
              doc.setTextColor(200, 200, 200);
              doc.setFontSize(50);
              doc.setFont("helvetica", "bold");
              doc.text("DRAFT / KONSEP", centerX, pageHeight / 2, { align: "center", angle: 45 });
              doc.restoreGraphicsState();
              doc.setTextColor(0, 0, 0);
            }
          }

          const isLastLine = index === lines.length - 1;
          doc.text(line, x, currentY, { 
            align: isLastLine ? "left" : "justify",
            maxWidth: width
          });
          currentY += 6.5;
        });
        currentY += 2;
      });
      
      return currentY;
    };

    cursorY = renderJustifiedText(letter.content, marginX, cursorY, contentWidth);
    cursorY += 5;

    // Closing
    const closingText = "Demikian surat ini kami sampaikan, atas perhatian dan kerjasamanya kami ucapkan terima kasih.";
    cursorY = renderJustifiedText(closingText, marginX, cursorY, contentWidth);
    cursorY += 15;

    // --- Signature Section ---
    // If signature doesn't fit on the current page, move to next
    if (cursorY > pageHeight - 65) {
      doc.addPage();
      cursorY = 25;
    }

    const signX = pageWidth - 65;
    doc.setFont("times", "normal");
    doc.text(`Ketua ${config.rtName}`, signX, cursorY, { align: "center" });
    
    const signSpaceY = cursorY + 5;
    cursorY += 30;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, cursorY, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), cursorY + 1, signX + (chairmanWidth / 2), cursorY + 1);

    // Add Stamp and Signature
    if (letter.status === 'Published') {
      try {
        if (config.signature) {
          const signImg = await getImageData(config.signature);
          if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY, 30, 20);
        }
        if (config.stamp) {
          const stampImg = await getImageData(config.stamp);
          if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY - 5, 25, 25);
        }
      } catch (e) {}

      // Digital Verification Footer (SODD) - Same as Surat Pengantar
      const footerY = pageHeight - 40;
      doc.setDrawColor(200);
      doc.setLineWidth(0.2);
      doc.line(marginX, footerY, pageWidth - marginX, footerY);
      
      const qrSize = 22;
      const qrX = marginX;
      const qrY = footerY + 6;

      try {
        const baseUrl = window.location.origin;
        const verificationUrl = `${baseUrl}/#/verify-official/${letter.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { 
          margin: 1,
          width: 200,
          color: { dark: '#1e293b', light: '#f8fafc' }
        });
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (e) {}

      const infoX = qrX + qrSize + 6;
      doc.setFont("times", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("SISTEM OTENTIKASI DOKUMEN DIGITAL (SODD)", infoX, footerY + 10);
      
      doc.setFont("times", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID Otentikasi : ${letter.id.toUpperCase()}`, infoX, footerY + 14);
      doc.text(`Jenis Surat    : ${letter.type.toUpperCase()}`, infoX, footerY + 17.5);
      doc.text(`Waktu Terbit  : ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WITA`, infoX, footerY + 21);
      
      doc.setFont("times", "italic");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      const disclaimer = "Dokumen ini diterbitkan secara elektronik melalui Sistem Teras Warga dan merupakan dokumen sah yang tidak memerlukan tanda tangan basah. Keaslian dokumen dapat diverifikasi melalui pemindaian QR Code di atas.";
      const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth - qrSize - 10);
      doc.text(splitDisclaimer, infoX, footerY + 26);
      
      doc.setTextColor(0);
    }

    doc.save(`Surat_${letter.type}_${letter.letterNumber.replace(/\//g, '-')}.pdf`);
  } catch (error) {
    console.error("Official PDF Generation Error:", error);
    toast.error("Gagal membuat PDF: " + (error instanceof Error ? error.message : "Unknown error"));
  }
};

export const generateReportReceiptPDF = async (report: Report, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a5",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const margin = 10;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    // Header / Kop Surat Mini
    if (logoData) {
        doc.addImage(logoData, 'PNG', 10, 10, 15, 20);
    }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`PENGURUS ${config.rtName}`, centerX + 5, 15, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("times", "normal");
    const addressLines = doc.splitTextToSize(config.rtAddress, 80);
    doc.text(addressLines, centerX + 5, 20, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("BUKTI LAPORAN WARGA", centerX, 38, { align: "center" });
    
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.text(`No. Ref: ${report.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 5, 45, { align: "right" });

    let y = 52;
    const drawRow = (label: string, value: string) => {
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.text(label, margin + 5, y);
        doc.text(":", margin + 40, y);
        doc.setFont("times", "normal");
        const splitVal = doc.splitTextToSize(value || '-', pageWidth - margin - 55);
        doc.text(splitVal, margin + 43, y);
        y += (splitVal.length * 5) + 3;
    };

    drawRow("Tanggal Laporan", new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
    drawRow("Kategori", report.type);
    drawRow("Nama Pelapor", report.reporterName);
    drawRow("Lokasi/Unit", report.houseId || "-");
    drawRow("Deskripsi Kejadian", report.description);
    drawRow("Status Saat Ini", report.status);

    y += 10;
    const signX = pageWidth - 45;
    doc.setFontSize(9);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin + 5, y);
    
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    const signSpaceY = y + 2;
    y += 20;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 15, y + 1, signX + 15, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 12, signSpaceY + 2, 24, 15);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 20, signSpaceY - 2, 18, 18);
        }
    } catch (e) { console.error(e); }

    doc.setFontSize(7);
    doc.setFont("times", "italic");
    doc.setTextColor(150);
    doc.text("Bukti lapor digital ini sah dan diterbitkan oleh Sistem Teras Warga.", centerX, pageHeight - 8, { align: "center" });

    doc.save(`Bukti_Lapor_${report.id.substring(0, 8)}.pdf`);
};

export const generateResidentReportPDF = async (houses: House[], customConfig?: PdfConfig, selectedCols?: string[]) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    const drawHeader = (isFirstPage = false) => {
        if (isFirstPage) {
            if (logoData) {
                doc.addImage(logoData, 'PNG', 15, 10, 22, 28);
            }

            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
            doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
            doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
            doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
            doc.setFont("times", "normal");
            doc.setFontSize(10);
            doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

            doc.setLineWidth(0.8);
            doc.line(margin, 42, pageWidth - margin, 42);
            doc.setLineWidth(0.2);
            doc.line(margin, 43, pageWidth - margin, 43);
        } else {
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(`PENGURUS ${config.rtName} | DAFTAR INDUK DATA WARGA (Lanjutan)`, margin, 12);
            doc.setTextColor(0);
            doc.setLineWidth(0.2);
            doc.line(margin, 14, pageWidth - margin, 14);
        }
    };

    drawHeader(true);
    
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("DAFTAR INDUK DATA WARGA", centerX, 52, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, pageWidth - margin, 52, { align: "right" });

    let y = 60;
    
    // Configurable PDF Column Definitions
    const allPdfCols = [
        { id: 'block', label: "BLOK", baseWidth: 10 },
        { id: 'number', label: "NO RUMAH", baseWidth: 14 },
        { id: 'headOfFamily', label: "NAMA KEPALA KELUARGA (PENGHUNI)", baseWidth: 50 },
        { id: 'gender', label: "L/P", baseWidth: 8 },
        { id: 'birthDate', label: "TGL LAHIR", baseWidth: 18 },
        { id: 'religion', label: "AGAMA", baseWidth: 14 },
        { id: 'ownerName', label: "PEMILIK RUMAH", baseWidth: 45 },
        { id: 'ownerPhone', label: "TLP PEMILIK", baseWidth: 24 },
        { id: 'phone', label: "TELEPON", baseWidth: 24 },
        { id: 'status', label: "STATUS", baseWidth: 16 },
        { id: 'residenceType', label: "KEPENGHUNIAN", baseWidth: 18 },
        { id: 'occupants', label: "JIWA", baseWidth: 8 },
        { id: 'education', label: "PENDIDIKAN", baseWidth: 16 },
        { id: 'jobCategory', label: "PEKERJAAN", baseWidth: 25 },
        { id: 'economicStatus', label: "EKONOMI", baseWidth: 16 },
        { id: 'isVerified', label: "KET", baseWidth: 12 }
    ];

    let selectedDefs = allPdfCols;
    if (selectedCols && selectedCols.length > 0) {
        selectedDefs = allPdfCols.filter(col => selectedCols.includes(col.id));
    }
    if (selectedDefs.length === 0) {
        // Fallback: at least show Blok, No Rumah, Nama KK, Status, Jml Penghuni
        selectedDefs = [allPdfCols[0], allPdfCols[1], allPdfCols[2], allPdfCols[9], allPdfCols[11]];
    }

    const noWidth = 8;
    const availableWidth = contentWidth - noWidth;
    const totalBaseWidth = selectedDefs.reduce((sum, c) => sum + c.baseWidth, 0);

    const headers = [
        { id: 'no', label: "NO", w: noWidth },
        ...selectedDefs.map(c => ({
            id: c.id,
            label: c.label,
            w: (c.baseWidth / totalBaseWidth) * availableWidth
        }))
    ];

    const drawTableHeader = (startY: number) => {
        doc.setFillColor(30, 41, 59);
        doc.rect(margin, startY - 5, contentWidth, 8, 'F');
        doc.setTextColor(255);
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        
        let currX = margin;
        headers.forEach(h => {
            doc.text(h.label, currX + (h.w / 2), startY, { align: "center" });
            currX += h.w;
        });
        doc.setTextColor(0);
    };

    drawTableHeader(y);
    y += 8;

    const sortedHouses = [...houses].sort((a,b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

    let currentBlock = '';
    let residentNo = 0;

    sortedHouses.forEach((h, i) => {
        const houseBlock = (h.block || '').toUpperCase();
        if (houseBlock !== currentBlock) {
            currentBlock = houseBlock;
            
            // Check for page break before drawing block separator
            if (y > pageHeight - 20) {
                doc.addPage();
                drawHeader(false);
                y = 22;
                drawTableHeader(y);
                y += 8;
            }
            
            // Block section header row
            doc.setFillColor(241, 245, 249); // slate-100 background
            doc.rect(margin, y - 5, contentWidth, 7, 'F');
            
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.text(`BLOK ${houseBlock}`, margin + 4, y);
            
            doc.setDrawColor(203, 213, 225); // slate-300
            doc.setLineWidth(0.3);
            doc.line(margin, y + 2, pageWidth - margin, y + 2);
            
            y += 7;
        }

        if (y > pageHeight - 20) {
            doc.addPage();
            drawHeader(false);
            y = 22;
            drawTableHeader(y);
            y += 8;
        }

        residentNo++;

        // Zebra striping
        if (residentNo % 2 !== 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 5, contentWidth, 7, 'F');
        }

        doc.setFont("times", "normal");
        doc.setFontSize(8.5);
        
        let currX = margin;
        const rowData = headers.map((header) => {
            if (header.id === 'no') return residentNo.toString();
            
            const val = h[header.id as keyof House];
            if (header.id === 'status') {
                return h.status === 'Occupied' ? 'DIHUNI' : h.status === 'Empty' ? 'KOSONG' : h.status === 'Business' ? 'USAHA' : 'MENGUNJUNGI';
            }
            if (header.id === 'isVerified') {
                return h.isVerified ? 'VERIF' : 'PENDING';
            }
            if (header.id === 'headOfFamily' || header.id === 'ownerName') {
                return (val?.toString() || '-').toUpperCase();
            }
            if (header.id === 'occupants') {
                return (h.occupants || 0).toString();
            }
            if (header.id === 'residenceType') {
                if (h.status === 'Empty') return '-';
                return (val?.toString() || '-');
            }
            return (val?.toString() || '-');
        });

        rowData.forEach((text, idx) => {
            const hDef = headers[idx];
            const w = hDef.w;
            const centerKeys = ['no', 'block', 'number', 'gender', 'birthDate', 'religion', 'status', 'residenceType', 'occupants', 'isVerified'];
            const align = centerKeys.includes(hDef.id) ? "center" : "left";
            const xPos = align === "center" ? currX + (w / 2) : currX + 2;
            
            // Set default font and text color
            doc.setFont("times", "normal");
            doc.setTextColor(51, 65, 85); // Slate-700
            
            // Highlight Status Hunian
            if (hDef.id === 'status') {
                if (text === 'DIHUNI') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(2, 132, 199); // Sky-700
                } else if (text === 'KOSONG') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(100, 116, 139); // Slate-500
                } else if (text === 'USAHA') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(217, 119, 6); // Amber-600
                }
            }
            
            // Highlight Keberadaan / Kepenghunian Rumah (residenceType)
            if (hDef.id === 'residenceType') {
                if (text === 'Tetap') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(15, 118, 110); // Teal-700
                } else if (text === 'Kontrak' || text === 'Sewa' || text === 'Kost') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(180, 83, 9); // Amber-700
                } else if (text === 'Keluarga' || text === 'Rumah Keluarga') {
                    doc.setFont("times", "bold");
                    doc.setTextColor(79, 70, 229); // Indigo-600
                }
            }

            let truncatedText = text;
            if (doc.getTextWidth(text) > w - 2) {
                // Handle splitting and truncation nicely to context width
                truncatedText = doc.splitTextToSize(text, w - 4)[0];
                if (text.length > truncatedText.length) {
                    truncatedText = truncatedText.substring(0, Math.max(2, truncatedText.length - 2)) + "..";
                }
            }
            doc.text(truncatedText, xPos, y, { align: align as any });
            currX += w;
        });

        // Reset default style after row
        doc.setFont("times", "normal");
        doc.setTextColor(0);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        
        y += 7;
    });

    // Statistics / Summary Block (Rekapitulasi Data Status Hunian & Kepenghunian)
    if (y > pageHeight - 105) {
        doc.addPage();
        drawHeader(false);
        y = 22;
    } else {
        y += 8;
    }

    doc.setFillColor(248, 250, 252); // Slate 50 background
    doc.setDrawColor(226, 232, 240); // Slate 200 border
    doc.setLineWidth(0.2);
    doc.rect(margin, y, contentWidth, 60, 'FD');

    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0); // Pure black
    doc.text("REKAPITULASI STATUS HUNIAN & KEPENGHUNIAN", margin + 4, y + 6);

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0); // Pure black

    const totalHouses = houses.length;
    const occupiedCount = houses.filter(h => h.status === 'Occupied').length;
    const emptyCount = houses.filter(h => h.status === 'Empty').length;
    const businessCount = houses.filter(h => h.status === 'Business').length;

    const tetaps = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Tetap').length;
    const sewas = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Sewa').length;
    const keluargas = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Rumah Keluarga').length;

    const visitingCount = houses.filter(h => h.status === 'Visiting').length;
    const totalKepenghunian = tetaps + sewas + keluargas;

    const row1Txt = `Status Hunian      :  Total Rumah = ${totalHouses}  |  Dihuni = ${occupiedCount}  |  Kosong = ${emptyCount}  |  Usaha = ${businessCount}  |  Mengunjungi = ${visitingCount}`;
    const row2Txt = `Status Kepenghunian :  Total KK Menghuni = ${totalKepenghunian}  |  SK Tetap = ${tetaps}  |  Sewa / Kontrak = ${sewas}  |  Keluarga = ${keluargas}`;

    doc.text(row1Txt, margin + 4, y + 13);
    doc.text(row2Txt, margin + 4, y + 20);

    // Decorative explanation line
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(margin + 4, y + 24, margin + contentWidth - 4, y + 24);

    doc.setFontSize(8.5); // Clearer 8.5 font size
    doc.setTextColor(0); // Pure black for high contrast and readability as requested

    const notes = [
        { label: "* Catatan:", text: ' Rumah dengan status "Belum Dihuni (Kosong)" otomatis dikecualikan (tidak dihitung) dari persentase Status Kepenghunian.' },
        { label: "* Status Tetap (SK Tetap):", text: " Rumah ditempati sendiri secara sah oleh pemilik utamanya (bukan penyewa atau keluarga jauh)." },
        { label: "* Status Sewa / Kontrak:", text: " Warga yang menyewa atau mengontrak rumah." },
        { label: "* Status Rumah Keluarga:", text: " Warga yang menempati dan menggunakan rumah milik keluarga atau kerabat dekat." },
        { label: "* Status Mengunjungi:", text: " Rumah/warga dengan status tinggal sementara atau hanya berkunjung/silaturahmi untuk waktu terbatas." }
    ];

    let noteY = y + 29;
    notes.forEach(note => {
        doc.setFont("times", "bold");
        doc.text(note.label, margin + 4, noteY);
        const labelWidth = doc.getTextWidth(note.label);
        doc.setFont("times", "normal");
        doc.text(note.text, margin + 4 + labelWidth, noteY);
        noteY += 6;
    });

    // Reset style
    doc.setFont("times", "normal");
    doc.setTextColor(0);

    y += 66;

    // Signature Block
    if (y > pageHeight - 50) {
        doc.addPage();
        drawHeader(false);
        y = 22;
    } else {
        y += 15;
    }

    const signX = pageWidth - 60;
    doc.setFontSize(10);
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    
    const signSpaceY = y + 2;
    y += 25;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 25, y + 1, signX + 25, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    // Page Numbers
    const totalPages = doc.getNumberOfPages();
    for(let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setFont("times", "italic");
        doc.setTextColor(150);
        doc.text(`Halaman ${j} dari ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
    }
    doc.save(`Data_Warga_RT02_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateIuranReceiptPDF = async (payment: any, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a5",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const margin = 10;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    // Header / Kop Surat Mini
    if (logoData) {
        doc.addImage(logoData, 'PNG', 10, 10, 15, 20);
    }

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`PENGURUS ${config.rtName}`, centerX + 5, 15, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.text(config.rtAddress, centerX + 5, 20, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("KWITANSI PEMBAYARAN IURAN", centerX, 35, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`No. Ref: ${payment.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 5, 42, { align: "right" });

    // Content Table-like structure
    let y = 52;
    const drawRow = (label: string, value: string) => {
        doc.setFont("times", "bold");
        doc.text(label, margin + 5, y);
        doc.text(":", margin + 40, y);
        doc.setFont("times", "normal");
        doc.text(value, margin + 43, y);
        y += 8;
    };

    drawRow("Telah Terima Dari", payment.headOfFamily);
    drawRow("Alamat / Rumah", `Blok ${payment.block} No. ${payment.number}`);
    drawRow("Untuk Pembayaran", `Iuran ${payment.type === 'Both' ? 'Air & Sampah' : payment.type}`);
    drawRow("Periode Bulan", payment.month);
    drawRow("Tanggal Bayar", new Date(payment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));

    y += 5;
    // Amount Box
    doc.setFillColor(245, 245, 245);
    doc.rect(margin + 5, y, pageWidth - (margin * 2) - 10, 12, 'F');
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`TERBILANG: Rp ${payment.amount.toLocaleString()},-`, margin + 10, y + 8);

    // Signature
    y += 20;
    const signX = pageWidth - 45;
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    doc.text("Penerima / Bendahara,", signX, y + 5, { align: "center" });
    
    const signSpaceY = y + 7;
    y += 25;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 15, y + 1, signX + 15, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    // Footer
    doc.setFontSize(7);
    doc.setFont("times", "italic");
    doc.setTextColor(150);
    doc.text("* Bukti pembayaran ini sah dan diterbitkan secara digital melalui SiTeras.", margin + 5, pageHeight - 10);

    doc.save(`Kwitansi_Iuran_${payment.headOfFamily}_${payment.month.replace(/\s+/g, '_')}.pdf`);
};

export const generateCashFlowReportPDF = async (cashFlow: any[], month: string, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // --- Professional Header (Kop Surat) ---
    try {
        const logoData = await getImageData(config.logo);
        if (logoData) {
            doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
        }
    } catch (e) {}

    doc.setFont("times", "normal"); 
    doc.setFontSize(14);
    doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
    doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
    doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
    doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

    doc.setLineWidth(1.0);
    doc.line(20, 42, 190, 42);
    doc.setLineWidth(0.3);
    doc.line(20, 43, 190, 43);

    // --- Title ---
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN REALISASI KAS BULANAN", centerX, 52, { align: "center" });
    doc.setFont("times", "normal");
    doc.text(`Periode: ${month}`, centerX, 58, { align: "center" });

    // Filter data for the selected month
    const filteredData = cashFlow.filter(cf => {
        const cfDate = new Date(cf.date);
        const cfMonth = cfDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
        return cfMonth === month;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalIncome = filteredData.filter(cf => cf.type === 'Income').reduce((acc, cf) => acc + cf.amount, 0);
    const totalExpense = filteredData.filter(cf => cf.type === 'Expense').reduce((acc, cf) => acc + cf.amount, 0);
    const balance = totalIncome - totalExpense;

    let y = 70;
    const rowHeight = 8;

    // --- Summary Section ---
    doc.setFont("times", "bold");
    doc.text("RINGKASAN KEUANGAN", margin, y);
    y += 8;
    
    const drawSummaryRow = (label: string, value: number, color?: [number, number, number]) => {
        doc.setFont("times", "normal");
        doc.text(label, margin + 5, y);
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        doc.text(`Rp ${value.toLocaleString()}`, pageWidth - margin - 5, y, { align: "right" });
        doc.setTextColor(0);
        doc.line(margin + 5, y + 2, pageWidth - margin - 5, y + 2);
        y += rowHeight;
    };

    drawSummaryRow("Total Pemasukan (+)", totalIncome, [16, 185, 129]);
    drawSummaryRow("Total Pengeluaran (-)", totalExpense, [239, 68, 68]);
    doc.setFont("times", "bold");
    drawSummaryRow("SALDO PERIODE INI", balance, balance >= 0 ? [79, 70, 229] : [239, 68, 68]);

    y += 10;

    // --- Transaction Table ---
    doc.setFont("times", "bold");
    doc.text("RINCIAN TRANSAKSI", margin, y);
    y += 8;

    const cols = [
        { header: "Tgl", width: 18, x: margin },
        { header: "Keterangan", width: 64, x: margin + 18 },
        { header: "Kategori", width: 28, x: margin + 82 },
        { header: "Pemasukan", width: 30, x: margin + 110 },
        { header: "Pengeluaran", width: 30, x: margin + 140 },
    ];

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, contentWidth, 7, 'F');
    doc.setFontSize(9);
    cols.forEach(col => {
        const align = (col.header === "Pemasukan" || col.header === "Pengeluaran") ? "right" : "left";
        const xPos = align === "right" ? col.x + col.width - 2 : col.x + 2;
        doc.text(col.header, xPos, y, { align });
    });
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 7;

    doc.setFont("times", "normal");
    filteredData.forEach(cf => {
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 30;
        }
        const date = new Date(cf.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        doc.text(date, cols[0].x + 2, y);
        
        const desc = doc.splitTextToSize(cf.description, cols[1].width - 4);
        doc.text(desc, cols[1].x + 2, y);
        
        const categoryVal = cf.category || '-';
        let truncatedCategory = categoryVal;
        if (doc.getTextWidth(categoryVal) > cols[2].width - 4) {
            truncatedCategory = doc.splitTextToSize(categoryVal, cols[2].width - 5)[0];
            if (categoryVal.length > truncatedCategory.length) {
                truncatedCategory = truncatedCategory.substring(0, Math.max(2, truncatedCategory.length - 2)) + "..";
            }
        }
        doc.text(truncatedCategory, cols[2].x + 2, y);
        
        if (cf.type === 'Income') {
            doc.text(cf.amount.toLocaleString('id-ID'), cols[3].x + cols[3].width - 2, y, { align: "right" });
        } else {
            doc.text("-", cols[3].x + (cols[3].width / 2), y, { align: "center" });
        }
        
        if (cf.type === 'Expense') {
            doc.text(cf.amount.toLocaleString('id-ID'), cols[4].x + cols[4].width - 2, y, { align: "right" });
        } else {
            doc.text("-", cols[4].x + (cols[4].width / 2), y, { align: "center" });
        }

        const rowLines = desc.length;
        y += (rowLines * 5) + 2;
        doc.setDrawColor(240);
        doc.line(margin, y - 2, pageWidth - margin, y - 2);
        doc.setDrawColor(0);
    });

    // --- Signature ---
    y += 15;
    if (y > pageHeight - 60) { doc.addPage(); y = 30; }
    const signX = pageWidth - 60;
    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, y, { align: "center" });
    doc.text(`Ketua ${config.rtName}`, signX, y + 6, { align: "center" });
    
    const signSpaceY = y + 8;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y + 35, { align: "center" });
    doc.line(signX - 20, y + 36, signX + 20, y + 36);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY, 25, 25);
        }
    } catch (e) {}

    doc.save(`Laporan_Keuangan_${month.replace(/\s+/g, '_')}.pdf`);
};

export const generateGuestReportPDF = async (guestReports: any[], customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // Header
    try {
        const logoData = await getImageData(config.logo);
        if (logoData) doc.addImage(logoData, 'PNG', margin, 10, 20, 25);
    } catch (e) {}

    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
    doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
    doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
    doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

    doc.setLineWidth(1.0);
    doc.line(margin, 42, pageWidth - margin, 42);
    doc.setLineWidth(0.3);
    doc.line(margin, 43, pageWidth - margin, 43);

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`LAPORAN DATA TAMU MENGINAP ${config.rtName}`, centerX, 52, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, centerX, 57, { align: "center" });

    let y = 65;
    const rowHeight = 8;
    const cols = [
        { header: "No", width: 8, x: margin },
        { header: "Nama Tamu", width: 38, x: margin + 8 },
        { header: "NIK", width: 35, x: margin + 46 },
        { header: "Hubungan", width: 25, x: margin + 81 },
        { header: "Rumah Dikunjungi", width: 38, x: margin + 106 },
        { header: "Keperluan", width: 40, x: margin + 144 },
        { header: "Tgl Masuk", width: 25, x: margin + 184 },
        { header: "Durasi", width: 20, x: margin + 209 },
        { header: "No. HP", width: 30, x: margin + 229 },
        { header: "Status", width: 18, x: margin + 259 },
    ];

    // Table Header
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setFont("times", "bold");
    cols.forEach(col => doc.text(col.header, col.x + 2, y + 5));
    doc.rect(margin, y, contentWidth, rowHeight);
    y += rowHeight;

    const getColText = (text: string, colIdx: number) => {
        const rawText = text || '-';
        const w = cols[colIdx].width;
        if (doc.getTextWidth(rawText) > w - 3) {
            let truncated = doc.splitTextToSize(rawText, w - 5)[0];
            if (rawText.length > truncated.length) {
                return truncated.substring(0, Math.max(2, truncated.length - 2)) + "..";
            }
            return truncated;
        }
        return rawText;
    };

    doc.setFont("times", "normal");
    guestReports.forEach((guest, index) => {
        if (y > pageHeight - 20) {
            doc.addPage();
            y = 20;
            // Draw header again
            doc.setFillColor(230, 230, 230);
            doc.rect(margin, y, contentWidth, rowHeight, 'F');
            doc.setFont("times", "bold");
            cols.forEach(col => doc.text(col.header, col.x + 2, y + 5));
            doc.rect(margin, y, contentWidth, rowHeight);
            y += rowHeight;
            doc.setFont("times", "normal");
        }

        doc.text((index + 1).toString(), cols[0].x + 2, y + 5);
        doc.text(getColText(guest.guestName, 1), cols[1].x + 2, y + 5);
        doc.text(getColText(guest.guestNik, 2), cols[2].x + 2, y + 5);
        doc.text(getColText(guest.relationship, 3), cols[3].x + 2, y + 5);
        doc.text(getColText(guest.residentName, 4), cols[4].x + 2, y + 5);
        doc.text(getColText(guest.purpose, 5), cols[5].x + 2, y + 5);
        doc.text(new Date(guest.arrivalDate).toLocaleDateString('id-ID'), cols[6].x + 2, y + 5);
        doc.text(getColText(guest.stayDuration, 7), cols[7].x + 2, y + 5);
        doc.text(getColText(guest.phone, 8), cols[8].x + 2, y + 5);
        doc.text(guest.status === 'Active' ? 'Aktif' : 'Pulang', cols[9].x + 2, y + 5);

        doc.rect(margin, y, contentWidth, rowHeight);
        y += rowHeight;
    });
    
    // Signature Block
    y += 10;
    if (y > pageHeight - 50) {
        doc.addPage();
        y = 30;
    }

    const signX = pageWidth - 60;
    doc.setFontSize(10);
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    
    const signSpaceY = y + 2;
    y += 25;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 25, y + 1, signX + 25, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    doc.save(`Laporan_Tamu_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePBBReportPDF = async (houses: House[], year: string, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    // --- SORTING LOGIC ---
    // Custom sort to handle alphanumeric blocks like C5, C10, etc.
    const sortedHouses = [...houses].sort((a, b) => {
        // Extract block code and number
        const getBlockParts = (blockStr: string) => {
            const matches = (blockStr || '').match(/([a-zA-Z]+)(\d+)/);
            if (matches) {
                return { alpha: matches[1], num: parseInt(matches[2]) };
            }
            return { alpha: blockStr || '', num: 0 };
        };

        const partsA = getBlockParts(a.block || '');
        const partsB = getBlockParts(b.block || '');

        // Sort by alpha first (e.g., 'C')
        if (partsA.alpha < partsB.alpha) return -1;
        if (partsA.alpha > partsB.alpha) return 1;

        // Then sort by block number (e.g., 5 vs 10)
        if (partsA.num < partsB.num) return -1;
        if (partsA.num > partsB.num) return 1;
        
        // Then sort by house number numerically
        const numA = parseInt((a.number || '0').replace(/\D/g, '')) || 0;
        const numB = parseInt((b.number || '0').replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    // Statistics
    const totalResidents = sortedHouses.length;
    const takenCount = sortedHouses.filter(h => h.pbbStatus === 'Sudah Diambil').length;
    const pendingCount = totalResidents - takenCount;

    const drawHeader = (isFirstPage = false) => {
        if (isFirstPage) {
            // --- Professional Header (Kop Surat) ---
            if (logoData) {
                doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
            }

            doc.setFont("times", "normal");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setDrawColor(0, 0, 0);

            doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
            doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
            doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
            doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });

            doc.setFontSize(11);
            doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

            // Double lines below header
            doc.setLineWidth(1.0);
            doc.line(margin, 42, pageWidth - margin, 42);
            doc.setLineWidth(0.3);
            doc.line(margin, 43, pageWidth - margin, 43);

            // Title
            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.text(`DAFTAR PENERIMA SPPT PBB TAHUN ${year}`, centerX, 55, { align: "center" });
            const titleWidth = doc.getTextWidth(`DAFTAR PENERIMA SPPT PBB TAHUN ${year}`);
            doc.line(centerX - (titleWidth / 2), 56, centerX + (titleWidth / 2), 56);
            
            // Summary Stats (Solid and Clear)
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0); // Black for Total
            doc.text(`TOTAL WARGA: ${totalResidents}`, margin + 5, 75);
            
            doc.setTextColor(0, 128, 0); // Dark Green for Taken
            doc.text(`SUDAH: ${takenCount}`, margin + (contentWidth / 2), 75, { align: "center" });
            
            doc.setTextColor(200, 0, 0); // Dark Red for Pending
            doc.text(`BELUM: ${pendingCount}`, pageWidth - margin - 5, 75, { align: "right" });
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(margin, 78, pageWidth - margin, 78);
            
            doc.setTextColor(0, 0, 0);
        } else {
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`PENGURUS ${config.rtName} | DAFTAR PENERIMA SPPT PBB TAHUN ${year} (Lanjutan)`, margin, 12);
            doc.setTextColor(0);
            doc.setLineWidth(0.2);
            doc.line(margin, 14, pageWidth - margin, 14);
        }
    };

    drawHeader(true);
    let y = 92;

    const colWidths = [8, 18, 69, 35, 40]; 
    const headers = ["NO", "UNIT/BLOK", "NAMA KEPALA KELUARGA (PENGHUNI)", "SUDAH/BELUM", "TANDA TANGAN"];
    
    const drawTableHeaders = (startY: number) => {
        doc.setFillColor(40, 40, 40); // Darker for better contrast
        doc.rect(margin, startY - 6, contentWidth, 9, 'F');
        
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        let curX = margin;
        headers.forEach((h, i) => {
            const align = (i === 0 || i === 1 || i === 3) ? "center" : "left";
            const xPos = align === "center" ? curX + (colWidths[i] / 2) : curX + 3;
            doc.text(h, xPos, startY, { align });
            curX += colWidths[i];
        });
    };

    drawTableHeaders(y);
    y += 9;

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    let currentBlock = "";

    sortedHouses.forEach((house, index) => {
        const houseBlock = (house.block || '').toString().toUpperCase();
        const isNewBlock = houseBlock !== currentBlock;
        
        if (isNewBlock) {
            currentBlock = houseBlock;
            
            // Check for page break before block header
            if (y > 270) {
                doc.addPage();
                drawHeader(false);
                y = 22;
                drawTableHeaders(y);
                y += 9;
            }

            // Draw Block Header Row
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 6, contentWidth, 8, 'F');
            doc.setFont("times", "bold");
            doc.setTextColor(0);
            doc.text(`BLOK ${houseBlock}`, margin + 5, y);
            doc.setFont("times", "normal");
            y += 8;
        }

        if (y > 275) {
            doc.addPage();
            drawHeader(false);
            y = 22;
            drawTableHeaders(y);
            y += 9;
            doc.setFont("times", "normal");
            doc.setFontSize(9);
            
            // Re-draw block header on new page if item continues
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 6, contentWidth, 8, 'F');
            doc.setFont("times", "bold");
            doc.text(`BLOK ${houseBlock} (Lanjutan)`, margin + 5, y);
            doc.setFont("times", "normal");
            y += 8;
        }

        let curX = margin;
        
        // No
        doc.text((index + 1).toString(), curX + (colWidths[0] / 2), y, { align: "center" });
        curX += colWidths[0];

        // Unit
        doc.text(`${house.block}-${house.number}`, curX + (colWidths[1] / 2), y, { align: "center" });
        curX += colWidths[1];

        // Name
        const name = house.headOfFamily?.toUpperCase() || "-";
        let truncatedName = name;
        if (doc.getTextWidth(name) > colWidths[2] - 4) {
            truncatedName = doc.splitTextToSize(name, colWidths[2] - 5)[0];
            if (name.length > truncatedName.length) {
                truncatedName = truncatedName.substring(0, Math.max(2, truncatedName.length - 2)) + "..";
            }
        }
        doc.text(truncatedName, curX + 3, y);
        curX += colWidths[2];

        // Status
        const isTaken = house.pbbStatus === 'Sudah Diambil';
        if (isTaken) {
            doc.setTextColor(0, 128, 0); // Darker Green
            doc.setFont("times", "bold");
        } else {
            doc.setTextColor(80, 80, 80); // Darker Grey
        }
        doc.text(isTaken ? "[v] Sudah" : "[  ] Belum", curX + (colWidths[3] / 2), y, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        curX += colWidths[3];

        // Signature Box
        doc.setDrawColor(200, 200, 200);
        doc.rect(curX + 2, y - 5, colWidths[4] - 4, 7, 'S');
        if (!isTaken) {
            doc.setFontSize(6);
            doc.setTextColor(180, 180, 180);
            doc.text(`${index + 1}.`, curX + 4, y);
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
        }

        // Thin separator
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);

        y += 8;
    });

    // Signature Area
    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (y > 240) {
        doc.addPage();
        y = 30;
    } else {
        y += 15;
    }

    const signX = pageWidth - 60;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    
    const signSpaceY = y + 2;
    y += 25;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), y + 1.5, signX + (chairmanWidth / 2), y + 1.5);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("times", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${totalPages} - Laporan SPPT PBB ${year}`, centerX, pageHeight - 10, { align: "center" });
    }

    doc.save(`Laporan_PBB_${year}.pdf`);
};

export const generateResidentStatsReportPDF = async (houses: House[], customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // --- Data Analysis ---
    const totalHouses = houses.length;
    const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
    const emptyHouses = houses.filter(h => h.status === 'Empty').length;
    const businessHouses = houses.filter(h => h.status === 'Business').length;
    
    const verifiedResidentCount = houses.filter(h => h.isVerified).length;
    const totalOccupants = houses.reduce((sum, h) => sum + (h.occupants || 0), 0);
    const maleCount = houses.filter(h => h.gender === 'Laki-laki').length;
    const femaleCount = houses.filter(h => h.gender === 'Perempuan').length;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    const drawHeader = () => {
        if (logoData) {
            doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
        }
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
        doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
        doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
        doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
        doc.setFontSize(11);
        doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });
        doc.setLineWidth(1.0);
        doc.line(margin, 42, pageWidth - margin, 42);
        doc.setLineWidth(0.3);
        doc.line(margin, 43, pageWidth - margin, 43);

        doc.setFont("times", "bold");
        doc.setFontSize(14);
        doc.text("LAPORAN STATISTIK & REKAPITULASI WARGA", centerX, 55, { align: "center" });
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, margin, 65);
    };

    drawHeader();
    let y = 75;

    // --- Occupancy Summary Section ---
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 9, 'F');
    doc.setFont("times", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255);
    doc.text("I. REKAPITULASI HUNIAN (RUMAH)", margin + 3, y);
    doc.setTextColor(0);
    y += 12;

    const addStatRow = (label: string, value: string | number, percentage?: string, isTotal = false) => {
        if (isTotal) {
            doc.setFillColor(241, 245, 249);
            doc.rect(margin, y - 5, contentWidth, 8, 'F');
            doc.setFont("times", "bold");
        } else {
            doc.setFont("times", "normal");
        }
        doc.setFontSize(10);
        doc.text(label, margin + 5, y + 1);
        doc.text(value.toString(), margin + 110, y + 1, { align: "right" });
        if (percentage) {
            doc.text(percentage, pageWidth - margin - 5, y + 1, { align: "right" });
        }
        
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 3, pageWidth - margin, y + 3);
        y += 8;
    };

    addStatRow("Total Unit Rumah", totalHouses, "100%", true);
    addStatRow("Rumah Dihuni (Occupied)", occupiedHouses, `${((occupiedHouses / totalHouses) * 100).toFixed(1)}%`);
    addStatRow("Rumah Kosong (Empty)", emptyHouses, `${((emptyHouses / totalHouses) * 100).toFixed(1)}%`);
    addStatRow("Tempat Usaha (Business)", businessHouses, `${((businessHouses / totalHouses) * 100).toFixed(1)}%`);
    
    y += 10;

    // --- Resident Summary Section ---
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 9, 'F');
    doc.setFont("times", "bold");
    doc.setTextColor(255);
    doc.text("II. STATISTIK WARGA (KEPALA KELUARGA)", margin + 3, y);
    doc.setTextColor(0);
    y += 12;

    addStatRow("Total Kepala Keluarga Terdata", totalHouses, "100%", true);
    addStatRow("Status Terverifikasi", verifiedResidentCount, `${((verifiedResidentCount / totalHouses) * 100).toFixed(1)}%`);
    addStatRow("Belum Verifikasi", totalHouses - verifiedResidentCount, `${(((totalHouses - verifiedResidentCount) / totalHouses) * 100).toFixed(1)}%`);
    addStatRow("Kepala Keluarga Laki-laki", maleCount, `${((maleCount / totalHouses) * 100).toFixed(1)}%`);
    addStatRow("Kepala Keluarga Perempuan", femaleCount, `${((femaleCount / totalHouses) * 100).toFixed(1)}%`);

    y += 10;

    // --- Occupants Section ---
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y - 6, contentWidth, 9, 'F');
    doc.setFont("times", "bold");
    doc.setTextColor(255);
    doc.text("III. KOMPOSISI JIWA (ANGGOTA KELUARGA)", margin + 3, y);
    doc.setTextColor(0);
    y += 12;

    addStatRow("Total Seluruh Jiwa / Anggota", totalOccupants, "-", true);
    addStatRow("Rata-rata Jiwa per Rumah", (totalOccupants / occupiedHouses).toFixed(1), "-");

    // --- Footer / Signature ---
    if (y > 230) {
        doc.addPage();
        y = 30;
    } else {
        y += 20;
    }

    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const signX = pageWidth - 60;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });

    const signSpaceY = y + 2;
    y += 25;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), y + 1, signX + (chairmanWidth / 2), y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    // Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("times", "italic");
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${totalPages} - Laporan Statistik Warga`, centerX, pageHeight - 10, { align: "center" });
    }

    doc.save(`Laporan_Statistik_Warga_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateIncidentReportPDF = async (reports: Report[], houses: House[], customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // Fetch Logo once
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    const drawHeader = (isFirstPage = false) => {
        if (isFirstPage) {
            if (logoData) {
                doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
            }
            doc.setFont("times", "normal");
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
            doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
            doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
            doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
            doc.setFontSize(11);
            doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });
            
            doc.setLineWidth(1.0);
            doc.line(margin, 42, pageWidth - margin, 42);
            doc.setLineWidth(0.3);
            doc.line(margin, 43, pageWidth - margin, 43);

            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.text("REKAPITULASI LAPORAN & TEMUAN LAPANGAN", centerX, 55, { align: "center" });
            doc.line(centerX - 45, 56, centerX + 45, 56);
        } else {
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`PENGURUS ${config.rtName} | LAPORAN & TEMUAN LAPANGAN (Lanjutan)`, margin, 12);
            doc.setTextColor(0);
            doc.setLineWidth(0.2);
            doc.line(margin, 14, pageWidth - margin, 14);
        }
    };

    drawHeader(true);
    let y = 65;

    // Statistics Summary
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, margin, y);
    doc.text(`Total Laporan: ${reports.length}`, pageWidth - margin, y, { align: "right" });
    y += 10;

    const sortedReports = [...reports].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedReports.length === 0) {
        doc.setFont("times", "italic");
        doc.text("Tidak ada data laporan ditemukan.", centerX, y + 10, { align: "center" });
    } else {
        sortedReports.forEach((report, index) => {
            // Check for page break
            if (y > 240) {
                doc.addPage();
                drawHeader(false);
                y = 22;
            }

            // Report Header Box
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 5, contentWidth, 8, 'F');
            doc.setFont("times", "bold");
            doc.setFontSize(10);
            doc.text(`${index + 1}. [${report.type.toUpperCase()}] - ${new Date(report.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`, margin + 3, y);
            
            // Status Tag
            const isDone = report.status === 'Selesai';
            doc.setFillColor(isDone ? 200 : 255, isDone ? 255 : 220, isDone ? 200 : 150);
            doc.roundedRect(pageWidth - margin - 25, y - 4, 22, 6, 1, 1, 'F');
            doc.setFontSize(8);
            doc.setTextColor(isDone ? 0 : 150, isDone ? 100 : 0, 0);
            doc.text(report.status.toUpperCase(), pageWidth - margin - 14, y, { align: "center" });
            doc.setTextColor(0);
            y += 8;

            // Details Section
            doc.setFont("times", "normal");
            doc.setFontSize(9);
            
            // Reporter & House Info
            const house = houses.find(h => h.id === report.reporterHouseId || h.id === report.houseId);
            const reporterText = `Pelapor: ${report.reporterName || 'Anonim'}`;
            const houseText = house ? `Unit: ${house.block}-${house.number} (${house.status === 'Occupied' ? 'Dihuni' : 'Kosong/Lainnya'})` : `Unit: ${report.houseId || '-'}`;
            
            doc.text(reporterText, margin + 5, y);
            doc.text(houseText, margin + 80, y);
            y += 5;

            // Resident Details
            if (house) {
                const residentInfo = `Penghuni: ${house.headOfFamily || '-'} | Telp: ${house.phone || '-'}`;
                doc.text(residentInfo, margin + 5, y);
                y += 5;
            }

            // Description
            doc.setFont("times", "bold");
            doc.text("Keterangan/Aduan:", margin + 5, y);
            y += 4;
            doc.setFont("times", "normal");
            const splitDesc = doc.splitTextToSize(report.description, contentWidth - 20);
            doc.text(splitDesc, margin + 10, y);
            y += (splitDesc.length * 4.5) + 5;

            // Separator
            doc.setDrawColor(230, 230, 230);
            doc.line(margin, y - 2, pageWidth - margin, y - 2);
            y += 5;
        });
    }

    // Signature Area
    if (y > 240) {
        doc.addPage();
        drawHeader(false);
        y = 22;
    } else {
        y += 10;
    }

    const signX = pageWidth - 60;
    doc.setFontSize(11);
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    
    const signSpaceY = y + 2;
    y += 25;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 25, y + 1, signX + 25, y + 1);

    // Add Signature then Stamp (Stamp on top)
    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
        }
    } catch (e) { console.error(e); }

    // Page Numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("times", "italic");
        doc.setTextColor(150);
        doc.text(`Halaman ${i} dari ${totalPages} - SiTeras RT02`, centerX, pageHeight - 10, { align: "center" });
    }

    doc.save(`Rekap_Laporan_RT02_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateBillReportPDF = async (houses: House[], iuranPayments: any[], billType: 'Air' | 'Sampah', month?: string, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    const doc = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4",
        compress: true 
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    const currentMonth = month || getIndonesianMonthYear(new Date());

    // Helper to check payment status consistently with FinancialContext
    const checkIsPaid = (house: House) => {
        const payment = iuranPayments.find(p => {
            const idMatch = String(p.houseId) === String(house.id) || 
                            String(p.houseId) === `${house.block}-${house.number}` ||
                            (p.block === house.block && p.number === house.number);
            return idMatch && isMonthMatch(p.month, currentMonth) && (p.type === billType || p.type === 'Both');
        });
        
        if (payment) return true;
        
        // Fallback to house record if month matches current real-world month
        const realCurrentMonth = getIndonesianMonthYear(new Date());
        if (isMonthMatch(currentMonth, realCurrentMonth)) {
            const status = billType === 'Air' ? house.paymentStatusAir : house.paymentStatusSampah;
            return status === PaymentStatus.PAID;
        }
        
        return false;
    };

    const filteredHouses = houses.filter(h => h.status === 'Occupied');
    const sortedHouses = [...filteredHouses].sort((a, b) => {
        const blockA = a.block || "";
        const blockB = b.block || "";
        if (blockA !== blockB) return blockA.localeCompare(blockB);
        return a.number.localeCompare(b.number, undefined, { numeric: true });
    });

    const totalResidents = filteredHouses.length;
    const paidCount = filteredHouses.filter(h => checkIsPaid(h)).length;
    const unpaidCount = totalResidents - paidCount;

    // Fetch Logo
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) {}

    const drawHeader = (isFirstPage = false) => {
        if (isFirstPage) {
            if (logoData) {
                doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
            }

            doc.setFont("times", "normal");
            doc.setFontSize(14);
            doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
            doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
            doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
            doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });

            doc.setFontSize(11);
            doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

            doc.setLineWidth(1.0);
            doc.line(margin, 42, pageWidth - margin, 42);
            doc.setLineWidth(0.3);
            doc.line(margin, 43, pageWidth - margin, 43);

            doc.setFont("times", "bold");
            doc.setFontSize(12);
            doc.text(`DAFTAR PEMBAYARAN IURAN ${billType.toUpperCase()} - ${currentMonth.toUpperCase()}`, centerX, 55, { align: "center" });
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0); 
            doc.text(`TOTAL WARGA: ${totalResidents}`, margin + 5, 75);
            
            doc.setTextColor(0, 128, 0);
            doc.text(`LUNAS: ${paidCount}`, margin + (contentWidth / 2), 75, { align: "center" });
            
            doc.setTextColor(200, 0, 0);
            doc.text(`BELUM LUNAS: ${unpaidCount}`, pageWidth - margin - 5, 75, { align: "right" });
            
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.line(margin, 78, pageWidth - margin, 78);
            
            doc.setTextColor(0, 0, 0);
        } else {
            doc.setFont("times", "bold");
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`PENGURUS ${config.rtName} | LAPORAN IURAN ${billType.toUpperCase()} - ${currentMonth.toUpperCase()} (Lanjutan)`, margin, 12);
            doc.setTextColor(0);
            doc.setLineWidth(0.2);
            doc.line(margin, 14, pageWidth - margin, 14);
        }
    };

    drawHeader(true);
    let y = 92;

    const colWidths = [8, 18, 69, 35, 40]; 
    const headers = ["NO", "UNIT/BLOK", "NAMA KEPALA KELUARGA (PENGHUNI)", "STATUS", "KETERANGAN"];
    
    const drawTableHeaders = (startY: number) => {
        doc.setFillColor(40, 40, 40);
        doc.rect(margin, startY - 6, contentWidth, 9, 'F');
        
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        let curX = margin;
        headers.forEach((h, i) => {
            const align = (i === 0 || i === 1 || i === 3) ? "center" : "left";
            const xPos = align === "center" ? curX + (colWidths[i] / 2) : curX + 3;
            doc.text(h, xPos, startY, { align });
            curX += colWidths[i];
        });
    };

    drawTableHeaders(y);
    y += 9;

    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    let currentBlock = "";

    sortedHouses.forEach((house, index) => {
        const houseBlock = (house.block || '').toString().toUpperCase();
        if (houseBlock !== currentBlock) {
            currentBlock = houseBlock;
            if (y > 270) {
                doc.addPage();
                drawHeader(false);
                y = 22;
                drawTableHeaders(y);
                y += 9;
            }
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 6, contentWidth, 8, 'F');
            doc.setFont("times", "bold");
            doc.text(`BLOK ${houseBlock}`, margin + 5, y);
            doc.setFont("times", "normal");
            y += 8;
        }

        if (y > 275) {
            doc.addPage();
            drawHeader(false);
            y = 22;
            drawTableHeaders(y);
            y += 9;
            doc.setFont("times", "normal");
            doc.setFontSize(9);
        }

        let curX = margin;
        doc.text((index + 1).toString(), curX + (colWidths[0] / 2), y, { align: "center" });
        curX += colWidths[0];
        doc.text(`${house.block}-${house.number}`, curX + (colWidths[1] / 2), y, { align: "center" });
        curX += colWidths[1];
        const name = house.headOfFamily?.toUpperCase() || "-";
        let truncatedName = name;
        if (doc.getTextWidth(name) > colWidths[2] - 4) {
            truncatedName = doc.splitTextToSize(name, colWidths[2] - 5)[0];
            if (name.length > truncatedName.length) {
                truncatedName = truncatedName.substring(0, Math.max(2, truncatedName.length - 2)) + "..";
            }
        }
        doc.text(truncatedName, curX + 3, y);
        curX += colWidths[2];

        const isPaid = checkIsPaid(house);
        if (isPaid) {
            doc.setTextColor(0, 128, 0);
            doc.setFont("times", "bold");
        } else {
            doc.setTextColor(200, 0, 0);
        }
        doc.text(isPaid ? "LUNAS" : "PENDING", curX + (colWidths[3] / 2), y, { align: "center" });
        doc.setTextColor(0, 0, 0);
        doc.setFont("times", "normal");
        curX += colWidths[3];

        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        y += 8;
    });

    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    if (y > 240) {
        doc.addPage();
        y = 30;
    } else {
        y += 15;
    }

    const signX = pageWidth - 60;
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, y, { align: "center" });
    y += 6;
    doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });
    const signSpaceY = y + 2;
    y += 25;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), y + 1.5, signX + (chairmanWidth / 2), y + 1.5);

    try {
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
        }
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY - 2, 22, 22);
        }
    } catch (e) {}

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("times", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(`Halaman ${i} dari ${totalPages} - Laporan Iuran ${billType} ${month || ''}`, centerX, pageHeight - 10, { align: "center" });
    }

    doc.save(`Laporan_Iuran_${billType}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateDemographicAnalyticsReportPDF = async (
  houses: House[], 
  cashFlow: CashFlow[], 
  reports: Report[],
  customConfig?: PdfConfig
) => {
  const config = customConfig || DEFAULT_PDF_CONFIG;
  const doc = new jsPDF({ 
    orientation: "portrait", 
    unit: "mm", 
    format: "a4",
    compress: true 
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const centerX = pageWidth / 2;

  // Helper to calculate age (consistency with DemographicAnalytics.tsx)
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 30;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // --- Aggregate Stats ---
  const allResidents: any[] = [];
  let totalPregnant = 0, totalBabies = 0, totalToddlers = 0, totalChildren = 0;
  let totalTeenagers = 0, totalAdults = 0, totalElderly = 0, totalWidows = 0;
  let totalDisability = 0, totalOrphans = 0, totalPKH = 0, totalBLT = 0;
  let totalBansosLain = 0, totalOccupied = 0;
  
  const religions: Record<string, number> = {};
  const educations: Record<string, number> = {};
  const occupations: Record<string, number> = {};
  const economicStatuses: Record<string, number> = {};

  houses.forEach(h => {
    if (h.status === 'Occupied') {
      totalOccupied++;
      totalPregnant += (h.pregnantCount || 0);
      totalBabies += (h.babyCount || 0);
      totalToddlers += (h.toddlerCount || 0);
      totalChildren += (h.childCount || 0);
      totalTeenagers += (h.teenagerCount || 0);
      totalAdults += (h.adultCount || 0);
      totalElderly += (h.elderlyCount || 0);
      totalWidows += (h.widowCount || 0);
      totalDisability += (h.disabilityCount || 0);
      totalOrphans += (h.orphanCount || 0);
      if (h.isPKH) totalPKH++;
      if (h.isBLT) totalBLT++;
      if (h.isBansosLain) totalBansosLain++;

      // Process HoF
      const hoF = { gender: h.gender || 'Laki-laki', age: calculateAge(h.birthDate), religion: h.religion || 'Lainnya', education: h.education || 'Lainnya', job: h.jobCategory || 'Lainnya', economic: h.economicStatus || 'Sejahtera' };
      allResidents.push(hoF);
      religions[hoF.religion || 'Lainnya'] = (religions[hoF.religion || 'Lainnya'] || 0) + 1;
      educations[hoF.education || 'Lainnya'] = (educations[hoF.education || 'Lainnya'] || 0) + 1;
      occupations[hoF.job || 'Lainnya'] = (occupations[hoF.job || 'Lainnya'] || 0) + 1;
      economicStatuses[hoF.economic || 'Sejahtera'] = (economicStatuses[hoF.economic || 'Sejahtera'] || 0) + 1;

      // Family Members
      h.familyMembers?.forEach(m => {
        const member = { gender: m.gender || 'Laki-laki', age: calculateAge(m.birthDate), religion: h.religion || 'Lainnya', education: m.education || 'Lainnya', job: m.job || 'Lainnya' };
        allResidents.push(member);
        religions[member.religion] = (religions[member.religion] || 0) + 1;
        educations[member.education] = (educations[member.education] || 0) + 1;
        occupations[member.job] = (occupations[member.job] || 0) + 1;
      });
    }
  });

  // Calculate totalSoul using the occupants field from houses to ensure consistency with the dashboard
  const totalSoul = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
  const totalRegistered = allResidents.length;

  // Header
  let logoData = '';
  try { logoData = await getImageData(config.logo); } catch (e) {}
  if (logoData) doc.addImage(logoData, 'PNG', 20, 10, 22, 28);

  doc.setFont("times", "normal");
  doc.setFontSize(14);
  doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
  doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'}`, centerX, 20, { align: "center" });
  doc.text(`KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 26, { align: "center" });
  doc.text(`PENGURUS ${config.rtName}`, centerX, 32, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });
  doc.setLineWidth(1); doc.line(20, 42, 190, 42);
  doc.setLineWidth(0.3); doc.line(20, 43, 190, 43);

  // Report Title
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN ANALITIK & DEMOGRAFI TERPADU", centerX, 55, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, centerX, 61, { align: "center" });

  let y = 70;

  // Executive Summary Cards
  const drawCard = (x: number, y: number, w: number, h: number, title: string, data: string, color: [number, number, number]) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, w, h, 3, 3, 'F');
    doc.setTextColor(255);
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.text(title, x + (w / 2), y + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text(data, x + (w / 2), y + 17, { align: "center" });
    doc.setTextColor(0);
  };

  const cardW = (contentWidth - 10) / 3;
  drawCard(margin, y, cardW, 25, "TOTAL SELURUH JIWA", totalSoul.toString(), [79, 70, 229]);
  drawCard(margin + cardW + 5, y, cardW, 25, "RUMAH TANGGA AKTIF", totalOccupied.toString(), [16, 185, 129]);
  drawCard(margin + (cardW * 2) + 10, y, cardW, 25, "KENDARAAN WARGA", houses.reduce((acc, h) => acc + (h.vehicleCount || 0), 0).toString(), [245, 158, 11]);

  y += 35;

  // I. Demografi Dasar
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y - 6, contentWidth, 9, 'F');
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("times", "bold");
  doc.text("I. KOMPOSISI DEMOGRAFI DASAR", margin + 3, y);
  doc.setTextColor(0);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Kategori Demografi', 'Jumlah JIwa', 'Persentase']],
    body: [
      ['Laki-laki', allResidents.filter(r => r.gender === 'Laki-laki').length, `${((allResidents.filter(r => r.gender === 'Laki-laki').length / totalSoul) * 100).toFixed(1)}%`],
      ['Perempuan', allResidents.filter(r => r.gender === 'Perempuan').length, `${((allResidents.filter(r => r.gender === 'Perempuan').length / totalSoul) * 100).toFixed(1)}%`],
      ['Bayi (0-1)', totalBabies, `${((totalBabies / totalSoul) * 100).toFixed(1)}%`],
      ['Balita (1-5)', totalToddlers, `${((totalToddlers / totalSoul) * 100).toFixed(1)}%`],
      ['Anak (6-12)', totalChildren, `${((totalChildren / totalSoul) * 100).toFixed(1)}%`],
      ['Remaja (13-18)', totalTeenagers, `${((totalTeenagers / totalSoul) * 100).toFixed(1)}%`],
      ['Dewasa (19-55)', totalAdults, `${((totalAdults / totalSoul) * 100).toFixed(1)}%`],
      ['Lansia (55+)', totalElderly, `${((totalElderly / totalSoul) * 100).toFixed(1)}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: margin },
    tableWidth: contentWidth
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // II. Kelompok Rentan & Bantuan Sosial
  if (y > 200) { doc.addPage(); y = 30; }
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y - 6, contentWidth, 9, 'F');
  doc.setTextColor(255);
  doc.text("II. KELOMPOK RENTAN & BANTUAN SOSIAL", margin + 3, y);
  doc.setTextColor(0);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Indikator Kesejahteraan', 'Jumlah Unit/Jiwa', 'Keterangan']],
    body: [
      ['Ibu Hamil', totalPregnant, 'Jiwa'],
      ['Janda / Duda', totalWidows, 'Jiwa'],
      ['Penyandang Disabilitas', totalDisability, 'Jiwa'],
      ['Anak Yatim / Piatu', totalOrphans, 'Jiwa'],
      ['Penerima PKH', totalPKH, 'Rumah Tangga'],
      ['Penerima BLT', totalBLT, 'Rumah Tangga'],
      ['Penerima Bansos Lain', totalBansosLain, 'Rumah Tangga'],
      ['Status Ekonomi Sejahtera', economicStatuses['Sejahtera'] || 0, 'Rumah Tangga'],
      ['Status Ekonomi Prasejahtera', economicStatuses['Prasejahtera'] || 0, 'Rumah Tangga'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] },
    margin: { left: margin },
    tableWidth: contentWidth
  });

  y = (doc as any).lastAutoTable.finalY + 15;

  // III. Pekerjaan & Pendidikan
  if (y > 200) { doc.addPage(); y = 30; }
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y - 6, contentWidth, 9, 'F');
  doc.setTextColor(255);
  doc.text("III. SEBARAN PEKERJAAN & PENDIDIKAN", margin + 3, y);
  doc.setTextColor(0);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['Kategori Pekerjaan', 'Jumlah']],
    body: Object.entries(occupations).sort((a, b) => b[1] - a[1]).slice(0, 10).map(o => [o[0], o[1]]),
    theme: 'striped',
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: margin },
    tableWidth: contentWidth / 2 - 5
  });
  const finalYOcc = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: y,
    head: [['Jenjang Pendidikan', 'Jumlah']],
    body: Object.entries(educations).sort((a, b) => b[1] - a[1]).map(e => [e[0], e[1]]),
    theme: 'striped',
    headStyles: { fillColor: [236, 72, 153] },
    margin: { left: centerX + 5 },
    tableWidth: contentWidth / 2 - 5
  });
  const finalYEdu = (doc as any).lastAutoTable.finalY;

  y = Math.max(finalYOcc, finalYEdu) + 15;

  // IV. Ringkasan Keuangan (Garis Besar)
  if (y > 200) { doc.addPage(); y = 30; }
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y - 6, contentWidth, 9, 'F');
  doc.setTextColor(255);
  doc.text("IV. RINGKASAN KEUANGAN & OPERASIONAL", margin + 3, y);
  doc.setTextColor(0);
  y += 10;

  const income = cashFlow.filter(c => c.type === 'Income').reduce((acc, c) => acc + c.amount, 0);
  const expense = cashFlow.filter(c => c.type === 'Expense').reduce((acc, c) => acc + c.amount, 0);
  const balance = income - expense;

  const formatIDR = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

  autoTable(doc, {
    startY: y,
    body: [
      ['Total Pemasukan Kas', formatIDR(income)],
      ['Total Pengeluaran Kas', formatIDR(expense)],
      ['Saldo Kas Saat Ini', formatIDR(balance)],
      ['Total Laporan Warga', reports.length.toString()],
      ['Laporan Selesai Ditangani', reports.filter(r => r.status === 'Selesai').length.toString()],
    ],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { halign: 'right' } },
    margin: { left: margin },
    tableWidth: 100
  });

  // Verification
  y = (doc as any).lastAutoTable.finalY + 15;
  if (y > 230) { doc.addPage(); y = 30; }

  const signX = pageWidth - 60;
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.text(`Dicetak di Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
  y += 6;
  doc.text(`Ketua ${config.rtName}`, signX, y, { align: "center" });

  const signSpaceY = y + 2;
  y += 25;
  doc.setFont("times", "bold");
  doc.text(config.rtChairman, signX, y, { align: "center" });
  doc.line(signX - 25, y + 1, signX + 25, y + 1);

  try {
    if (config.signature) {
      const signImg = await getImageData(config.signature);
      if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
    }
    if (config.stamp) {
      const stampImg = await getImageData(config.stamp);
      if (stampImg) doc.addImage(stampImg, 'PNG', signX - 28, signSpaceY - 2, 22, 22);
    }
  } catch (e) {}

  // SODD Verification
  const footerY = pageHeight - 40;
  doc.setDrawColor(200); doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  
  try {
    const verificationUrl = `${window.location.origin}/#/analytics-verify/${new Date().getTime()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 200 });
    doc.addImage(qrCodeDataUrl, 'PNG', margin, footerY + 5, 20, 20);
  } catch (e) {}

  doc.setFont("times", "normal"); doc.setFontSize(8); doc.setTextColor(100);
  doc.text("Laporan ini dihasilkan secara otomatis oleh Sistem Teras Warga RT 02.", margin + 25, footerY + 10);
  doc.text("Data yang disajikan bersifat real-time berdasarkan input pengurus.", margin + 25, footerY + 15);

  const totalP = doc.getNumberOfPages();
  for (let i = 1; i <= totalP; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.text(`Halaman ${i} dari ${totalP}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  doc.save(`Laporan_Analitik_RT02_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateResidentCardPDF = async (house: House, customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ 
        orientation: "landscape", 
        unit: "mm", 
        format: [85.6, 53.98], // Standard ID-1 Card Size
        compress: true 
    });

    const cardWidth = 85.6;
    const cardHeight = 53.98;

    // Background Gradient / Styling
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, cardWidth, cardHeight, "F");

    // Header Stripe
    doc.setFillColor(79, 70, 229); // Indigo 600
    doc.rect(0, 0, cardWidth, 12, "F");

    // Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`KARTU DOMISILI WARGA RT 02`, 6, 6);
    
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(224, 231, 255);
    doc.text(`${config.kelurahan || 'Kelurahan Tondo'} - ${config.kota || 'Palu'}`, 6, 9.5);

    // House Block Badge
    doc.setFillColor(238, 242, 255);
    doc.roundedRect( cardWidth - 24, 3, 20, 6, 1.5, 1.5, "F" );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(67, 56, 202);
    doc.text(`BLOK ${house.block}-${house.number}`, cardWidth - 14, 7, { align: "center" });

    // Citizen Info Body
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.text(house.headOfFamily || 'Penghuni RT 02', 6, 18);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`NIK: ${house.nik || '-'}`, 6, 22);
    doc.text(`No. KK: ${house.kkNumber || '-'}`, 6, 25.5);
    doc.text(`Status Kepenghunian: ${house.residenceType || 'Tetap'} (${house.status === 'Occupied' ? 'Dihuni' : 'Kosong'})`, 6, 29);
    doc.text(`Alamat KTP: ${house.addressKtp ? house.addressKtp.substring(0, 32) : 'RT 02 RW 01'}`, 6, 32.5);

    // QR Code Generation for Verification
    try {
        const verifyData = `VERIFIED-RT02:${house.block}-${house.number}:${house.headOfFamily}:${house.nik || 'VALID'}`;
        const qrDataUrl = await QRCode.toDataURL(verifyData, { margin: 1, width: 80 });
        doc.addImage(qrDataUrl, 'PNG', cardWidth - 22, 17, 18, 18);
        doc.setFontSize(4.5);
        doc.setTextColor(100, 116, 139);
        doc.text("Scan Validasi RT", cardWidth - 13, 37, { align: "center" });
    } catch (e) {
        console.error("QR Code Error:", e);
    }

    // Footer Stamp & Verification Note
    doc.setDrawColor(226, 232, 240);
    doc.line(6, 41, cardWidth - 6, 41);

    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text("● TERVERIFIKASI RESMI PENGURUS RT 02", 6, 45);

    doc.setFontSize(4.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Dokumen Sah Digital RT 02`, 6, 48.5);

    doc.save(`Kartu_Warga_RT02_${house.block}-${house.number}_${(house.headOfFamily || 'Warga').replace(/\s+/g, '_')}.pdf`);
    toast.success(`Kartu Warga (PDF) berhasil diunduh untuk Blok ${house.block}-${house.number}`);
};

export const generateMutationReportPDF = async (report: PopulationReport, logs: PopulationChangeLog[], customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 15;

    // Header Kop Surat RT 02
    let logoData = '';
    try {
        logoData = await getImageData(config.logo);
    } catch (e) { console.error(e); }

    const centerX = pageWidth / 2;
    if (logoData) {
        doc.addImage(logoData, 'PNG', 15, 10, 20, 25);
    }

    doc.setFont("helvetica", "bold"); 
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(`PEMERINTAH KOTA ${config.kota || 'PALU'}`, centerX, 14, { align: "center" });
    doc.text(`KECAMATAN ${config.kecamatan || 'MANTIKULORE'} - KELURAHAN ${config.kelurahan || 'TONDO'}`, centerX, 19.5, { align: "center" });
    doc.text(`PENGURUS RUKUN TETANGGA 02`, centerX, 25, { align: "center" });

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Alamat: ${config.rtAddress || 'Jl. Tondo Utama RT 02 Palu'}`, centerX, 30, { align: "center" });

    doc.setLineWidth(0.8);
    doc.setDrawColor(30, 41, 59);
    doc.line(15, 33, pageWidth - 15, 33);
    doc.setLineWidth(0.2);
    doc.line(15, 34, pageWidth - 15, 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("LAPORAN REKAPITULASI MUTASI & DINAMIKA WARGA", centerX, 41, { align: "center" });
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`PERIODE: BULAN ${report.month.toUpperCase()} ${report.year}`, centerX, 46, { align: "center" });

    currentY = 52;

    // Metric Summary Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 24, 3, 3, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, pageWidth - (margin * 2), 24, 3, 3, "D");

    const colW = (pageWidth - (margin * 2)) / 5;
    const stats = [
        { label: "Warga Awal", val: report.initialPopulation },
        { label: "Warga Masuk", val: `+${report.newcomerCount}` },
        { label: "Pindah Out", val: `-${report.movedOutCount}` },
        { label: "Kelahiran", val: `+${report.birthCount}` },
        { label: "Kematian", val: `-${report.deathCount}` }
    ];

    stats.forEach((s, idx) => {
        const x = margin + (idx * colW) + (colW / 2);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(s.label.toUpperCase(), x, currentY + 7, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(String(s.val), x, currentY + 16, { align: "center" });
    });

    currentY += 32;

    // Section 1: Detailed Mutation Logs Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("A. RINCIAN CATATAN MUTASI WARGA", margin, currentY);
    currentY += 5;

    const filteredLogs = logs.filter(l => l.date.startsWith(report.month));

    const colWidths = [10, 25, 28, 45, 30, 42];
    const headers = ['NO', 'TANGGAL', 'JENIS MUTASI', 'NAMA WARGA', 'KONTAK', 'KETERANGAN'];

    // Table Header
    doc.setFillColor(79, 70, 229);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    headers.forEach((h, i) => {
        const align = (i === 0 || i === 1) ? "center" : "left";
        const xPos = align === "center" ? curX + (colWidths[i] / 2) : curX + 2;
        doc.text(h, xPos, currentY + 5.5, { align });
        curX += colWidths[i];
    });

    currentY += 8;

    // Table Rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    if (filteredLogs.length === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - (margin * 2), 10, 'F');
        doc.setTextColor(148, 163, 184);
        doc.text("Tidak ada catatan mutasi warga pada periode bulan ini", pageWidth / 2, currentY + 6.5, { align: "center" });
        currentY += 10;
    } else {
        filteredLogs.forEach((log, i) => {
            if (currentY > 260) {
                doc.addPage();
                currentY = 20;
            }

            if (i % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margin, currentY, pageWidth - (margin * 2), 8, 'F');
            }

            let cX = margin;
            doc.text((i + 1).toString(), cX + (colWidths[0] / 2), currentY + 5.5, { align: "center" });
            cX += colWidths[0];

            doc.text(log.date, cX + (colWidths[1] / 2), currentY + 5.5, { align: "center" });
            cX += colWidths[1];

            const typeLabel = log.type === 'Newcomer' ? 'Warga Masuk' : log.type === 'MovedOut' ? 'Pindah Out' : log.type === 'Birth' ? 'Kelahiran' : 'Kematian';
            doc.setFont("helvetica", "bold");
            doc.text(typeLabel, cX + 2, currentY + 5.5);
            doc.setFont("helvetica", "normal");
            cX += colWidths[2];

            const name = log.name.length > 22 ? log.name.substring(0, 20) + '..' : log.name;
            doc.text(name, cX + 2, currentY + 5.5);
            cX += colWidths[3];

            doc.text(log.phone || '-', cX + 2, currentY + 5.5);
            cX += colWidths[4];

            const desc = (log.description || '-').length > 22 ? (log.description || '-').substring(0, 20) + '..' : (log.description || '-');
            doc.text(desc, cX + 2, currentY + 5.5);

            currentY += 8;
        });
    }

    currentY += 15;

    // Signatures Section
    if (currentY > 230) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dokumen disahkan pada: Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, currentY);
    currentY += 10;

    const sigW = (pageWidth - (margin * 2)) / 2;
    
    // Left Sig: Sekretaris RT
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Sekretaris RT 02", margin + (sigW / 2), currentY, { align: "center" });
    doc.text("( ..................................... )", margin + (sigW / 2), currentY + 25, { align: "center" });

    // Right Sig: Ketua RT
    doc.text("Ketua RT 02", margin + sigW + (sigW / 2), currentY, { align: "center" });
    doc.text(config.ketuaRtName || "( ..................................... )", margin + sigW + (sigW / 2), currentY + 25, { align: "center" });

    doc.save(`Laporan_Mutasi_Warga_RT02_${report.month}.pdf`);
    toast.success(`Laporan Mutasi (PDF) Periode ${report.month} berhasil diunduh!`);
};
