/**
 * Social Media Marketing (SMM) & Search Engine Marketing (SEM) Campaign URL & Sharing Utilities
 * Optimized for WhatsApp Groups, Native Mobile Share Sheet, and Clean QR/Campaign Links.
 */

export const BASE_PORTAL_URL = 'https://terasrt02.vercel.app';

export type CampaignTargetKey =
  | 'beranda'
  | 'surat'
  | 'layanan'
  | 'info'
  | 'peta'
  | 'gempa'
  | 'umkm'
  | 'sampah'
  | 'donasi'
  | 'aturan'
  | 'tentang'
  | 'kesehatan'
  | 'faq'
  | 'panduan'
  | 'warga'
  | 'daftar';

export const CAMPAIGN_ROUTE_MAP: Record<string, string> = {
  beranda: '/',
  home: '/',
  surat: '/services',
  layanan: '/services',
  pengaduan: '/services',
  tamu: '/services',
  info: '/info',
  kas: '/info',
  ronda: '/info',
  siskamling: '/info',
  peta: '/peta',
  gempa: '/peta',
  evakuasi: '/peta',
  umkm: '/umkm',
  pasar: '/umkm',
  sampah: '/sampah',
  'bank-sampah': '/sampah',
  donasi: '/donasi',
  aturan: '/rules',
  rules: '/rules',
  tentang: '/about',
  profil: '/about',
  about: '/about',
  kesehatan: '/kesehatan',
  posyandu: '/kesehatan',
  faq: '/faq',
  bantuan: '/faq',
  panduan: '/welcome',
  welcome: '/welcome',
  warga: '/resident',
  resident: '/resident',
  daftar: '/register',
  register: '/register',
  dokumen: '/dokumen',
  kegiatan: '/kegiatan'
};

/**
 * Builds a clean, shareable campaign URL with optional UTM tracking parameters.
 */
export const buildCampaignUrl = (
  target: CampaignTargetKey = 'beranda',
  source: 'whatsapp' | 'facebook' | 'telegram' | 'qr' | 'share' = 'whatsapp'
): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin : BASE_PORTAL_URL;
  const params = new URLSearchParams();
  if (target !== 'beranda') {
    params.set('go', target);
  }
  params.set('utm_source', source);
  params.set('utm_medium', source === 'qr' ? 'offline_qr' : 'social');
  params.set('utm_campaign', `teras_rt02_${target}`);
  return `${origin}/?${params.toString()}`;
};

/**
 * Shares the Teras Warga RT 002 portal via native Web Share API (if supported on mobile)
 * or opens a formatted WhatsApp message ready to forward to community/block groups.
 */
export const sharePortalSocial = async (target: CampaignTargetKey = 'beranda'): Promise<void> => {
  const shareUrl = buildCampaignUrl(target, 'share');
  const title = 'TERAS Warga RT 002 / RW 020 — Huntap Tondo 2 Kota Palu';
  const text =
    '🏡 *PORTAL DIGITAL TERAS WARGA RT 002 / RW 020*\n' +
    '📍 _Kawasan Huntap Tondo 2, Kel. Tondo, Kota Palu_\n\n' +
    'Akses layanan surat pengantar RT online, transparansi kas & iuran, jadwal ronda siskamling, katalog UMKM warga, bank sampah, serta pantauan gempa BMKG dalam satu genggaman:\n\n' +
    `👉 ${shareUrl}`;

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url: shareUrl });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  if (typeof window !== 'undefined') {
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }
};
