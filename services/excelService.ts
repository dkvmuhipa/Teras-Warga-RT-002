import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { House, PaymentStatus } from '../types';

export const generateProfessionalExcel = async (houses: House[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Warga RT 002');

  // Define columns
  worksheet.columns = [
    { header: 'BLOK (Wajib)', key: 'block', width: 15 },
    { header: 'NOMOR (Wajib)', key: 'number', width: 15 },
    { header: 'NAMA KEPALA KELUARGA (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Occupied/Empty/Business)', key: 'status', width: 35 },
    { header: 'STATUS KEPEMILIKAN (Tetap/Kontrak/Kost)', key: 'residenceType', width: 40 },
    { header: 'JUMLAH PENGHUNI', key: 'occupants', width: 20 },
    { header: 'PENDIDIKAN', key: 'education', width: 20 },
    { header: 'PEKERJAAN', key: 'jobCategory', width: 25 },
    { header: 'JUMLAH KENDARAAN', key: 'vehicleCount', width: 20 },
    { header: 'JUMLAH IBU HAMIL', key: 'pregnantCount', width: 25 },
    { header: 'JUMLAH BALITA', key: 'toddlerCount', width: 25 },
    { header: 'JUMLAH LANSIA', key: 'elderlyCount', width: 25 },
    { header: 'STATUS PEMBAYARAN (Lunas/Belum Lunas)', key: 'paymentStatus', width: 35 },
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
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Add Data
  houses.forEach((house, index) => {
    const row = worksheet.addRow({
      block: house.block,
      number: house.number,
      headOfFamily: house.headOfFamily,
      ownerName: house.ownerName || '-',
      phone: house.phone || '-',
      status: house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha',
      residenceType: house.residenceType || '-',
      occupants: house.occupants || 0,
      education: house.education || '-',
      jobCategory: house.jobCategory || '-',
      vehicleCount: house.vehicleCount || 0,
      pregnantCount: house.pregnantCount || 0,
      toddlerCount: house.toddlerCount || 0,
      elderlyCount: house.elderlyCount || 0,
      paymentStatus: house.paymentStatus,
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
      if (cell.value === PaymentStatus.PAID) {
        cell.font = { color: { argb: 'FF059669' }, bold: true }; // Emerald-600
      } else if (cell.value === PaymentStatus.PENDING || cell.value === PaymentStatus.UNPAID) {
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

  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Data_Warga_RT002_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Data Warga');

  // Define columns
  worksheet.columns = [
    { header: 'BLOK (Wajib)', key: 'block', width: 15 },
    { header: 'NOMOR (Wajib)', key: 'number', width: 15 },
    { header: 'NAMA KEPALA KELUARGA (Wajib)', key: 'headOfFamily', width: 35 },
    { header: 'NAMA PEMILIK (Opsional)', key: 'ownerName', width: 35 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Occupied/Empty/Business)', key: 'status', width: 35 },
    { header: 'STATUS KEPEMILIKAN (Tetap/Kontrak/Kost)', key: 'residenceType', width: 40 },
    { header: 'JUMLAH PENGHUNI', key: 'occupants', width: 20 },
    { header: 'PENDIDIKAN', key: 'education', width: 20 },
    { header: 'PEKERJAAN', key: 'jobCategory', width: 25 },
    { header: 'JUMLAH KENDARAAN', key: 'vehicleCount', width: 20 },
    { header: 'JUMLAH IBU HAMIL', key: 'pregnantCount', width: 25 },
    { header: 'JUMLAH BALITA', key: 'toddlerCount', width: 25 },
    { header: 'JUMLAH LANSIA', key: 'elderlyCount', width: 25 },
    { header: 'STATUS PEMBAYARAN (Lunas/Belum Lunas)', key: 'paymentStatus', width: 35 },
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
    ownerName: 'Ahmad Dahlan',
    phone: '081234567890',
    status: 'Occupied',
    residenceType: 'Kontrak',
    occupants: 4,
    education: 'S1',
    jobCategory: 'Karyawan Swasta',
    vehicleCount: 2,
    pregnantCount: 0,
    toddlerCount: 1,
    elderlyCount: 0,
    paymentStatus: 'Belum Lunas',
    accessCode: '123456',
  });

  // Add Instructions
  worksheet.addRow([]);
  const instructionRow = worksheet.addRow(['PETUNJUK PENGISIAN:']);
  instructionRow.font = { bold: true, color: { argb: 'FFDC2626' } };
  worksheet.addRow(['1. Kolom bertanda (Wajib) tidak boleh kosong.']);
  worksheet.addRow(['2. Status Hunian harus diisi salah satu dari: Occupied, Empty, atau Business.']);
  worksheet.addRow(['3. Status Kepemilikan harus diisi: Tetap, Kontrak, atau Kost.']);
  worksheet.addRow(['4. Status Pembayaran harus diisi: Lunas atau Belum Lunas.']);
  worksheet.addRow(['5. Kolom Jumlah (Kendaraan, Ibu Hamil, Balita, Lansia) diisi dengan angka.']);

  // Generate and Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Template_Data_Warga_RT002.xlsx');
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
    const headOfFamily = row.getCell(3 + offset).text?.toString().trim();

    // If block is empty or looks like an instruction row, skip
    if (!block || !number || !headOfFamily || block.startsWith('PETUNJUK') || block.match(/^\d+\./)) return;

    const ownerName = row.getCell(4 + offset).text;
    const phone = row.getCell(5 + offset).text;
    const statusRaw = row.getCell(6 + offset).text;
    const residenceTypeRaw = row.getCell(7 + offset).text;
    const occupantsRaw = row.getCell(8 + offset).value;
    const education = row.getCell(9 + offset).text;
    const jobCategory = row.getCell(10 + offset).text;
    const vehicleCountRaw = row.getCell(11 + offset).value;
    const pregnantCountRaw = row.getCell(12 + offset).value;
    const toddlerCountRaw = row.getCell(13 + offset).value;
    const elderlyCountRaw = row.getCell(14 + offset).value;
    const paymentStatusRaw = row.getCell(15 + offset).text;
    const accessCode = row.getCell(16 + offset).text;

    // Map status
    let status: 'Occupied' | 'Empty' | 'Business' = 'Occupied';
    if (statusRaw?.toLowerCase() === 'empty' || statusRaw?.toLowerCase() === 'kosong') status = 'Empty';
    else if (statusRaw?.toLowerCase() === 'business' || statusRaw?.toLowerCase() === 'usaha') status = 'Business';

    // Map payment status
    let paymentStatus = PaymentStatus.UNPAID;
    if (paymentStatusRaw?.toLowerCase() === 'lunas' || paymentStatusRaw?.toLowerCase() === 'paid') paymentStatus = PaymentStatus.PAID;
    else if (paymentStatusRaw?.toLowerCase() === 'belum lunas' || paymentStatusRaw?.toLowerCase() === 'pending') paymentStatus = PaymentStatus.PENDING;

    // Map residence type
    let residenceType: 'Tetap' | 'Kontrak' | 'Kost' | undefined = undefined;
    if (residenceTypeRaw?.toLowerCase() === 'tetap') residenceType = 'Tetap';
    else if (residenceTypeRaw?.toLowerCase() === 'kontrak') residenceType = 'Kontrak';
    else if (residenceTypeRaw?.toLowerCase() === 'kost') residenceType = 'Kost';

    data.push({
      block,
      number,
      headOfFamily,
      ownerName,
      phone,
      status,
      occupants: Number(occupantsRaw) || 1,
      residenceType,
      education,
      jobCategory,
      vehicleCount: Number(vehicleCountRaw) || 0,
      pregnantCount: Number(pregnantCountRaw) || 0,
      toddlerCount: Number(toddlerCountRaw) || 0,
      elderlyCount: Number(elderlyCountRaw) || 0,
      paymentStatus,
      accessCode,
      familyMembers: []
    });
  });

  return data;
};
