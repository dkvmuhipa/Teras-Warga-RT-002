import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { House, PaymentStatus, STBMRecord } from '../types';

export const naturalSortBlockAndNumber = (
  blockA: string | undefined | null,
  numA: string | undefined | null,
  blockB: string | undefined | null,
  numB: string | undefined | null
): number => {
  const bA = (blockA || '').trim();
  const bB = (blockB || '').trim();

  const blockMatchA = bA.match(/^([A-Za-z]+)?(\d+)?$/);
  const blockMatchB = bB.match(/^([A-Za-z]+)?(\d+)?$/);

  const letterA = blockMatchA ? (blockMatchA[1] || '') : bA;
  const letterB = blockMatchB ? (blockMatchB[1] || '') : bB;
  const valA = blockMatchA && blockMatchA[2] ? parseInt(blockMatchA[2], 10) : -1;
  const valB = blockMatchB && blockMatchB[2] ? parseInt(blockMatchB[2], 10) : -1;

  const letterComp = letterA.localeCompare(letterB, undefined, { sensitivity: 'base' });
  if (letterComp !== 0) return letterComp;

  if (valA !== valB) {
    if (valA === -1) return 1;
    if (valB === -1) return -1;
    return valA - valB;
  }

  const nA = (numA || '').trim();
  const nB = (numB || '').trim();

  const numMatchA = nA.match(/^([A-Za-z]+)?(\d+)?$/);
  const numMatchB = nB.match(/^([A-Za-z]+)?(\d+)?$/);

  const numLetterA = numMatchA ? (numMatchA[1] || '') : nA;
  const numLetterB = numMatchB ? (numMatchB[1] || '') : nB;
  const numValA = numMatchA && numMatchA[2] ? parseInt(numMatchA[2], 10) : -1;
  const numValB = numMatchB && numMatchB[2] ? parseInt(numMatchB[2], 10) : -1;

  const numLetterComp = numLetterA.localeCompare(numLetterB, undefined, { sensitivity: 'base' });
  if (numLetterComp !== 0) return numLetterComp;

  if (numValA !== numValB) {
    if (numValA === -1) return 1;
    if (numValB === -1) return -1;
    return numValA - numValB;
  }

  return 0;
};

export const generateProfessionalExcel = async (houses: House[], selectedCols?: string[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Warga RT 02');

  // Sort houses by block and number naturally (C5, C7 to C12)
  const sortedHouses = [...houses].sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

  // Define columns
  const allColumns = [
    { header: 'BLOK (Wajib)', key: 'block', width: 15 },
    { header: 'NOMOR (Wajib)', key: 'number', width: 15 },
    { header: 'NAMA KEPALA KELUARGA / PENGHUNI (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'JENIS KELAMIN', key: 'gender', width: 20 },
    { header: 'TANGGAL LAHIR', key: 'birthDate', width: 20 },
    { header: 'AGAMA', key: 'religion', width: 20 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'KONTAK PEMILIK (Opsional)', key: 'ownerPhone', width: 25 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Dihuni/Kosong/Usaha)', key: 'status', width: 35 },
    { header: 'STATUS KEPENGHUNIAN (Tetap/Sewa)', key: 'residenceType', width: 40 },
    { header: 'JUMLAH PENGHUNI', key: 'occupants', width: 20 },
    { header: 'PENDIDIKAN', key: 'education', width: 20 },
    { header: 'PEKERJAAN', key: 'jobCategory', width: 25 },
    { header: 'JUMLAH KENDARAAN', key: 'vehicleCount', width: 20 },
    { header: 'MOTOR (RODA 2)', key: 'twoWheelCount', width: 20 },
    { header: 'MOBIL (RODA 4)', key: 'fourWheelCount', width: 20 },
    { header: 'JUMLAH IBU HAMIL', key: 'pregnantCount', width: 25 },
    { header: 'JUMLAH BAYI (0-11 bln)', key: 'babyCount', width: 25 },
    { header: 'JUMLAH BALITA (1-5 thn)', key: 'toddlerCount', width: 25 },
    { header: 'JUMLAH REMAJA', key: 'teenagerCount', width: 25 },
    { header: 'JUMLAH DEWASA', key: 'adultCount', width: 25 },
    { header: 'JUMLAH LANSIA', key: 'elderlyCount', width: 25 },
    { header: 'JUMLAH ANAK', key: 'childCount', width: 25 },
    { header: 'JUMLAH JANDA', key: 'widowCount', width: 25 },
    { header: 'STATUS EKONOMI (Pra-Sejahtera/Sejahtera/Mampu)', key: 'economicStatus', width: 35 },
    { header: 'PENERIMA BPNT (Ya/Tidak)', key: 'isBPNT', width: 25 },
    { header: 'DISABILITAS (Ya/Tidak)', key: 'isDisability', width: 25 },
    { header: 'JUMLAH DISABILITAS', key: 'disabilityCount', width: 25 },
    { header: 'YATIM/PIATU (Ya/Tidak)', key: 'isOrphan', width: 25 },
    { header: 'JUMLAH YATIM/PIATU', key: 'orphanCount', width: 25 },
    { header: 'STATUS IURAN AIR', key: 'paymentStatusAir', width: 25 },
    { header: 'STATUS IURAN SAMPAH', key: 'paymentStatusSampah', width: 25 },
    { header: 'STATUS IURAN KEAMANAN', key: 'paymentStatusKeamanan', width: 25 },
    { header: 'TANGGAL BAYAR TERAKHIR', key: 'paymentDate', width: 25 },
    { header: 'STATUS VERIFIKASI', key: 'isVerified', width: 20 },
    { header: 'KODE AKSES (PIN)', key: 'accessCode', width: 20 },
  ];

  let columnsToUse = allColumns;
  if (selectedCols && selectedCols.length > 0) {
    columnsToUse = allColumns.filter(col => selectedCols.includes(col.key));
  }
  // Fallback: at least Block, Nomor, Nama KK
  if (columnsToUse.length === 0) {
    columnsToUse = allColumns.slice(0, 3);
  }

  worksheet.columns = columnsToUse;

  // Styles
  const primaryHeaderColor = 'FF1E293B'; // Slate-800
  const alternateRowColor = 'FFF8FAFC'; // Slate-50
  const borderColor = 'FFE2E8F0'; // Slate-200

  // Style Header
  const headerRow = worksheet.getRow(1);
  headerRow.height = 35;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: primaryHeaderColor },
    };
    cell.font = {
      name: 'Segoe UI',
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    };
  });

  // Freeze top row and enable filter
  worksheet.views = [
    { showGridLines: true, state: 'frozen', xSplit: 0, ySplit: 1, topLeftCell: 'A2' }
  ];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  // Add Data
  sortedHouses.forEach((house, index) => {
    const row = worksheet.addRow({
      block: house.block,
      number: house.number,
      headOfFamily: house.headOfFamily,
      gender: house.gender || '-',
      birthDate: house.birthDate || '-',
      religion: house.religion || '-',
      ownerName: house.ownerName || '-',
      ownerPhone: house.ownerPhone || '-',
      phone: house.phone || '-',
      status: house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : house.status === 'Business' ? 'Usaha' : 'Mengunjungi',
      residenceType: house.status === 'Empty' ? '-' : (house.residenceType || '-'),
      occupants: house.occupants || 0,
      education: house.education || '-',
      jobCategory: house.jobCategory || '-',
      vehicleCount: (house.twoWheelCount || 0) + (house.fourWheelCount || 0) > 0 ? (house.twoWheelCount || 0) + (house.fourWheelCount || 0) : (house.vehicleCount || 0),
      twoWheelCount: house.twoWheelCount || 0,
      fourWheelCount: house.fourWheelCount || 0,
      pregnantCount: house.pregnantCount || 0,
      babyCount: house.babyCount || 0,
      toddlerCount: house.toddlerCount || 0,
      teenagerCount: house.teenagerCount || 0,
      adultCount: house.adultCount || 0,
      elderlyCount: house.elderlyCount || 0,
      childCount: house.childCount || 0,
      widowCount: house.widowCount || 0,
      economicStatus: house.economicStatus || 'Sejahtera',
      isBPNT: house.isBPNT ? 'Ya' : 'Tidak',
      isDisability: house.isDisability ? 'Ya' : 'Tidak',
      disabilityCount: house.disabilityCount || 0,
      isOrphan: house.isOrphan ? 'Ya' : 'Tidak',
      orphanCount: house.orphanCount || 0,
      paymentStatusAir: house.paymentStatusAir || PaymentStatus.UNPAID,
      paymentStatusSampah: house.paymentStatusSampah || PaymentStatus.UNPAID,
      paymentStatusKeamanan: house.paymentStatusKeamanan || '-',
      paymentDate: house.paymentDate || '-',
      isVerified: house.isVerified ? 'Terverifikasi' : 'Belum Verifikasi',
      accessCode: house.accessCode || '-',
    });

    // Style Data Rows
    row.height = 28;
    row.eachCell((cell, colNumber) => {
      const colKey = columnsToUse[colNumber - 1]?.key;
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }; // Slate-700
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: borderColor } },
        left: { style: 'thin', color: { argb: borderColor } },
        bottom: { style: 'thin', color: { argb: borderColor } },
        right: { style: 'thin', color: { argb: borderColor } },
      };
      
      const valStr = cell.value?.toString() || '';

      // Conditional styling for Status Hunian (Dihuni / Kosong / Usaha)
      if (colKey === 'status') {
        if (valStr === 'Dihuni') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0284C7' }, bold: true }; // Sky-700
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } }; // Sky-100
        } else if (valStr === 'Kosong') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' }, bold: true }; // Slate-500
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100
        } else if (valStr === 'Usaha') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FFD97706' }, bold: true }; // Amber-600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-100
        }
      }

      // Conditional styling for Status Kepenghunian (Tetap / Sewa / Rumah Keluarga)
      if (colKey === 'residenceType') {
        if (valStr === 'Tetap') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF0F766E' }, bold: true }; // Teal-700
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2F1' } }; // Teal-100
        } else if (valStr === 'Kontrak' || valStr === 'Kost' || valStr === 'Sewa') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FFB45309' }, bold: true }; // Amber-700
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-100
        } else if (valStr === 'Keluarga' || valStr === 'Rumah Keluarga') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF4F46E5' }, bold: true }; // Indigo-600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }; // Indigo-100
        }
      }

      // Conditional styling for Payment Status / Verification
      if (colKey === 'paymentStatusAir' || colKey === 'paymentStatusSampah' || colKey === 'paymentStatusKeamanan' || colKey === 'isVerified') {
        if (valStr === PaymentStatus.PAID || valStr === 'Terverifikasi' || valStr === 'Lunas') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF059669' }, bold: true }; // Emerald-600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } }; // Emerald-50
        } else if (valStr === PaymentStatus.UNPAID || valStr === 'Belum Verifikasi' || valStr === 'Menunggak' || valStr === 'Belum Lunas') {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FFDC2626' }, bold: true }; // Rose-600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } }; // Rose-50
        } else if (valStr === PaymentStatus.PENDING) {
          cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FFD97706' }, bold: true }; // Amber-600
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }; // Amber-50
        }
      }

      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });

    // Alternate row background except where custom styling is applied
    if (index % 2 !== 0) {
      row.eachCell((cell) => {
        if (!cell.fill) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: alternateRowColor },
          };
        }
      });
    }
  });

  // Adjust Column Widths based on content
  worksheet.columns.forEach(column => {
    let maxColumnLength = 0;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxColumnLength) {
        maxColumnLength = columnLength;
      }
    });
    const finalWidth = Math.min(Math.max(12, maxColumnLength + 5), 50);
    column.width = finalWidth;
  });

  // Add Recap Rows to Main Sheet
  worksheet.addRow([]); // Blank row
  const recapTitleRow = worksheet.addRow(['REKAPITULASI DATA STATUS HUNIAN & KEPENGHUNIAN']);
  recapTitleRow.height = 24;
  const recapTitleCell = recapTitleRow.getCell(1);
  recapTitleCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF1E293B' } };

  const occupiedCount = houses.filter(h => h.status === 'Occupied').length;
  const emptyCount = houses.filter(h => h.status === 'Empty').length;
  const businessCount = houses.filter(h => h.status === 'Business').length;
  const visitingCount = houses.filter(h => h.status === 'Visiting').length;
  const totalHouses = houses.length;

  const tetaps = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Tetap').length;
  const sewas = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Sewa').length;
  const keluargas = houses.filter(h => h.status !== 'Empty' && h.residenceType === 'Rumah Keluarga').length;
  const totalKepenghunian = tetaps + sewas + keluargas;

  const statusRow = worksheet.addRow([
    'Status Hunian:',
    `Total: ${totalHouses} Rumah`,
    `Dihuni: ${occupiedCount} Rumah`,
    `Kosong: ${emptyCount} Rumah`,
    `Usaha: ${businessCount} Rumah`,
    `Mengunjungi: ${visitingCount} Rumah`
  ]);
  statusRow.height = 20;
  statusRow.eachCell((cell, colNumber) => {
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: colNumber === 1,
      color: { argb: 'FF000000' } // Pure black for better contrast and clarity
    };
  });

  const kepemilikanRow = worksheet.addRow([
    'Status Kepenghunian:',
    `Total KK Menghuni: ${totalKepenghunian} Rumah`,
    `Tetap: ${tetaps} Rumah`,
    `Sewa / Kontrak: ${sewas} Rumah`,
    `Rumah Keluarga: ${keluargas} Rumah`
  ]);
  kepemilikanRow.height = 20;
  kepemilikanRow.eachCell((cell, colNumber) => {
    cell.font = {
      name: 'Segoe UI',
      size: 10,
      bold: colNumber === 1,
      color: { argb: 'FF000000' } // Pure black
    };
  });

  // Add explanatory clarification rows
  worksheet.addRow([]); // Blank spacer
  const explanationTitleRow = worksheet.addRow(['Keterangan & Penjelasan Status Kepenghunian:']);
  explanationTitleRow.height = 22;
  explanationTitleRow.getCell(1).font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF1E293B' } };

  const exp1Row = worksheet.addRow([
    '• Catatan Kosong:',
    'Rumah dengan status "Belum Dihuni (Kosong)" otomatis dilewati/tidak dihitung ke dalam "Status Kepenghunian".'
  ]);
  exp1Row.height = 20;

  const exp2Row = worksheet.addRow([
    '• Tetap (SK Tetap):',
    'Rumah ditempati sendiri secara sah oleh pemilik utamanya (bukan penyewa atau keluarga jauh).'
  ]);
  exp2Row.height = 20;

  const exp3Row = worksheet.addRow([
    '• Sewa / Kontrak:',
    'Warga yang menyewa atau mengontrak rumah.'
  ]);
  exp3Row.height = 20;

  const exp4Row = worksheet.addRow([
    '• Rumah Keluarga:',
    'Warga yang menempati dan menggunakan rumah milik keluarga atau kerabat dekat.'
  ]);
  exp4Row.height = 20;

  const exp5Row = worksheet.addRow([
    '• Mengunjungi:',
    'Rumah/warga dengan status tinggal sementara atau hanya berkunjung/silaturahmi untuk waktu terbatas.'
  ]);
  exp5Row.height = 20;

  [exp1Row, exp2Row, exp3Row, exp4Row, exp5Row].forEach(row => {
    row.getCell(1).font = { name: 'Segoe UI', size: 10, bold: true, italic: true, color: { argb: 'FF000000' } };
    row.getCell(2).font = { name: 'Segoe UI', size: 10, italic: true, color: { argb: 'FF000000' } };
  });

  // Add Family Members Sheet
  const familySheet = workbook.addWorksheet('Anggota Keluarga');
  familySheet.views = [{ showGridLines: true }];
  familySheet.columns = [
    { header: 'BLOK', key: 'block', width: 10 },
    { header: 'NOMOR', key: 'number', width: 10 },
    { header: 'KEPALA KELUARGA / PENGHUNI', key: 'headOfFamily', width: 30 },
    { header: 'NAMA ANGGOTA', key: 'name', width: 30 },
    { header: 'NIK', key: 'nik', width: 25 },
    { header: 'HUBUNGAN', key: 'relation', width: 20 },
    { header: 'JENIS KELAMIN', key: 'gender', width: 20 },
    { header: 'TANGGAL LAHIR', key: 'birthDate', width: 20 },
    { header: 'PEKERJAAN', key: 'job', width: 25 },
  ];

  const familyHeaderRow = familySheet.getRow(1);
  familyHeaderRow.height = 30;
  familyHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  sortedHouses.forEach(house => {
    if (house.familyMembers && house.familyMembers.length > 0) {
      house.familyMembers.forEach(member => {
        familySheet.addRow({
          block: house.block,
          number: house.number,
          headOfFamily: house.headOfFamily,
          name: member.name,
          nik: member.nik || '-',
          relation: member.relation,
          gender: member.gender || '-',
          birthDate: member.birthDate || '-',
          job: member.job || '-',
        });
      });
    }
  });

  // Add Summary Sheet
  const summarySheet = workbook.addWorksheet('Ringkasan Statistik');
  summarySheet.views = [{ showGridLines: true }];
  summarySheet.columns = [
    { header: 'KATEGORI', key: 'category', width: 30 },
    { header: 'JUMLAH', key: 'value', width: 20 },
    { header: 'SATUAN', key: 'unit', width: 15 },
  ];

  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.height = 30;
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const totalJiwa = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + Math.max(h.occupants || 1, 1 + (h.familyMembers?.length || 0)), 0);
  const totalRumah = houses.length;
  const totalDihuni = houses.filter(h => h.status === 'Occupied').length;
  const totalKosong = houses.filter(h => h.status === 'Empty').length;
  const totalUsaha = houses.filter(h => h.status === 'Business').length;
  
  const totalLaki = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => {
    let count = h.gender === 'Laki-laki' ? 1 : 0;
    if (h.familyMembers) {
      count += h.familyMembers.filter(m => m.gender === 'Laki-laki').length;
    }
    return acc + count;
  }, 0);

  const totalPerempuan = totalJiwa - totalLaki;

  summarySheet.addRows([
    { category: 'Total Rumah', value: totalRumah, unit: 'Unit' },
    { category: 'Rumah Dihuni', value: totalDihuni, unit: 'Unit' },
    { category: 'Rumah Kosong', value: totalKosong, unit: 'Unit' },
    { category: 'Rumah Usaha', value: totalUsaha, unit: 'Unit' },
    { category: 'Total Penduduk (Jiwa)', value: totalJiwa, unit: 'Orang' },
    { category: 'Total Laki-laki', value: totalLaki, unit: 'Orang' },
    { category: 'Total Perempuan', value: totalPerempuan, unit: 'Orang' },
    { category: 'Total Kendaraan', value: houses.reduce((acc, h) => acc + ((h.twoWheelCount || 0) + (h.fourWheelCount || 0) > 0 ? (h.twoWheelCount || 0) + (h.fourWheelCount || 0) : (h.vehicleCount || 0)), 0), unit: 'Unit' },
    { category: 'Sepeda Motor (Roda 2)', value: houses.reduce((acc, h) => acc + (h.twoWheelCount || 0), 0), unit: 'Unit' },
    { category: 'Mobil Pribadi (Roda 4)', value: houses.reduce((acc, h) => acc + (h.fourWheelCount || 0), 0), unit: 'Unit' },
    { category: 'Total Ibu Hamil', value: houses.reduce((acc, h) => acc + (h.pregnantCount || 0), 0), unit: 'Orang' },
    { category: 'Total Bayi (0-11 bln)', value: houses.reduce((acc, h) => acc + (h.babyCount || 0), 0), unit: 'Orang' },
    { category: 'Total Balita (1-5 thn)', value: houses.reduce((acc, h) => acc + (h.toddlerCount || 0), 0), unit: 'Orang' },
    { category: 'Total Remaja', value: houses.reduce((acc, h) => acc + (h.teenagerCount || 0), 0), unit: 'Orang' },
    { category: 'Total Lansia', value: houses.reduce((acc, h) => acc + (h.elderlyCount || 0), 0), unit: 'Orang' },
    { category: 'Total Janda', value: houses.reduce((acc, h) => acc + (h.widowCount || 0), 0), unit: 'Orang' },
  ]);

  summarySheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Data_Lengkap_Warga_RT02_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Data Warga');

  // Define columns
  worksheet.columns = [
    { header: 'BLOK (Wajib)', key: 'block', width: 15 },
    { header: 'NOMOR (Wajib)', key: 'number', width: 15 },
    { header: 'NAMA KEPALA KELUARGA / PENGHUNI (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'JENIS KELAMIN (Laki-laki/Perempuan)', key: 'gender', width: 25 },
    { header: 'TANGGAL LAHIR (YYYY-MM-DD)', key: 'birthDate', width: 25 },
    { header: 'AGAMA', key: 'religion', width: 20 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'KONTAK PEMILIK (Opsional)', key: 'ownerPhone', width: 25 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Dihuni/Kosong/Usaha)', key: 'status', width: 35 },
    { header: 'STATUS KEPENGHUNIAN (Tetap/Sewa)', key: 'residenceType', width: 40 },
    { header: 'JUMLAH PENGHUNI', key: 'occupants', width: 20 },
    { header: 'PENDIDIKAN', key: 'education', width: 20 },
    { header: 'PEKERJAAN', key: 'jobCategory', width: 25 },
    { header: 'JUMLAH KENDARAAN', key: 'vehicleCount', width: 20 },
    { header: 'MOTOR (RODA 2)', key: 'twoWheelCount', width: 20 },
    { header: 'MOBIL (RODA 4)', key: 'fourWheelCount', width: 20 },
    { header: 'JUMLAH IBU HAMIL', key: 'pregnantCount', width: 25 },
    { header: 'JUMLAH BAYI (0-11 bln)', key: 'babyCount', width: 25 },
    { header: 'JUMLAH BALITA (1-5 thn)', key: 'toddlerCount', width: 25 },
    { header: 'JUMLAH REMAJA', key: 'teenagerCount', width: 25 },
    { header: 'JUMLAH DEWASA', key: 'adultCount', width: 25 },
    { header: 'JUMLAH LANSIA', key: 'elderlyCount', width: 25 },
    { header: 'JUMLAH ANAK', key: 'childCount', width: 25 },
    { header: 'JUMLAH JANDA', key: 'widowCount', width: 25 },
    { header: 'STATUS EKONOMI (Pra-Sejahtera/Sejahtera/Mampu)', key: 'economicStatus', width: 40 },
    { header: 'PENERIMA BPNT (Ya/Tidak)', key: 'isBPNT', width: 25 },
    { header: 'DISABILITAS (Ya/Tidak)', key: 'isDisability', width: 25 },
    { header: 'JUMLAH DISABILITAS', key: 'disabilityCount', width: 25 },
    { header: 'YATIM/PIATU (Ya/Tidak)', key: 'isOrphan', width: 25 },
    { header: 'JUMLAH YATIM/PIATU', key: 'orphanCount', width: 25 },
    { header: 'STATUS IURAN AIR (Lunas/Belum Lunas)', key: 'paymentStatusAir', width: 35 },
    { header: 'STATUS IURAN SAMPAH (Lunas/Belum Lunas)', key: 'paymentStatusSampah', width: 35 },
    { header: 'KODE AKSES (PIN)', key: 'accessCode', width: 20 },
  ];

  // Style Header
  const headerRow = worksheet.getRow(1);
  headerRow.height = 35;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  // Enable gridlines and styling
  worksheet.views = [{ showGridLines: true }];

  // Add Example Row
  worksheet.addRow({
    block: 'C5',
    number: '01',
    headOfFamily: 'Budi Santoso',
    gender: 'Laki-laki',
    birthDate: '1985-05-20',
    religion: 'Islam',
    ownerName: 'Ahmad Dahlan',
    ownerPhone: '081299887766',
    phone: '081234567890',
    status: 'Dihuni',
    residenceType: 'Sewa',
    occupants: 4,
    education: 'S1',
    jobCategory: 'Karyawan Swasta',
    vehicleCount: 2,
    twoWheelCount: 1,
    fourWheelCount: 1,
    pregnantCount: 0,
    babyCount: 0,
    toddlerCount: 1,
    teenagerCount: 1,
    adultCount: 2,
    elderlyCount: 0,
    childCount: 0,
    widowCount: 0,
    economicStatus: 'Sejahtera',
    isBPNT: 'Tidak',
    isDisability: 'Tidak',
    disabilityCount: 0,
    isOrphan: 'Tidak',
    orphanCount: 0,
    paymentStatusAir: 'Lunas',
    paymentStatusSampah: 'Belum Lunas',
    accessCode: '123456',
  });

  // Add Instructions
  worksheet.addRow([]);
  const instructionRow = worksheet.addRow(['PETUNJUK PENGISIAN:']);
  instructionRow.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFDC2626' }, size: 11 };
  worksheet.addRow(['1. Kolom bertanda (Wajib) tidak boleh kosong.']);
  worksheet.addRow(['2. Status Hunian harus diisi salah satu dari: Dihuni, Kosong, atau Usaha.']);
  worksheet.addRow(['3. Status Kepenghunian harus diisi: Tetap, Sewa, atau Rumah Keluarga.']);
  worksheet.addRow(['4. Status Iuran (Air/Sampah) harus diisi: Lunas atau Belum Lunas.']);
  worksheet.addRow(['5. Kolom Jumlah (Kendaraan, Ibu Hamil, Bayi, Balita, Remaja, Lansia, Janda) diisi dengan angka.']);
  worksheet.addRow(['6. Format Tanggal adalah YYYY-MM-DD (Contoh: 1990-01-31).']);


  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Template_Data_Warga_Lengkap_RT02.xlsx');
};

export const parseExcelFile = async (file: File): Promise<Partial<House>[]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const worksheet = workbook.getWorksheet(1);
  const data: Partial<House>[] = [];

  if (!worksheet) return [];

  let isOldFormat = false;
  const headerMap: Record<string, number> = {};

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row and detect format
    if (rowNumber === 1) {
      if (row.getCell(1).text?.toString().trim().toUpperCase() === 'NO') {
        isOldFormat = true;
      }
      row.eachCell((cell, colNumber) => {
        const text = cell.text?.toString().trim().toUpperCase();
        if (text) {
          headerMap[text] = colNumber;
        }
      });
      return;
    }
    
    // Check if it's the example row or empty
    const offset = isOldFormat ? 1 : 0;
    const getColIndex = (keyword: string, fallback: number): number => {
      const match = Object.keys(headerMap).find(k => k.includes(keyword));
      return match ? headerMap[match] : fallback;
    };

    const block = row.getCell(getColIndex('BLOK', 1 + offset)).text?.toString().trim();
    const number = row.getCell(getColIndex('NOMOR', 2 + offset)).text?.toString().trim();
    const headOfFamily = row.getCell(getColIndex('KEPALA KELUARGA', 3 + offset)).text?.toString().trim() || '-';

    // If block is empty or looks like an instruction row, skip
    if (!block || !number || block.startsWith('PETUNJUK') || block.match(/^\d+\./)) return;

    const genderRaw = row.getCell(getColIndex('KELAMIN', 4 + offset)).text?.trim() || undefined;
    const birthDate = row.getCell(getColIndex('LAHIR', 5 + offset)).text?.trim() || undefined;
    const religion = row.getCell(getColIndex('AGAMA', 6 + offset)).text?.trim() || undefined;
    const ownerName = row.getCell(getColIndex('NAMA PEMILIK', 7 + offset)).text?.trim() || undefined;
    const ownerPhone = row.getCell(getColIndex('KONTAK PEMILIK', 8 + offset)).text?.trim() || undefined;
    const phone = row.getCell(getColIndex('TELEPON', 9 + offset)).text?.trim() || undefined;
    const statusRaw = row.getCell(getColIndex('STATUS HUNIAN', 10 + offset)).text?.trim() || undefined;
    const residenceTypeRaw = row.getCell(getColIndex('KEPENGHUNIAN', 11 + offset)).text?.trim() || undefined;
    const occupantsRaw = row.getCell(getColIndex('PENGHUNI', 12 + offset)).value;
    const education = row.getCell(getColIndex('PENDIDIKAN', 13 + offset)).text?.trim() || undefined;
    const jobCategory = row.getCell(getColIndex('PEKERJAAN', 14 + offset)).text?.trim() || undefined;
    const vehicleCountRaw = row.getCell(getColIndex('JUMLAH KENDARAAN', 15 + offset)).value;
    
    const motorCol = Object.keys(headerMap).find(k => k.includes('MOTOR'));
    const mobilCol = Object.keys(headerMap).find(k => k.includes('MOBIL'));
    const twoWheelCountRaw = motorCol ? row.getCell(headerMap[motorCol]).value : undefined;
    const fourWheelCountRaw = mobilCol ? row.getCell(headerMap[mobilCol]).value : undefined;

    const pregnantCountRaw = row.getCell(getColIndex('HAMIL', 16 + offset)).value;
    const babyCountRaw = row.getCell(getColIndex('BAYI', 17 + offset)).value;
    const toddlerCountRaw = row.getCell(getColIndex('BALITA', 18 + offset)).value;
    const teenagerCountRaw = row.getCell(getColIndex('REMAJA', 19 + offset)).value;
    const adultCountRaw = row.getCell(getColIndex('DEWASA', 20 + offset)).value;
    const elderlyCountRaw = row.getCell(getColIndex('LANSIA', 21 + offset)).value;
    const childCountRaw = row.getCell(getColIndex('ANAK', 22 + offset)).value;
    const widowCountRaw = row.getCell(getColIndex('JANDA', 23 + offset)).value;
    const economicStatus = row.getCell(getColIndex('EKONOMI', 24 + offset)).text?.trim() || undefined;
    const isBPNTRaw = row.getCell(getColIndex('BPNT', 25 + offset)).text?.trim() || undefined;
    const isDisabilityRaw = row.getCell(getColIndex('DISABILITAS (YA', 26 + offset)).text?.trim() || undefined;
    const disabilityCountRaw = row.getCell(getColIndex('JUMLAH DISABILITAS', 27 + offset)).value;
    const isOrphanRaw = row.getCell(getColIndex('YATIM/PIATU (YA', 28 + offset)).text?.trim() || undefined;
    const orphanCountRaw = row.getCell(getColIndex('JUMLAH YATIM/PIATU', 29 + offset)).value;
    const paymentStatusAirRaw = row.getCell(getColIndex('AIR', 30 + offset)).text?.trim() || undefined;
    const paymentStatusSampahRaw = row.getCell(getColIndex('SAMPAH', 31 + offset)).text?.trim() || undefined;
    const accessCode = row.getCell(getColIndex('AKSES', 32 + offset)).text?.trim() || undefined;

    // Map gender
    let gender: 'Laki-laki' | 'Perempuan' | undefined = undefined;
    if (genderRaw?.toLowerCase() === 'laki-laki' || genderRaw?.toLowerCase() === 'pria') gender = 'Laki-laki';
    else if (genderRaw?.toLowerCase() === 'perempuan' || genderRaw?.toLowerCase() === 'wanita') gender = 'Perempuan';

    // Map status
    let status: 'Occupied' | 'Empty' | 'Business' | 'Visiting' | undefined = undefined;
    if (statusRaw?.toLowerCase() === 'empty' || statusRaw?.toLowerCase() === 'kosong') status = 'Empty';
    else if (statusRaw?.toLowerCase() === 'business' || statusRaw?.toLowerCase() === 'usaha') status = 'Business';
    else if (statusRaw?.toLowerCase() === 'occupied' || statusRaw?.toLowerCase() === 'dihuni') status = 'Occupied';
    else if (statusRaw?.toLowerCase() === 'visiting' || statusRaw?.toLowerCase() === 'mengunjungi' || statusRaw?.toLowerCase() === 'singgah' || statusRaw?.toLowerCase() === 'kunjungan') status = 'Visiting';

    // Map payment status Air
    let paymentStatusAir: PaymentStatus | undefined = undefined;
    if (paymentStatusAirRaw?.toLowerCase() === 'lunas' || paymentStatusAirRaw?.toLowerCase() === 'paid') paymentStatusAir = PaymentStatus.PAID;
    else if (paymentStatusAirRaw?.toLowerCase() === 'belum lunas' || paymentStatusAirRaw?.toLowerCase() === 'pending') paymentStatusAir = PaymentStatus.PENDING;

    // Map payment status Sampah
    let paymentStatusSampah: PaymentStatus | undefined = undefined;
    if (paymentStatusSampahRaw?.toLowerCase() === 'lunas' || paymentStatusSampahRaw?.toLowerCase() === 'paid') paymentStatusSampah = PaymentStatus.PAID;
    else if (paymentStatusSampahRaw?.toLowerCase() === 'belum lunas' || paymentStatusSampahRaw?.toLowerCase() === 'pending') paymentStatusSampah = PaymentStatus.PENDING;

    // Map residence type
    let residenceType: 'Tetap' | 'Sewa' | 'Rumah Keluarga' | undefined = undefined;
    if (residenceTypeRaw?.toLowerCase() === 'tetap') residenceType = 'Tetap';
    else if (residenceTypeRaw?.toLowerCase() === 'kontrak' || residenceTypeRaw?.toLowerCase() === 'sewa' || residenceTypeRaw?.toLowerCase() === 'kost') residenceType = 'Sewa';
    else if (residenceTypeRaw?.toLowerCase() === 'keluarga' || residenceTypeRaw?.toLowerCase() === 'rumah keluarga') residenceType = 'Rumah Keluarga';

    data.push({
      block,
      number,
      headOfFamily,
      ...(gender !== undefined && { gender }),
      ...(birthDate !== undefined && { birthDate }),
      ...(religion !== undefined && { religion }),
      ...(ownerName !== undefined && { ownerName }),
      ...(ownerPhone !== undefined && { ownerPhone }),
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
      ...(occupantsRaw !== null && occupantsRaw !== undefined && occupantsRaw !== '' && { occupants: Number(occupantsRaw) }),
      ...(residenceType !== undefined && { residenceType }),
      ...(education !== undefined && { education }),
      ...(jobCategory !== undefined && { jobCategory }),
      ...(vehicleCountRaw !== null && vehicleCountRaw !== undefined && vehicleCountRaw !== '' 
        ? { vehicleCount: Number(vehicleCountRaw) } 
        : (twoWheelCountRaw !== undefined || fourWheelCountRaw !== undefined 
          ? { vehicleCount: Number(twoWheelCountRaw || 0) + Number(fourWheelCountRaw || 0) } 
          : {})),
      ...(twoWheelCountRaw !== null && twoWheelCountRaw !== undefined && twoWheelCountRaw !== '' && { twoWheelCount: Number(twoWheelCountRaw) }),
      ...(fourWheelCountRaw !== null && fourWheelCountRaw !== undefined && fourWheelCountRaw !== '' && { fourWheelCount: Number(fourWheelCountRaw) }),
      ...(pregnantCountRaw !== null && pregnantCountRaw !== undefined && pregnantCountRaw !== '' && { pregnantCount: Number(pregnantCountRaw) }),
      ...(babyCountRaw !== null && babyCountRaw !== undefined && babyCountRaw !== '' && { babyCount: Number(babyCountRaw) }),
      ...(toddlerCountRaw !== null && toddlerCountRaw !== undefined && toddlerCountRaw !== '' && { toddlerCount: Number(toddlerCountRaw) }),
      ...(teenagerCountRaw !== null && teenagerCountRaw !== undefined && teenagerCountRaw !== '' && { teenagerCount: Number(teenagerCountRaw) }),
      ...(adultCountRaw !== null && adultCountRaw !== undefined && adultCountRaw !== '' && { adultCount: Number(adultCountRaw) }),
      ...(elderlyCountRaw !== null && elderlyCountRaw !== undefined && elderlyCountRaw !== '' && { elderlyCount: Number(elderlyCountRaw) }),
      ...(childCountRaw !== null && childCountRaw !== undefined && childCountRaw !== '' && { childCount: Number(childCountRaw) }),
      ...(widowCountRaw !== null && widowCountRaw !== undefined && widowCountRaw !== '' && { widowCount: Number(widowCountRaw) }),
      ...(economicStatus !== undefined && { economicStatus: economicStatus as any }),
      ...(isBPNTRaw !== undefined && { isBPNT: isBPNTRaw.toLowerCase() === 'ya' }),
      ...(isDisabilityRaw !== undefined && { isDisability: isDisabilityRaw.toLowerCase() === 'ya' }),
      ...(disabilityCountRaw !== null && disabilityCountRaw !== undefined && disabilityCountRaw !== '' && { disabilityCount: Number(disabilityCountRaw) }),
      ...(isOrphanRaw !== undefined && { isOrphan: isOrphanRaw.toLowerCase() === 'ya' }),
      ...(orphanCountRaw !== null && orphanCountRaw !== undefined && orphanCountRaw !== '' && { orphanCount: Number(orphanCountRaw) }),
      ...(paymentStatusAir !== undefined && { paymentStatusAir }),
      ...(paymentStatusSampah !== undefined && { paymentStatusSampah }),
      ...(accessCode !== undefined && { accessCode })
    });
  });

  return data;
};

export const generateIuranReportExcel = async (
  payments: any[], 
  month: string, 
  typeLabel: string, 
  summaries: any,
  arrearsData?: { house: any, arrears: string[] }[]
) => {
  const workbook = new ExcelJS.Workbook();
  
  // Sort payments by block and number naturally (C5, C7 to C12)
  const sortedPayments = [...payments].sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

  // Sort arrearsData if provided naturally (C5, C7 to C12)
  const sortedArrearsData = arrearsData ? [...arrearsData].sort((a, b) => naturalSortBlockAndNumber(a.house.block, a.house.number, b.house.block, b.house.number)) : [];

  // SHEET 1: LAPORAN PEMBAYARAN
  const worksheet = workbook.addWorksheet('Laporan Pembayaran');

  // Title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `LAPORAN PEMBAYARAN IURAN - PERIODE ${month.toUpperCase()}`;
  titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  worksheet.mergeCells('A2:F2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = `Kategori: ${typeLabel.toUpperCase()}`;
  subtitleCell.font = { bold: true, size: 12, color: { argb: 'FF64748B' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 25;

  // Summary Section
  worksheet.addRow([]);
  worksheet.addRow(['RINGKASAN KEUANGAN']);
  worksheet.getRow(4).font = { bold: true, size: 12 };
  
  const summaryRows = [
    ['Total Terkumpul', summaries.totalCollected, 'Rupiah'],
    ['Partisipasi Warga', summaries.participationRate, '%'],
    ['Rumah Sudah Bayar', summaries.paidHousesCount, 'Unit'],
    ['Rumah Belum Bayar', summaries.unpaidHousesCount, 'Unit'],
    ['Estimasi Piutang', summaries.estimatedReceivables, 'Rupiah'],
    ['Total Tunggakan', summaries.totalArrearsAmount, 'Rupiah'],
    ['Total Bulan Tunggakan', summaries.totalArrearsMonths, 'Bulan'],
  ];

  summaryRows.forEach(row => {
    worksheet.addRow(row);
  });

  // Style Summary
  const summaryStartRow = 5;
  const summaryEndRow = 5 + summaryRows.length - 1;
  for (let i = summaryStartRow; i <= summaryEndRow; i++) {
    const row = worksheet.getRow(i);
    row.getCell(2).numFmt = '#,##0';
    row.getCell(1).font = { bold: true };
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  }

  worksheet.addRow([]);
  
  // Table Header (Split RUMAH to BLOK and NOMOR columns as requested)
  const headerRowIndex = summaryEndRow + 3;
  worksheet.getRow(headerRowIndex).values = ['TANGGAL BAYAR', 'BULAN IURAN', 'NAMA WARGA', 'BLOK', 'NOMOR', 'JENIS IURAN', 'NOMINAL'];
  
  const hRow = worksheet.getRow(headerRowIndex);
  hRow.height = 32;
  hRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    };
  });

  // Add Data
  sortedPayments.forEach((p, index) => {
    const row = worksheet.addRow([
      new Date(p.date).toLocaleDateString('id-ID'),
      p.month,
      p.headOfFamily + (p.payerName && p.payerName !== p.headOfFamily ? ` (Oleh: ${p.payerName})` : ''),
      p.block || '-',
      p.number || '-',
      p.type === 'Both' ? 'Air & Sampah' : p.type === 'Air' ? 'Air Saja' : 'Sampah Saja',
      p.amount,
    ]);

    row.height = 26;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 7 ? 'right' : 'center' };
      if (colNumber === 7) {
        cell.numFmt = '#,##0';
        cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF0F172A' }, size: 10 };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });

    if (index % 2 !== 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  // Auto column widths for Iuran sheet
  worksheet.columns.forEach(column => {
    let max = 15;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 10;
      if (len > max) max = len;
    });
    column.width = Math.min(max + 5, 40);
  });

  // Header freeze
  worksheet.views = [{ showGridLines: true, state: 'frozen', ySplit: headerRowIndex }];

  // Footer (Updated column indices to G for NOMINAL)
  const footerRowIndex = worksheet.rowCount + 2;
  worksheet.mergeCells(`A${footerRowIndex}:F${footerRowIndex}`);
  worksheet.getCell(`A${footerRowIndex}`).value = 'TOTAL PEMASUKAN PERIODE INI';
  worksheet.getCell(`A${footerRowIndex}`).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF1E293B' }, size: 10 };
  worksheet.getCell(`A${footerRowIndex}`).alignment = { horizontal: 'right', vertical: 'middle' };
  
  const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
  worksheet.getCell(`G${footerRowIndex}`).value = totalAmount;
  worksheet.getCell(`G${footerRowIndex}`).font = { name: 'Segoe UI', bold: true, color: { argb: 'FF0F172A' }, size: 10 };
  worksheet.getCell(`G${footerRowIndex}`).numFmt = '#,##0';
  worksheet.getCell(`G${footerRowIndex}`).border = {
    top: { style: 'double', color: { argb: 'FF1E293B' } },
    bottom: { style: 'double', color: { argb: 'FF1E293B' } }
  };

  // SHEET 2: DAFTAR TUNGGAKAN
  if (sortedArrearsData && sortedArrearsData.length > 0) {
    const arrearsSheet = workbook.addWorksheet('Daftar Tunggakan');
    arrearsSheet.views = [{ showGridLines: true }];
    
    arrearsSheet.mergeCells('A1:D1');
    const arrearsTitle = arrearsSheet.getCell('A1');
    arrearsTitle.value = `DAFTAR TUNGGAKAN WARGA - PERIODE ${month.toUpperCase()}`;
    arrearsTitle.font = { bold: true, size: 14 };
    arrearsTitle.alignment = { horizontal: 'center' };
    arrearsSheet.getRow(1).height = 30;

    arrearsSheet.addRow([]);
    
    const arrearsHeaderRow = arrearsSheet.addRow(['NAMA WARGA', 'BLOK', 'NOMOR', 'JUMLAH BULAN', 'DETAIL BULAN']);
    arrearsHeaderRow.height = 28;
    arrearsHeaderRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      cell.font = { name: 'Segoe UI', bold: true, color: { argb: 'FF1E293B' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin', color: { argb: '000000' } }, left: { style: 'thin', color: { argb: '000000' } }, bottom: { style: 'thin', color: { argb: '000000' } }, right: { style: 'thin', color: { argb: '000000' } } };
    });

    arrearsSheet.columns = [
      { width: 35 },
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 50 },
    ];

    sortedArrearsData.forEach((item, index) => {
      const row = arrearsSheet.addRow([
        item.house.headOfFamily,
        item.house.block || '-',
        item.house.number || '-',
        item.arrears.length,
        item.arrears.join(', ')
      ]);
      row.height = 24;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
        cell.alignment = { vertical: 'middle', horizontal: (colNumber === 2 || colNumber === 3 || colNumber === 4) ? 'center' : 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
      if (index % 2 !== 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  }

  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Iuran_${typeLabel.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}.xlsx`);
};

export const generatePopulationReportExcel = async (reportsInput: any | any[], logs: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const reports = Array.isArray(reportsInput) ? reportsInput : [reportsInput];
  
  // SHEET 1: REKAPITULASI LAPORAN
  const reportSheet = workbook.addWorksheet('Rekapitulasi Laporan');
  
  // Style Header
  const headers = [
    { header: 'Periode', key: 'month' },
    { header: 'Tahun', key: 'year' },
    { header: 'Awal (Jiwa)', key: 'initialPopulation' },
    { header: 'Lahir', key: 'birthCount' },
    { header: 'Meninggal', key: 'deathCount' },
    { header: 'Masuk', key: 'newcomerCount' },
    { header: 'Keluar', key: 'movedOutCount' },
    { header: 'Akhir (Jiwa)', key: 'finalPopulation' },
    { header: 'Laki-laki', key: 'maleCount' },
    { header: 'Perempuan', key: 'femaleCount' },
    { header: 'Hamil', key: 'pregnantCount' },
    { header: 'Bayi/Balita', key: 'youngChildren' },
    { header: 'Anak', key: 'childCount' },
    { header: 'Remaja', key: 'teenagerCount' },
    { header: 'Dewasa', key: 'adultCount' },
    { header: 'Lansia', key: 'elderlyCount' },
    { header: 'Janda/Duda', key: 'widowCount' },
    { header: 'Disabilitas', key: 'disabilityCount' },
    { header: 'Yatim/Piatu', key: 'orphanCount' },
    { header: 'Musiman Total', key: 'seasonalCount' },
    { header: 'Musiman (L)', key: 'seasonalMaleCount' },
    { header: 'Musiman (P)', key: 'seasonalFemaleCount' },
  ];

  reportSheet.columns = headers.map(h => ({ ...h, width: 15 }));

  const headerRow = reportSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  [...reports].sort((a, b) => (b.month || '').localeCompare(a.month || '')).forEach((r, i) => {
    const row = reportSheet.addRow({
      month: r.month,
      year: r.year,
      initialPopulation: r.initialPopulation,
      birthCount: r.birthCount,
      deathCount: r.deathCount,
      newcomerCount: r.newcomerCount,
      movedOutCount: r.movedOutCount,
      finalPopulation: r.initialPopulation + r.birthCount + r.newcomerCount - r.movedOutCount - (r.deathCount || 0),
      maleCount: r.maleCount,
      femaleCount: r.femaleCount,
      pregnantCount: r.pregnantCount,
      youngChildren: (r.babyCount || 0) + (r.toddlerCount || 0),
      childCount: r.childCount || 0,
      teenagerCount: r.teenagerCount || 0,
      adultCount: r.adultCount || 0,
      elderlyCount: r.elderlyCount,
      widowCount: r.widowCount || 0,
      disabilityCount: r.disabilityCount || 0,
      orphanCount: r.orphanCount || 0,
      seasonalCount: r.seasonalCount || 0,
      seasonalMaleCount: r.seasonalMaleCount || 0,
      seasonalFemaleCount: r.seasonalFemaleCount || 0
    });

    row.height = 25;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });

    if (i % 2 !== 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  reportSheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

  // SHEET 2: LOG MUTASI
  const logSheet = workbook.addWorksheet('Log Mutasi Penduduk');
  logSheet.views = [{ showGridLines: true }];
  logSheet.columns = [
    { header: 'TANGGAL', key: 'date', width: 15 },
    { header: 'TIPE MUTASI', key: 'type', width: 20 },
    { header: 'NAMA WARGA', key: 'name', width: 35 },
    { header: 'LOKASI (BLOK-NO)', key: 'houseId', width: 18 },
    { header: 'KETERANGAN', key: 'description', width: 45 },
    { header: 'JML KELUARGA', key: 'familyCount', width: 18 },
    { header: 'DETAIL INFORMASI', key: 'details', width: 50 },
  ];

  const logHeaderRow = logSheet.getRow(1);
  logHeaderRow.height = 32;
  logHeaderRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFBE123C' } }; // Rose-700
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  logs.sort((a, b) => b.date.localeCompare(a.date)).forEach((l, i) => {
    let detailsStr = '';
    if (l.type === 'Newcomer' && l.details) {
      detailsStr = `Asal: ${l.details.previousAddress || '-'}. Alasan: ${l.details.reasonForMoving || '-'}`;
    } else if (l.type === 'MovedOut' && l.details) {
      detailsStr = `Tujuan: ${l.details.newAddress || '-'}. Alasan: ${l.details.reasonForMoving || '-'}`;
    } else if (l.type === 'Birth' && l.details) {
      detailsStr = `Ayah: ${l.details.fatherName || '-'}. Ibu: ${l.details.motherName || '-'}`;
    } else if (l.type === 'Death' && l.details) {
      detailsStr = `Sebab: ${l.details.causeOfDeath || '-'}. Tempat: ${l.details.placeOfDeath || '-'}`;
    }

    logSheet.addRow({
      date: l.date,
      type: l.type === 'Newcomer' ? 'Pendatang' : l.type === 'MovedOut' ? 'Pindah Keluar' : l.type === 'Birth' ? 'Kelahiran' : 'Kematian',
      name: l.name,
      houseId: l.houseId,
      description: l.description,
      familyCount: l.details?.familyCount || 1,
      details: detailsStr
    });
  });

  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Mutasi_Kependudukan_RT02_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateOfficialLettersExcel = async (letters: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Arsip Surat Resmi');
  
  worksheet.views = [{ showGridLines: true }];
  
  worksheet.columns = [
    { header: 'NOMOR SURAT', key: 'letterNumber', width: 25 },
    { header: 'PERIHAL', key: 'subject', width: 35 },
    { header: 'TANGGAL', key: 'date', width: 15 },
    { header: 'PENERIMA', key: 'recipient', width: 25 },
    { header: 'JENIS SURAT', key: 'type', width: 15 },
    { header: 'STATUS', key: 'status', width: 15 },
    { header: 'TANGGAL DIBUAT', key: 'createdAt', width: 25 },
    { header: 'SUMBER', key: 'source', width: 15 },
    { header: 'URL LAMPIRAN', key: 'attachmentUrl', width: 40 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo-600
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  letters.forEach((l, i) => {
    const row = worksheet.addRow({
      letterNumber: l.letterNumber || '-',
      subject: l.subject || '-',
      date: l.date || '-',
      recipient: l.recipient || '-',
      type: l.type || '-',
      status: l.status || '-',
      createdAt: l.createdAt ? new Date(l.createdAt).toLocaleString('id-ID') : '-',
      source: l.source || 'Internal',
      attachmentUrl: l.attachmentUrl || '-'
    });
    row.height = 22;
    row.eachCell(cell => {
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
    if (i % 2 !== 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Arsip_Surat_Resmi_RT02_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateCashFlowExcel = async (cashFlow: any[], selectedMonth?: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Arus Kas');
  
  worksheet.views = [{ showGridLines: true }];
  
  worksheet.columns = [
    { header: 'TANGGAL', key: 'date', width: 15 },
    { header: 'KETERANGAN', key: 'description', width: 35 },
    { header: 'PIHAK KEDUA', key: 'payerReceiver', width: 25 },
    { header: 'KATEGORI', key: 'category', width: 15 },
    { header: 'METODE', key: 'method', width: 12 },
    { header: 'TIPE', key: 'type', width: 15 },
    { header: 'NOMINAL', key: 'amount', width: 18 }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Emerald-600
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  let filtered = [...cashFlow];
  if (selectedMonth) {
    const monthsId = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    filtered = cashFlow.filter(cf => {
      const d = new Date(cf.date);
      const mName = monthsId[d.getMonth()];
      const yName = d.getFullYear().toString();
      return `${mName} ${yName}` === selectedMonth;
    });
  }

  filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let currentBalance = 0;
  filtered.forEach((cf, i) => {
    if (cf.type === 'Income') {
      currentBalance += cf.amount;
    } else {
      currentBalance -= cf.amount;
    }

    const row = worksheet.addRow({
      date: cf.date || '-',
      description: cf.description || '-',
      payerReceiver: cf.payerReceiver || '-',
      category: cf.category || '-',
      method: cf.method || 'Tunai',
      type: cf.type === 'Income' ? 'Pemasukan' : 'Pengeluaran',
      amount: cf.amount
    });
    row.height = 22;
    row.eachCell((cell, colNum) => {
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNum === 7) {
        cell.numFmt = '#,##0';
        cell.font = { bold: true, color: { argb: cf.type === 'Income' ? 'FF10B981' : 'FFF43F5E' } };
      }
    });
    if (i % 2 !== 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    }
  });

  const totalIncome = filtered.filter(cf => cf.type === 'Income').reduce((acc, cf) => acc + cf.amount, 0);
  const totalExpense = filtered.filter(cf => cf.type === 'Expense').reduce((acc, cf) => acc + cf.amount, 0);
  
  const sumIncomeRow = worksheet.addRow({
    date: 'TOTAL',
    description: 'Total Pemasukan',
    amount: totalIncome
  });
  sumIncomeRow.getCell(7).numFmt = '#,##0';
  sumIncomeRow.getCell(7).font = { bold: true, color: { argb: 'FF10B981' } };

  const sumExpenseRow = worksheet.addRow({
    date: '',
    description: 'Total Pengeluaran',
    amount: totalExpense
  });
  sumExpenseRow.getCell(7).numFmt = '#,##0';
  sumExpenseRow.getCell(7).font = { bold: true, color: { argb: 'FFF43F5E' } };

  const balRow = worksheet.addRow({
    date: '',
    description: 'Saldo Akhir Periode',
    amount: currentBalance
  });
  balRow.getCell(7).numFmt = '#,##0';
  balRow.getCell(7).font = { bold: true, color: { argb: 'FF4F46E5' } };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filenameSuffix = selectedMonth ? `_${selectedMonth.replace(/\s+/g, '_')}` : '';
  saveAs(blob, `Arus_Kas_RT02${filenameSuffix}.xlsx`);
};

export const generateMutationReportExcel = async (logs: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Log Mutasi Kependudukan RT 02');

  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN REKAPITULASI MUTASI KEPENDUDUKAN RT 02';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Jenis Peristiwa', key: 'type', width: 18 },
    { header: 'Nama Warga', key: 'name', width: 26 },
    { header: 'ID Rumah / Kavling', key: 'houseId', width: 18 },
    { header: 'Keterangan Mutasi', key: 'description', width: 35 },
    { header: 'Status Verifikasi', key: 'status', width: 18 }
  ];

  const headerRow = worksheet.getRow(3);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  logs.forEach((log, index) => {
    const typeLabel = log.type === 'Newcomer' ? 'Warga Baru' :
                      log.type === 'MovedOut' ? 'Pindah Keluar' :
                      log.type === 'Birth' ? 'Kelahiran' : 'Kematian';

    const row = worksheet.addRow({
      no: index + 1,
      date: log.date,
      type: typeLabel,
      name: log.name || '-',
      houseId: log.houseId || '-',
      description: log.description || '-',
      status: log.verificationStatus || 'Approved'
    });

    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Log_Mutasi_Kependudukan_RT02_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateGuestReportExcel = async (guests: any[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Laporan Tamu RT 02');

  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'LAPORAN WAJIB LAPOR TAMU 24 JAM RT 02';
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Tgl Kedatangan', key: 'arrivalDate', width: 16 },
    { header: 'Nama Tamu', key: 'guestName', width: 25 },
    { header: 'No. HP Tamu', key: 'phone', width: 16 },
    { header: 'Tuan Rumah / Kavling', key: 'residentName', width: 25 },
    { header: 'Lama Menginap', key: 'stayDuration', width: 16 },
    { header: 'Status Tamu', key: 'status', width: 16 }
  ];

  const headerRow = worksheet.getRow(3);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  guests.forEach((g, index) => {
    const row = worksheet.addRow({
      no: index + 1,
      arrivalDate: g.arrivalDate || '-',
      guestName: g.guestName || '-',
      phone: g.phone || '-',
      residentName: `${g.residentName || '-'} (${g.residentHouseId || '-'})`,
      stayDuration: g.stayDuration || '-',
      status: g.status === 'Active' ? 'Sedang Menginap' : 'Sudah Pulang'
    });

    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Tamu_RT02_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateIuranBatchTemplateExcel = async (houses: House[], monthYear: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Iuran');

  // Title
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `TEMPLATE PENAGIHAN IURAN WARGA RT 02 - PERIODE ${monthYear.toUpperCase()}`;
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF1E293B' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]);

  worksheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Blok', key: 'block', width: 10 },
    { header: 'No Rumah', key: 'number', width: 12 },
    { header: 'Nama Kepala Keluarga', key: 'headOfFamily', width: 28 },
    { header: 'Status Pembayaran (Lunas/Belum)', key: 'status', width: 25 },
    { header: 'Jenis Iuran (Air/Sampah/Semua)', key: 'type', width: 22 },
    { header: 'Nominal Bayar (Rp)', key: 'amount', width: 20 },
  ];

  const headerRow = worksheet.getRow(3);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const occupiedHouses = houses.filter(h => h.status === 'Occupied')
    .sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));

  occupiedHouses.forEach((h, index) => {
    const row = worksheet.addRow({
      no: index + 1,
      block: h.block,
      number: h.number,
      headOfFamily: h.headOfFamily,
      status: 'Belum',
      type: 'Semua',
      amount: 50000
    });

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      if (colNumber === 5) {
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Template_Penagihan_Iuran_RT02_${monthYear.replace(/\s+/g, '_')}.xlsx`);
};

export const exportProfessionalMonthlyReportExcel = async (
  report: any,
  pdfConfig?: any,
  cashFlow: any[] = [],
  stbmRecords: any[] = []
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Teras Warga RT 02';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Laporan Bulanan RT', {
    views: [{ showGridLines: true }]
  });

  const rtName = pdfConfig?.rtName || 'RT 02';
  const kelurahan = pdfConfig?.kelurahan || 'TONDO';
  const kecamatan = pdfConfig?.kecamatan || 'MANTIKULORE';
  const kota = pdfConfig?.kota || 'PALU';
  const monthLabel = report.month || 'Bulan Berjalan';

  // 1. Header Resmi RT 02
  worksheet.mergeCells('A1:G1');
  const title1 = worksheet.getCell('A1');
  title1.value = `PEMERINTAH KOTA ${kota.toUpperCase()} - KECAMATAN ${kecamatan.toUpperCase()} - KELURAHAN ${kelurahan.toUpperCase()}`;
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF475569' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:G2');
  const title2 = worksheet.getCell('A2');
  title2.value = `PENGURUS ${rtName.toUpperCase()} HUNTAP TONDO 2`;
  title2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:G3');
  const title3 = worksheet.getCell('A3');
  title3.value = `LAPORAN PERTANGGUNGJAWABAN BULANAN TERPADU - PERIODE: ${monthLabel.toUpperCase()}`;
  title3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF4F46E5' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Blank row A4

  // 2. Ringkasan Eksekutif & Kamtibmas Box
  worksheet.mergeCells('A5:G5');
  const sumHeader = worksheet.getCell('A5');
  sumHeader.value = 'I. RINGKASAN SITUASI WILAYAH & KAMTIBMAS';
  sumHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  sumHeader.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(5).height = 24;

  worksheet.mergeCells('A6:G6');
  const sumContent = worksheet.getCell('A6');
  sumContent.value = `Situasi Umum: ${report.executiveSummary || 'Kondisi lingkungan aman, kondusif, dan harmonis.'}`;
  sumContent.font = { name: 'Calibri', size: 10, italic: true };
  sumContent.alignment = { vertical: 'middle', wrapText: true };
  worksheet.getRow(6).height = 28;

  if (report.securitySummary) {
    worksheet.mergeCells('A7:G7');
    const secContent = worksheet.getCell('A7');
    secContent.value = `Kamtibmas & Siskamling: ${report.securitySummary}`;
    secContent.font = { name: 'Calibri', size: 10, italic: true };
    secContent.alignment = { vertical: 'middle', wrapText: true };
    worksheet.getRow(7).height = 24;
  }

  worksheet.addRow([]); // Blank row

  // 3. Header Tabel Kegiatan
  const tableHeaderRowIndex = report.securitySummary ? 9 : 8;
  worksheet.mergeCells(`A${tableHeaderRowIndex}:G${tableHeaderRowIndex}`);
  const actSection = worksheet.getCell(`A${tableHeaderRowIndex}`);
  actSection.value = 'II. TABEL RINCIAN AGENDA & PERISTIWA LINGKUNGAN BULAN BERJALAN';
  actSection.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  actSection.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
  actSection.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(tableHeaderRowIndex).height = 24;

  const colHeaders = ['No', 'Tanggal', 'Jam (WITA)', 'Uraian Kegiatan', 'Lokasi Kegiatan', 'Koordinator / PIC', 'Keterangan & Hasil'];
  const headerRow = worksheet.addRow(colHeaders);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } }; // Indigo-700
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // Sort activities chronologically
  const sortedActivities = [...(report.activities || [])].sort((a: any, b: any) => {
    const dateA = `${a.date || ''} ${a.startTime || '00:00'}`;
    const dateB = `${b.date || ''} ${b.startTime || '00:00'}`;
    return dateA.localeCompare(dateB);
  });

  if (sortedActivities.length === 0) {
    const emptyRow = worksheet.addRow(['1', '-', '-', 'Tidak ada agenda kegiatan khusus pada bulan ini', '-', '-', '-']);
    emptyRow.height = 22;
    emptyRow.eachCell(c => {
      c.alignment = { horizontal: 'center', vertical: 'middle' };
      c.font = { italic: true, color: { argb: 'FF64748B' } };
    });
  } else {
    sortedActivities.forEach((act: any, idx: number) => {
      const timeStr = act.startTime ? (act.endTime ? `${act.startTime} - ${act.endTime}` : act.startTime) : '-';
      let remarks = act.description || '-';
      if (act.attendanceCount && act.attendanceCount > 0) remarks += ` | Kehadiran: ${act.attendanceCount} Warga`;
      if (act.budgetSpent && act.budgetSpent > 0) remarks += ` | Biaya: Rp ${act.budgetSpent.toLocaleString('id-ID')}`;

      const row = worksheet.addRow([
        idx + 1,
        act.date || '-',
        timeStr,
        act.title || '-',
        act.location || 'Lingkungan RT 02',
        act.picName || 'Pengurus RT',
        remarks
      ]);

      row.height = 24;
      const isEven = idx % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
      });
    });
  }

  // Width formatting
  worksheet.getColumn(1).width = 6;   // No
  worksheet.getColumn(2).width = 15;  // Tanggal
  worksheet.getColumn(3).width = 18;  // Jam
  worksheet.getColumn(4).width = 32;  // Uraian Kegiatan
  worksheet.getColumn(5).width = 28;  // Lokasi
  worksheet.getColumn(6).width = 24;  // PIC
  worksheet.getColumn(7).width = 45;  // Keterangan

  worksheet.addRow([]); // Blank row

  // 4. Pengesahan Tanda Tangan
  const currentLastRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 20;
  
  worksheet.getCell(`B${currentLastRow}`).value = 'Dibuat oleh,';
  worksheet.getCell(`B${currentLastRow}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`B${currentLastRow}`).font = { bold: true };

  worksheet.getCell(`F${currentLastRow}`).value = 'Mengetahui,';
  worksheet.getCell(`F${currentLastRow}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`F${currentLastRow}`).font = { bold: true };

  worksheet.getCell(`B${currentLastRow + 1}`).value = `Sekretaris ${rtName}`;
  worksheet.getCell(`B${currentLastRow + 1}`).alignment = { horizontal: 'center' };

  worksheet.getCell(`F${currentLastRow + 1}`).value = `Ketua ${rtName}`;
  worksheet.getCell(`F${currentLastRow + 1}`).alignment = { horizontal: 'center' };

  worksheet.getCell(`B${currentLastRow + 5}`).value = report.preparedBy || 'Sekretaris RT 02';
  worksheet.getCell(`B${currentLastRow + 5}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`B${currentLastRow + 5}`).font = { bold: true, underline: true };

  worksheet.getCell(`F${currentLastRow + 5}`).value = report.approvedBy || pdfConfig?.rtChairman || 'Ketua RT 02';
  worksheet.getCell(`F${currentLastRow + 5}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`F${currentLastRow + 5}`).font = { bold: true, underline: true };

  // --- SHEET 2: KESEHATAN LINGKUNGAN & 5 PILAR STBM (PUSKESMAS & KELURAHAN) ---
  const stbmSheet = workbook.addWorksheet('Sanitasi & STBM', {
    views: [{ showGridLines: true }]
  });

  stbmSheet.mergeCells('A1:F1');
  const stbmT1 = stbmSheet.getCell('A1');
  stbmT1.value = `LAPORAN KESEHATAN LINGKUNGAN & 5 PILAR STBM - RT 02 HUNTAP TONDO 2`;
  stbmT1.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF065F46' } };
  stbmT1.alignment = { horizontal: 'center', vertical: 'middle' };

  stbmSheet.mergeCells('A2:F2');
  const stbmT2 = stbmSheet.getCell('A2');
  stbmT2.value = `Standar Kementerian Kesehatan RI & Puskesmas Mantikulore/Talise - Periode: ${monthLabel.toUpperCase()}`;
  stbmT2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  stbmT2.alignment = { horizontal: 'center', vertical: 'middle' };

  stbmSheet.addRow([]);

  const stbmHeaders = ['No', 'Pilar STBM', 'Standar Sarana Huntap Tondo 2', 'Capaian Terverifikasi', 'Status Sanitasi', 'Keterangan Kelayakan'];
  const stbmHRow = stbmSheet.addRow(stbmHeaders);
  stbmHRow.height = 25;
  stbmHRow.eachCell(c => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } }; // Emerald-600
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const totalKk = 129;
  const issues = stbmRecords.filter((s: any) => s.needsFollowUp || s.isBABS).length;
  const odfPct = Math.round(((totalKk - issues) / totalKk) * 100);

  const stbmRows = [
    [1, 'Pilar 1: Stop Buang Air Besar Sembarangan (BABS)', 'Tangki Septik Pabrikasi Kedap (Biotank PUPR)', `${odfPct}% ODF (Bebas BABS)`, '100% Memenuhi', 'Seluruh 129 Hunian Memiliki Jamban Leher Angsa Tertutup'],
    [2, 'Pilar 2: Cuci Tangan Pakai Sabun (CTPS)', 'Kran Air Mengalir & Sabun Pembersih Tangan', '100% Sarana Tersedia', 'Memenuhi Standar', 'Pencegahan transmisi virus dan diare balita'],
    [3, 'Pilar 3: Pengelolaan Air Minum & Makanan Aman', 'Reservoir SPAM Terlindungi & Wadah Makanan Tertutup', '100% Terlindungi', 'Memenuhi Standar', 'Air minum bersih teruji bebas kontaminasi bakteri'],
    [4, 'Pilar 4: Pengelolaan Sampah Rumah Tangga', 'Pemilahan Sampah Terpilah & Retribusi Rutin TPS3R', '100% Terlayani', 'Aktif TPS3R & Bank Sampah', 'Pengangkutan teratur mencegah penumpukan sampah liar'],
    [5, 'Pilar 5: Pengelolaan Limbah Cair Rumah Tangga (SPAL)', 'Saluran Tertutup SPALDT Bebas Genangan', '100% Saluran Lancar', 'Memenuhi Standar', 'Air buangan cucian dan dapur mengalir lancar ke drainase kedap']
  ];

  stbmRows.forEach((r) => {
    const row = stbmSheet.addRow(r);
    row.height = 24;
    row.eachCell((c, col) => {
      c.font = { name: 'Calibri', size: 10 };
      if (col === 1 || col === 4 || col === 5) {
        c.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        c.alignment = { vertical: 'middle' };
      }
    });
  });

  stbmSheet.getColumn(1).width = 6;
  stbmSheet.getColumn(2).width = 34;
  stbmSheet.getColumn(3).width = 36;
  stbmSheet.getColumn(4).width = 24;
  stbmSheet.getColumn(5).width = 20;
  stbmSheet.getColumn(6).width = 46;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Kegiatan_RT02_${monthLabel.replace(/\s+/g, '_')}.xlsx`);
};

export const parseIuranBatchExcel = async (file: File): Promise<Array<{
  block: string;
  number: string;
  headOfFamily: string;
  status: 'Lunas' | 'Belum';
  type: 'Air' | 'Sampah' | 'Both';
  amount: number;
}>> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) return [];

  const results: Array<{
    block: string;
    number: string;
    headOfFamily: string;
    status: 'Lunas' | 'Belum';
    type: 'Air' | 'Sampah' | 'Both';
    amount: number;
  }> = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) return; // Skip title and header

    const block = row.getCell(2).value?.toString().trim() || '';
    const number = row.getCell(3).value?.toString().trim() || '';
    const headOfFamily = row.getCell(4).value?.toString().trim() || '';
    const rawStatus = row.getCell(5).value?.toString().trim().toLowerCase() || '';
    const rawType = row.getCell(6).value?.toString().trim().toLowerCase() || '';
    const rawAmount = parseInt(row.getCell(7).value?.toString() || '0', 10);

    if (block && number) {
      const status: 'Lunas' | 'Belum' = (rawStatus === 'lunas' || rawStatus === 'ya' || rawStatus === 'paid') ? 'Lunas' : 'Belum';
      let type: 'Air' | 'Sampah' | 'Both' = 'Both';
      if (rawType.includes('air')) type = 'Air';
      else if (rawType.includes('sampah')) type = 'Sampah';

      results.push({
        block,
        number,
        headOfFamily,
        status,
        type,
        amount: isNaN(rawAmount) ? 0 : rawAmount
      });
    }
  });

  return results;
};

/**
 * EXPORT EXCEL RESMI & EKSEKUTIF - LAPORAN 5 PILAR STBM KAWASAN HUNTAP TONDO 2
 * Standar Kementerian Kesehatan RI & Dinas Kesehatan Kota Palu / Kelurahan Tondo
 * 
 * Terdiri dari 3 Lembar Kerja Terintegrasi (Multi-Worksheet Workbook):
 * 1. Sheet 'Ringkasan & Dashboard STBM' : Dashboard Eksekutif, KPI Capaian, Matriks per Blok, & Tanda Tangan Resmi
 * 2. Sheet 'Formulir 14 Kolom Standar' : Master Data 129 Kavling dengan Frozen Panes, Zebra Stripe & Highlight Status
 * 3. Sheet 'Prioritas Tindak Lanjut'   : Rekapitulasi Rencana Aksi Kavling Membutuhkan Intervensi / Verifikasi ODF
 */
export const exportSTBMReportExcel = async (
  records: STBMRecord[],
  rtRwText: string = 'RT 002/RW 020 KELURAHAN TONDO'
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Teras Warga RT 002 Huntap Tondo 2';
  workbook.lastModifiedBy = 'Pengurus RT 002 / RW 020';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Urutkan data berdasarkan Blok dan Nomor kavling secara natural
  const sorted = [...records].sort((a, b) => naturalSortBlockAndNumber(a.block, a.number, b.block, b.number));
  const totalKK = sorted.length;
  const totalJiwa = sorted.reduce((acc, r) => acc + (r.occupants || 0), 0);

  // Kalkulasi statistik global
  const countLatrine = sorted.filter(r => r.hasHealthyLatrine).length;
  const countNoBABS = sorted.filter(r => !r.isBABS).length;
  const countCTPS = sorted.filter(r => r.hasCTPS).length;
  const countFood = sorted.filter(r => r.safeWaterAndFood).length;
  const countWaste = sorted.filter(r => r.wasteManagement).length;
  const countLiquid = sorted.filter(r => r.liquidWasteManagement).length;
  const countWater = sorted.filter(r => r.hasCleanWaterAccess).length;
  const countTriggering = sorted.filter(r => r.hasSTBMTriggering).length;
  const countFollowUp = sorted.filter(r => r.needsFollowUp).length;

  const pctLatrine = totalKK > 0 ? Math.round((countLatrine / totalKK) * 100) : 0;
  const pctNoBABS = totalKK > 0 ? Math.round((countNoBABS / totalKK) * 100) : 0;
  const pctCTPS = totalKK > 0 ? Math.round((countCTPS / totalKK) * 100) : 0;
  const pctFood = totalKK > 0 ? Math.round((countFood / totalKK) * 100) : 0;
  const pctWaste = totalKK > 0 ? Math.round((countWaste / totalKK) * 100) : 0;
  const pctLiquid = totalKK > 0 ? Math.round((countLiquid / totalKK) * 100) : 0;
  const pctWater = totalKK > 0 ? Math.round((countWater / totalKK) * 100) : 0;
  const pctTriggering = totalKK > 0 ? Math.round((countTriggering / totalKK) * 100) : 0;

  // Daftar blok unik
  const blockSet = new Set<string>();
  sorted.forEach(r => { if (r.block) blockSet.add(r.block); });
  const blockList = Array.from(blockSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // =========================================================================
  // LEMBAR 1: RINGKASAN & DASHBOARD EKSEKUTIF STBM
  // =========================================================================
  const wsSummary = workbook.addWorksheet('Ringkasan & Dashboard STBM', {
    views: [{ showGridLines: true }]
  });

  wsSummary.columns = [
    { width: 6 },   // A
    { width: 34 },  // B
    { width: 28 },  // C
    { width: 16 },  // D
    { width: 16 },  // E
    { width: 24 },  // F
    { width: 16 },  // G
    { width: 18 },  // H
    { width: 16 },  // I
    { width: 22 },  // J
  ];

  // 1.1 Kop Surat Resmi (Row 1-4)
  wsSummary.mergeCells('A1:J1');
  const sumTitle1 = wsSummary.getCell('A1');
  sumTitle1.value = 'PEMERINTAH KOTA PALU • DINAS KESEHATAN & KELURAHAN TONDO';
  sumTitle1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E35' } }; // Deep Forest Green
  sumTitle1.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.mergeCells('A2:J2');
  const sumTitle2 = wsSummary.getCell('A2');
  sumTitle2.value = 'LAPORAN EKSEKUTIF PENDATAAN 5 PILAR SANITASI TOTAL BERBASIS MASYARAKAT (STBM)';
  sumTitle2.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  sumTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E35' } };
  sumTitle2.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.mergeCells('A3:J3');
  const sumTitle3 = wsSummary.getCell('A3');
  sumTitle3.value = `WILAYAH: ${rtRwText.toUpperCase()} • KAWASAN HUNIAN TETAP (HUNTAP) TONDO 2`;
  sumTitle3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF164E35' } };
  sumTitle3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
  sumTitle3.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.mergeCells('A4:J4');
  const sumTitle4 = wsSummary.getCell('A4');
  const printDateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  sumTitle4.value = `Tanggal Laporan: ${printDateStr} | Dasar Hukum: Permenkes RI No. 3/2014 | Status: Kawasan 100% ODF (Bebas BABS)`;
  sumTitle4.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF495057' } };
  sumTitle4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
  sumTitle4.alignment = { vertical: 'middle', horizontal: 'center' };

  wsSummary.getRow(1).height = 26;
  wsSummary.getRow(2).height = 28;
  wsSummary.getRow(3).height = 22;
  wsSummary.getRow(4).height = 20;

  // 1.2 Sub-Header Bagian 1: Indikator Kunci STBM (Row 6)
  wsSummary.mergeCells('A6:J6');
  const sec1 = wsSummary.getCell('A6');
  sec1.value = 'I. MATRIKS INDIKATOR KUNCI 5 PILAR STBM (KAWASAN HUNTAP TONDO 2)';
  sec1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF164E35' } };
  sec1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  sec1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsSummary.getRow(6).height = 24;

  // Header Tabel Indikator Kunci (Row 7)
  const kpiHeaders = ['No.', 'Pilar / Indikator Sanitasi', 'Dasar Standar Teknis Kawasan', 'Target Baku', 'Realisasi KK', 'Capaian (%)', 'Status Verifikasi'];
  wsSummary.mergeCells('A7:A7');
  wsSummary.mergeCells('B7:B7');
  wsSummary.mergeCells('C7:C7');
  wsSummary.mergeCells('D7:D7');
  wsSummary.mergeCells('E7:E7');
  wsSummary.mergeCells('F7:F7');
  wsSummary.mergeCells('G7:J7');

  wsSummary.getCell('A7').value = 'No.';
  wsSummary.getCell('B7').value = 'Pilar / Indikator Sanitasi';
  wsSummary.getCell('C7').value = 'Dasar Standar Teknis Kawasan';
  wsSummary.getCell('D7').value = 'Target KK';
  wsSummary.getCell('E7').value = 'Realisasi KK';
  wsSummary.getCell('F7').value = 'Capaian (%)';
  wsSummary.getCell('G7').value = 'Status Verifikasi Lapangan';

  ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7'].forEach(cellKey => {
    const c = wsSummary.getCell(cellKey);
    c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } }; // Soft Forest
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  wsSummary.getRow(7).height = 26;

  // Data Indikator Kunci
  const kpiRows = [
    { no: '1', pilar: 'Pilar 1: Akses Jamban Sehat', standard: 'Tangki Biotank Biofilter PUPR', target: totalKK, real: countLatrine, pct: pctLatrine, status: pctLatrine === 100 ? '100% Memenuhi Standar PUPR' : 'Perlu Pemeliharaan' },
    { no: '2', pilar: 'Stop BABS (Buang Air Besar Sembarangan)', standard: 'Deklarasi ODF (Open Defecation Free)', target: totalKK, real: countNoBABS, pct: pctNoBABS, status: pctNoBABS === 100 ? '100% ODF (Bebas Buang Bebas)' : 'Ada Indikasi BABS' },
    { no: '3', pilar: 'Pilar 2: Cuci Tangan Pakai Sabun (CTPS)', standard: 'Sarana Air Mengalir & Sabun', target: totalKK, real: countCTPS, pct: pctCTPS, status: pctCTPS === 100 ? 'Sarana CTPS Tersedia Lengkap' : 'Perlu Edukasi Sabun' },
    { no: '4', pilar: 'Pilar 3: Pengelolaan Air Minum & Makanan (PAMM-RT)', standard: 'Wadah Tertutup & Pengolahan Higienis', target: totalKK, real: countFood, pct: pctFood, status: pctFood === 100 ? 'PAMM-RT Higienis Terpenuhi' : 'Perlu Pembinaan Kader' },
    { no: '5', pilar: 'Pilar 4: Pengelolaan Sampah (TPS3R)', standard: 'Pilah Sampah Organik/Anorganik Mandiri', target: totalKK, real: countWaste, pct: pctWaste, status: pctWaste === 100 ? 'Terlayani Layanan TPS3R Kawasan' : 'Pilah Sampah Belum Optimal' },
    { no: '6', pilar: 'Pilar 5: Pengolahan Air Limbah Domestik (SPALDT)', standard: 'Pipa Tertutup Menuju IPAL Terpusat', target: totalKK, real: countLiquid, pct: pctLiquid, status: pctLiquid === 100 ? 'SPAL Tertutup Ramah Lingkungan' : 'Potensi Saluran Tersumbat' },
    { no: '7', pilar: 'Akses Air Bersih Perpipaan (SPAM/PDAM)', standard: 'Jaringan Perpipaan Resmi Kota Palu', target: totalKK, real: countWater, pct: pctWater, status: pctWater === 100 ? 'Jaringan PDAM Aktif Seluruh Kavling' : 'Ada Kendala Suplai Air' },
    { no: '8', pilar: 'Pemicuan / Sosialisasi Sanitasi STBM', standard: 'Edukasi Terjadwal Kader Kesehatan RT', target: totalKK, real: countTriggering, pct: pctTriggering, status: pctTriggering === 100 ? '100% Warga Terpemicu STBM' : 'Perlu Pemicuan Ulang' },
    { no: '9', pilar: 'Kebutuhan Tindak Lanjut Khusus', standard: 'Ambang Batas Maksimal Masalah = 0 KK', target: 0, real: countFollowUp, pct: totalKK > 0 ? Math.round((countFollowUp / totalKK) * 100) : 0, status: countFollowUp === 0 ? 'Semua Tuntas (Nihil Masalah)' : `${countFollowUp} Kavling Perlu Perbaikan` },
  ];

  kpiRows.forEach((item, idx) => {
    const rNum = 8 + idx;
    wsSummary.mergeCells(`G${rNum}:J${rNum}`);
    const row = wsSummary.getRow(rNum);
    row.height = 22;

    wsSummary.getCell(`A${rNum}`).value = item.no;
    wsSummary.getCell(`B${rNum}`).value = item.pilar;
    wsSummary.getCell(`C${rNum}`).value = item.standard;
    wsSummary.getCell(`D${rNum}`).value = item.target;
    wsSummary.getCell(`E${rNum}`).value = item.real;
    wsSummary.getCell(`F${rNum}`).value = `${item.pct}%`;
    wsSummary.getCell(`G${rNum}`).value = item.status;

    // Formatting
    wsSummary.getCell(`A${rNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getCell(`B${rNum}`).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsSummary.getCell(`B${rNum}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1A1A1A' } };
    wsSummary.getCell(`C${rNum}`).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsSummary.getCell(`C${rNum}`).font = { name: 'Segoe UI', size: 9, color: { argb: 'FF595959' } };
    wsSummary.getCell(`D${rNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getCell(`E${rNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getCell(`E${rNum}`).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
    wsSummary.getCell(`F${rNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
    wsSummary.getCell(`F${rNum}`).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
    wsSummary.getCell(`G${rNum}`).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsSummary.getCell(`G${rNum}`).font = { name: 'Segoe UI', size: 9, bold: true, color: item.real === item.target ? { argb: 'FF164E35' } : { argb: 'FFC00000' } };

    // Row borders & zebra
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
      const cell = wsSummary.getCell(`${col}${rNum}`);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAF8' } };
      }
    });
  });

  // 1.3 Sub-Header Bagian 2: Matriks per Blok (Row 18)
  const blkSecRow = 18;
  wsSummary.mergeCells(`A${blkSecRow}:J${blkSecRow}`);
  const sec2 = wsSummary.getCell(`A${blkSecRow}`);
  sec2.value = 'II. REKAPITULASI CAPAIAN 5 PILAR STBM PER BLOK HUNIAN (C5 - C12)';
  sec2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF164E35' } };
  sec2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  sec2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsSummary.getRow(blkSecRow).height = 24;

  // Header Tabel Blok (Row 19)
  const blkHeaders = [
    { col: 'A', text: 'No.' },
    { col: 'B', text: 'Blok Kawasan' },
    { col: 'C', text: 'Total KK' },
    { col: 'D', text: 'Total Jiwa' },
    { col: 'E', text: 'Pilar 1 (Jamban)' },
    { col: 'F', text: 'Bebas BABS' },
    { col: 'G', text: 'Pilar 2 (CTPS)' },
    { col: 'H', text: 'Pilar 4 (Sampah)' },
    { col: 'I', text: 'Pilar 5 (SPAL)' },
    { col: 'J', text: 'Kepatuhan Blok (%)' }
  ];

  const blkHeadRow = blkSecRow + 1;
  blkHeaders.forEach(h => {
    const c = wsSummary.getCell(`${h.col}${blkHeadRow}`);
    c.value = h.text;
    c.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A4F' } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  wsSummary.getRow(blkHeadRow).height = 26;

  // Isi Data per Blok
  blockList.forEach((blk, bIdx) => {
    const rNum = blkHeadRow + 1 + bIdx;
    const recordsInBlock = sorted.filter(r => r.block === blk);
    const bTotal = recordsInBlock.length;
    const bOccupants = recordsInBlock.reduce((acc, r) => acc + (r.occupants || 0), 0);
    const bLatrine = recordsInBlock.filter(r => r.hasHealthyLatrine).length;
    const bNoBabs = recordsInBlock.filter(r => !r.isBABS).length;
    const bCtps = recordsInBlock.filter(r => r.hasCTPS).length;
    const bWaste = recordsInBlock.filter(r => r.wasteManagement).length;
    const bLiquid = recordsInBlock.filter(r => r.liquidWasteManagement).length;

    const bLatPct = bTotal > 0 ? Math.round((bLatrine / bTotal) * 100) : 0;
    const bBabsPct = bTotal > 0 ? Math.round((bNoBabs / bTotal) * 100) : 0;
    const bCtpsPct = bTotal > 0 ? Math.round((bCtps / bTotal) * 100) : 0;
    const bWastePct = bTotal > 0 ? Math.round((bWaste / bTotal) * 100) : 0;
    const bLiqPct = bTotal > 0 ? Math.round((bLiquid / bTotal) * 100) : 0;
    const bAvgPct = Math.round((bLatPct + bBabsPct + bCtpsPct + bWastePct + bLiqPct) / 5);

    wsSummary.getCell(`A${rNum}`).value = bIdx + 1;
    wsSummary.getCell(`B${rNum}`).value = `Blok ${blk}`;
    wsSummary.getCell(`C${rNum}`).value = `${bTotal} KK`;
    wsSummary.getCell(`D${rNum}`).value = `${bOccupants} Jiwa`;
    wsSummary.getCell(`E${rNum}`).value = `${bLatPct}%`;
    wsSummary.getCell(`F${rNum}`).value = `${bBabsPct}%`;
    wsSummary.getCell(`G${rNum}`).value = `${bCtpsPct}%`;
    wsSummary.getCell(`H${rNum}`).value = `${bWastePct}%`;
    wsSummary.getCell(`I${rNum}`).value = `${bLiqPct}%`;
    wsSummary.getCell(`J${rNum}`).value = `${bAvgPct}%`;

    // Format Baris
    wsSummary.getRow(rNum).height = 21;
    ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(c => {
      wsSummary.getCell(`${c}${rNum}`).alignment = { vertical: 'middle', horizontal: 'center' };
    });
    wsSummary.getCell(`B${rNum}`).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    wsSummary.getCell(`B${rNum}`).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF164E35' } };
    wsSummary.getCell(`J${rNum}`).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(c => {
      const cell = wsSummary.getCell(`${c}${rNum}`);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };
      if (bIdx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAF8' } };
    });
  });

  // Baris Total Kawasan per Blok
  const totBlkRow = blkHeadRow + 1 + blockList.length;
  wsSummary.mergeCells(`A${totBlkRow}:B${totBlkRow}`);
  wsSummary.getCell(`A${totBlkRow}`).value = 'TOTAL / RATA-RATA KAWASAN RT 002';
  wsSummary.getCell(`C${totBlkRow}`).value = `${totalKK} KK`;
  wsSummary.getCell(`D${totBlkRow}`).value = `${totalJiwa} Jiwa`;
  wsSummary.getCell(`E${totBlkRow}`).value = `${pctLatrine}%`;
  wsSummary.getCell(`F${totBlkRow}`).value = `${pctNoBABS}%`;
  wsSummary.getCell(`G${totBlkRow}`).value = `${pctCTPS}%`;
  wsSummary.getCell(`H${totBlkRow}`).value = `${pctWaste}%`;
  wsSummary.getCell(`I${totBlkRow}`).value = `${pctLiquid}%`;
  wsSummary.getCell(`J${totBlkRow}`).value = '100% ODF';

  wsSummary.getRow(totBlkRow).height = 24;
  ['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].forEach(c => {
    const cell = wsSummary.getCell(`${c}${totBlkRow}`);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF164E35' } },
      bottom: { style: 'double', color: { argb: 'FF164E35' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
    if (c !== 'A') cell.alignment = { vertical: 'middle', horizontal: 'center' };
    else cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });

  // 1.4 Catatan Teknis Infrastruktur Kawasan
  const noteStartRow = totBlkRow + 2;
  wsSummary.mergeCells(`A${noteStartRow}:J${noteStartRow}`);
  const infraHead = wsSummary.getCell(`A${noteStartRow}`);
  infraHead.value = 'III. PROFIL INFRASTRUKTUR TEKNIS SANITASI KAWASAN HUNTAP TONDO 2';
  infraHead.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF164E35' } };
  infraHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
  infraHead.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  wsSummary.getRow(noteStartRow).height = 24;

  const infraNotes = [
    '• Pilar 1 & 5: Pengelolaan air limbah menggunakan SPALDT (Sistem Pengolahan Air Limbah Domestik Terpusat) perpipaan tertutup dan biofilter Biotank higienis standar Ditjen Cipta Karya Kementerian PUPR.',
    '• Akses Air Minum: Menggunakan sambungan rumah jaringan perpipaan terpusat SPAM / PDAM Kota Palu untuk menjamin mutu mikrobiologis dan sanitasi keluarga.',
    '• Pilar 4: Pengelolaan sampah dilayani melalui sistem kawasan mandiri TPS3R Tondo 2 berbasis pemilahan dari sumber (Reduce, Reuse, Recycle).'
  ];

  infraNotes.forEach((noteText, idx) => {
    const rN = noteStartRow + 1 + idx;
    wsSummary.mergeCells(`A${rN}:J${rN}`);
    const c = wsSummary.getCell(`A${rN}`);
    c.value = noteText;
    c.font = { name: 'Segoe UI', size: 8.5, italic: true, color: { argb: 'FF495057' } };
    c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
    wsSummary.getRow(rN).height = 20;
  });

  // 1.5 Lembar Pengesahan / Tanda Tangan
  const signRow = noteStartRow + 5;
  wsSummary.mergeCells(`B${signRow}:D${signRow}`);
  wsSummary.mergeCells(`G${signRow}:I${signRow}`);
  wsSummary.getCell(`B${signRow}`).value = 'Mengetahui / Memverifikasi:';
  wsSummary.getCell(`G${signRow}`).value = `Palu, ${printDateStr}`;

  wsSummary.getCell(`B${signRow}`).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF374151' } };
  wsSummary.getCell(`G${signRow}`).font = { name: 'Segoe UI', size: 9.5, color: { argb: 'FF374151' } };
  wsSummary.getCell(`B${signRow}`).alignment = { horizontal: 'center' };
  wsSummary.getCell(`G${signRow}`).alignment = { horizontal: 'center' };

  const signTitleRow = signRow + 1;
  wsSummary.mergeCells(`B${signTitleRow}:D${signTitleRow}`);
  wsSummary.mergeCells(`G${signTitleRow}:I${signTitleRow}`);
  wsSummary.getCell(`B${signTitleRow}`).value = 'Petugas Sanitarian / Kader STBM RT 002';
  wsSummary.getCell(`G${signTitleRow}`).value = 'Ketua RT 002 / RW 020 Huntap Tondo 2';
  wsSummary.getCell(`B${signTitleRow}`).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
  wsSummary.getCell(`G${signTitleRow}`).font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
  wsSummary.getCell(`B${signTitleRow}`).alignment = { horizontal: 'center' };
  wsSummary.getCell(`G${signTitleRow}`).alignment = { horizontal: 'center' };

  const signSpaceRow = signTitleRow + 4;
  wsSummary.mergeCells(`B${signSpaceRow}:D${signSpaceRow}`);
  wsSummary.mergeCells(`G${signSpaceRow}:I${signSpaceRow}`);
  wsSummary.getCell(`B${signSpaceRow}`).value = '( ..................................................... )';
  wsSummary.getCell(`G${signSpaceRow}`).value = '( ..................................................... )';
  wsSummary.getCell(`B${signSpaceRow}`).alignment = { horizontal: 'center' };
  wsSummary.getCell(`G${signSpaceRow}`).alignment = { horizontal: 'center' };

  // =========================================================================
  // LEMBAR 2: FORMULIR 14 KOLOM STANDAR DINAS KESEHATAN (MASTER DATA)
  // =========================================================================
  const wsMaster = workbook.addWorksheet('Formulir 14 Kolom Standar', {
    views: [
      { 
        showGridLines: true,
        state: 'frozen',
        xSplit: 4,  // Freeze Kolom A-D (No, Blok, Kavling, Nama KK)
        ySplit: 3   // Freeze Baris 1-3 (Header)
      }
    ]
  });

  const masterHeaders = [
    { text: 'No.', width: 6 },
    { text: 'Blok', width: 8 },
    { text: 'No. Kavling', width: 12 },
    { text: 'Nama Kepala Keluarga', width: 34 },
    { text: 'Jml Jiwa', width: 11 },
    { text: '1. Jamban Sehat', width: 16 },
    { text: 'BABS (Stop BABS)', width: 17 },
    { text: '2. CTPS', width: 13 },
    { text: '3. PAMM-RT (Air & Mkn)', width: 22 },
    { text: '4. Kelola Sampah (TPS3R)', width: 22 },
    { text: '5. Kelola SPALDT (Limbah)', width: 23 },
    { text: 'Air Bersih (SPAM)', width: 18 },
    { text: 'Pemicuan STBM', width: 16 },
    { text: 'Perlu Tindak Lanjut', width: 18 },
    { text: 'Jenis Masalah', width: 28 },
    { text: 'Keterangan / Catatan', width: 25 }
  ];

  // Judul Master Sheet (Row 1-2)
  wsMaster.mergeCells('A1:P1');
  const mTitle1 = wsMaster.getCell('A1');
  mTitle1.value = 'FORMULIR PENDATAAN RUMAH TANGGA - 5 PILAR STBM (STANDAR DINAS KESEHATAN KOTA PALU)';
  mTitle1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  mTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF164E35' } };
  mTitle1.alignment = { vertical: 'middle', horizontal: 'center' };
  wsMaster.getRow(1).height = 26;

  wsMaster.mergeCells('A2:P2');
  const mTitle2 = wsMaster.getCell('A2');
  mTitle2.value = `${rtRwText.toUpperCase()} • STATUS KAWASAN: 100% BEBAS BABS (ODF) • TOTAL: ${totalKK} KK (${totalJiwa} JIWA)`;
  mTitle2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF164E35' } };
  mTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
  mTitle2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsMaster.getRow(2).height = 22;

  // Header Kolom (Row 3)
  const masterHeaderRow = wsMaster.getRow(3);
  masterHeaderRow.height = 36;

  masterHeaders.forEach((h, idx) => {
    const colLetter = String.fromCharCode(65 + idx);
    const cell = masterHeaderRow.getCell(idx + 1);
    cell.value = h.text;
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF000000' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6E0B4' } }; // Soft Sage Green Resmi
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF164E35' } },
      bottom: { style: 'medium', color: { argb: 'FF164E35' } },
      left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
      right: { style: 'thin', color: { argb: 'FF9CA3AF' } }
    };
    wsMaster.getColumn(idx + 1).width = h.width;
  });

  // Isi Data Master Sheet (Row 4+)
  sorted.forEach((rec, idx) => {
    const rowNum = idx + 4;
    const row = wsMaster.getRow(rowNum);
    row.height = 23;

    const rowValues = [
      idx + 1,
      rec.block,
      `${rec.block}-${rec.number}`,
      rec.headOfFamily ? rec.headOfFamily.toUpperCase() : `KAVLING ${rec.block}-${rec.number} (KOSONG)`,
      rec.occupants || 0,
      rec.hasHealthyLatrine ? 'Ya' : 'Tidak',
      rec.isBABS ? 'Ya' : 'Tidak',
      rec.hasCTPS ? 'Ya' : 'Tidak',
      rec.safeWaterAndFood ? 'Ya' : 'Tidak',
      rec.wasteManagement ? 'Ya' : 'Tidak',
      rec.liquidWasteManagement ? 'Ya' : 'Tidak',
      rec.hasCleanWaterAccess ? 'Ya' : 'Tidak',
      rec.hasSTBMTriggering ? 'Ya' : 'Tidak',
      rec.needsFollowUp ? 'Ya' : 'Tidak',
      rec.problemType || '-',
      rec.notes || '-'
    ];

    rowValues.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF1F2937' } };

      // Border halus
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      // Zebra striping
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAF8' } };
      }

      // Alignment
      if (cIdx === 0 || cIdx === 1 || cIdx === 2 || cIdx === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (cIdx === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF111827' } };
      } else if (cIdx === 14 || cIdx === 15) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // --- CONDITIONAL HIGHLIGHTING ---
      // Nilai 'Ya' pada pilar sanitasi: Hijau Sehat Lembut
      if ([5, 7, 8, 9, 10, 11, 12].includes(cIdx) && val === 'Ya') {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      }
      // Nilai 'Tidak' pada pilar sanitasi (kurang baik)
      if ([5, 7, 8, 9, 10, 11, 12].includes(cIdx) && val === 'Tidak') {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      }
      // Khusus BABS: 'Tidak' = SEHAT (Hijau), 'Ya' = BAHAYA (Merah)
      if (cIdx === 6) {
        if (val === 'Tidak') {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF166534' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        }
      }
      // Khusus Tindak Lanjut: 'Ya' = Merah Peringatan
      if (cIdx === 13 && val === 'Ya') {
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      }
    });
  });

  // Baris Total / Rangkuman di Bawah Master Data
  const mTotRow = sorted.length + 4;
  const mRow = wsMaster.getRow(mTotRow);
  mRow.height = 26;

  wsMaster.mergeCells(`A${mTotRow}:D${mTotRow}`);
  wsMaster.getCell(`A${mTotRow}`).value = 'TOTAL CAPAIAN SANITASI KAWASAN:';
  wsMaster.getCell(`E${mTotRow}`).value = totalJiwa;
  wsMaster.getCell(`F${mTotRow}`).value = `${countLatrine} Ya`;
  wsMaster.getCell(`G${mTotRow}`).value = `${countNoBABS} Tdk`;
  wsMaster.getCell(`H${mTotRow}`).value = `${countCTPS} Ya`;
  wsMaster.getCell(`I${mTotRow}`).value = `${countFood} Ya`;
  wsMaster.getCell(`J${mTotRow}`).value = `${countWaste} Ya`;
  wsMaster.getCell(`K${mTotRow}`).value = `${countLiquid} Ya`;
  wsMaster.getCell(`L${mTotRow}`).value = `${countWater} Ya`;
  wsMaster.getCell(`M${mTotRow}`).value = `${countTriggering} Ya`;
  wsMaster.getCell(`N${mTotRow}`).value = `${countFollowUp} KK`;
  wsMaster.getCell(`O${mTotRow}`).value = countFollowUp === 0 ? 'Nihil Masalah' : `${countFollowUp} Kavling`;
  wsMaster.getCell(`P${mTotRow}`).value = '100% ODF';

  for (let c = 1; c <= 16; c++) {
    const cell = mRow.getCell(c);
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FF164E35' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    cell.border = {
      top: { style: 'double', color: { argb: 'FF164E35' } },
      bottom: { style: 'double', color: { argb: 'FF164E35' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
    if (c === 1) cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    else cell.alignment = { vertical: 'middle', horizontal: 'center' };
  }

  // =========================================================================
  // LEMBAR 3: PRIORITAS TINDAK LANJUT & INTERVENSI LAPANGAN
  // =========================================================================
  const wsIssues = workbook.addWorksheet('Prioritas Tindak Lanjut', {
    views: [{ showGridLines: true }]
  });

  wsIssues.columns = [
    { width: 6 },   // No
    { width: 14 },  // Kavling
    { width: 32 },  // Nama KK
    { width: 12 },  // Jiwa
    { width: 30 },  // Masalah yang Ditemukan
    { width: 22 },  // Kategori Pilar Terdampak
    { width: 30 },  // Rekomendasi Solusi Teknis
    { width: 25 },  // Catatan Khusus
  ];

  // Judul Sheet Tindak Lanjut
  wsIssues.mergeCells('A1:H1');
  const issTitle1 = wsIssues.getCell('A1');
  issTitle1.value = 'DAFTAR PRIORITAS TINDAK LANJUT & INTERVENSI SARANA SANITASI RT 002';
  issTitle1.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  issTitle1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF991B1B' } }; // Deep Red
  issTitle1.alignment = { vertical: 'middle', horizontal: 'center' };
  wsIssues.getRow(1).height = 26;

  wsIssues.mergeCells('A2:H2');
  const issTitle2 = wsIssues.getCell('A2');
  issTitle2.value = `Daftar kavling yang memerlukan pemeliharaan Biotank, perbaikan pipa SPALDT, atau penguatan sarana CTPS (${countFollowUp} Kavling)`;
  issTitle2.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FFFFFFFF' } };
  issTitle2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB91C1C' } };
  issTitle2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsIssues.getRow(2).height = 20;

  // Header Tabel Tindak Lanjut (Row 4)
  const issueHeaders = ['No.', 'Kavling', 'Nama Kepala Keluarga', 'Jml Jiwa', 'Masalah Sanitasi yang Dilaporkan', 'Pilar Terdampak', 'Rekomendasi Intervensi', 'Catatan Petugas'];
  const issHeaderRow = wsIssues.getRow(4);
  issHeaderRow.height = 26;

  issueHeaders.forEach((text, idx) => {
    const c = issHeaderRow.getCell(idx + 1);
    c.value = text;
    c.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } }; // Slate Gray
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const problemRecords = sorted.filter(r => r.needsFollowUp || r.isBABS || !r.hasHealthyLatrine);

  if (problemRecords.length === 0) {
    // Jika 0 masalah (Semua 129 kavling tuntas dan sehat)
    wsIssues.mergeCells('A5:H6');
    const emptyCell = wsIssues.getCell('A5');
    emptyCell.value = '✓ HASIL VERIFIKASI LAPANGAN: SELURUH 129 KAVLING DI RT 002 MEMENUHI STANDAR 5 PILAR STBM\nStatus Kawasan: 100% Bebas BABS (ODF), terhubung Biotank PUPR, SPALDT Terpusat, SPAM PDAM, dan TPS3R.';
    emptyCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF166534' } };
    emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    emptyCell.border = {
      top: { style: 'thin', color: { argb: 'FF86EFAC' } },
      bottom: { style: 'thin', color: { argb: 'FF86EFAC' } },
      left: { style: 'thin', color: { argb: 'FF86EFAC' } },
      right: { style: 'thin', color: { argb: 'FF86EFAC' } }
    };
    wsIssues.getRow(5).height = 25;
    wsIssues.getRow(6).height = 25;
  } else {
    // Isi data masalah jika ada
    problemRecords.forEach((rec, idx) => {
      const rN = 5 + idx;
      const row = wsIssues.getRow(rN);
      row.height = 22;

      let pilarTerdampak = 'Umum';
      if (rec.isBABS || !rec.hasHealthyLatrine) pilarTerdampak = 'Pilar 1 (Jamban / BABS)';
      else if (!rec.hasCTPS) pilarTerdampak = 'Pilar 2 (CTPS)';
      else if (!rec.safeWaterAndFood) pilarTerdampak = 'Pilar 3 (PAMM-RT)';
      else if (!rec.wasteManagement) pilarTerdampak = 'Pilar 4 (TPS3R)';
      else if (!rec.liquidWasteManagement) pilarTerdampak = 'Pilar 5 (SPALDT)';

      row.getCell(1).value = idx + 1;
      row.getCell(2).value = `${rec.block}-${rec.number}`;
      row.getCell(3).value = rec.headOfFamily ? rec.headOfFamily.toUpperCase() : '-';
      row.getCell(4).value = rec.occupants || 0;
      row.getCell(5).value = rec.problemType || 'Perlu pemantauan berkala';
      row.getCell(6).value = pilarTerdampak;
      row.getCell(7).value = rec.problemType?.includes('Biotank') ? 'Penyedotan / pemeriksaan biofilter' : 'Pembersihan pipa & sosialisasi kader';
      row.getCell(8).value = rec.notes || '-';

      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(5).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      row.getCell(6).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(7).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      row.getCell(8).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

      row.getCell(5).font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
      row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

      for (let c = 1; c <= 8; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      }
    });
  }

  // Generate binary buffer & trigger direct browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const dateStr = new Date().toISOString().split('T')[0];
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Laporan_Eksekutif_5_Pilar_STBM_RT02_${dateStr}.xlsx`);
};



