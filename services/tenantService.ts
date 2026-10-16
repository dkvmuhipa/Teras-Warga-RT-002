import { Tenant, PdfConfig } from '../types';

export const DEFAULT_TENANT_ID = 'tondo-rw20-rt02';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tondo-rw20-rt02',
    slug: 'rt02-tondo',
    name: 'RT 002 / RW 020 Huntap Tondo 2',
    rt: '002',
    rw: '020',
    kelurahan: 'Tondo',
    kecamatan: 'Mantikulore',
    city: 'Kota Palu',
    province: 'Sulawesi Tengah',
    postalCode: '94119',
    address: 'Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu',
    chairmanName: 'Bpk. Irfan Arianto',
    chairmanPhone: '+62 859-6119-4621',
    secretaryName: 'Sekretaris RT 002',
    treasurerName: 'Bendahara RT 002',
    blocks: ['C5', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'],
    blockConfig: [
      { code: 'C5', start: 1, end: 26 },
      { code: 'C7', start: 1, end: 18 },
      { code: 'C8', start: 1, end: 18 },
      { code: 'C9', start: 1, end: 18 },
      { code: 'C10', start: 1, end: 16 },
      { code: 'C11', start: 1, end: 18 },
      { code: 'C12', start: 1, end: 15 },
    ],
    fees: {
      sampahUmum: 20000,
      sampahPkh: 10000,
      sampahPns: 35000,
      airFee: 10000,
      kasFee: 20000,
    },
    paymentGateway: {
      bankName: 'Bank BPD Sulteng',
      accountNumber: '01-02-004589-1',
      accountHolder: 'KAS RT 002 HUNTAP TONDO 2',
      qrisStatus: 'active',
      merchantNmid: 'ID1020260981244',
      digitalRate: 88
    },
    status: 'active',
    modules: {
      waterMeter: true,
      assetRental: true,
      letters: true,
      panicButton: true,
      stbmSanitation: true,
      cctv: true
    },
    logoUrl: '/logo-rt.svg',
    themeColor: '#2563EB',
    isPilotDemo: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

export const DEFAULT_TENANT_MODULES = {
  waterMeter: true,
  assetRental: true,
  letters: true,
  panicButton: true,
  stbmSanitation: true,
  cctv: true
};

const REGISTERED_TENANTS_KEY = 'registered_tenants';

const loadStoredTenants = (): Tenant[] => {
  if (typeof window === 'undefined') return [];
  try {
    // Purge demo tenant from active selection if stuck
    if (localStorage.getItem('active_tenant_id') === 'tondo-rw20-rt01') {
      localStorage.setItem('active_tenant_id', DEFAULT_TENANT_ID);
    }
    const raw = localStorage.getItem(REGISTERED_TENANTS_KEY);
    if (!raw) return [];
    const list: Tenant[] = JSON.parse(raw);
    const cleaned = list.filter(t => t.id !== 'tondo-rw20-rt01' && !t.isPilotDemo);
    if (cleaned.length !== list.length) {
      localStorage.setItem(REGISTERED_TENANTS_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.warn('Failed to load stored tenants:', e);
    return [];
  }
};

let inMemoryTenants: Tenant[] = loadStoredTenants();

export const getAllTenants = (): Tenant[] => {
  const mergedMap = new Map<string, Tenant>();
  INITIAL_TENANTS.forEach(t => mergedMap.set(t.id, t));
  inMemoryTenants.forEach(t => mergedMap.set(t.id, t));
  return Array.from(mergedMap.values());
};

export const registerTenantInMemory = (newTenant: Tenant): void => {
  const existingIdx = inMemoryTenants.findIndex(t => t.id === newTenant.id);
  if (existingIdx >= 0) {
    inMemoryTenants[existingIdx] = newTenant;
  } else {
    inMemoryTenants.push(newTenant);
  }
  try {
    localStorage.setItem(REGISTERED_TENANTS_KEY, JSON.stringify(inMemoryTenants));
  } catch (e) {
    console.warn('Failed to persist registered tenant:', e);
  }
};

export const updateTenantInMemory = (tenantId: string, updates: Partial<Tenant>): void => {
  const existingIdx = inMemoryTenants.findIndex(t => t.id === tenantId);
  if (existingIdx >= 0) {
    inMemoryTenants[existingIdx] = { ...inMemoryTenants[existingIdx], ...updates };
  } else {
    const fromInitial = INITIAL_TENANTS.find(t => t.id === tenantId);
    if (fromInitial) {
      inMemoryTenants.push({ ...fromInitial, ...updates });
    }
  }
  try {
    localStorage.setItem(REGISTERED_TENANTS_KEY, JSON.stringify(inMemoryTenants));
  } catch (e) {
    console.warn('Failed to persist updated tenant:', e);
  }
};

export const deleteTenantInMemory = (tenantId: string): void => {
  inMemoryTenants = inMemoryTenants.filter(t => t.id !== tenantId);
  try {
    localStorage.setItem(REGISTERED_TENANTS_KEY, JSON.stringify(inMemoryTenants));
  } catch (e) {
    console.warn('Failed to persist deleted tenant:', e);
  }
};

export const syncTenantsFromRemote = (remoteTenants: Tenant[]): void => {
  if (!remoteTenants || remoteTenants.length === 0) return;
  const mergedMap = new Map<string, Tenant>();
  inMemoryTenants.forEach(t => mergedMap.set(t.id, t));
  remoteTenants.forEach(t => {
    if (t.id !== 'tondo-rw20-rt01' && !t.isPilotDemo) {
      mergedMap.set(t.id, t);
    }
  });
  inMemoryTenants = Array.from(mergedMap.values());
  try {
    localStorage.setItem(REGISTERED_TENANTS_KEY, JSON.stringify(inMemoryTenants));
  } catch (e) {}
};

export const getTenantById = (id?: string | null): Tenant => {
  if (!id) return INITIAL_TENANTS[0];
  const all = getAllTenants();
  const found = all.find(t => t.id === id);
  return found || INITIAL_TENANTS[0];
};

export const getTenantBySlug = (slug?: string | null): Tenant | undefined => {
  if (!slug) return undefined;
  const all = getAllTenants();
  return all.find(t => t.slug === slug.toLowerCase());
};

/**
 * Helper to match document against active tenant:
 * - Documents with matching tenantId -> match
 * - Documents without tenantId -> match ONLY if activeTenant is DEFAULT_TENANT_ID (100% backward compatible!)
 */
export const matchesTenant = (docTenantId: string | undefined | null, activeTenantId: string): boolean => {
  if (docTenantId) {
    return docTenantId === activeTenantId;
  }
  // Backward compatibility: legacy docs without tenantId belong to RT 002
  return activeTenantId === DEFAULT_TENANT_ID;
};

// Global in-memory pointer to current active tenant
let activeTenantInstance: Tenant = INITIAL_TENANTS[0];

export const setActiveTenant = (t: Tenant) => {
  activeTenantInstance = t;
};

export const getActiveTenant = (): Tenant => {
  return activeTenantInstance;
};

/**
 * Generate a complete, dynamic PdfConfig tailored specifically for any tenant
 */
export const getPdfConfigForTenant = (tenant: Tenant, overrides?: Partial<PdfConfig>): PdfConfig => {
  const rtNumber = (tenant.rt || '02').padStart(2, '0');
  const rwNumber = (tenant.rw || '020').padStart(3, '0');
  const kel = (tenant.kelurahan || 'Tondo').toUpperCase();
  const kec = (tenant.kecamatan || 'Mantikulore').toUpperCase();
  const kota = (tenant.city || 'Palu').replace(/^Kota\s+/i, '').toUpperCase();
  const rawChairman = tenant.chairmanName || `Ketua RT ${tenant.rt}`;
  const cleanChairman = rawChairman.replace(/^Bpk\.\s*/i, '').trim().toUpperCase();

  return {
    logo: tenant.logoUrl || '/logo-rt.svg',
    stamp: tenant.pdfConfig?.stamp || "",
    signature: tenant.pdfConfig?.signature || "",
    rtName: `RT.${rtNumber} / RW.${rwNumber}`,
    rtAddress: tenant.address || `Huntap Tondo 2, RT ${tenant.rt}/RW ${tenant.rw}, ${tenant.city}`,
    rtChairman: cleanChairman,
    rtPhone: tenant.chairmanPhone?.replace(/[^0-9]/g, '') || '',
    kelurahan: kel,
    kecamatan: kec,
    kota: kota,
    lastLetterNumber: 0,
    whatsappGroupId: "",
    whatsappGroupName: "",
    kopLine1: `RUKUN TETANGGA ${rtNumber} / RUKUN WARGA ${rwNumber}`,
    kopLine2: `KELURAHAN ${kel} KECAMATAN ${kec}`,
    kopLine3: `${tenant.address || `Kelurahan ${tenant.kelurahan}, Kecamatan ${tenant.kecamatan}`}, ${tenant.city}`,
    rtLeader: cleanChairman,
    introText: `Yang bertanda tangan di bawah ini Ketua RT.${rtNumber} / RW.${rwNumber}, Kel. ${tenant.kelurahan || 'Tondo'}, Kec. ${tenant.kecamatan || 'Mantikulore'}, Kota ${tenant.city || 'Palu'}, Provinsi ${tenant.province || 'Sulawesi Tengah'} menerangkan dengan sebenarnya bahwa :`,
    ...tenant.pdfConfig,
    ...overrides
  };
};

export const getActivePdfConfig = (): PdfConfig => {
  return getPdfConfigForTenant(activeTenantInstance);
};

