
import { jsPDF } from "jspdf";
import { LetterRequest, PdfConfig } from "../types";
import { DEFAULT_PDF_CONFIG } from "../constants";

export const generateSuratPengantar = async (letter: LetterRequest, customConfig?: PdfConfig) => {
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

  // --- Helper Functions ---
  
  // Load Gambar (Support Base64 direct or URL fetch)
  const getImageData = (source: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!source) {
        resolve('');
        return;
      }

      // Jika sudah Base64, langsung pakai
      if (source.startsWith('data:image')) {
        resolve(source);
        return;
      }

      // Jika URL
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              console.error("CORS Error on canvas export", e);
              resolve('');
            }
        } else {
            resolve('');
        }
      };
      img.onerror = () => {
        console.error("Failed to load image:", source);
        resolve(''); 
      };
      img.src = source;
    });
  };

  // --- 1. KOP SURAT (Official Style) ---
  
  // LOGO: Try Image -> Fallback to Vector
  let logoDrawn = false;
  try {
    const logoData = await getImageData(config.logo);
    if (logoData) {
      doc.addImage(logoData, 'PNG', 20, 10, 22, 26); // Posisi logo kiri atas
      logoDrawn = true;
    }
  } catch (e) {
    console.error("Gagal memuat logo", e);
  }

  // Fallback Vector Logo (Simbol Garuda/Perisai)
  if (!logoDrawn) {
     const lx = 30; 
     const ly = 22;
     doc.setDrawColor(0);
     doc.setLineWidth(0.5);
     
     // Perisai Luar
     doc.lines([[10,0], [0,12], [-10,0], [0,-12]], lx, ly - 6, [1,1], 'S', true);
     
     // Sayap Sederhana (Garis)
     doc.setLineWidth(0.3);
     doc.line(lx-10, ly-2, lx-2, ly+2);
     doc.line(lx+10, ly-2, lx+2, ly+2);
     doc.line(lx-8, ly-4, lx-2, ly);
     doc.line(lx+8, ly-4, lx+2, ly);

     // Bintang (Ketuhanan)
     doc.setFontSize(10);
     doc.text("★", lx-1.5, ly-1);
  }

  // Teks Kop
  doc.setFont("times", "normal"); 
  doc.setFontSize(12);
  doc.text("PEMERINTAH KOTA PALU", centerX, 14, { align: "center" });
  doc.text("KECAMATAN MANTIKULORE", centerX, 19, { align: "center" });
  doc.text("KELURAHAN TONDO", centerX, 24, { align: "center" });
  
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text(`PENGURUS ${config.rtName}`, centerX, 30, { align: "center" });

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.text(`Alamat : ${config.rtAddress}`, centerX, 35, { align: "center" });

  // Garis Pemisah Kop (Double Line)
  doc.setLineWidth(0.8);
  doc.line(20, 38, 190, 38); // Garis tebal
  doc.setLineWidth(0.2);
  doc.line(20, 39, 190, 39); // Garis tipis

  // --- 2. JUDUL & NOMOR SURAT ---
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  doc.text("SURAT PENGANTAR", centerX, 48, { align: "center" });
  
  // Garis bawah judul
  const textWidth = doc.getTextWidth("SURAT PENGANTAR");
  doc.setLineWidth(0.5);
  doc.line(centerX - (textWidth/2), 49, centerX + (textWidth/2), 49);

  // Nomor Surat
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const currentYear = new Date().getFullYear();
  const monthRoman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"][new Date().getMonth()];
  const nomorSurat = `002 / ${config.rtName} / ${monthRoman} / ${currentYear}`; 
  doc.text(`Nomor : ${nomorSurat}`, centerX, 54, { align: "center" });

  // --- 3. ISI SURAT (Narrative Style) ---
  let cursorY = 65;
  const lineHeight = 6;

  // Pembuka
  doc.setFont("times", "normal");
  doc.text(`Yang bertanda tangan di bawah ini Ketua ${config.rtName} Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, menerangkan bahwa:`, marginX, cursorY, { maxWidth: contentWidth, align: "justify" });

  cursorY += 10;

  // --- 4. BIODATA (Aligned) ---
  const labelX = 25;
  const colonX = 65;
  const valueX = 68;

  const drawField = (label: string, value: string) => {
    doc.text(label, labelX, cursorY);
    doc.text(":", colonX, cursorY);
    
    // Handle multi-line address/value
    const splitValue = doc.splitTextToSize(value ? value.toString().toUpperCase() : "-", 115);
    doc.text(splitValue, valueX, cursorY);
    
    cursorY += (lineHeight * splitValue.length); 
    cursorY += 1;
  };

  drawField("Nama Lengkap", letter.applicantName);
  drawField("NIK / No. KTP", letter.nik);
  drawField("Tempat / Tgl Lahir", `${letter.birthPlace}, ${letter.birthDate}`);
  drawField("Jenis Kelamin", letter.gender);
  drawField("Agama", letter.religion);
  drawField("Status Perkawinan", letter.maritalStatus);
  drawField("Pekerjaan", letter.job);
  drawField("Alamat KTP", letter.addressKtp);
  drawField("Alamat Domisili", letter.houseId);

  cursorY += 4;

  // Inti Surat
  doc.text("Orang tersebut di atas adalah benar-benar warga kami yang berdomisili di alamat tersebut.", marginX, cursorY, { maxWidth: contentWidth, align: "justify" });
  cursorY += lineHeight;
  
  doc.text("Surat pengantar ini diberikan kepada yang bersangkutan untuk keperluan:", marginX, cursorY);
  cursorY += lineHeight;

  // Keperluan (Bold & Indented)
  doc.setFont("times", "bold");
  const keperluanLines = doc.splitTextToSize(`"${letter.type.toUpperCase()}"`, contentWidth - 20);
  doc.text(keperluanLines, marginX + 10, cursorY);
  cursorY += (lineHeight * keperluanLines.length) + 4;

  // Penutup
  doc.setFont("times", "normal");
  doc.text("Demikian Surat Pengantar ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.", marginX, cursorY, { maxWidth: contentWidth, align: "justify" });

  // --- 5. TANDA TANGAN ---
  cursorY += 20;
  
  const dateString = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Posisi TTD Kanan (Ketua RT)
  const ttdX = 145; 
  
  doc.text(`Palu, ${dateString}`, ttdX, cursorY, { align: "center" });
  cursorY += 6;
  doc.text(`Ketua ${config.rtName}`, ttdX, cursorY, { align: "center" });
  
  // Koordinat Area Tanda Tangan
  const signSpaceY = cursorY + 2; 
  const signCenterX = ttdX;
  
  // --- 6. RENDER GAMBAR (STEMPEL & TTD) ---
  const stampWidth = 35; 
  const stampHeight = 35;
  const signWidth = 30;
  const signHeight = 20;

  let stampDrawn = false;

  // A. Coba Render Stempel Gambar (Jika ada di Config)
  if (config.stamp) {
    try {
       const stampImg = await getImageData(config.stamp);
       if (stampImg) {
          doc.addImage(stampImg, 'PNG', signCenterX - 25, signSpaceY - 5, stampWidth, stampHeight);
          stampDrawn = true;
       }
    } catch(e) { console.error("Error loading stamp", e); }
  } 
  
  // B. Fallback: Render Stempel Vektor (Jika gambar tidak ada/gagal)
  if (!stampDrawn) {
     const stempelX = signCenterX - 8; 
     const stempelY = signSpaceY + 12;
     
     // Simpan state warna asli
     const prevColor = doc.getTextColor();
     
     // Set Warna Merah Stempel
     doc.setDrawColor(200, 0, 0); // Merah Tua Border
     doc.setTextColor(200, 0, 0); // Merah Tua Teks
     
     // Lingkaran Luar & Dalam
     doc.setLineWidth(0.8);
     doc.circle(stempelX, stempelY, 16); 
     doc.setLineWidth(0.3);
     doc.circle(stempelX, stempelY, 15);
     
     // Teks Melengkung (Simulasi sederhana dengan teks atas & bawah)
     doc.setFontSize(6);
     doc.setFont("helvetica", "bold");
     
     // Teks Atas
     doc.text("RUKUN TETANGGA 002", stempelX, stempelY - 10, {align:'center'});
     // Teks Bawah
     doc.text("RW 020 KEL. TONDO", stempelX, stempelY + 11, {align:'center'});
     
     // Garis Tengah
     doc.setLineWidth(0.2);
     doc.line(stempelX - 13, stempelY - 3, stempelX + 13, stempelY - 3);
     doc.line(stempelX - 13, stempelY + 3, stempelX + 13, stempelY + 3);
     
     // Teks Tengah
     doc.setFontSize(8);
     doc.text("TERTIB", stempelX, stempelY + 1, {align:'center'});
     
     // Reset Warna ke Hitam
     doc.setTextColor(0, 0, 0); 
     doc.setDrawColor(0, 0, 0);
  }

  // Render Tanda Tangan (di tengah)
  if (config.signature) {
    try {
      const signImg = await getImageData(config.signature);
      if (signImg) {
         doc.addImage(signImg, 'PNG', signCenterX - 15, signSpaceY, signWidth, signHeight);
      }
    } catch(e) { console.error("Error loading signature", e); }
  } else {
     // Fallback text if no signature image
     doc.setFont("times", "italic");
     doc.setFontSize(8);
     doc.setTextColor(150, 150, 150); // Abu-abu
     doc.text("(Dokumen Digital)", signCenterX, signSpaceY + 10, {align: 'center'});
     doc.setTextColor(0, 0, 0);
  }

  // Nama Terang
  cursorY += 25;
  doc.setFont("times", "bold", "underline");
  doc.setFontSize(12);
  doc.text("IRFAN ARIANTO", ttdX, cursorY, { align: "center" });


  // --- 7. CATATAN KAKI (Footer) ---
  doc.setTextColor(0, 0, 0); 
  const footerY = pageHeight - 50; 
  
  doc.setFont("times", "italic");
  doc.setFontSize(9);
  doc.text("Catatan:", marginX, footerY);
  
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  const notes = [
    "1. Surat ini berlaku selama 3 (tiga) bulan sejak tanggal dikeluarkan.",
    `2. Harap menjaga nama baik lingkungan ${config.rtName} Kelurahan Tondo.`,
    "3. Apabila terdapat kekeliruan dalam surat ini akan diperbaiki sebagaimana mestinya."
  ];

  let currentNoteY = footerY + 4;
  notes.forEach((note) => {
    doc.text(note, marginX + 2, currentNoteY);
    currentNoteY += 4;
  });

  // Save PDF
  doc.save(`Surat_Pengantar_RT02_${letter.applicantName.replace(/\s+/g, '_')}.pdf`);
};
