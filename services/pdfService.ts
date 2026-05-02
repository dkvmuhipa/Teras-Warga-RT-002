
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { LetterRequest, PdfConfig, House, PaymentStatus, Report, PopulationReport, OfficialLetter } from "../types";
import { DEFAULT_PDF_CONFIG } from "../constants";

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
    let logoDrawn = false;
    try {
        const logoData = await getImageData(config.logo);
        if (logoData) {
            doc.addImage(logoData, 'PNG', 20, 10, 22, 28);
            logoDrawn = true;
        }
    } catch (e) { console.error(e); }

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
export const getDriveThumbnail = (url: string): string => {
  const id = getDriveId(url);
  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w800`;
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
      if (config.stamp) {
          try {
             const stampImg = await getImageData(config.stamp);
             // Ukuran stempel diperkecil lagi (20x20) dan posisi disesuaikan
             if (stampImg) doc.addImage(stampImg, 'PNG', rightSignX - 25, signSpaceY - 2, 25, 25);
          } catch(e) {}
      }

      if (config.signature) {
          try {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', rightSignX - 15, signSpaceY, 30, 20);
          } catch(e) {}
      }
  }

  const filenamePrefix = isDraft ? "DRAFT_" : "RESMI_";
  const safeApplicantName = letter.applicantName.replace(/[^a-z0-9]/gi, '_');
  const safeTitle = title.replace(/[^a-z0-9]/gi, '_');
  doc.save(`${filenamePrefix}Surat_${safeTitle}_${safeApplicantName}.pdf`);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    alert("Gagal membuat PDF: " + (error instanceof Error ? error.message : "Unknown error"));
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
        if (config.stamp) {
          const stampImg = await getImageData(config.stamp);
          if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY - 5, 25, 25);
        }
        if (config.signature) {
          const signImg = await getImageData(config.signature);
          if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY, 30, 20);
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
    alert("Gagal membuat PDF: " + (error instanceof Error ? error.message : "Unknown error"));
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
    const centerX = doc.internal.pageSize.getWidth() / 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BUKTI LAPORAN WARGA", centerX, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ID Laporan: ${report.id}`, centerX, 28, { align: "center" });
    doc.text(`Tanggal: ${new Date(report.date).toLocaleDateString('id-ID')}`, centerX, 34, { align: "center" });

    doc.setLineWidth(0.5);
    doc.line(10, 40, 138, 40);

    let y = 50;
    const addField = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 15, y);
        doc.setFont("helvetica", "normal");
        const splitVal = doc.splitTextToSize(value, 80);
        doc.text(splitVal, 50, y);
        y += (splitVal.length * 5) + 5;
    };

    addField("Kategori", report.type);
    addField("Pelapor", report.reporterName);
    addField("Lokasi", report.houseId || "-");
    addField("Deskripsi", report.description);
    addField("Status", report.status);

    doc.setFontSize(8);
    doc.text("Simpan bukti ini sebagai referensi.", centerX, y + 10, { align: "center" });
    
    doc.save(`Bukti_Lapor_${report.id}.pdf`);
};

export const generateResidentReportPDF = async (houses: House[], customConfig?: PdfConfig) => {
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

    const drawHeader = () => {
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
    };

    drawHeader();
    
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("DAFTAR INDUK DATA WARGA", centerX, 52, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, 52);

    let y = 60;
    const colWidths = {
        no: 8,
        blok: 12,
        no_rumah: 12,
        nama: 55,
        owner: 55,
        status: 20,
        tipe: 20,
        jml: 10,
        kontak: 30,
        ekonomi: 25,
        keterangan: 20
    };

    const headers = [
        { label: "NO", w: colWidths.no },
        { label: "BLOK", w: colWidths.blok },
        { label: "NO RMH", w: colWidths.no_rumah },
        { label: "NAMA KEPALA KELUARGA", w: colWidths.nama },
        { label: "PEMILIK RUMAH", w: colWidths.owner },
        { label: "STATUS", w: colWidths.status },
        { label: "KEPEMILIKAN", w: colWidths.tipe },
        { label: "JIWA", w: colWidths.jml },
        { label: "TELEPON", w: colWidths.kontak },
        { label: "EKONOMI", w: colWidths.ekonomi },
        { label: "KET", w: colWidths.keterangan }
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

    const sortedHouses = [...houses].sort((a,b) => {
        const blockComp = a.block.localeCompare(b.block);
        if (blockComp !== 0) return blockComp;
        return a.number.localeCompare(b.number, undefined, { numeric: true });
    });

    sortedHouses.forEach((h, i) => {
        if (y > pageHeight - 20) {
            doc.addPage();
            drawHeader();
            y = 60;
            drawTableHeader(y);
            y += 8;
        }

        // Zebra striping
        if (i % 2 !== 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 5, contentWidth, 7, 'F');
        }

        doc.setFont("times", "normal");
        doc.setFontSize(8.5);
        
        let currX = margin;
        const rowData = [
            (i + 1).toString(),
            h.block,
            h.number,
            h.headOfFamily.toUpperCase(),
            (h.ownerName || '-').toUpperCase(),
            h.status === 'Occupied' ? 'DIHUNI' : h.status === 'Empty' ? 'KOSONG' : 'USAHA',
            h.residenceType || '-',
            (h.occupants || 0).toString(),
            h.phone || '-',
            h.economicStatus || '-',
            h.isVerified ? 'VERIF' : 'PENDING'
        ];

        rowData.forEach((text, idx) => {
            const w = headers[idx].w;
            const align = (idx === 0 || idx === 1 || idx === 2 || idx === 7 || idx === 5 || idx === 6) ? "center" : "left";
            const xPos = align === "center" ? currX + (w / 2) : currX + 2;
            
            const truncatedText = doc.getTextWidth(text) > w - 2 ? doc.splitTextToSize(text, w - 5)[0] + "..." : text;
            doc.text(truncatedText, xPos, y, { align: align as any });
            currX += w;
        });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        
        y += 7;
    });

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

    // Header / Kop Surat Mini
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`PENGURUS ${config.rtName}`, centerX, 15, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.text(config.rtAddress, centerX, 20, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(margin, 23, pageWidth - margin, 23);

    // Title
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("KWITANSI PEMBAYARAN IURAN", centerX, 32, { align: "center" });
    
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`No. Ref: ${payment.id.substring(0, 8).toUpperCase()}`, pageWidth - margin - 5, 40, { align: "right" });

    // Content Table-like structure
    let y = 50;
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
    y += 25;
    const signX = pageWidth - 45;
    doc.setFontSize(9);
    doc.setFont("times", "normal");
    doc.text(`Palu, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, signX, y, { align: "center" });
    doc.text("Penerima / Bendahara,", signX, y + 5, { align: "center" });
    
    y += 20;
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y, { align: "center" });
    doc.line(signX - 15, y + 1, signX + 15, y + 1);

    // Footer
    doc.setFontSize(7);
    doc.setFont("times", "italic");
    doc.setTextColor(150);
    doc.text("* Bukti pembayaran ini sah dan diterbitkan secara digital.", margin + 5, pageHeight - 10);

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
        { header: "Tgl", width: 25, x: margin },
        { header: "Keterangan", width: 80, x: margin + 25 },
        { header: "Kategori", width: 30, x: margin + 105 },
        { header: "Pemasukan", width: 30, x: margin + 135 },
        { header: "Pengeluaran", width: 30, x: margin + 165 },
    ];

    // Table Header
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 5, contentWidth, 7, 'F');
    doc.setFontSize(9);
    cols.forEach(col => doc.text(col.header, col.x + 2, y));
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
        
        doc.text(cf.category, cols[2].x + 2, y);
        
        if (cf.type === 'Income') {
            doc.text(cf.amount.toLocaleString(), pageWidth - margin - 35, y, { align: "right" });
        } else {
            doc.text(cf.amount.toLocaleString(), pageWidth - margin - 5, y, { align: "right" });
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

    try {
        if (config.stamp) {
            const stampImg = await getImageData(config.stamp);
            if (stampImg) doc.addImage(stampImg, 'PNG', signX - 25, signSpaceY, 25, 25);
        }
        if (config.signature) {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signSpaceY + 2, 30, 20);
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
        doc.text(guest.guestName, cols[1].x + 2, y + 5);
        doc.text(guest.guestNik || '-', cols[2].x + 2, y + 5);
        doc.text(guest.relationship, cols[3].x + 2, y + 5);
        doc.text(guest.residentName, cols[4].x + 2, y + 5);
        doc.text(guest.purpose || '-', cols[5].x + 2, y + 5);
        doc.text(new Date(guest.arrivalDate).toLocaleDateString('id-ID'), cols[6].x + 2, y + 5);
        doc.text(guest.stayDuration, cols[7].x + 2, y + 5);
        doc.text(guest.phone, cols[8].x + 2, y + 5);
        doc.text(guest.status === 'Active' ? 'Aktif' : 'Pulang', cols[9].x + 2, y + 5);

        doc.rect(margin, y, contentWidth, rowHeight);
        y += rowHeight;
    });

    doc.save(`Laporan_Tamu_${new Date().toISOString().split('T')[0]}.pdf`);
};
