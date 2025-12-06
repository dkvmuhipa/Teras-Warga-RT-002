

import { jsPDF } from "jspdf";
import { LetterRequest, PdfConfig, House, PaymentStatus } from "../types";
import { DEFAULT_PDF_CONFIG } from "../constants";

// --- Shared Helper Functions ---
const convertToDirectLink = (url: string): string => {
  if (!url) return '';
  const driveRegex = /\/d\/([a-zA-Z0-9_-]+)|\?id=([a-zA-Z0-9_-]+)/;
  const match = url.match(driveRegex);
  if (match) {
    const id = match[1] || match[2];
    return `https://drive.google.com/uc?export=view&id=${id}`;
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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          try {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) { resolve(''); }
      } else { resolve(''); }
    };
    img.onerror = () => { resolve(''); };
    img.src = directUrl.includes('?') ? `${directUrl}&t=${Date.now()}` : `${directUrl}?t=${Date.now()}`;
  });
};

export const generateSuratPengantar = async (letter: LetterRequest, customConfig?: PdfConfig, isDraft: boolean = true) => {
  const config = customConfig || DEFAULT_PDF_CONFIG;
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // --- Helper Constants ---
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 20;
  const contentWidth = pageWidth - (marginX * 2);
  const centerX = pageWidth / 2;

  // --- 0. WATERMARK (SECURITY) ---
  if (isDraft) {
      doc.saveGraphicsState();
      doc.setTextColor(220, 220, 220); // Light Grey
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      
      // Rotate context for diagonal text
      // Note: jsPDF rotation happens around a point.
      doc.text("DRAFT / MENUNGGU VALIDASI", centerX, pageHeight / 2, { align: "center", angle: 45 });
      
      doc.restoreGraphicsState();
      doc.setTextColor(0, 0, 0); // Reset color
  }

  // --- 1. KOP SURAT (OFFICIAL GOVERNMENT STYLE) ---
  
  // LOGO: Try Image -> Fallback to Vector
  let logoDrawn = false;
  try {
    const logoData = await getImageData(config.logo);
    if (logoData) {
      doc.addImage(logoData, 'PNG', 20, 10, 22, 28); // Logo at left
      logoDrawn = true;
    }
  } catch (e) { console.error(e); }

  // Fallback Vector Logo (Palu Shield)
  if (!logoDrawn) {
     const lx = 30; const ly = 22;
     doc.setDrawColor(0); doc.setLineWidth(0.5);
     doc.lines([[10,0], [0,12], [-10,0], [0,-12]], lx, ly - 6, [1,1], 'S', true);
  }

  // Header Text (Centered)
  doc.setFont("times", "normal"); 
  doc.setFontSize(14);
  doc.text("PEMERINTAH KOTA PALU", centerX, 14, { align: "center" });
  doc.text("KECAMATAN MANTIKULORE", centerX, 20, { align: "center" });
  doc.text("KELURAHAN TONDO", centerX, 26, { align: "center" });
  doc.text("PENGURUS RT.002/RW.020", centerX, 32, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

  // Double Line Separator
  doc.setLineWidth(1.0);
  doc.line(20, 42, 190, 42); // Bold
  doc.setLineWidth(0.3);
  doc.line(20, 43, 190, 43); // Thin

  // --- 2. JUDUL & NOMOR SURAT ---
  const title = letter.type === 'Surat Izin Keramaian' ? "SURAT IZIN KERAMAIAN" : "SURAT PENGANTAR";
  
  doc.setFont("times", "bold", "underline");
  doc.setFontSize(12);
  doc.text(title, centerX, 52, { align: "center" });
  
  doc.setFont("times", "normal"); // Reset underline
  doc.setFontSize(11);
  const currentMonthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
  const currentYear = new Date().getFullYear();
  const nomorSurat = `003/RT. 002/RW. 020/${currentMonthRoman}/${currentYear}`;
  doc.text(`Nomor : ${nomorSurat}`, centerX, 57, { align: "center" });

  // --- 3. ISI SURAT ---
  let cursorY = 66;
  const lineHeight = 6;

  // Intro
  const introText = "Yang bertanda tangan di bawah ini Ketua RT 002 RW 020 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu, Provinsi Sulawesi Tengah menerangkan dengan sebenarnya bahwa :";
  doc.text(introText, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });
  cursorY += 12;

  // Numbered List (1 - 11)
  const labelX = 28;
  const colonX = 72;
  const valueX = 75;

  const fields = [
      { label: "Nama Lengkap", value: letter.applicantName.toUpperCase() },
      { label: "NIK / No KTP", value: letter.nik },
      { label: "Kepala Keluarga", value: letter.familyHeadName.toUpperCase() },
      { label: "Tempat/Tanggal Lahir", value: `${letter.birthPlace.toUpperCase()}, ${letter.birthDate.split('-').reverse().join('-')}` }, // DD-MM-YYYY
      { label: "Jenis Kelamin", value: letter.gender },
      { label: "Alamat/Tempat Tinggal", value: `${letter.addressKtp}, Kel. Tondo, Kec. Mantikulore, Kota Palu` }, 
      { label: "Agama", value: letter.religion },
      { label: "Status", value: letter.maritalStatus },
      { label: "Pekerjaan", value: letter.job },
      { label: "Kewarganegaraan", value: letter.nationality || "Indonesia" },
      { label: "Keperluan", value: letter.purposeDetail || letter.type } 
  ];

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

  // Closing
  const closingText = "Orang tersebut adalah benar-benar warga RT 002 RW 020 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu dengan data seperti di atas.";
  doc.text(closingText, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });
  
  cursorY += 10;
  doc.text("Demikian surat keterangan ini dibuat, untuk dipergunakan sebagaimana mestinya.", marginX, cursorY, { maxWidth: contentWidth, align: "justify" });

  // --- 4. TANDA TANGAN ---
  cursorY += 15;
  const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Left (Pemohon)
  const leftSignX = 50;
  doc.text("Pemohon", leftSignX, cursorY, { align: "center" });

  // Right (Ketua RT)
  const rightSignX = 150;
  doc.text(`Palu, ${dateString}`, rightSignX, cursorY, { align: "center" });
  cursorY += 6;
  doc.text("Ketua RT 002 RW 020", rightSignX, cursorY, { align: "center" });

  // Sign Space
  const signSpaceY = cursorY + 2; 
  cursorY += 25; // Gap for signature

  // Nama Terang
  doc.text(letter.applicantName, leftSignX, cursorY, { align: "center" });
  doc.text("IRFAN ARIANTO", rightSignX, cursorY, { align: "center" });

  // --- 5. RENDER STEMPEL & TTD (SECURE: ONLY IF NOT DRAFT) ---
  if (!isDraft) {
      if (config.stamp) {
          try {
             const stampImg = await getImageData(config.stamp);
             if (stampImg) doc.addImage(stampImg, 'PNG', rightSignX - 20, signSpaceY - 5, 35, 35);
          } catch(e) {}
      }

      if (config.signature) {
          try {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', rightSignX - 15, signSpaceY, 30, 20);
          } catch(e) {}
      }
  }

  // Save PDF
  const filenamePrefix = isDraft ? "DRAFT_" : "RESMI_";
  doc.save(`${filenamePrefix}Surat_${title.replace(/\s/g, '_')}_${letter.applicantName}.pdf`);
};

export const generateResidentReportPDF = async (houses: House[], customConfig?: PdfConfig) => {
    const config = customConfig || DEFAULT_PDF_CONFIG;
    
    // LANDSCAPE MODE
    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const centerX = pageWidth / 2;

    // --- LOGO & HEADER ---
    let logoDrawn = false;
    try {
        const logoData = await getImageData(config.logo);
        if (logoData) {
            doc.addImage(logoData, 'PNG', margin, 10, 20, 25);
            logoDrawn = true;
        }
    } catch (e) {}

    // Header Text
    doc.setFont("times", "normal");
    doc.setFontSize(14);
    doc.text("PEMERINTAH KOTA PALU", centerX, 14, { align: "center" });
    doc.text("KECAMATAN MANTIKULORE", centerX, 20, { align: "center" });
    doc.text("KELURAHAN TONDO", centerX, 26, { align: "center" });
    doc.text("PENGURUS RT.002/RW.020", centerX, 32, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Alamat : ${config.rtAddress}`, centerX, 38, { align: "center" });

    // Lines
    doc.setLineWidth(1.0);
    doc.line(margin, 42, pageWidth - margin, 42);
    doc.setLineWidth(0.3);
    doc.line(margin, 43, pageWidth - margin, 43);

    // --- TITLE ---
    const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("LAPORAN DATA WARGA RT 002 RW 020", centerX, 52, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Per Tanggal: ${dateString}`, centerX, 57, { align: "center" });

    // --- TABLE CONFIG ---
    let startY = 65;
    const rowHeight = 8;
    // Columns: No, Blok/Rumah, Kepala Keluarga, Jml, Status Hunian, Status Iuran, No. HP
    const cols = [
        { header: "No", width: 10, x: margin },
        { header: "Blok/Rumah", width: 30, x: margin + 10 },
        { header: "Kepala Keluarga", width: 80, x: margin + 40 },
        { header: "Jml", width: 15, x: margin + 120 },
        { header: "Status Hunian", width: 35, x: margin + 135 },
        { header: "Status Iuran", width: 35, x: margin + 170 },
        { header: "No. HP", width: 40, x: margin + 205 },
        { header: "Ket", width: 32, x: margin + 245 },
    ];

    // Helper to draw Header
    const drawTableHeader = (y: number) => {
        doc.setFillColor(230, 230, 230); // Light Grey
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        doc.setFont("times", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0);
        
        cols.forEach(col => {
            doc.text(col.header, col.x + 1, y + 5);
        });
        
        // Header Border
        doc.setDrawColor(0);
        doc.rect(margin, y, contentWidth, rowHeight);
        
        // Vertical Lines for Header
        let currentX = margin;
        cols.forEach(col => {
             doc.line(currentX, y, currentX, y + rowHeight);
             currentX += col.width;
        });
        doc.line(currentX, y, currentX, y + rowHeight); // Final line
    };

    drawTableHeader(startY);
    let currentY = startY + rowHeight;

    // --- TABLE ROWS ---
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    
    // Sort houses logic: by block then number
    const sortedHouses = [...houses].sort((a,b) => {
        if(a.block === b.block) return parseInt(a.number, 10) - parseInt(b.number, 10);
        return a.block.localeCompare(b.block);
    });

    sortedHouses.forEach((house, index) => {
        // Pagination Check
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
        
        // Format Status (Includes Rent info)
        let status = house.status === 'Occupied' ? 'Dihuni' : (house.status === 'Business' ? 'Usaha' : 'Kosong');
        if (house.status === 'Occupied' && house.residenceType === 'Kontrak') {
             status += " (Kontrak)";
        }

        const payment = house.paymentStatus;
        const phone = house.phone || '-';
        
        // Demographic notes
        const notes = [];
        if(house.hasPregnant) notes.push("Hamil");
        if(house.hasBaby) notes.push("Bayi");
        if(house.hasToddler) notes.push("Balita");
        if(house.hasTeenager) notes.push("Remaja");
        if(house.hasElderly) notes.push("Lansia");
        const ket = notes.join(', ');

        // Draw Row Text
        doc.text(no, cols[0].x + 1, currentY + 5);
        doc.text(address, cols[1].x + 1, currentY + 5);
        doc.text(name, cols[2].x + 1, currentY + 5);
        doc.text(count, cols[3].x + 1, currentY + 5);
        
        const splitStatus = doc.splitTextToSize(status, cols[4].width - 2);
        doc.text(splitStatus, cols[4].x + 1, currentY + 5);
        
        // Color for payment
        if (payment === PaymentStatus.UNPAID) doc.setTextColor(220, 38, 38); // Red
        else if (payment === PaymentStatus.PENDING) doc.setTextColor(217, 119, 6); // Amber
        doc.text(payment, cols[5].x + 1, currentY + 5);
        doc.setTextColor(0); // Reset

        doc.text(phone, cols[6].x + 1, currentY + 5);
        doc.text(ket, cols[7].x + 1, currentY + 5);

        // Draw Row Borders
        doc.rect(margin, currentY, contentWidth, rowHeight);
        
        // Vertical Lines
        let currentX = margin;
        cols.forEach(col => {
            doc.line(currentX, currentY, currentX, currentY + rowHeight);
            currentX += col.width;
        });
        doc.line(currentX, currentY, currentX, currentY + rowHeight);

        currentY += rowHeight;
    });

    // --- SUMMARY ---
    currentY += 5;
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

    const totalOccupied = houses.filter(h => h.status !== 'Empty').length;
    const totalPermanent = houses.filter(h => h.status === 'Occupied' && (h.residenceType === 'Tetap' || !h.residenceType)).length;
    const totalRenter = houses.filter(h => h.status === 'Occupied' && h.residenceType === 'Kontrak').length;
    const totalEmpty = houses.filter(h => h.status === 'Empty').length;
    const totalPeople = houses.reduce((acc, h) => acc + h.occupants, 0);

    doc.setFont("times", "bold");
    doc.text("REKAPITULASI:", margin, currentY);
    currentY += 5;
    doc.setFont("times", "normal");
    doc.text(`Total Unit Rumah: ${houses.length} Unit`, margin, currentY);
    doc.text(`Total Kepala Keluarga: ${houses.length}`, margin + 70, currentY);
    currentY += 5;
    doc.text(`Dihuni Tetap: ${totalPermanent}`, margin, currentY);
    doc.text(`Dihuni Kontrak/Sewa: ${totalRenter}`, margin + 70, currentY);
    doc.text(`Rumah Kosong: ${totalEmpty}`, margin + 140, currentY);
    currentY += 5;
    doc.text(`Estimasi Total Penduduk: ${totalPeople} Jiwa`, margin, currentY);

    // --- SIGNATURE ---
    const signY = currentY + 10;
    // Check space
    if (signY + 30 > pageHeight) { doc.addPage(); }

    const signX = pageWidth - 60;
    doc.text(`Palu, ${dateString}`, signX, signY, { align: "center" });
    doc.text("Ketua RT 002 RW 020", signX, signY + 6, { align: "center" });

    // Render Signature Image if exists
    if (config.signature) {
        try {
            const signImg = await getImageData(config.signature);
            if (signImg) doc.addImage(signImg, 'PNG', signX - 15, signY + 10, 30, 20);
        } catch(e) {}
    }

    doc.setFont("times", "bold", "underline");
    doc.text("IRFAN ARIANTO", signX, signY + 35, { align: "center" });

    doc.save(`Laporan_Warga_RT002_${new Date().toISOString().split('T')[0]}.pdf`);
};