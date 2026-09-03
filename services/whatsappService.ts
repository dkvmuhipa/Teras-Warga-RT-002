import { RondaSchedule } from '../types';

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

/**
 * Send WhatsApp message via the server-side gateway (Automatic)
 */
export const sendWhatsAppViaGateway = async (target: string, message: string) => {
  try {
    const response = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target, message }),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to send WhatsApp via gateway:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Broadcast message to multiple numbers via gateway
 */
export const broadcastWhatsApp = async (phones: string[], message: string) => {
  // Join targets with comma (server handles splitting for Sidobe)
  const target = phones.map(p => {
    // If it's a group ID (contains @), don't format it as a phone number
    if (p.includes('@')) return p;
    
    let formatted = p.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1);
    return formatted;
  }).join(',');

  return sendWhatsAppViaGateway(target, message);
};

/**
 * Fetch list of WhatsApp groups from gateway
 */
export const getWhatsAppGroups = async () => {
  try {
    const response = await fetch('/api/whatsapp/groups', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();
      return result;
    } else {
      return { success: false, error: `Server error (${response.status})` };
    }
  } catch (error) {
    console.error('Failed to fetch WhatsApp groups:', error);
    return { success: false, error: 'Network error' };
  }
};

export const formatAnnouncementForWhatsApp = (title: string, content: string) => {
  return `*PENGUMUMAN RESMI RT 02*
------------------------------------------

Yth. Bapak/Ibu Warga RT 02,

Berikut adalah informasi terbaru:

*Judul:* ${title}
*Isi:* ${content}

Untuk informasi lebih lengkap, silakan akses aplikasi *TERAS RT 02*:
https://terasrt02.vercel.app

Terima kasih atas perhatiannya.
_Pesan otomatis dari Pengurus RT 02_`;
};

export const formatLelayuForWhatsApp = (data: {
  deceasedName: string;
  deceasedAge?: string;
  deceasedHouseId?: string;
  funeralTime?: string;
  funeralLocation?: string;
  tazkiahSchedule?: string;
  bankAccount?: string;
  content?: string;
}) => {
  return `🖤 *BERITA LELAYU / DUKA CITA RT 02* 🖤
------------------------------------------
_Innalillahi wa inna ilaihi raji'un_

Telah berpulang ke Rahmatullah, warga/keluarga kita tercinta:

👤 *Nama:* ${data.deceasedName} ${data.deceasedAge ? `(${data.deceasedAge} Tahun)` : ''}
🏠 *Rumah Duka:* ${data.deceasedHouseId || '-'}
⏰ *Waktu Pemakaman:* ${data.funeralTime || 'Menyusul'}
📍 *Lokasi Pemakaman:* ${data.funeralLocation || '-'}
${data.tazkiahSchedule ? `🤲 *Jadwal Takziah/Tahlil:* ${data.tazkiahSchedule}\n` : ''}${data.bankAccount ? `💳 *Rekening Tali Asih/Belasungkawa:*\n${data.bankAccount}\n` : ''}
${data.content ? `${data.content}\n` : ''}
------------------------------------------
Semoga almarhum/almarhumah diampuni segala dosanya, diterima amal ibadahnya, dan keluarga yang ditinggalkan senantiasa diberi ketabahan & keikhlasan. Aamiin.

_Disiarkan secara resmi oleh Pengurus RT 02 Huntap Tondo 2_`;
};

export const formatLetterStatusForWhatsApp = (
  name: string, 
  type: string, 
  status: string, 
  letterId?: string, 
  letterNumber?: string
) => {
  const isApproved = status === 'Disetujui' || status === 'Approved';
  const isRejected = status === 'Ditolak' || status === 'Rejected';
  
  const statusLabel = isApproved ? '✅ DISETUJUI & SELESAI' : isRejected ? '❌ DITOLAK / TIDAK DAPAT DIPROSES' : '⏳ SEDANG DIVERIFIKASI';
  
  // Direct tracking & download link based on current domain with HashRouter support
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://terasrt02.vercel.app';
  const downloadLink = letterId ? `${baseUrl}/#/surat/${letterId}` : `${baseUrl}/#/services?tab=history`;

  let detailsBlock = `*Jenis Surat:* ${type}\n*Status Permohonan:* ${statusLabel}`;
  if (letterNumber) {
    detailsBlock += `\n*Nomor Surat:* ${letterNumber}`;
  }
  if (letterId) {
    detailsBlock += `\n*ID Pelacakan:* \`${letterId}\``;
  }

  let bodyMessage = '';
  if (isApproved) {
    bodyMessage = `Kabar baik! Permohonan surat Anda telah selesai ditinjau dan disahkan secara resmi oleh Pengurus RT 02.

📥 *UNDUH DOKUMEN SURAT (PDF RESMI):*
👉 ${downloadLink}

_Dokumen PDF digital di atas sudah dilengkapi Tanda Tangan Digital & Stempel Sah RT 02 dan dapat langsung dicetak atau dilampirkan ke Kelurahan/Kecamatan/Instansi terkait._`;
  } else if (isRejected) {
    bodyMessage = `Mohon maaf, permohonan surat belum dapat kami setujui saat ini. Silakan periksa detail keterangan atau hubungi pengurus RT untuk melengkapi persyaratan yang dibutuhkan.

🔍 *Cek Status & Keterangan:*
👉 ${downloadLink}`;
  } else {
    bodyMessage = `Permohonan surat Anda telah kami terima dan sedang dalam proses verifikasi oleh Ketua RT. Anda dapat memantau progresnya secara berkala melalui tautan berikut:

🔍 *Pantau Progres Permohonan:*
👉 ${downloadLink}`;
  }

  return `*KONFIRMASI LAYANAN PERSURATAN RT 02*
------------------------------------------

Yth. Sdr/i *${name}*,

${bodyMessage}

------------------------------------------
${detailsBlock}

Terima kasih telah menggunakan sistem pelayanan digital *TERAS WARGA RT 02*.
_Pesan otomatis dari Pengurus RT 02_`;
};

export const formatRondaScheduleForWhatsApp = (ronda: RondaSchedule[]) => {
  let message = `*JADWAL RONDA RT 02*
------------------------------------------

Yth. Bapak/Ibu Warga RT 02,

Berikut adalah jadwal ronda mingguan terbaru:

`;

  ronda.forEach(day => {
    message += `*${day.day.toUpperCase()}*\n`;
    if (day.shifts && day.shifts.length > 0) {
      day.shifts.forEach(shift => {
        message += `• ${shift.time}: ${shift.members.join(', ') || '-'}\n`;
      });
    } else {
      message += `• Petugas: ${day.members.join(', ') || '-'}\n`;
    }
    message += `\n`;
  });

  message += `------------------------------------------
Akses jadwal lengkap & lapor ronda: https://terasrt02.vercel.app

Mohon kehadiran dan kerjasamanya demi keamanan lingkungan kita bersama.

Terima kasih.
_Pesan otomatis dari Pengurus RT 02_`;

  return message;
};
