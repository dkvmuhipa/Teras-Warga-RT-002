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

export const formatUMKMCartOrderForWhatsApp = (
  sellerName: string,
  umkmName: string,
  customerName: string,
  customerPhone: string,
  customerAddress: string,
  cartItems: { name: string; price: number; quantity: number }[],
  totalPrice: number,
  notes?: string
) => {
  let msg = `🛒 *PESANAN BARU DARI PASAR WARGA RT 02*
------------------------------------------
Yth. *${sellerName}* (*${umkmName}*)

Halo, saya tetangga dari RT 02 ingin memesan produk berikut:

👤 *Nama Pemesan:* ${customerName}
📞 *No. HP:* ${customerPhone}
📍 *Alamat Antar / Blok:* ${customerAddress}

📦 *DAFTAR PESANAN:*
${cartItems.map((item, idx) => `${idx + 1}. ${item.name} (${item.quantity}x) = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}`).join('\n')}

💰 *TOTAL TAGIHAN:* *Rp ${totalPrice.toLocaleString('id-ID')}*`;

  if (notes) {
    msg += `\n\n📝 *Catatan Khusus:*
"${notes}"`;
  }

  msg += `\n\n_Pesanan dibuat otomatis melalui Website TERAS RT 02 Huntap Tondo 2. Mohon konfirmasi ketersediaan & metode pengantaran. Terima kasih!_`;

  return msg;
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

export const formatUtilityOutageForWhatsApp = (
  type: 'PLN' | 'PDAM' | 'Internet' | 'Fasum Lain',
  title: string,
  startTime: string,
  endTime: string,
  affectedBlocks: string[],
  description: string,
  emergencyNotes?: string,
  officialRefNumber?: string,
  feederName?: string,
  impactSeverity?: string,
  contactCenter?: string,
  date?: string
) => {
  const icon = type === 'PLN' ? '⚡' : type === 'PDAM' ? '💧' : '📡';
  const header = `*PEMBERITAHUAN RESMI ${type === 'PLN' ? 'PEMADAMAN LISTRIK PLN' : type === 'PDAM' ? 'GANGGUAN ALIRAN AIR PDAM' : 'PEMELIHARAAN FASUM'}*`;

  let msg = `📢 ${header}
Lingkungan RT 02 / RW 05 Huntap Tondo 2
------------------------------------------
${officialRefNumber ? `📄 *No. Surat/Edaran:* \`${officialRefNumber}\`\n` : ''}${feederName ? `🔌 *Penyulang / Gardu:* ${feederName}\n` : ''}${impactSeverity ? `⚠️ *Tingkat Dampak:* [${impactSeverity.toUpperCase()}]\n` : ''}${icon} *Perihal:* *${title}*
📅 *Tanggal:* ${date ? new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Hari Ini'}
🕒 *Waktu Padam:* *${startTime} s.d ${endTime}*
📍 *Wilayah Terdampak:* ${affectedBlocks?.join(', ') || 'Semua Blok RT 02'}

📝 *Rincian Pekerjaan:*
${description}`;

  if (emergencyNotes) {
    msg += `\n\n💡 *Solusi / Dukungan Darurat RT:*
${emergencyNotes}`;
  }

  msg += `\n\n🛡️ *Tips Kesiagaan Warga:*
1. Simpan cadangan air bersih & isi penuh tandon.
2. Cabut peralatan elektronik sensitif dari colokan.
3. Pastikan baterai lampu darurat & HP terisi penuh.`;

  if (contactCenter) {
    msg += `\n\n📞 *Kontak Resmi Bantuan:* ${contactCenter}`;
  }

  msg += `\n\n🌐 *Pantau Status Real-Time Lingkungan:*
👉 https://terasrt02.vercel.app/#/resident?tab=outages

_Disiarkan secara resmi oleh Pengurus RT 02 Huntap Tondo 2_`;

  return msg;
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
  const isApproved = status === 'Disetujui' || status === 'Approved' || status === 'Selesai' || status === 'Completed';
  const isRejected = status === 'Ditolak' || status === 'Rejected';
  
  // Safe symbols compatible with all WhatsApp gateways (prevent \uFFFD replacement diamond)
  const statusLabel = isApproved 
    ? '✓ DISETUJUI & SELESAI' 
    : isRejected 
    ? '✕ DITOLAK / PERLU PERBAIKAN' 
    : '⏳ SEDANG DIVERIFIKASI';
  
  // Direct tracking & download link based on current domain with HashRouter support
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://terasrt02.vercel.app';
  const downloadLink = letterId ? `${baseUrl}/#/surat/${letterId}` : `${baseUrl}/#/services?tab=history`;

  let detailsBlock = `*RINGKASAN DOKUMEN:*
• Jenis Surat  : *${type}*
• Nomor Surat  : *${letterNumber || 'Menunggu Penomoran'}*
• Status       : *${statusLabel}*`;

  if (letterId) {
    detailsBlock += `\n• ID Pelacakan : \`${letterId}\``;
  }

  let bodyMessage = '';
  if (isApproved) {
    bodyMessage = `Kabar baik! Permohonan surat pengantar Anda telah *SELESAI DIVERIFIKASI & DISAHKAN* secara resmi oleh Pengurus RT 02.

*PANDUAN MENGUNDUH SURAT (PDF RESMI):*
1. Buka tautan dokumen berikut:
   ▶ ${downloadLink}
2. Klik tombol *"Unduh Berkas Surat (PDF Resmi)"*.
3. File PDF surat resmi langsung tersimpan di HP/perangkat Anda.

*Catatan Keabsahan Dokumen:*
Dokumen digital ini merupakan surat resmi yang sah, telah dibubuhi Tanda Tangan Digital, Stempel Resmi RT 02, dan QR-Code validasi. Surat dapat langsung dicetak (print) atau dilampirkan secara online untuk keperluan di Kelurahan Tondo, Kecamatan Mantikulore, maupun instansi terkait lainnya.`;
  } else if (isRejected) {
    bodyMessage = `Mohon maaf, permohonan surat Anda *BELUM DAPAT KAMI SETUJUI* saat ini.

*PANDUAN PENGECEKAN KETERANGAN:*
1. Buka tautan berikut untuk membaca catatan/alasan dari pengurus RT:
   ▶ ${downloadLink}
2. Silakan lengkapi berkas persyaratan yang kurang atau hubungi Pengurus RT untuk koordinasi lebih lanjut.`;
  } else {
    bodyMessage = `Permohonan surat Anda telah kami terima dan saat ini sedang dalam *PROSES PENINJAUAN & VERIFIKASI* oleh Pengurus RT 02.

*PANTAU PROGRES PERMOHONAN:*
Anda dapat memantau status surat secara berkala melalui tautan berikut:
▶ ${downloadLink}

Notifikasi WhatsApp lanjutan akan otomatis dikirimkan begitu surat selesai disahkan oleh Ketua RT.`;
  }

  return `*LAYANAN PERSURATAN WARGA RT 02*
────────────────────────────

Yth. Sdr/i *${name}*,

${bodyMessage}

────────────────────────────
${detailsBlock}

Terima kasih telah menggunakan sistem pelayanan digital *TERAS WARGA RT 02*.
_Pesan otomatis resmi Pengurus RT 02 / RW 020 Kelurahan Tondo_`;
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
