import { House, PaymentStatus } from '../types';

export const generateTemplateCSV = () => {
  const headers = [
    'Blok (Wajib)',
    'Nomor (Wajib)',
    'Nama Kepala Keluarga (Wajib)',
    'Nomor Telepon',
    'Status Hunian (Occupied/Empty/Business)',
    'Jumlah Penghuni',
    'Status Pembayaran (Lunas/Belum Lunas)',
    'Tipe Hunian (Tetap/Kontrak/Kost)',
    'Kode Akses (PIN)'
  ];

  const exampleRow = [
    'C5',
    '01',
    'Budi Santoso',
    '081234567890',
    'Occupied',
    '4',
    'Belum Lunas',
    'Tetap',
    '123456'
  ];

  const csvContent = [
    headers.join(','),
    exampleRow.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'template_data_warga_rt002.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseResidentCSV = (file: File): Promise<Partial<House>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const data: Partial<House>[] = [];

        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV split by comma, handling potential quotes if needed (simplified for now)
          // For robust parsing, a library like PapaParse is recommended, but we'll stick to simple split for this task
          // assuming the template is followed.
          const values = line.split(',').map(v => v.trim());

          if (values.length < 3) continue; // Skip invalid rows

          const [
            block,
            number,
            headOfFamily,
            phone,
            statusRaw,
            occupantsRaw,
            paymentStatusRaw,
            residenceTypeRaw,
            accessCode
          ] = values;

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
            block: block || '',
            number: number || '',
            headOfFamily: headOfFamily || '',
            phone: phone || '',
            status,
            occupants: parseInt(occupantsRaw) || 1,
            paymentStatus,
            residenceType,
            accessCode: accessCode || '',
            familyMembers: [] // CSV simple template doesn't support nested family members yet
          });
        }
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
