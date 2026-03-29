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
Mohon kehadiran dan kerjasamanya demi keamanan lingkungan kita bersama.

Terima kasih.
_Pesan otomatis dari Pengurus RT 02_`;

  return message;
};
