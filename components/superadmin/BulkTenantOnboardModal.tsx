import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, FileSpreadsheet, Sparkles, AlertCircle, CheckCircle2, 
  X, Download, UploadCloud, RefreshCw, ArrowRight, ShieldCheck, 
  Building2, Users, Check, AlertTriangle, Key, ExternalLink, Copy
} from 'lucide-react';
import { Tenant, Role, BlockRangeConfig } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { createTenantAdminAccount } from '../../services/authAdminService';
import { 
  generateBulkTenantTemplateExcel, 
  parseBulkTenantExcel, 
  BulkTenantCandidate 
} from '../../services/excelService';
import { toast } from 'sonner';

interface BulkTenantOnboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredCount: number) => void;
  existingTenants: Tenant[];
}

export const BulkTenantOnboardModal: React.FC<BulkTenantOnboardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingTenants = []
}) => {
  const { registerTenant } = useTenant();

  // Mode: 'range' (generator otomatis) | 'excel' (unggah template)
  const [activeMode, setActiveMode] = useState<'range' | 'excel'>('range');

  // Generator Range Form State
  const [kelurahan, setKelurahan] = useState('Tondo');
  const [rw, setRw] = useState('020');
  const [kecamatan, setKecamatan] = useState('Mantikulore');
  const [city, setCity] = useState('Kota Palu');
  const [startRt, setStartRt] = useState(3);
  const [endRt, setEndRt] = useState(6);
  const [blockPrefix, setBlockPrefix] = useState('C');
  const [blockStart, setBlockStart] = useState(5);
  const [blockEnd, setBlockEnd] = useState(12);
  const [housesPerBlock, setHousesPerBlock] = useState(20);
  const [defaultPassword, setDefaultPassword] = useState('TerasWarga2026!');
  const [createAdminAccounts, setCreateAdminAccounts] = useState(true);

  // Excel Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [excelCandidates, setExcelCandidates] = useState<BulkTenantCandidate[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Execution & Progress State
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [executionResults, setExecutionResults] = useState<{ name: string; success: boolean; error?: string }[] | null>(null);

  // Keyboard close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExecuting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExecuting, onClose]);

  // Compute generated candidates for Range Mode
  const generatedRangeCandidates = useMemo<BulkTenantCandidate[]>(() => {
    const list: BulkTenantCandidate[] = [];
    const s = Math.max(1, startRt);
    const e = Math.max(s, endRt);

    for (let num = s; num <= e; num++) {
      const cleanRt = String(num).padStart(3, '0');
      const cleanRw = String(rw).padStart(3, '0');
      const cleanKel = kelurahan.trim() || 'Tondo';
      const name = `RT ${cleanRt} / RW ${cleanRw} Kelurahan ${cleanKel}`;
      const slug = `rt${num}-rw${cleanRw.replace(/[^0-9]/g, '')}-${cleanKel.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      list.push({
        name,
        rt: cleanRt,
        rw: cleanRw,
        kelurahan: cleanKel,
        kecamatan: kecamatan.trim() || 'Mantikulore',
        city: city.trim() || 'Kota Palu',
        chairmanName: `Ketua RT ${cleanRt}`,
        chairmanPhone: '08123456789',
        chairmanEmail: `rt${cleanRt}.${cleanKel.toLowerCase().replace(/[^a-z0-9]/g, '')}@teraswarga.id`,
        blockPrefix: blockPrefix.trim().toUpperCase() || 'C',
        blockStart,
        blockEnd,
        housesPerBlock,
        slug
      });
    }
    return list;
  }, [kelurahan, rw, kecamatan, city, startRt, endRt, blockPrefix, blockStart, blockEnd, housesPerBlock]);

  // Active candidates list depending on mode
  const activeCandidates = activeMode === 'range' ? generatedRangeCandidates : excelCandidates;

  // Conflict validation: check existing slugs and names
  const evaluatedCandidates = useMemo(() => {
    return activeCandidates.map(c => {
      const isSlugConflict = existingTenants.some(t => 
        (t.slug && c.slug && t.slug.toLowerCase() === c.slug.toLowerCase()) || 
        (t.id && c.slug && t.id.toLowerCase() === c.slug.toLowerCase())
      );
      const isRtRwConflict = existingTenants.some(t => 
        t.rt === c.rt && 
        t.rw === c.rw && 
        t.kelurahan?.toLowerCase() === c.kelurahan?.toLowerCase()
      );

      let conflictReason = '';
      if (isSlugConflict) conflictReason = 'Slug URL sudah digunakan';
      else if (isRtRwConflict) conflictReason = `RT ${c.rt} RW ${c.rw} ${c.kelurahan} sudah terdaftar`;

      return {
        ...c,
        isConflict: isSlugConflict || isRtRwConflict,
        conflictReason
      };
    });
  }, [activeCandidates, existingTenants]);

  const validCandidates = useMemo(() => {
    return evaluatedCandidates.filter(c => !c.isConflict);
  }, [evaluatedCandidates]);

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsParsingExcel(true);
    setParseError(null);

    try {
      const parsed = await parseBulkTenantExcel(file);
      setExcelCandidates(parsed);
      toast.success(`Berhasil membaca ${parsed.length} data RT dari spreadsheet`);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setParseError(err.message || 'Gagal memproses template Excel.');
      toast.error('Format Spreadsheet Tidak Valid', {
        description: err.message
      });
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Execute Batch Onboarding
  const handleExecuteBatch = async () => {
    if (validCandidates.length === 0) {
      toast.warning('Tidak ada calon RT yang valid untuk didaftarkan.');
      return;
    }

    setIsExecuting(true);
    const results: { name: string; success: boolean; error?: string }[] = [];

    for (let i = 0; i < validCandidates.length; i++) {
      const candidate = validCandidates[i];
      setProgress({
        current: i + 1,
        total: validCandidates.length,
        currentName: candidate.name
      });

      try {
        // 1. Build Block Range Config
        const blockConfigs: BlockRangeConfig[] = [];
        const parsedBlocks: string[] = [];
        const pfx = candidate.blockPrefix || 'C';
        const bStart = candidate.blockStart || 1;
        const bEnd = candidate.blockEnd || 5;
        const hpb = candidate.housesPerBlock || 20;

        for (let b = bStart; b <= bEnd; b++) {
          const blockName = `${pfx}${b}`;
          parsedBlocks.push(blockName);
          blockConfigs.push({
            code: blockName,
            start: 1,
            end: hpb
          });
        }

        // 2. Register Tenant in Firestore
        const newTenant = await registerTenant({
          name: candidate.name,
          slug: candidate.slug,
          rt: candidate.rt,
          rw: candidate.rw,
          kelurahan: candidate.kelurahan,
          kecamatan: candidate.kecamatan || 'Mantikulore',
          city: candidate.city || 'Kota Palu',
          province: 'Sulawesi Tengah',
          postalCode: '94119',
          address: `Kelurahan ${candidate.kelurahan}, Kecamatan ${candidate.kecamatan || 'Mantikulore'}, ${candidate.city || 'Kota Palu'}`,
          chairmanName: candidate.chairmanName,
          chairmanPhone: candidate.chairmanPhone,
          secretaryName: `Sekretaris RT ${candidate.rt}`,
          treasurerName: `Bendahara RT ${candidate.rt}`,
          blocks: parsedBlocks,
          blockConfig: blockConfigs,
          fees: {
            sampahUmum: 20000,
            sampahPkh: 10000,
            sampahPns: 35000,
            kasFee: 20000,
            airFee: 10000,
          },
          logoUrl: '/logo-rt.svg',
          themeColor: '#4f46e5',
          isPilotDemo: false
        });

        // 3. Provision Admin Account if enabled
        if (createAdminAccounts && candidate.chairmanEmail) {
          try {
            await createTenantAdminAccount({
              email: candidate.chairmanEmail,
              password: defaultPassword,
              name: candidate.chairmanName,
              phone: candidate.chairmanPhone,
              role: Role.ADMIN,
              tenantId: newTenant.id
            });
          } catch (authErr: any) {
            console.warn(`Gagal membuat akun login admin untuk ${candidate.name}:`, authErr);
          }
        }

        results.push({ name: candidate.name, success: true });
      } catch (err: any) {
        console.error(`Gagal mendaftarkan ${candidate.name}:`, err);
        results.push({ name: candidate.name, success: false, error: err.message });
      }
    }

    setIsExecuting(false);
    setProgress(null);
    setExecutionResults(results);

    const successCount = results.filter(r => r.success).length;
    if (onSuccess) {
      onSuccess(successCount);
    }
    toast.success(`Onboarding Massal Selesai: ${successCount} RT Berhasil Didaftarkan!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-indigo-300">
              <Layers size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 font-mono text-[9px] uppercase font-bold tracking-wider border border-indigo-400/30">
                  Onboarding Massal Kelurahan
                </span>
              </div>
              <h2 className="text-base font-semibold text-white">Pendaftaran Massal Wilayah RT</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Execution Progress Overlay */}
          {isExecuting && progress && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center space-y-3 ">
              <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
              <div>
                <h3 className="font-bold text-sm text-indigo-950">
                  Sedang Mendaftarkan RT ke Sistem ({progress.current} dari {progress.total})
                </h3>
                <p className="text-xs text-indigo-600 mt-1 font-mono">
                  {progress.currentName}
                </p>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2.5 transition-[width] duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Summary if completed */}
          {executionResults && !isExecuting && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <h3 className="font-semibold text-sm text-slate-900">
                    Hasil pendaftaran massal
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  Total: {executionResults.length} RT
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {executionResults.map((r, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      r.success 
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                        : 'bg-rose-50/60 border-rose-200 text-rose-950'
                    }`}
                  >
                    <span className="font-bold">{r.name}</span>
                    <span className="font-mono text-[11px]">
                      {r.success ? '✓ Berhasil Didaftarkan' : `✗ Gagal: ${r.error}`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setExecutionResults(null);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
                >
                  Tutup & Kembali ke Direktori
                </button>
              </div>
            </div>
          )}

          {!executionResults && !isExecuting && (
            <>
              {/* Method Switcher Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveMode('range')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    activeMode === 'range'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers size={14} className={activeMode === 'range' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>Generator rentang RT</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMode('excel')}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    activeMode === 'excel'
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet size={14} className={activeMode === 'excel' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>Import Spreadsheet (.xlsx)</span>
                </button>
              </div>

              {/* TAB 1: RANGE GENERATOR */}
              {activeMode === 'range' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Kelurahan</label>
                      <input
                        type="text"
                        value={kelurahan}
                        onChange={(e) => setKelurahan(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                        placeholder="Contoh: Tondo"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Nomor RW</label>
                      <input
                        type="text"
                        value={rw}
                        onChange={(e) => setRw(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                        placeholder="Contoh: 020"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Mulai RT</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={startRt}
                        onChange={(e) => setStartRt(parseInt(e.target.value || '1', 10))}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Selesai RT</label>
                      <input
                        type="number"
                        min={startRt}
                        max={99}
                        value={endRt}
                        onChange={(e) => setEndRt(parseInt(e.target.value || '1', 10))}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Prefix Blok Rumah</label>
                      <input
                        type="text"
                        value={blockPrefix}
                        onChange={(e) => setBlockPrefix(e.target.value.toUpperCase())}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                        placeholder="Contoh: C"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Blok Awal - Akhir</label>
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="number"
                          value={blockStart}
                          onChange={(e) => setBlockStart(parseInt(e.target.value || '1', 10))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono text-center"
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input
                          type="number"
                          value={blockEnd}
                          onChange={(e) => setBlockEnd(parseInt(e.target.value || '1', 10))}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Rumah per Blok</label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={housesPerBlock}
                        onChange={(e) => setHousesPerBlock(parseInt(e.target.value || '20', 10))}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700">Password Awal Akun RT</label>
                      <input
                        type="text"
                        value={defaultPassword}
                        onChange={(e) => setDefaultPassword(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs px-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createAdminAccounts}
                        onChange={(e) => setCreateAdminAccounts(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">
                        Buat akun login Admin RT secara otomatis dengan email resmi
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: EXCEL IMPORT */}
              {activeMode === 'excel' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl">
                    <div className="text-xs text-indigo-950">
                      <p className="font-bold">Gunakan Template Resmi Kelurahan</p>
                      <p className="text-indigo-600 text-[11px] mt-0.5">
                        Unduh template spreadsheet, isi data RT dan ketua RT, lalu unggah kembali di bawah.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => generateBulkTenantTemplateExcel()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download size={14} />
                      <span>Unduh Template Excel</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      id="excel-bulk-file"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="excel-bulk-file"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <UploadCloud size={24} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {uploadedFile ? uploadedFile.name : 'Pilih atau Tarik Berkas Excel (.xlsx) ke sini'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Format spreadsheet (.xlsx) sesuai kolom template resmi
                      </span>
                    </label>
                  </div>

                  {parseError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle size={15} />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PREVIEW & VALIDATION TABLE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Pratinjau Data RT ({evaluatedCandidates.length} Unit)
                    </h4>
                    {validCandidates.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                        {validCandidates.length} Siap Didaftarkan
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Periksa status sebelum eksekusi
                  </span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="max-h-56 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold sticky top-0 z-10">
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Wilayah</th>
                          <th className="py-2.5 px-3">Slug URL</th>
                          <th className="py-2.5 px-3">Ketua RT</th>
                          <th className="py-2.5 px-3">Email Login</th>
                          <th className="py-2.5 px-3">Blok Rumah</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {evaluatedCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                              Belum ada data RT yang digenerate atau diunggah.
                            </td>
                          </tr>
                        ) : (
                          evaluatedCandidates.map((c, i) => (
                            <tr key={i} className={c.isConflict ? 'bg-rose-50/50' : 'hover:bg-slate-50'}>
                              <td className="py-2 px-3 font-mono text-slate-500">{i + 1}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-indigo-600">/{c.slug}</td>
                              <td className="py-2 px-3 text-slate-700">{c.chairmanName}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-600">{c.chairmanEmail}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                                {c.blockPrefix}{c.blockStart} - {c.blockPrefix}{c.blockEnd}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {c.isConflict ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold font-mono" title={c.conflictReason}>
                                    ✗ Konflik
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                                    ✓ Siap
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!executionResults && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExecuteBatch}
              disabled={isExecuting || validCandidates.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Memproses Pendaftaran...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Daftarkan {validCandidates.length} RT Sekaligus</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
