import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, TenantContextType } from '../types';
import { 
  DEFAULT_TENANT_ID, 
  INITIAL_TENANTS, 
  getAllTenants,
  getTenantById, 
  getTenantBySlug, 
  setActiveTenant, 
  getPdfConfigForTenant,
  registerTenantInMemory,
  syncTenantsFromRemote
} from '../services/tenantService';
import { setActiveTenantScope, addTenantToDb, subscribeToTenants } from '../services/databaseService';
import { toast } from 'sonner';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const resolveInitialTenant = (): Tenant => {
  let resolved: Tenant = getTenantById(DEFAULT_TENANT_ID);
  if (typeof window === 'undefined') {
    setActiveTenant(resolved);
    return resolved;
  }

  try {
    // 1. Check URL Search Params (?rt=rt02-tondo or ?tenant=tondo-rw20-rt02)
    const urlParams = new URLSearchParams(window.location.search);
    const rtParam = urlParams.get('rt') || urlParams.get('tenant');
    if (rtParam) {
      const bySlug = getTenantBySlug(rtParam);
      if (bySlug) resolved = bySlug;
      else {
        const byId = getTenantById(rtParam);
        if (byId && byId.id === rtParam) resolved = byId;
      }
    } else {
      // 2. Check Hash Route (e.g., #/rt/rt01-tondo)
      const hash = window.location.hash || '';
      const hashMatch = hash.match(/\/rt\/([a-zA-Z0-9_-]+)/);
      if (hashMatch && hashMatch[1]) {
        const bySlug = getTenantBySlug(hashMatch[1]);
        if (bySlug) resolved = bySlug;
        else {
          const byId = getTenantById(hashMatch[1]);
          if (byId && byId.id === hashMatch[1]) resolved = byId;
        }
      } else {
        // 3. Check LocalStorage
        const savedTenantId = localStorage.getItem('active_tenant_id');
        if (savedTenantId) {
          const byId = getTenantById(savedTenantId);
          if (byId) resolved = byId;
        }
      }
    }
  } catch (e) {
    console.warn('Tenant resolution error:', e);
  }

  setActiveTenant(resolved);
  return resolved;
};

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => resolveInitialTenant());
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>(() => getAllTenants());

  // Subscribe to remote tenants in Firestore
  useEffect(() => {
    const unsub = subscribeToTenants((remoteList) => {
      if (remoteList && remoteList.length > 0) {
        syncTenantsFromRemote(remoteList);
        setAvailableTenants(getAllTenants());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Sync scope with database service & tenant service on init & change
    setActiveTenantScope(currentTenant.id);
    setActiveTenant(currentTenant);
    try {
      localStorage.setItem('active_tenant_id', currentTenant.id);
    } catch (e) {
      console.warn('Failed to save active tenant to localStorage:', e);
    }
  }, [currentTenant]);

  const switchTenant = (idOrSlug: string) => {
    let target = getTenantBySlug(idOrSlug);
    if (!target) {
      target = getTenantById(idOrSlug);
    }

    if (!target || target.id === currentTenant.id) {
      return;
    }

    setCurrentTenant(target);
    setActiveTenantScope(target.id);
    try {
      localStorage.setItem('active_tenant_id', target.id);
      
      // Update URL query parameter seamlessly
      const url = new URL(window.location.href);
      url.searchParams.set('rt', target.slug);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      console.warn('Error saving tenant state:', e);
    }

    toast.success(`Beralih Wilayah ke ${target.name}`, {
      description: `${target.kelurahan}, ${target.city} • Blok ${target.blocks.join(', ')}`,
      duration: 3500
    });
  };

  const registerTenant = async (data: Omit<Tenant, 'id' | 'createdAt'>): Promise<Tenant> => {
    const slugKel = (data.kelurahan || 'wilayah').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rtClean = (data.rt || '01').padStart(2, '0');
    const rwClean = (data.rw || '01').padStart(3, '0');
    const generatedId = `${slugKel}-rw${parseInt(rwClean, 10)}-rt${parseInt(rtClean, 10)}`;
    const generatedSlug = data.slug || `rt${parseInt(rtClean, 10)}-${slugKel}`;

    const newTenant: Tenant = {
      ...data,
      id: generatedId,
      slug: generatedSlug,
      createdAt: new Date().toISOString()
    };

    // 1. Save to in-memory & local cache
    registerTenantInMemory(newTenant);
    setAvailableTenants(getAllTenants());

    // 2. Save to Firestore tenants collection
    try {
      await addTenantToDb(newTenant);
    } catch (e) {
      console.warn("Could not save tenant to remote firestore:", e);
    }

    // 3. Immediately switch active tenant to the newly registered RT
    switchTenant(newTenant.id);

    return newTenant;
  };

  const value: TenantContextType = {
    currentTenant,
    tenantId: currentTenant.id,
    availableTenants,
    switchTenant,
    registerTenant,
    isDefaultTenant: currentTenant.id === DEFAULT_TENANT_ID,
    pdfConfig: getPdfConfigForTenant(currentTenant)
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    // Safe fallback if used outside provider
    const fallbackTenant = getTenantById(DEFAULT_TENANT_ID);
    return {
      currentTenant: fallbackTenant,
      tenantId: fallbackTenant.id,
      availableTenants: INITIAL_TENANTS,
      switchTenant: () => {},
      registerTenant: async () => fallbackTenant,
      isDefaultTenant: true,
      pdfConfig: getPdfConfigForTenant(fallbackTenant)
    };
  }
  return context;
};
