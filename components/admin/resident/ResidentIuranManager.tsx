import React, { useState, useMemo } from 'react';
import { 
  DollarSign, Activity, AlertCircle, CreditCard, Mail, Download, 
  Printer, Edit2, Trash2, Calendar, Filter, Users, MessageCircle,
  ChevronDown, ArrowRight, Share2, ClipboardList, Clock, History, Copy
} from 'lucide-react';
import { House, PdfConfig, PaymentStatus } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';
import { toast } from 'sonner';
import { useConfirm } from '../../../context/ConfirmContext';
import { handleFirestoreError, OperationType, addIuranPaymentToDb } from '../../../services/databaseService';
import { generateIuranReportExcel, generateIuranBatchTemplateExcel, parseIuranBatchExcel } from '../../../services/excelService';

interface ResidentIuranManagerProps {
  houses: House[];
  searchTerm: string;
  generateIuranReceiptPDF: (payment: any, config: PdfConfig) => void;
  pdfConfig: PdfConfig;
  deleteIuranPaymentFromDb: (id: string) => Promise<void>;
  setEditingPayment: (payment: any) => void;
  setPayType: (type: 'Air' | 'Sampah' | 'Both') => void;
  setPayAmount: (amount: string) => void;
  setPayDate: (date: string) => void;
  setPayNotes: (notes: string) => void;
  setPayerName: (name: string) => void;
  setIsEditPaymentModalOpen: (open: boolean) => void;
  openPayModal: (house: House) => void;
  onSendWhatsApp?: (house: House, message?: string) => void;
}

type ArrearsAging = 'all' | '1-2' | '3-5' | '6+';

export const ResidentIuranManager: React.FC<ResidentIuranManagerProps> = ({
  houses,
  searchTerm,
  generateIuranReceiptPDF,
  pdfConfig,
  deleteIuranPaymentFromDb,
  setEditingPayment,
  setPayType,
  setPayAmount,
  setPayDate,
  setPayNotes,
  setPayerName,
  setIsEditPaymentModalOpen,
  openPayModal,
  onSendWhatsApp,
}) => {
  const confirm = useConfirm();
  const [filterType, setFilterType] = useState<'All' | 'Air' | 'Sampah'>('All');
  const [arrearsAging, setArrearsAging] = useState<ArrearsAging>('all');
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [showOnlyArrears, setShowOnlyArrears] = useState(false);
  
  const { 
    selectedMonth, 
    summaries, 
    iuranPayments, 
    getArrearsForHouse,
    isMonthMatch,
    settings
  } = useFinancial();
  
  const { 
    totalCollected, 
    participationRate, 
    paidHousesCount, 
    unpaidHousesCount, 
    estimatedReceivables, 
    totalArrearsAmount, 
    totalArrearsMonths,
    air,
    sampah
  } = summaries;

  const searchLower = searchTerm.toLowerCase();

  const occupiedHousesList = useMemo(() => {
    return houses.filter(h => {
      const isOccupied = h.status === 'Occupied';
      const matchesSearch = 
        h.headOfFamily.toLowerCase().includes(searchLower) || 
        h.block.toLowerCase().includes(searchLower) ||
        h.number.toLowerCase().includes(searchLower) ||
        (h.ownerName && h.ownerName.toLowerCase().includes(searchLower));
      return isOccupied && matchesSearch;
    }).sort((a, b) => {
      const blockCompare = a.block.localeCompare(b.block, undefined, { numeric: true });
      if (blockCompare !== 0) return blockCompare;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [houses, searchLower]);

  const currentMonthPayments = useMemo(() => {
    return iuranPayments.filter(p => {
      const matchesMonth = isMonthMatch(p.month, selectedMonth);
      const matchesSearch = 
        p.headOfFamily.toLowerCase().includes(searchLower) || 
        p.block.toLowerCase().includes(searchLower) ||
        p.number.toLowerCase().includes(searchLower);
      const matchesType = filterType === 'All' || p.type === filterType || p.type === 'Both';
      return matchesMonth && matchesSearch && matchesType;
    }).sort((a, b) => {
      const blockCompare = a.block.localeCompare(b.block, undefined, { numeric: true });
      if (blockCompare !== 0) return blockCompare;
      return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [iuranPayments, selectedMonth, searchLower, filterType]);

  const arrearsData = useMemo(() => {
    return occupiedHousesList
      .map(h => {
        const arrears = getArrearsForHouse(h, filterType === 'All' ? undefined : filterType as 'Air' | 'Sampah');
        const totalAmount = arrears.length * (
          filterType === 'All' ? (settings.airFee + settings.sampahFee) : 
          filterType === 'Air' ? settings.airFee : settings.sampahFee
        );
        return { house: h, arrears, totalAmount };
      })
      .filter(item => {
        if (item.arrears.length === 0) return false;
        if (selectedBlock !== 'All' && item.house.block !== selectedBlock) return false;
        if (arrearsAging === '1-2') return item.arrears.length <= 2;
        if (arrearsAging === '3-5') return item.arrears.length >= 3 && item.arrears.length <= 5;
        if (arrearsAging === '6+') return item.arrears.length >= 6;
        return true;
      });
  }, [occupiedHousesList, filterType, selectedBlock, arrearsAging, settings, getArrearsForHouse]);

  const arrearsByBlock = useMemo(() => {
    const blocks: Record<string, typeof arrearsData> = {};
    arrearsData.forEach(item => {
      if (!blocks[item.house.block]) blocks[item.house.block] = [];
      blocks[item.house.block].push(item);
    });
    return Object.keys(blocks).sort().map(block => ({
      block,
      items: blocks[block]
    }));
  }, [arrearsData]);

  const blockOptions = useMemo(() => {
    const blocks = new Set(occupiedHousesList.map(h => h.block));
    return Array.from(blocks).sort();
  }, [occupiedHousesList]);

  const displayStats = filterType === 'All' ? {
    totalCollected,
    participationRate,
    paidHousesCount,
    unpaidHousesCount,
    estimatedReceivables,
    totalArrearsAmount,
    totalArrearsMonths
  } : filterType === 'Air' ? {
    totalCollected: air.totalCollected,
    participationRate: Math.round(((occupiedHousesList.length - air.unpaidCount) / occupiedHousesList.length) * 100) || 0,
    paidHousesCount: occupiedHousesList.length - air.unpaidCount,
    unpaidHousesCount: air.unpaidCount,
    estimatedReceivables: air.estimatedReceivables,
    totalArrearsAmount: air.totalArrearsAmount,
    totalArrearsMonths: air.arrearsUnits
  } : {
    totalCollected: sampah.totalCollected,
    participationRate: Math.round(((occupiedHousesList.length - sampah.unpaidCount) / occupiedHousesList.length) * 100) || 0,
    paidHousesCount: occupiedHousesList.length - sampah.unpaidCount,
    unpaidHousesCount: sampah.unpaidCount,
    estimatedReceivables: sampah.estimatedReceivables,
    totalArrearsAmount: sampah.totalArrearsAmount,
    totalArrearsMonths: sampah.arrearsUnits
  };

  const copyCollectiveArrears = () => {
    const typeLabel = filterType === 'All' ? 'KEAMANAN & KEBERSIHAN' : filterType === 'Air' ? 'AIR' : 'SAMPAH';
    const header = `*DAFTAR TUNGGAKAN IURAN ${typeLabel}*\n*Per Tanggal:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\n\n`;
    
    const list = arrearsData.map((item, i) => {
      return `${i + 1}. Blok ${item.house.block}-${item.house.number} (${item.house.headOfFamily}): ${item.arrears.length} Bulan (Rp ${item.totalAmount.toLocaleString()})`;
    }).join('\n');
    
    const footer = `\n\nTotal Tunggakan: Rp ${arrearsData.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}\n\nMohon Bapak/Ibu segera menyelesaikan kewajiban iuran demi kelancaran operasional lingkungan kita. Terima kasih.`;
    
    const fullText = header + list + footer;
    navigator.clipboard.writeText(fullText);
    toast.success('Daftar Penagihan Kolektif berhasil disalin!');
  };

  return (
    <div className="space-y-6">
      {/* Search & Main Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex p-0.5 bg-slate-100 rounded-2xl w-full lg:w-fit border border-slate-200">
          {[
            { id: 'All', label: 'Semua Iuran', color: 'text-indigo-600' },
            { id: 'Air', label: 'Air', color: 'text-blue-600' },
            { id: 'Sampah', label: 'Sampah', color: 'text-emerald-600' }
          ].map((type) => (
            <button 
              key={type.id}
              onClick={() => setFilterType(type.id as any)}
              className={`flex-1 lg:flex-none px-4 sm:px-6 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${filterType === type.id ? `bg-white ${type.color} shadow-sm` : 'text-slate-400 hover:text-slate-600'}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-slate-200 rounded-2xl sm:rounded-[1.5rem] shadow-sm">
            <Filter size={14} className="text-slate-400" />
            <select 
              value={selectedBlock} 
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer w-full text-center sm:text-left"
            >
              <option value="All">Semua Blok</option>
              {blockOptions.map(b => (
                <option key={b} value={b}>Blok {b}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setShowOnlyArrears(!showOnlyArrears)}
            className={`flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${showOnlyArrears ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Clock size={16} /> {showOnlyArrears ? 'Tampil Semua' : 'Fokus Tunggakan'}
          </button>
          <button 
            type="button"
            onClick={() => generateIuranBatchTemplateExcel(houses, selectedMonth)}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all shadow-sm"
            title="Download Template Excel Penagihan Iuran Warga"
          >
            <Download size={15} /> Unduh Template Excel
          </button>
          <label className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer">
            <Share2 size={15} /> Import Rekap Excel
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx, .xls"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  toast.loading("Membaca data Excel penagihan...");
                  const parsed = await parseIuranBatchExcel(file);
                  const lunasItems = parsed.filter(item => item.status === 'Lunas');
                  
                  if (lunasItems.length === 0) {
                    toast.dismiss();
                    toast.error("Tidak ada data warga dengan status 'Lunas' ditemukan dalam file.");
                    return;
                  }

                  let successCount = 0;
                  for (const item of lunasItems) {
                    const house = houses.find(h => 
                      h.block.toLowerCase().trim() === item.block.toLowerCase().trim() && 
                      h.number.toLowerCase().trim() === item.number.toLowerCase().trim()
                    );

                    if (house) {
                      await addIuranPaymentToDb({
                        houseId: house.id,
                        block: house.block,
                        number: house.number,
                        headOfFamily: house.headOfFamily,
                        payerName: item.headOfFamily || house.headOfFamily,
                        amount: item.amount || 50000,
                        month: selectedMonth,
                        type: item.type,
                        date: new Date().toISOString().split('T')[0],
                        notes: 'Imported via Batch Excel Penagihan'
                      });
                      successCount++;
                    }
                  }

                  toast.dismiss();
                  toast.success(`Berhasil mengimpor ${successCount} data pembayaran iuran warga!`);
                } catch (err) {
                  console.error(err);
                  toast.dismiss();
                  toast.error("Gagal mengimpor file Excel. Pastikan format file sesuai.");
                }
              }} 
            />
          </label>
          <button 
            onClick={() => {
              const typeLabel = filterType === 'All' ? 'Semua Iuran' : filterType === 'Air' ? 'Iuran Air' : 'Iuran Sampah';
              const exportArrears = occupiedHousesList
                .map(h => ({ 
                  house: h, 
                  arrears: getArrearsForHouse(h, filterType === 'All' ? undefined : filterType as 'Air' | 'Sampah') 
                }))
                .filter(item => item.arrears.length > 0);
              
              generateIuranReportExcel(currentMonthPayments, selectedMonth, typeLabel, displayStats, exportArrears);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download size={16} /> Ekspor Data
          </button>
        </div>
      </div>

      {!showOnlyArrears && (
        <>
          {/* Financial Summary Dashboard */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:scale-110 transition-transform">
                <DollarSign size={40} className="text-emerald-600 sm:w-[48px] sm:h-[48px]" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Total Terkumpul</p>
              <h4 className="text-base sm:text-2xl font-black text-slate-800 break-words leading-tight">Rp {displayStats.totalCollected.toLocaleString()}</h4>
              <div className="mt-2 sm:mt-4 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] sm:text-[10px] font-black rounded-md border border-emerald-100">
                  {selectedMonth}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:scale-110 transition-transform">
                <Activity size={40} className="text-indigo-600 sm:w-[48px] sm:h-[48px]" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Partisipasi Warga</p>
              <h4 className="text-base sm:text-2xl font-black text-slate-800 leading-tight">{displayStats.participationRate}%</h4>
              <div className="mt-2 sm:mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-1000" 
                  style={{ width: `${displayStats.participationRate}%` }}
                ></div>
              </div>
              <p className="mt-1.5 text-[8px] sm:text-[10px] font-bold text-slate-400 line-clamp-1">{displayStats.paidHousesCount}/{occupiedHousesList.length} Rmh</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:scale-110 transition-transform">
                <AlertCircle size={40} className="text-rose-600 sm:w-[48px] sm:h-[48px]" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Belum Bayar</p>
              <h4 className="text-base sm:text-2xl font-black text-rose-600 leading-tight">{displayStats.unpaidHousesCount} <span className="text-[10px] sm:text-sm text-slate-400 font-bold">Rmh</span></h4>
              <div className="mt-2 sm:mt-4 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] sm:text-[10px] font-black rounded-md border border-rose-100">
                  Bulan Ini
                </span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:scale-110 transition-transform">
                <CreditCard size={40} className="text-amber-600 sm:w-[48px] sm:h-[48px]" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Estimasi Piutang</p>
              <h4 className="text-base sm:text-2xl font-black text-slate-800 break-words leading-tight">Rp {displayStats.estimatedReceivables.toLocaleString()}</h4>
              <p className="mt-2 sm:mt-4 text-[8px] sm:text-[10px] font-bold text-slate-400 italic">Bulan Ini</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group ring-2 ring-rose-500/5 col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-2 sm:p-3 opacity-10 group-hover:scale-110 transition-transform">
                <AlertCircle size={40} className="text-rose-600 sm:w-[48px] sm:h-[48px]" />
              </div>
              <p className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1">Total Tunggakan</p>
              <h4 className="text-base sm:text-2xl font-black text-rose-600 break-words leading-tight">Rp {displayStats.totalArrearsAmount.toLocaleString()}</h4>
              <p className="mt-2 sm:mt-4 text-[8px] sm:text-[10px] font-bold text-rose-400 italic">Dari {displayStats.totalArrearsMonths} Bulan Unpaid</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Rincian Transaksi Iuran</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Catatan pembayaran periode {selectedMonth}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const typeLabel = filterType === 'All' ? 'IURAN' : filterType === 'Air' ? 'IURAN AIR' : 'IURAN SAMPAH';
                    const unpaidHouses = occupiedHousesList.filter(h => !currentMonthPayments.some(p => 
                      String(p.houseId) === String(h.id) || 
                      String(p.houseId) === `${h.block}-${h.number}` ||
                      (p.block === h.block && p.number === h.number)
                    ));
                    const text = `*DAFTAR WARGA BELUM BAYAR ${typeLabel}*\n*Periode:* ${selectedMonth}\n\n` + 
                      unpaidHouses.map((h, i) => {
                        const arrears = getArrearsForHouse(h, filterType === 'All' ? undefined : filterType as 'Air' | 'Sampah');
                        const arrearsText = arrears.length > 0 ? ` (+ Tunggakan ${arrears.length} bln)` : '';
                        return `${i+1}. Blok ${h.block}-${h.number} (${h.headOfFamily})${arrearsText}`;
                      }).join('\n') +
                      `\n\nMohon segera melakukan pembayaran guna membiayai operasional RT. Terima kasih.`;
                    navigator.clipboard.writeText(text);
                    toast.success(`Daftar warga belum bayar berhasil disalin!`);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all font-sans"
                >
                  <Share2 size={14} /> Salin Belum Bayar
                </button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Tanggal</th>
                    <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Periode</th>
                    <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Kepala Keluarga / Penghuni</th>
                    <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Rumah</th>
                    <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px] hidden sm:table-cell">Jenis</th>
                    <th className="p-3 md:p-4 text-right font-black text-slate-600 uppercase tracking-widest text-[10px]">Nominal</th>
                    <th className="p-3 md:p-4 text-center font-black text-slate-600 uppercase tracking-widest text-[10px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMonthPayments.length > 0 ? (
                    currentMonthPayments.map((payment) => (
                      <tr key={payment.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 md:p-4 text-slate-500 font-medium text-xs md:text-sm">{new Date(payment.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-3 md:p-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {payment.month}
                          </span>
                        </td>
                        <td className="p-3 md:p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs md:text-sm">{payment.headOfFamily}</span>
                            {payment.payerName && payment.payerName !== payment.headOfFamily && (
                              <span className="text-[10px] text-slate-400 font-medium italic">Pembayar: {payment.payerName}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 md:p-4 font-mono font-black text-slate-600 text-xs md:text-sm">{payment.block}-{payment.number}</td>
                        <td className="p-3 md:p-4 hidden sm:table-cell">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            payment.type === 'Both' ? 'bg-indigo-50 text-indigo-600' :
                            payment.type === 'Air' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {payment.type === 'Both' ? 'Semua' : payment.type === 'Air' ? 'Air' : 'Sampah'}
                          </span>
                        </td>
                        <td className="p-3 md:p-4 text-right font-black text-slate-800 text-xs md:text-sm">Rp {payment.amount.toLocaleString()}</td>
                        <td className="p-3 md:p-4 text-center">
                          <div className="flex items-center justify-center gap-1 md:gap-2">
                            <button 
                              onClick={() => generateIuranReceiptPDF(payment, pdfConfig)}
                              className="p-1.5 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <Printer size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingPayment(payment);
                                setPayType(payment.type);
                                setPayAmount(payment.amount.toString());
                                setPayDate(new Date(payment.date).toISOString().split('T')[0]);
                                setPayNotes(payment.notes || '');
                                setPayerName(payment.payerName || '');
                                setIsEditPaymentModalOpen(true);
                              }}
                              className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={async () => {
                                const isConfirmed = await confirm({
                                  title: 'Hapus Pembayaran',
                                  message: 'Hapus catatan pembayaran ini?',
                                  confirmLabel: 'Hapus',
                                  isDanger: true
                                });

                                if (isConfirmed) {
                                  try {
                                    await deleteIuranPaymentFromDb(payment.id);
                                    toast.success('Dihapus.');
                                  } catch (error) {
                                    handleFirestoreError(error, OperationType.DELETE, `iuranPayments/${payment.id}`);
                                  }
                                }
                              }}
                              className="p-1.5 md:p-2 text-slate-300 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-payments">
                      <td colSpan={7} className="p-12 text-center text-slate-400 italic">
                        Belum ada pembayaran masuk untuk periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {currentMonthPayments.length > 0 ? (
                currentMonthPayments.map((payment) => (
                  <div key={payment.id} className="p-5 bg-slate-50/75 border border-slate-100 rounded-[2rem] space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-extrabold text-slate-800 text-sm">{payment.headOfFamily}</p>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-0.5">Blok {payment.block}-{payment.number}</p>
                      </div>
                      <span className="text-sm font-black text-slate-800">Rp {payment.amount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>{new Date(payment.date).toLocaleDateString('id-ID')}</span>
                      <div className="flex gap-1.5">
                        <span className="px-2.5 py-1 bg-white text-slate-600 rounded-lg uppercase tracking-wider text-[8px] font-black border border-slate-100 shadow-sm">
                          {payment.month}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg uppercase tracking-wider text-[8px] font-black border ${
                          payment.type === 'Both' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          payment.type === 'Air' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}>
                          {payment.type === 'Both' ? 'Semua' : payment.type === 'Air' ? 'Air' : 'Sampah'}
                        </span>
                      </div>
                    </div>
                    
                    {payment.payerName && payment.payerName !== payment.headOfFamily && (
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pembayar: {payment.payerName}</p>
                    )}
                    
                    <div className="flex gap-2 pt-3 border-t border-slate-200/50">
                      <button 
                        onClick={() => generateIuranReceiptPDF(payment, pdfConfig)}
                        className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                      >
                        <Printer size={12} /> Cetak
                      </button>
                      <button 
                        onClick={() => {
                          setEditingPayment(payment);
                          setPayType(payment.type);
                          setPayAmount(payment.amount.toString());
                          setPayDate(new Date(payment.date).toISOString().split('T')[0]);
                          setPayNotes(payment.notes || '');
                          setPayerName(payment.payerName || '');
                          setIsEditPaymentModalOpen(true);
                        }}
                        className="flex-1 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-indigo-100 active:scale-95 transition-all border border-indigo-100"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button 
                        onClick={async () => {
                          const isConfirmed = await confirm({
                            title: 'Hapus Pembayaran',
                            message: 'Hapus catatan pembayaran ini?',
                            confirmLabel: 'Hapus',
                            isDanger: true
                          });

                          if (isConfirmed) {
                            try {
                              await deleteIuranPaymentFromDb(payment.id);
                              toast.success('Dihapus.');
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `iuranPayments/${payment.id}`);
                            }
                          }
                        }}
                        className="p-3 text-rose-500 hover:text-rose-700 bg-rose-50 rounded-xl active:scale-95 transition-all border border-rose-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-sm">
                  Belum ada pembayaran masuk untuk periode ini.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Enhanced Arrears Management Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden ring-4 ring-rose-50">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-rose-500 text-white rounded-3xl shadow-lg shadow-rose-500/30">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 leading-tight">Pusat Penagihan Tunggakan</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Warga dengan kewajiban iuran belum terpenuhi</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <select 
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="bg-transparent border-none text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none px-2 py-1 cursor-pointer"
              >
                <option value="All">Semua Blok</option>
                {blockOptions.map(b => (
                  <option key={b} value={b}>Blok {b}</option>
                ))}
              </select>
            </div>
            
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              {[
                { id: 'all', label: 'Semua' },
                { id: '1-2', label: '1-2 Bln' },
                { id: '3-5', label: '3-5 Bln' },
                { id: '6+', label: '6+ Bln' },
              ].map((aging) => (
                <button 
                  key={aging.id}
                  onClick={() => setArrearsAging(aging.id as ArrearsAging)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${arrearsAging === aging.id ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {aging.label}
                </button>
              ))}
            </div>
            <button 
              onClick={copyCollectiveArrears}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
            >
              <ClipboardList size={15} /> Salin Teks
            </button>
            {pdfConfig?.whatsappGroupId && (
              <button 
                onClick={async () => {
                  const typeLabel = filterType === 'All' ? 'KEAMANAN & KEBERSIHAN' : filterType === 'Air' ? 'AIR' : 'SAMPAH';
                  const header = `*REMINDER IURAN ${typeLabel} RT 02*\n*Per Tanggal:* ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}\n\n`;
                  const list = arrearsData.map((item, i) => `${i + 1}. Blok ${item.house.block}-${item.house.number}: ${item.arrears.length} Bulan (Rp ${item.totalAmount.toLocaleString()})`).join('\n');
                  const footer = `\n\nTotal Piutang: Rp ${arrearsData.reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString()}\n\nMohon kesediaannya untuk menyelesaikan iuran demi kelancaran operasional lingkungan kita bersama. Terima kasih. 🙏`;
                  const fullText = header + list + footer;

                  window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <MessageCircle size={15} /> Broadcast Grup WA
              </button>
            )}
          </div>
        </div>

        {arrearsByBlock.length > 0 ? (
          <div className="space-y-12">
            {arrearsByBlock.map(({ block, items }) => {
              const blockTotal = items.reduce((acc, curr) => acc + curr.totalAmount, 0);
              return (
                <div key={block} className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b-2 border-slate-100 mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg">
                        {block}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Blok {block}</h4>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{items.length} Rumah dalam Penagihan</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-right">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-none mb-1">Total Piutang Blok</p>
                        <p className="text-sm font-black text-rose-600">Rp {blockTotal.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => {
                          const header = `📋 *REKAP TUNGGAKAN IURAN - BLOK ${block}*\n📅 Periode: ${selectedMonth}\n\n`;
                          const list = items.map(({ house, arrears, totalAmount }) => 
                            `🏠 ${house.block}-${house.number} (${house.headOfFamily}): ${arrears.length} Bulan (Rp ${totalAmount.toLocaleString()})`
                          ).join('\n');
                          const footer = `\n\nTotal: Rp ${blockTotal.toLocaleString()}`;
                          navigator.clipboard.writeText(header + list + footer);
                          toast.success(`Daftar tunggakan Blok ${block} berhasil disalin!`);
                        }}
                        className="p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-sm group"
                        title="Salin Rincian Blok"
                      >
                        <Copy size={16} className="group-active:scale-90" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map(({ house, arrears, totalAmount }) => (
                    <div 
                      key={house.id} 
                      className={`p-6 border-2 rounded-[2rem] transition-all flex flex-col justify-between group ${
                        arrears.length >= 6 ? 'bg-rose-50/30 border-rose-200 hover:bg-rose-50 active:scale-[0.98]' :
                        arrears.length >= 3 ? 'bg-amber-50/20 border-amber-100 hover:bg-amber-50 active:scale-[0.98]' :
                        'bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 active:scale-[0.98]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-2xl ${arrears.length >= 6 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                              <Users size={16} />
                            </div>
                            <div>
                              <p className="text-lg font-black text-slate-800 leading-tight">{house.headOfFamily}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blok {house.block}-{house.number}</span>
                                <span className={`w-1 h-1 rounded-full ${arrears.length >= 6 ? 'bg-rose-400' : 'bg-slate-300'}`}></span>
                                <span className="text-[10px] font-bold text-slate-400 italic">Aging: {arrears.length} Bln</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/50 rounded-2xl p-4 mb-6 border border-slate-100/50">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalkulasi Tunggakan</p>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${arrears.length >= 6 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {arrears.length} x Rp {(totalAmount/arrears.length).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-end justify-between">
                            <p className="text-2xl font-black text-slate-800">Rp {totalAmount.toLocaleString()}</p>
                            <div className="flex -space-x-1 mb-1">
                              {arrears.slice(0, 4).map((_, i) => (
                                <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                    <Calendar size={10} className="text-slate-400" />
                                </div>
                              ))}
                              {arrears.length > 4 && (
                                <div className="w-5 h-5 rounded-full border-2 border-white bg-rose-50 text-[8px] font-black flex items-center justify-center text-rose-600">
                                  +{arrears.length-4}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-6">
                          {arrears.map(m => (
                            <span key={m} className={`px-2.5 py-1 rounded-full text-[9px] font-black transition-all border ${
                              m === selectedMonth ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-slate-500 border-slate-200'
                            }`}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <button 
                          onClick={() => openPayModal(house)}
                          className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                          <CreditCard size={14} /> Bayar Sekarang
                        </button>
                        {onSendWhatsApp && (
                          <button 
                            onClick={() => {
                              const typeLabel = filterType === 'All' ? 'Air & Sampah' : 'Iuran ' + filterType;
                              const msg = `Halo Bapak/Ibu ${house.headOfFamily} (Blok ${house.block}-${house.number}),\n\nMohon maaf mengganggu ketenangannya, kami ingin menginformasikan rincian tunggakan iuran ${typeLabel} untuk rumah Bapak/Ibu:\n\n📅 *Total:* ${arrears.length} Bulan\n📝 *Periode:* ${arrears.join(', ')}\n💰 *Total Nominal:* Rp ${totalAmount.toLocaleString()}\n\nMohon bantuannya untuk segera melakukan penyelesaian iuran demi kelancaran operasional RT. Pembayaran bisa dilakukan melalui pengurus atau transfer.\n\nTerima kasih atas pengertiannya. 🙏`;
                              onSendWhatsApp(house, msg);
                            }}
                            className="px-4 py-3.5 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-all active:scale-95 border border-emerald-100"
                            title="Kirim Penagihan WA"
                          >
                            <MessageCircle size={16} fill="currentColor" className="opacity-20" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-emerald-500" />
            </div>
            <h4 className="text-xl font-black text-slate-800">Semua Lunas Tagihan!</h4>
            <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">Tidak ditemukan tunggakan sesuai filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckCircle: React.FC<{ size?: number, className?: string }> = ({ size = 24, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

