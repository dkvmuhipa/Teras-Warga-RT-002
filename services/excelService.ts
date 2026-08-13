import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { House, PaymentStatus } from '../types';

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
      vehicleCount: house.vehicleCount || 0,
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
    { category: 'Total Kendaraan', value: houses.reduce((acc, h) => acc + (h.vehicleCount || 0), 0), unit: 'Unit' },
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

  worksheet.eachRow((row, rowNumber) => {
    // Skip header row and detect format
    if (rowNumber === 1) {
      if (row.getCell(1).text?.toString().trim().toUpperCase() === 'NO') {
        isOldFormat = true;
      }
      return;
    }
    
    // Check if it's the example row or empty
    const offset = isOldFormat ? 1 : 0;
    const block = row.getCell(1 + offset).text?.toString().trim();
    const number = row.getCell(2 + offset).text?.toString().trim();
    const headOfFamily = row.getCell(3 + offset).text?.toString().trim() || '-';

    // If block is empty or looks like an instruction row, skip
    if (!block || !number || block.startsWith('PETUNJUK') || block.match(/^\d+\./)) return;

    const genderRaw = row.getCell(4 + offset).text?.trim() || undefined;
    const birthDate = row.getCell(5 + offset).text?.trim() || undefined;
    const religion = row.getCell(6 + offset).text?.trim() || undefined;
    const ownerName = row.getCell(7 + offset).text?.trim() || undefined;
    const ownerPhone = row.getCell(8 + offset).text?.trim() || undefined;
    const phone = row.getCell(9 + offset).text?.trim() || undefined;
    const statusRaw = row.getCell(10 + offset).text?.trim() || undefined;
    const residenceTypeRaw = row.getCell(11 + offset).text?.trim() || undefined;
    const occupantsRaw = row.getCell(12 + offset).value;
    const education = row.getCell(13 + offset).text?.trim() || undefined;
    const jobCategory = row.getCell(14 + offset).text?.trim() || undefined;
    const vehicleCountRaw = row.getCell(15 + offset).value;
    const pregnantCountRaw = row.getCell(16 + offset).value;
    const babyCountRaw = row.getCell(17 + offset).value;
    const toddlerCountRaw = row.getCell(18 + offset).value;
    const teenagerCountRaw = row.getCell(19 + offset).value;
    const adultCountRaw = row.getCell(20 + offset).value;
    const elderlyCountRaw = row.getCell(21 + offset).value;
    const childCountRaw = row.getCell(22 + offset).value;
    const widowCountRaw = row.getCell(23 + offset).value;
    const economicStatus = row.getCell(24 + offset).text?.trim() || undefined;
    const isBPNTRaw = row.getCell(25 + offset).text?.trim() || undefined;
    const isDisabilityRaw = row.getCell(26 + offset).text?.trim() || undefined;
    const disabilityCountRaw = row.getCell(27 + offset).value;
    const isOrphanRaw = row.getCell(28 + offset).text?.trim() || undefined;
    const orphanCountRaw = row.getCell(29 + offset).value;
    const paymentStatusAirRaw = row.getCell(30 + offset).text?.trim() || undefined;
    const paymentStatusSampahRaw = row.getCell(31 + offset).text?.trim() || undefined;
    const accessCode = row.getCell(32 + offset).text?.trim() || undefined;

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
      ...(vehicleCountRaw !== null && vehicleCountRaw !== undefined && vehicleCountRaw !== '' && { vehicleCount: Number(vehicleCountRaw) }),
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

