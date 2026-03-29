import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { House, PaymentStatus } from '../types';

export const generateProfessionalExcel = async (houses: House[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Warga RT 02');

  // Sort houses by block and number
  const sortedHouses = [...houses].sort((a, b) => {
    if (a.block !== b.block) {
      return a.block.localeCompare(b.block);
    }
    // Try to sort numerically if possible
    const numA = parseInt(a.number, 10);
    const numB = parseInt(b.number, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.number.localeCompare(b.number);
  });

  // Define columns
  worksheet.columns = [
    { header: 'BLOK (Wajib)', key: 'block', width: 15 },
    { header: 'NOMOR (Wajib)', key: 'number', width: 15 },
    { header: 'NAMA KEPALA KELUARGA (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'JENIS KELAMIN', key: 'gender', width: 20 },
    { header: 'TANGGAL LAHIR', key: 'birthDate', width: 20 },
    { header: 'AGAMA', key: 'religion', width: 20 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'KONTAK PEMILIK (Opsional)', key: 'ownerPhone', width: 25 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Occupied/Empty/Business)', key: 'status', width: 35 },
    { header: 'STATUS KEPEMILIKAN (Tetap/Kontrak/Kost)', key: 'residenceType', width: 40 },
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

  // Style Header
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo-600
    };
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11,
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

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
      status: house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha',
      residenceType: house.residenceType || '-',
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
    row.height = 25;
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      
      // Conditional styling for Payment Status
      if (cell.value === PaymentStatus.PAID || cell.value === 'Terverifikasi') {
        cell.font = { color: { argb: 'FF059669' }, bold: true }; // Emerald-600
      } else if (cell.value === PaymentStatus.PENDING || cell.value === PaymentStatus.UNPAID || cell.value === 'Belum Verifikasi') {
        cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Rose-600
      }
    });

    // Alternate row background
    if (index % 2 !== 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' }, // Slate-50
      };
    }
  });

  // Add Family Members Sheet
  const familySheet = workbook.addWorksheet('Anggota Keluarga');
  familySheet.columns = [
    { header: 'BLOK', key: 'block', width: 10 },
    { header: 'NOMOR', key: 'number', width: 10 },
    { header: 'KEPALA KELUARGA', key: 'headOfFamily', width: 30 },
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
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
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
  summarySheet.columns = [
    { header: 'KATEGORI', key: 'category', width: 30 },
    { header: 'JUMLAH', key: 'value', width: 20 },
    { header: 'SATUAN', key: 'unit', width: 15 },
  ];

  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.height = 30;
  summaryHeaderRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const totalJiwa = houses.filter(h => h.status === 'Occupied').reduce((acc, h) => acc + (h.occupants || 0), 0);
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
    { header: 'NAMA KEPALA KELUARGA (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'JENIS KELAMIN (Laki-laki/Perempuan)', key: 'gender', width: 25 },
    { header: 'TANGGAL LAHIR (YYYY-MM-DD)', key: 'birthDate', width: 25 },
    { header: 'AGAMA', key: 'religion', width: 20 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'KONTAK PEMILIK (Opsional)', key: 'ownerPhone', width: 25 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Occupied/Empty/Business)', key: 'status', width: 35 },
    { header: 'STATUS KEPEMILIKAN (Tetap/Kontrak/Kost)', key: 'residenceType', width: 40 },
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
      fgColor: { argb: 'FF4F46E5' },
    };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

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
    status: 'Occupied',
    residenceType: 'Kontrak',
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
  instructionRow.font = { bold: true, color: { argb: 'FFDC2626' } };
  worksheet.addRow(['1. Kolom bertanda (Wajib) tidak boleh kosong.']);
  worksheet.addRow(['2. Status Hunian harus diisi salah satu dari: Occupied, Empty, atau Business.']);
  worksheet.addRow(['3. Status Kepemilikan harus diisi: Tetap, Kontrak, atau Kost.']);
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
    let status: 'Occupied' | 'Empty' | 'Business' | undefined = undefined;
    if (statusRaw?.toLowerCase() === 'empty' || statusRaw?.toLowerCase() === 'kosong') status = 'Empty';
    else if (statusRaw?.toLowerCase() === 'business' || statusRaw?.toLowerCase() === 'usaha') status = 'Business';
    else if (statusRaw?.toLowerCase() === 'occupied' || statusRaw?.toLowerCase() === 'dihuni') status = 'Occupied';

    // Map payment status Air
    let paymentStatusAir: PaymentStatus | undefined = undefined;
    if (paymentStatusAirRaw?.toLowerCase() === 'lunas' || paymentStatusAirRaw?.toLowerCase() === 'paid') paymentStatusAir = PaymentStatus.PAID;
    else if (paymentStatusAirRaw?.toLowerCase() === 'belum lunas' || paymentStatusAirRaw?.toLowerCase() === 'pending') paymentStatusAir = PaymentStatus.PENDING;

    // Map payment status Sampah
    let paymentStatusSampah: PaymentStatus | undefined = undefined;
    if (paymentStatusSampahRaw?.toLowerCase() === 'lunas' || paymentStatusSampahRaw?.toLowerCase() === 'paid') paymentStatusSampah = PaymentStatus.PAID;
    else if (paymentStatusSampahRaw?.toLowerCase() === 'belum lunas' || paymentStatusSampahRaw?.toLowerCase() === 'pending') paymentStatusSampah = PaymentStatus.PENDING;

    // Map residence type
    let residenceType: 'Tetap' | 'Kontrak' | 'Kost' | undefined = undefined;
    if (residenceTypeRaw?.toLowerCase() === 'tetap') residenceType = 'Tetap';
    else if (residenceTypeRaw?.toLowerCase() === 'kontrak') residenceType = 'Kontrak';
    else if (residenceTypeRaw?.toLowerCase() === 'kost') residenceType = 'Kost';

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

