import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { House, PaymentStatus } from '../types';

export const generateProfessionalExcel = async (houses: House[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Warga RT 002');

  // Define columns
  worksheet.columns = [
    { header: 'NO', key: 'no', width: 5 },
    { header: 'BLOK', key: 'block', width: 10 },
    { header: 'NOMOR', key: 'number', width: 10 },
    { header: 'KEPALA KELUARGA', key: 'headOfFamily', width: 30 },
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN', key: 'status', width: 15 },
    { header: 'PENGHUNI', key: 'occupants', width: 10 },
    { header: 'PEMBAYARAN', key: 'paymentStatus', width: 15 },
    { header: 'TIPE HUNIAN', key: 'residenceType', width: 15 },
    { header: 'KODE AKSES', key: 'accessCode', width: 15 },
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
      no: index + 1,
      block: house.block,
      number: house.number,
      headOfFamily: house.headOfFamily,
      phone: house.phone || '-',
      status: house.status === 'Occupied' ? 'Dihuni' : house.status === 'Empty' ? 'Kosong' : 'Usaha',
      occupants: house.occupants || 0,
      paymentStatus: house.paymentStatus,
      residenceType: house.residenceType || '-',
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
    { header: 'TELEPON', key: 'phone', width: 20 },
    { header: 'STATUS HUNIAN (Occupied/Empty/Business)', key: 'status', width: 35 },
    { header: 'JUMLAH PENGHUNI', key: 'occupants', width: 20 },
    { header: 'STATUS PEMBAYARAN (Lunas/Belum Lunas)', key: 'paymentStatus', width: 35 },
    { header: 'TIPE HUNIAN (Tetap/Kontrak/Kost)', key: 'residenceType', width: 30 },
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
    phone: '081234567890',
    status: 'Occupied',
    occupants: 4,
    paymentStatus: 'Belum Lunas',
    residenceType: 'Tetap',
    accessCode: '123456',
  });

  // Add Instructions
  worksheet.addRow([]);
  const instructionRow = worksheet.addRow(['PETUNJUK PENGISIAN:']);
  instructionRow.font = { bold: true, color: { argb: 'FFDC2626' } };
  worksheet.addRow(['1. Kolom bertanda (Wajib) tidak boleh kosong.']);
  worksheet.addRow(['2. Status Hunian harus diisi salah satu dari: Occupied, Empty, atau Business.']);
  worksheet.addRow(['3. Status Pembayaran harus diisi: Lunas atau Belum Lunas.']);
  worksheet.addRow(['4. Tipe Hunian harus diisi: Tetap, Kontrak, atau Kost.']);

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

  worksheet.eachRow((row, rowNumber) => {
    // Skip header and instruction rows
    if (rowNumber === 1 || rowNumber > worksheet.rowCount - 5) return;
    
    // Check if it's the example row or empty
    const block = row.getCell(1).text;
    const number = row.getCell(2).text;
    const headOfFamily = row.getCell(3).text;

    if (!block || !number || !headOfFamily) return;

    const phone = row.getCell(4).text;
    const statusRaw = row.getCell(5).text;
    const occupantsRaw = row.getCell(6).value;
    const paymentStatusRaw = row.getCell(7).text;
    const residenceTypeRaw = row.getCell(8).text;
    const accessCode = row.getCell(9).text;

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
      phone,
      status,
      occupants: Number(occupantsRaw) || 1,
      paymentStatus,
      residenceType,
      accessCode,
      familyMembers: []
    });
  });

  return data;
};
