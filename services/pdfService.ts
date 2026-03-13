
import { jsPDF } from "jspdf";
import { LetterRequest, PdfConfig, House, PaymentStatus, Report, PopulationReport } from "../types";
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

    let y = 70;
    const rowHeight = 10;

    // --- Section 1: Mutasi Penduduk ---
    doc.setFont("times", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 6, contentWidth, 8, 'F');
    doc.text("I. DATA MUTASI PENDUDUK", margin + 2, y);
    y += 12;

    const addStatRow = (label: string, value: string | number, isBold = false, color?: [number, number, number]) => {
        doc.setFont("times", isBold ? "bold" : "normal");
        doc.setFontSize(11);
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, margin + 5, y);
        doc.text(value.toString(), pageWidth - margin - 5, y, { align: "right" });
        doc.setTextColor(0);
        
        doc.setDrawColor(230);
        doc.setLineWidth(0.1);
        doc.line(margin + 5, y + 2, pageWidth - margin - 5, y + 2);
        y += rowHeight;
    };

    addStatRow("1. Penduduk Awal Bulan", report.initialPopulation);
    addStatRow("2. Kelahiran (+)", `+ ${report.birthCount}`, false, [16, 185, 129]);
    addStatRow("3. Kematian (-)", `- ${report.deathCount || 0}`, false, [239, 68, 68]);
    addStatRow("4. Pendatang (+)", `+ ${report.newcomerCount}`, false, [37, 99, 235]);
    addStatRow("5. Pindah Keluar (-)", `- ${report.movedOutCount}`, false, [245, 158, 11]);
    
    const totalAkhir = report.initialPopulation + report.birthCount + report.newcomerCount - report.movedOutCount - (report.deathCount || 0);
    y += 2;
    doc.setFillColor(240, 244, 255);
    doc.rect(margin, y - 7, contentWidth, 10, 'F');
    addStatRow("TOTAL PENDUDUK AKHIR", totalAkhir, true, [79, 70, 229]);

    y += 10;

    // --- Section 2: Kelompok Rentan ---
    doc.setFont("times", "bold");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 6, contentWidth, 8, 'F');
    doc.text("II. DATA KELOMPOK RENTAN", margin + 2, y);
    y += 12;

    addStatRow("1. Ibu Hamil", report.pregnantCount || 0);
    addStatRow("2. Bayi", report.babyCount || 0);
    addStatRow("3. Balita", report.toddlerCount || 0);
    addStatRow("4. Remaja", report.teenagerCount || 0);
    addStatRow("5. Dewasa", report.adultCount || 0);
    addStatRow("6. Lansia", report.elderlyCount || 0);
    addStatRow("7. Janda", report.widowCount || 0);

    // --- Signature Section ---
    y += 15;
    if (y > pageHeight - 60) {
        doc.addPage();
        y = 30;
    }

    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const signX = pageWidth - 60;
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, y, { align: "center" });
    doc.text(`Ketua ${config.rtName}`, signX, y + 6, { align: "center" });
    
    const signSpaceY = y + 8;
    
    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, y + 35, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), y + 36, signX + (chairmanWidth / 2), y + 36);

    // Add Stamp and Signature if available
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

    // Footer
    doc.setFontSize(8);
    doc.setFont("times", "italic");
    doc.setTextColor(150);
    doc.text(`Dicetak otomatis melalui Sistem Teras Warga pada ${new Date().toLocaleString('id-ID')}`, margin, pageHeight - 10);

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
  const nomorSurat = letter.letterNumber || `.../RT. 002/RW. 020/${currentMonthRoman}/${currentYear}`;
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
    const footerY = pageHeight - 35;
    doc.setDrawColor(220);
    doc.setLineWidth(0.1);
    doc.line(marginX, footerY, pageWidth - marginX, footerY);
    
    // QR Code Placeholder
    doc.setFillColor(245, 245, 245);
    doc.rect(marginX, footerY + 5, 20, 20, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(marginX, footerY + 5, 20, 20, 'S');
    
    // Simple QR Pattern
    doc.setDrawColor(50);
    doc.setLineWidth(0.5);
    doc.rect(marginX + 2, footerY + 7, 4, 4);
    doc.rect(marginX + 14, footerY + 7, 4, 4);
    doc.rect(marginX + 2, footerY + 19, 4, 4);
    doc.rect(marginX + 7, footerY + 11, 6, 6);

    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text("VERIFIKASI DIGITAL RT 002", marginX + 25, footerY + 10);
    doc.text(`ID Dokumen: ${letter.id.substring(0, 8).toUpperCase()}-${letter.houseId}`, marginX + 25, footerY + 14);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, marginX + 25, footerY + 18);
    doc.text("Dokumen ini sah dan diverifikasi secara elektronik.", marginX + 25, footerY + 22);
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
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    let logoDrawn = false;
    try {
        const logoData = await getImageData(config.logo);
        if (logoData) {
            doc.addImage(logoData, 'PNG', margin, 10, 20, 25);
            logoDrawn = true;
        }
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

    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`LAPORAN DATA WARGA ${config.rtName}`, centerX, 52, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Per Tanggal: ${dateString}`, centerX, 57, { align: "center" });

    let startY = 65;
    const rowHeight = 8;
    const cols = [
        { header: "No", width: 10, x: margin },
        { header: "Blok/Rumah", width: 30, x: margin + 10 },
        { header: "Kepala Keluarga", width: 80, x: margin + 40 },
        { header: "Jml", width: 15, x: margin + 120 },
        { header: "Status Hunian", width: 35, x: margin + 135 },
        { header: "Air", width: 18, x: margin + 170 },
        { header: "Sampah", width: 17, x: margin + 188 },
        { header: "No. HP", width: 40, x: margin + 205 },
        { header: "Ket", width: 32, x: margin + 245 },
    ];

    const drawTableHeader = (y: number) => {
        doc.setFillColor(230, 230, 230);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        cols.forEach(col => {
            doc.text(col.header, col.x + 1, y + 5);
        });
        
        doc.setDrawColor(0);
        doc.rect(margin, y, contentWidth, rowHeight);
        
        let currentX = margin;
        cols.forEach(col => {
             doc.line(currentX, y, currentX, y + rowHeight);
             currentX += col.width;
        });
        doc.line(currentX, y, currentX, y + rowHeight);
    };

    drawTableHeader(startY);
    let currentY = startY + rowHeight;

    doc.setFont("times", "normal");
    doc.setFontSize(10);
    
    const sortedHouses = [...houses].sort((a,b) => {
        if(a.block === b.block) return parseInt(a.number, 10) - parseInt(b.number, 10);
        return a.block.localeCompare(b.block);
    });

    sortedHouses.forEach((house, index) => {
        if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
            drawTableHeader(currentY);
            currentY += rowHeight;
        }

        const no = (index + 1).toString();
        const address = `${house.block}-${house.number}`;
        const name = house.headOfFamily;
        const count = house.occupants.toString();
        
        let status = house.status === 'Occupied' ? 'Dihuni' : (house.status === 'Business' ? 'Usaha' : 'Kosong');
        if (house.status === 'Occupied') {
             if (house.residenceType === 'Kontrak') status += " (Kontrak)";
             else if (house.residenceType === 'Kost') status += " (Kost)";
             else status += " (Pemilik)";
        }

        const paymentAir = house.paymentStatusAir || PaymentStatus.UNPAID;
        const paymentSampah = house.paymentStatusSampah || PaymentStatus.UNPAID;
        const phone = house.phone || '-';
        
        const notes = [];
        if(house.pregnantCount && house.pregnantCount > 0) notes.push("Hamil");
        if(house.babyCount && house.babyCount > 0) notes.push("Bayi");
        if(house.toddlerCount && house.toddlerCount > 0) notes.push("Balita");
        if(house.teenagerCount && house.teenagerCount > 0) notes.push("Remaja");
        if(house.adultCount && house.adultCount > 0) notes.push("Dewasa");
        if(house.elderlyCount && house.elderlyCount > 0) notes.push("Lansia");
        if(house.widowCount && house.widowCount > 0) notes.push("Janda");
        const ket = notes.join(', ');

        doc.text(no, cols[0].x + 1, currentY + 5);
        doc.text(address, cols[1].x + 1, currentY + 5);
        doc.text(name, cols[2].x + 1, currentY + 5);
        doc.text(count, cols[3].x + 1, currentY + 5);
        
        const splitStatus = doc.splitTextToSize(status, cols[4].width - 2);
        doc.text(splitStatus, cols[4].x + 1, currentY + 5);
        
        // Air
        if (paymentAir === PaymentStatus.UNPAID) doc.setTextColor(220, 38, 38);
        else if (paymentAir === PaymentStatus.PENDING) doc.setTextColor(217, 119, 6);
        doc.text(paymentAir === PaymentStatus.PAID ? 'L' : 'B', cols[5].x + 1, currentY + 5);
        doc.setTextColor(0);

        // Sampah
        if (paymentSampah === PaymentStatus.UNPAID) doc.setTextColor(220, 38, 38);
        else if (paymentSampah === PaymentStatus.PENDING) doc.setTextColor(217, 119, 6);
        doc.text(paymentSampah === PaymentStatus.PAID ? 'L' : 'B', cols[6].x + 1, currentY + 5);
        doc.setTextColor(0);

        doc.text(phone, cols[7].x + 1, currentY + 5);
        doc.text(ket, cols[8].x + 1, currentY + 5);

        doc.rect(margin, currentY, contentWidth, rowHeight);
        
        let currentX = margin;
        cols.forEach(col => {
            doc.line(currentX, currentY, currentX, currentY + rowHeight);
            currentX += col.width;
        });
        doc.line(currentX, currentY, currentX, currentY + rowHeight);

        currentY += rowHeight;
    });

    currentY += 5;
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

    const totalPermanent = houses.filter(h => h.status === 'Occupied' && (h.residenceType === 'Tetap' || !h.residenceType)).length;
    const totalRenter = houses.filter(h => h.status === 'Occupied' && h.residenceType === 'Kontrak').length;
    const totalBoarding = houses.filter(h => h.status === 'Occupied' && h.residenceType === 'Kost').length;
    const totalEmpty = houses.filter(h => h.status === 'Empty').length;
    const totalPeople = houses.reduce((acc, h) => acc + h.occupants, 0);

    doc.setFont("times", "bold");
    doc.text("REKAPITULASI:", margin, currentY);
    currentY += 5;
    doc.setFont("times", "normal");
    doc.text(`Total Unit Rumah: ${houses.length} Unit`, margin, currentY);
    doc.text(`Total Kepala Keluarga: ${houses.length}`, margin + 70, currentY);
    currentY += 5;
    doc.text(`Dihuni Tetap (Pemilik): ${totalPermanent}`, margin, currentY);
    doc.text(`Dihuni Kontrak/Sewa: ${totalRenter}`, margin + 70, currentY);
    doc.text(`Dihuni Kost: ${totalBoarding}`, margin + 140, currentY);
    currentY += 5;
    doc.text(`Rumah Kosong: ${totalEmpty}`, margin, currentY);
    doc.text(`Estimasi Total Penduduk: ${totalPeople} Jiwa`, margin + 70, currentY);

    const signY = currentY + 10;
    if (signY + 30 > pageHeight) { doc.addPage(); }

    const signX = pageWidth - 60;
    doc.setFontSize(11);
    doc.text(`Palu, ${dateString}`, signX, signY, { align: "center" });
    doc.text(`Ketua ${config.rtName}`, signX, signY + 6, { align: "center" });

    if (config.signature) {
        try {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signY + 10, 30, 20);
        } catch(e) {}
    }

    doc.setFont("times", "bold");
    doc.text(config.rtChairman, signX, signY + 35, { align: "center" });
    const chairmanWidth = doc.getTextWidth(config.rtChairman);
    doc.line(signX - (chairmanWidth / 2), signY + 36, signX + (chairmanWidth / 2), signY + 36);

    doc.save(`Laporan_Warga_RT002_${new Date().toISOString().split('T')[0]}.pdf`);
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
        { header: "No", width: 10, x: margin },
        { header: "Nama Tamu", width: 50, x: margin + 10 },
        { header: "Hubungan", width: 30, x: margin + 60 },
        { header: "Rumah Dikunjungi", width: 60, x: margin + 90 },
        { header: "Tgl Masuk", width: 30, x: margin + 150 },
        { header: "Durasi", width: 25, x: margin + 180 },
        { header: "No. HP", width: 35, x: margin + 205 },
        { header: "Status", width: 35, x: margin + 240 },
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
        doc.text(guest.relationship, cols[2].x + 2, y + 5);
        doc.text(guest.residentName, cols[3].x + 2, y + 5);
        doc.text(new Date(guest.arrivalDate).toLocaleDateString('id-ID'), cols[4].x + 2, y + 5);
        doc.text(guest.stayDuration, cols[5].x + 2, y + 5);
        doc.text(guest.phone, cols[6].x + 2, y + 5);
        doc.text(guest.status === 'Active' ? 'Menginap' : 'Pulang', cols[7].x + 2, y + 5);

        doc.rect(margin, y, contentWidth, rowHeight);
        y += rowHeight;
    });

    doc.save(`Laporan_Tamu_${new Date().toISOString().split('T')[0]}.pdf`);
};
