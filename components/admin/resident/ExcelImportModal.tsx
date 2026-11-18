import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { House } from '../../../types';
import { toast } from 'sonner';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  houses: House[];
  onUpdateHouse: (id: string, updates: Partial<House>) => Promise<void>;
}

interface ParsedDiffRow {
  house: House;
  rowIndex: number;
  updates: Partial<House>;
  changes: { field: string; from: string; to: string }[];
}

const normalizeUnit = (val: any) => String(val ?? '').trim().toUpperCase().replace(/^0+(?=\d)/, '');
const normalizeBlock = (val: any) => String(val ?? '').trim().toUpperCase().replace(/^BLOK\s*/i, '');

const mapCertificateValue = (raw: string): 'Ya' | 'Tidak' | 'Dalam Proses' | undefined => {
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  if (s === 'ya' || s === 'sudah' || s === 'v' || s === 'bersertifikat' || s === 'ada') return 'Ya';
  if (s.includes('proses')) return 'Dalam Proses';
  if (s === 'tidak' || s === 'belum' || s === 'belum ada' || s === '-') return 'Tidak';
  return undefined;
};

const mapConditionValue = (raw: string): 'Baik' | 'Terlantar' | 'Tidak Terawat' | undefined => {
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  if (s === 'baik' || s === 'layak') return 'Baik';
  if (s.includes('terlantar')) return 'Terlantar';
  if (s.includes('tidak terawat') || s.includes('tdk terawat') || s.includes('rusak')) return 'Tidak Terawat';
  return undefined;
};

const mapBooleanValue = (raw: string): boolean | undefined => {
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  if (s === 'ya' || s === 'v' || s === 'true' || s === 'renovasi' || s === 'ada') return true;
  if (s === 'tidak' || s === 'false' || s === 'standar' || s === 'no') return false;
  return undefined;
};

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  houses,
  onUpdateHouse
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [diffRows, setDiffRows] = useState<ParsedDiffRow[]>([]);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [unchangedCount, setUnchangedCount] = useState(0);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Rekonsiliasi Huntap');

      sheet.columns = [
        { header: 'Blok', key: 'block', width: 10 },
        { header: 'Nomor Unit', key: 'number', width: 12 },
        { header: 'Nama Penghuni / KK', key: 'headOfFamily', width: 26 },
        { header: 'Pemilik SK Huntap', key: 'ownerName', width: 26 },
        { header: 'Hubungan SK', key: 'ownerRelationship', width: 20 },
        { header: 'No. HP', key: 'phone', width: 18 },
        { header: 'Sertifikat (Ya/Proses/Tidak)', key: 'certificateStatus', width: 24 },
        { header: 'Kondisi (Baik/Terlantar/Tidak Terawat)', key: 'buildingCondition', width: 30 },
        { header: 'Renovasi (Ya/Tidak)', key: 'hasStructuralModification', width: 18 },
        { header: 'Catatan BPBD', key: 'specialNotes', width: 32 },
      ];

      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };

      const sorted = [...houses].sort((a, b) => {
        const bCmp = (a.block || '').localeCompare(b.block || '', undefined, { numeric: true });
        if (bCmp !== 0) return bCmp;
        return (a.number || '').localeCompare(b.number || '', undefined, { numeric: true });
      });

      sorted.forEach(h => {
        sheet.addRow({
          block: h.block || '',
          number: h.number || '',
          headOfFamily: h.headOfFamily || '',
          ownerName: h.ownerName || '',
          ownerRelationship: h.ownerRelationship || '',
          phone: h.phone || '',
          certificateStatus: h.certificateStatus || 'Tidak',
          buildingCondition: h.buildingCondition || 'Baik',
          hasStructuralModification: h.hasStructuralModification ? 'Ya' : 'Tidak',
          specialNotes: h.specialNotes || '',
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Template_Update_Warga_RT02_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Template Excel berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat template Excel.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setDiffRows([]);
    setUnmatchedCount(0);
    setUnchangedCount(0);

    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const buffer = await file.arrayBuffer();
      await workbook.xlsx.load(buffer);

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        toast.error('File Excel tidak memiliki lembar kerja (sheet).');
        setIsParsing(false);
        return;
      }

      // Detect header row (row 1 or first row containing 'Blok')
      let headerRowNum = 1;
      const colMap: Record<string, number> = {};

      for (let r = 1; r <= Math.min(10, sheet.rowCount); r++) {
        const row = sheet.getRow(r);
        let foundBlock = false;
        row.eachCell((cell, colNumber) => {
          const text = String(cell.value ?? '').trim().toLowerCase();
          if (text === 'blok' || text.includes('blok')) foundBlock = true;
        });
        if (foundBlock) {
          headerRowNum = r;
          break;
        }
      }

      sheet.getRow(headerRowNum).eachCell((cell, colNumber) => {
        const h = String(cell.value ?? '').trim().toLowerCase();
        if (h === 'blok' || h.includes('blok')) colMap.block = colNumber;
        else if (h.includes('nomor') || h.includes('no. unit') || h === 'no rumah') colMap.number = colNumber;
        else if (h.includes('penghuni') || h.includes('kepala keluarga')) colMap.headOfFamily = colNumber;
        else if (h.includes('pemilik')) colMap.ownerName = colNumber;
        else if (h.includes('hubungan')) colMap.ownerRelationship = colNumber;
        else if (h.includes('hp') || h.includes('telepon') || h.includes('wa')) colMap.phone = colNumber;
        else if (h.includes('sertifikat') || h.includes('sertifikasi')) colMap.certificateStatus = colNumber;
        else if (h.includes('kondisi')) colMap.buildingCondition = colNumber;
        else if (h.includes('renovasi') || h.includes('perubahan bentuk')) colMap.hasStructuralModification = colNumber;
        else if (h.includes('catatan') || h.includes('keterangan')) colMap.specialNotes = colNumber;
      });

      if (!colMap.block || !colMap.number) {
        toast.error('Kolom "Blok" dan "Nomor Unit" wajib ada pada file Excel.');
        setIsParsing(false);
        return;
      }

      // Build house lookup map by normalized block + number
      const houseMap = new Map<string, House>();
      houses.forEach(h => {
        const key = `${normalizeBlock(h.block)}-${normalizeUnit(h.number)}`;
        houseMap.set(key, h);
      });

      const diffs: ParsedDiffRow[] = [];
      let unmatched = 0;
      let unchanged = 0;

      for (let r = headerRowNum + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const rawBlock = row.getCell(colMap.block).value;
        const rawNumber = row.getCell(colMap.number).value;
        if (!rawBlock && !rawNumber) continue;

        const key = `${normalizeBlock(rawBlock)}-${normalizeUnit(rawNumber)}`;
        const target = houseMap.get(key);
        if (!target) {
          unmatched++;
          continue;
        }

        const getStr = (col?: number) => col ? String(row.getCell(col).value ?? '').trim() : '';
        const updates: Partial<House> = {};
        const changes: { field: string; from: string; to: string }[] = [];

        const newHead = getStr(colMap.headOfFamily);
        if (colMap.headOfFamily && newHead && newHead !== (target.headOfFamily || '').trim()) {
          updates.headOfFamily = newHead;
          changes.push({ field: 'Nama KK', from: target.headOfFamily || '-', to: newHead });
        }

        const newOwner = getStr(colMap.ownerName);
        if (colMap.ownerName && newOwner && newOwner !== (target.ownerName || '').trim()) {
          updates.ownerName = newOwner;
          changes.push({ field: 'Pemilik SK', from: target.ownerName || '-', to: newOwner });
        }

        const newRel = getStr(colMap.ownerRelationship);
        if (colMap.ownerRelationship && newRel && newRel !== (target.ownerRelationship || '').trim()) {
          updates.ownerRelationship = newRel;
          changes.push({ field: 'Hubungan SK', from: target.ownerRelationship || '-', to: newRel });
        }

        const newPhone = getStr(colMap.phone);
        if (colMap.phone && newPhone && newPhone !== '-' && newPhone !== (target.phone || '').trim()) {
          updates.phone = newPhone;
          changes.push({ field: 'No. HP', from: target.phone || '-', to: newPhone });
        }

        const newCert = mapCertificateValue(getStr(colMap.certificateStatus));
        if (newCert && newCert !== (target.certificateStatus || 'Tidak')) {
          updates.certificateStatus = newCert;
          changes.push({ field: 'Sertifikat', from: target.certificateStatus || 'Tidak', to: newCert });
        }

        const newCond = mapConditionValue(getStr(colMap.buildingCondition));
        if (newCond && newCond !== (target.buildingCondition || 'Baik')) {
          updates.buildingCondition = newCond;
          changes.push({ field: 'Kondisi', from: target.buildingCondition || 'Baik', to: newCond });
        }

        const newMod = mapBooleanValue(getStr(colMap.hasStructuralModification));
        if (newMod !== undefined && newMod !== Boolean(target.hasStructuralModification)) {
          updates.hasStructuralModification = newMod;
          changes.push({ field: 'Renovasi', from: target.hasStructuralModification ? 'Ya' : 'Tidak', to: newMod ? 'Ya' : 'Tidak' });
        }

        const newNotes = getStr(colMap.specialNotes);
        if (colMap.specialNotes && newNotes && newNotes !== '-' && newNotes !== (target.specialNotes || '').trim()) {
          updates.specialNotes = newNotes;
          changes.push({ field: 'Catatan', from: target.specialNotes || '-', to: newNotes });
        }

        if (changes.length > 0) {
          diffs.push({ house: target, rowIndex: r, updates, changes });
        } else {
          unchanged++;
        }
      }

      setDiffRows(diffs);
      setUnmatchedCount(unmatched);
      setUnchangedCount(unchanged);
    } catch (err) {
      console.error(err);
      toast.error('Gagal membaca file Excel. Pastikan format file valid (.xlsx).');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplyUpdates = async () => {
    if (diffRows.length === 0) return;
    setIsApplying(true);
    try {
      await Promise.all(diffRows.map(d => onUpdateHouse(d.house.id, d.updates)));
      toast.success(`Berhasil memperbarui ${diffRows.length} unit rumah dari Excel!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Sebagian pembaruan gagal disimpan. Silakan coba lagi.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Import &amp; Update Massal Excel</h3>
              <p className="text-xs text-slate-500">Perbarui data warga &amp; sensus BPBD secara massal dengan pratinjau perubahan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Download Template or Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-3 p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Download size={16} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-indigo-950">1. Unduh Template Excel</p>
                <p className="text-[11px] text-indigo-700">Berisi seluruh data unit saat ini siap edit</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-left transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Upload size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-emerald-950 truncate">
                  {fileName ? `File: ${fileName}` : '2. Unggah File Excel (.xlsx)'}
                </p>
                <p className="text-[11px] text-emerald-700">Otomatis mencocokkan Blok &amp; Nomor Unit</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
            </button>
          </div>

          {isParsing && (
            <div className="py-10 flex flex-col items-center justify-center text-slate-500 gap-2">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs font-semibold">Membaca dan membandingkan data Excel...</p>
            </div>
          )}

          {/* Diff Preview */}
          {!isParsing && fileName && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  ✓ {diffRows.length} Unit Akan Diperbarui
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                  {unchangedCount} Unit Tidak Berubah
                </span>
                {unmatchedCount > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                    <AlertTriangle size={12} /> {unmatchedCount} Baris Tidak Cocok
                  </span>
                )}
              </div>

              {diffRows.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 sticky top-0">
                      <tr>
                        <th className="px-3 py-2.5">Unit</th>
                        <th className="px-3 py-2.5">Perubahan Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {diffRows.map((d) => (
                        <tr key={d.house.id} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-700 whitespace-nowrap align-top">
                            {d.house.block}-{d.house.number}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {d.changes.map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-[10.5px]">
                                  <strong className="text-slate-700">{c.field}:</strong>
                                  <span className="text-slate-400 line-through max-w-[100px] truncate">{c.from}</span>
                                  <ArrowRight size={10} className="text-emerald-600 shrink-0" />
                                  <span className="text-emerald-700 font-bold max-w-[120px] truncate">{c.to}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Tidak ada perbedaan data yang ditemukan antara file Excel dan database saat ini.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={diffRows.length === 0 || isApplying}
            onClick={handleApplyUpdates}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {isApplying ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>Terapkan {diffRows.length} Pembaruan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
