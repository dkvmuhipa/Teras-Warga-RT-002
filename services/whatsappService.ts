export const sendWhatsAppMessage = (phone: string, message: string) => {
  let formattedPhone = phone.replace(/[^0-9]/g, '');
  
  // Handle Indonesian numbers starting with '0'
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '62' + formattedPhone.substring(1);
  }
  
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
};

export const formatAnnouncementForWhatsApp = (title: string, content: string) => {
  return `*PENGUMUMAN RESMI RT 02*
------------------------------------------

Yth. Bapak/Ibu Warga RT 02,

Berikut adalah informasi terbaru:

*Judul:* ${title}
*Isi:* ${content}

Untuk informasi lebih lengkap, silakan akses aplikasi *TERAS RT 02*.

Terima kasih atas perhatiannya.
_Pesan otomatis dari Pengurus RT 02_`;
};

export const formatLetterStatusForWhatsApp = (name: string, type: string, status: string) => {
  const statusLabel = status === 'Approved' ? '✅ DISETUJUI' : status === 'Rejected' ? '❌ DITOLAK' : '⏳ SEDANG DIPROSES';
  const footer = status === 'Approved' 
    ? '\nSilakan mengambil dokumen fisik di rumah Ketua RT dengan membawa persyaratan yang diperlukan.' 
    : '';

  return `*KONFIRMASI LAYANAN SURAT RT 02*
------------------------------------------

Yth. Sdr/i *${name}*,

Kami menginformasikan bahwa permohonan surat Anda:

*Jenis:* ${type}
*Status:* ${statusLabel}
${footer}

Terima kasih telah menggunakan layanan digital RT 02.
_Pesan otomatis dari Pengurus RT 02_`;
};
