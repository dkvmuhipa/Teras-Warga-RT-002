export const sendWhatsAppMessage = (phone: string, message: string) => {
  const formattedPhone = phone.replace(/[^0-9]/g, '');
  const encodedMessage = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  window.open(url, '_blank');
};

export const formatAnnouncementForWhatsApp = (title: string, content: string) => {
  return `*Pengumuman RT 002*\n\n*${title}*\n\n${content}\n\nInfo lebih lanjut kunjungi aplikasi TERAS RT 002.`;
};

export const formatLetterStatusForWhatsApp = (name: string, type: string, status: string) => {
  return `*Update Status Surat RT 002*\n\nHalo ${name},\n\nStatus permohonan surat *${type}* Anda saat ini adalah: *${status}*.\n\nTerima kasih.`;
};
