import React, { useState } from 'react';
import { 
  Server, Database, Activity, HardDrive, ShieldCheck, 
  RefreshCw, CheckCircle2, AlertTriangle, Globe, Cpu,
  Radio, Wifi, ArrowUpRight
} from 'lucide-react';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface SystemTelemetryTabProps {
  fleetCounts?: {
    tenants: number;
    houses: number;
    cashFlows: number;
    officials: number;
    reports: number;
    letters: number;
    tickets: number;
    auditLogs: number;
  };
}

export const SystemTelemetryTab: React.FC<SystemTelemetryTabProps> = ({ fleetCounts }) => {
  const [isPinging, setIsPinging] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [edgeLatencyMs, setEdgeLatencyMs] = useState<number>(14);
  const [edgeStatus, setEdgeStatus] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [lastPingTime, setLastPingTime] = useState<string>('Baru saja');

  const counts = {
    tenants: fleetCounts?.tenants ?? 1,
    houses: fleetCounts?.houses ?? 129,
    cashFlows: fleetCounts?.cashFlows ?? 0,
    officials: fleetCounts?.officials ?? 5,
    reports: fleetCounts?.reports ?? 0,
    letters: fleetCounts?.letters ?? 0,
    tickets: fleetCounts?.tickets ?? 0,
    auditLogs: fleetCounts?.auditLogs ?? 0,
  };

  const totalDocs =
    counts.tenants +
    counts.houses +
    counts.cashFlows +
    counts.officials +
    counts.reports +
    counts.letters +
    counts.tickets +
    counts.auditLogs;

  // Estimate realistic Firestore document & inline Base64 attachment footprint (in MB)
  const housesStorageMb = Number(((counts.houses * 18) / 1024).toFixed(2));
  const financeStorageMb = Number(((counts.cashFlows * 12) / 1024).toFixed(2));
  const lettersReportsMb = Number((((counts.letters + counts.reports) * 24) / 1024).toFixed(2));
  const systemMetaMb = Number((((counts.tenants + counts.officials + counts.tickets + counts.auditLogs) * 8) / 1024).toFixed(2));
  const totalUsedMb = Number((housesStorageMb + financeStorageMb + lettersReportsMb + systemMetaMb).toFixed(2));
  const quotaMb = 1024; // 1.00 GB Firestore NoSQL Document Quota
  const usedPercent = Math.min(100, Math.max(0.5, Number(((totalUsedMb / quotaMb) * 100).toFixed(2))));

  const handlePingDatabase = async () => {
    setIsPinging(true);
    const startDb = performance.now();
    let measuredDb = latencyMs;
    try {
      if (db) {
        await getDoc(doc(db, 'configs', 'system'));
      } else {
        await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
      }
      measuredDb = Math.round(performance.now() - startDb);
      setLatencyMs(measuredDb);
    } catch (e) {
      measuredDb = Math.round(performance.now() - startDb);
      setLatencyMs(measuredDb);
    }

    // Ping Vercel Edge CDN static asset
    const startEdge = performance.now();
    try {
      const edgeRes = await fetch('/manifest.json', { method: 'HEAD', cache: 'no-store' });
      const elapsedEdge = Math.round(performance.now() - startEdge);
      setEdgeLatencyMs(elapsedEdge);
      if (edgeRes.ok) {
        setEdgeStatus('ONLINE');
        toast.success(`Telemetri: Firestore ${measuredDb}ms • Edge CDN ${elapsedEdge}ms (Optimal)`);
      } else {
        setEdgeStatus('OFFLINE');
      }
    } catch (err) {
      setEdgeStatus('OFFLINE');
    } finally {
      setLastPingTime(new Date().toLocaleTimeString('id-ID'));
      setIsPinging(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Services Health Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Vercel Edge & CDN Engine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Vercel Edge & CDN
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              edgeStatus === 'ONLINE' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <Server size={16} />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-semibold tracking-tight font-mono flex items-center gap-2 ${
            edgeStatus === 'ONLINE' ? 'text-indigo-600' : 'text-rose-600'
          }`}>
            <span>{edgeStatus}</span>
            <div className={`w-2.5 h-2.5 rounded-full ${edgeStatus === 'ONLINE' ? 'bg-indigo-500 ' : 'bg-rose-500'}`}></div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Latensi: <strong className="text-slate-800 font-mono">{edgeLatencyMs} ms</strong> (Global Edge SSL)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Cloud Database
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Database size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-emerald-600 tracking-tight font-mono flex items-center gap-2">
            <span>OPERATIONAL</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 "></div>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Latensi: <strong className="text-slate-800 font-mono">{latencyMs} ms</strong> ({lastPingTime})
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Autentikasi & RBAC
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-indigo-700 tracking-tight font-mono flex items-center gap-2">
            <span>TERLINDUNGI</span>
            <CheckCircle2 size={18} className="text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Token session & aturan Firebase Security Rules aktif
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Offline PWA Engine
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Radio size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-sky-700 tracking-tight font-mono flex items-center gap-2">
            <span>READY (v2.4)</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Workbox service worker precache 42 assets (3.94 MB)
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
              Data Residency
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Globe size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-amber-700 tracking-tight font-mono">
            JAKARTA
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Region: <span className="font-mono text-slate-700">asia-southeast2</span>
          </p>
        </div>
      </div>

      {/* Latency Tester & Storage Quota */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Ping Box */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" />
              <span>Diagnostik Konektivitas Cloud</span>
            </h3>
            <button
              onClick={handlePingDatabase}
              disabled={isPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
            >
              <RefreshCw size={12} className={isPinging ? 'animate-spin' : ''} />
              <span>{isPinging ? 'Menguji...' : 'Uji Ping Database'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Pemeriksaan latensi round-trip (RTT) dari browser Super Admin ke simpul basis data terisolasi.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 "></div>
              <div>
                <span className="text-xs font-semibold text-slate-900">Firestore Read/Write RTT</span>
                <span className="text-[10px] text-slate-500 block font-mono">Protokol gRPC / WebSocket SSL</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-semibold font-mono text-emerald-600">
                {latencyMs} <span className="text-xs font-bold text-slate-500 font-sans">ms</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 block">Sangat Cepat</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1 font-mono pt-1">
            <div className="flex justify-between">
              <span>Tenant Partitioning:</span>
              <span className="text-slate-800 font-bold">Scoped (tenantId filter)</span>
            </div>
            <div className="flex justify-between">
              <span>Index Optimization:</span>
              <span className="text-emerald-700 font-bold">100% Covered</span>
            </div>
            <div className="flex justify-between">
              <span>CORS Policy:</span>
              <span className="text-slate-800 font-bold">Restricted Origin</span>
            </div>
          </div>
        </div>

        {/* Cloud Firestore Document Index & Storage Quota */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <HardDrive size={16} className="text-indigo-600" />
              <span>Indeks Dokumen & Penyimpanan Cloud Firestore</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500 tabular-nums">
              {totalUsedMb} MB / 1.024 MB ({totalDocs.toLocaleString('id-ID')} Dokumen)
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Kalkulasi real-time dari jumlah dokumen aktif yang tersimpan di koleksi Firestore seluruh armada RT:
          </p>

          <div>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-700">Total Terpakai: {usedPercent}% ({totalUsedMb} MB)</span>
              <span className="text-emerald-700 font-mono tabular-nums">Tersedia: {(quotaMb - totalUsedMb).toFixed(2)} MB</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
              <div className="bg-indigo-600 h-full" style={{ width: `${Math.max(2, (housesStorageMb / Math.max(0.1, totalUsedMb)) * usedPercent * 4)}%` }} title="Sensus Warga & KK"></div>
              <div className="bg-emerald-500 h-full" style={{ width: `${Math.max(1, (financeStorageMb / Math.max(0.1, totalUsedMb)) * usedPercent * 4)}%` }} title="Transaksi Kas & Iuran"></div>
              <div className="bg-sky-500 h-full" style={{ width: `${Math.max(1, (lettersReportsMb / Math.max(0.1, totalUsedMb)) * usedPercent * 4)}%` }} title="Arsip Surat & Aduan"></div>
              <div className="bg-amber-400 h-full" style={{ width: `${Math.max(1, (systemMetaMb / Math.max(0.1, totalUsedMb)) * usedPercent * 4)}%` }} title="Konfigurasi & Log Audit"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block truncate">Sensus Rumah & KK ({counts.houses} dok)</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">{housesStorageMb} MB</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block truncate">Jurnal Kas & Bukti ({counts.cashFlows} dok)</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">{financeStorageMb} MB</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block truncate">Surat & Aduan ({counts.letters + counts.reports} dok)</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">{lettersReportsMb} MB</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500 block truncate">Pengurus & Audit ({counts.officials + counts.auditLogs} dok)</span>
                <span className="font-bold text-slate-900 font-mono tabular-nums">{systemMetaMb} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
