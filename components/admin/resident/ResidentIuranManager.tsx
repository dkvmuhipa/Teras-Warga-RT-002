import React from 'react';
import { DollarSign, Activity, AlertCircle, CreditCard, Mail, Download, Printer, Edit2, Trash2 } from 'lucide-react';
import { House, PdfConfig } from '../../../types';
import { useFinancial } from '../../../context/FinancialContext';

interface ResidentIuranManagerProps {
  houses: House[];
  generateIuranReceiptPDF: (payment: any, config: PdfConfig) => void;
  pdfConfig: PdfConfig;
  deleteIuranPaymentFromDb: (id: string) => Promise<void>;
  setEditingPayment: (payment: any) => void;
  setPayType: (type: 'Air' | 'Sampah' | 'Both') => void;
  setPayAmount: (amount: string) => void;
  setPayDate: (date: string) => void;
  setPayNotes: (notes: string) => void;
  setIsEditPaymentModalOpen: (open: boolean) => void;
}

export const ResidentIuranManager: React.FC<ResidentIuranManagerProps> = ({
  houses,
  generateIuranReceiptPDF,
  pdfConfig,
  deleteIuranPaymentFromDb,
  setEditingPayment,
  setPayType,
  setPayAmount,
  setPayDate,
  setPayNotes,
  setIsEditPaymentModalOpen,
}) => {
  const { 
    selectedMonth, 
    summaries, 
    iuranPayments, 
    getArrearsForHouse 
  } = useFinancial();
  
  const { 
    totalCollected, 
    participationRate, 
    paidHousesCount, 
    unpaidHousesCount, 
    estimatedReceivables, 
    totalArrearsAmount, 
    totalArrearsMonths 
  } = summaries;

  const isMonthMatch = (monthA: string, monthB: string) => {
    if (!monthA || !monthB) return false;
    return monthA.trim().toLowerCase() === monthB.trim().toLowerCase();
  };

  const currentMonthPayments = iuranPayments.filter(p => isMonthMatch(p.month, selectedMonth));
  const occupiedHousesList = houses.filter(h => h.status === 'Occupied');

  return (
    <div className="space-y-6">
      {/* Financial Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={48} className="text-emerald-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Terkumpul</p>
          <h4 className="text-2xl font-black text-slate-800">Rp {totalCollected.toLocaleString()}</h4>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-md border border-emerald-100">
              {selectedMonth}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={48} className="text-indigo-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Partisipasi Warga</p>
          <h4 className="text-2xl font-black text-slate-800">{participationRate}%</h4>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-1000" 
              style={{ width: `${participationRate}%` }}
            ></div>
          </div>
          <p className="mt-2 text-[10px] font-bold text-slate-400">{paidHousesCount} dari {occupiedHousesList.length} Rumah Dihuni</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle size={48} className="text-rose-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Belum Bayar</p>
          <h4 className="text-2xl font-black text-rose-600">{unpaidHousesCount} <span className="text-sm text-slate-400 font-bold">Rumah</span></h4>
          <div className="mt-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-black rounded-md border border-rose-100">
              Bulan Ini
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <CreditCard size={48} className="text-amber-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Estimasi Piutang</p>
          <h4 className="text-2xl font-black text-slate-800">Rp {estimatedReceivables.toLocaleString()}</h4>
          <p className="mt-4 text-[10px] font-bold text-slate-400 italic">Bulan Ini</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden group ring-2 ring-rose-500/5">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <AlertCircle size={48} className="text-rose-600" />
          </div>
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Total Tunggakan</p>
          <h4 className="text-2xl font-black text-rose-600">Rp {totalArrearsAmount.toLocaleString()}</h4>
          <p className="mt-4 text-[10px] font-bold text-rose-400 italic">Dari {totalArrearsMonths} Bulan Unpaid</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800">Rincian Transaksi Iuran</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Daftar pembayaran yang masuk untuk periode {selectedMonth}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const unpaidHouses = occupiedHousesList.filter(h => !currentMonthPayments.some(p => 
                  String(p.houseId) === String(h.id) || 
                  String(p.houseId) === `${h.block}-${h.number}` ||
                  (p.block === h.block && p.number === h.number)
                ));
                const text = `*DAFTAR WARGA BELUM BAYAR IURAN*\n*Periode:* ${selectedMonth}\n\n` + 
                  unpaidHouses.map((h, i) => {
                    const arrears = getArrearsForHouse(h);
                    const arrearsText = arrears.length > 0 ? ` (+ Tunggakan ${arrears.length} bln)` : '';
                    return `${i+1}. Blok ${h.block}-${h.number} (${h.headOfFamily})${arrearsText}`;
                  }).join('\n') +
                  `\n\nMohon segera melakukan pembayaran. Terima kasih.`;
                navigator.clipboard.writeText(text);
                alert('Daftar warga belum bayar berhasil disalin ke clipboard!');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-100 transition-all"
            >
              <Mail size={16} /> Salin Daftar Belum Bayar
            </button>
            <button 
              onClick={() => {
                const csv = [
                  ['Tanggal Bayar', 'Bulan Iuran', 'Nama', 'Rumah', 'Jenis', 'Nominal'].join(','),
                  ...currentMonthPayments.map(p => [
                    new Date(p.date).toLocaleDateString('id-ID'),
                    p.month,
                    p.headOfFamily,
                    `${p.block}-${p.number}`,
                    p.type,
                    p.amount
                  ].join(','))
                ].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Laporan_Iuran_${selectedMonth.replace(/\s+/g, '_')}.csv`;
                a.click();
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
            >
              <Download size={16} /> Ekspor Laporan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Tanggal Bayar</th>
                <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Bulan Iuran</th>
                <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Nama Warga</th>
                <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px]">Rumah</th>
                <th className="p-3 md:p-4 text-left font-black text-slate-600 uppercase tracking-widest text-[10px] hidden sm:table-cell">Jenis Iuran</th>
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
                    <td className="p-3 md:p-4 font-bold text-slate-800 text-xs md:text-sm">{payment.headOfFamily}</td>
                    <td className="p-3 md:p-4 font-mono font-black text-slate-600 text-xs md:text-sm">{payment.block}-{payment.number}</td>
                    <td className="p-3 md:p-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        payment.type === 'Both' ? 'bg-indigo-50 text-indigo-600' :
                        payment.type === 'Air' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {payment.type === 'Both' ? 'Air & Sampah' : payment.type === 'Air' ? 'Air Saja' : 'Sampah Saja'}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-right font-black text-slate-800 text-xs md:text-sm">Rp {payment.amount.toLocaleString()}</td>
                    <td className="p-3 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        <button 
                          onClick={() => generateIuranReceiptPDF(payment, pdfConfig)}
                          className="p-1.5 md:p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Cetak Kwitansi"
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
                            setIsEditPaymentModalOpen(true);
                          }}
                          className="p-1.5 md:p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                          title="Edit Catatan"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Hapus catatan pembayaran ini?')) {
                              await deleteIuranPaymentFromDb(payment.id);
                            }
                          }}
                          className="p-1.5 md:p-2 text-slate-300 hover:text-rose-600 transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-payments">
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <DollarSign size={32} />
                      </div>
                      <p className="text-slate-400 font-bold italic">Belum ada catatan pembayaran iuran untuk periode {selectedMonth}.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arrears List Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertCircle size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Daftar Tunggakan Warga</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Warga yang memiliki tunggakan iuran (termasuk bulan berjalan jika lewat tgl 20)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {occupiedHousesList
            .map(h => ({ house: h, arrears: getArrearsForHouse(h) }))
            .filter(item => item.arrears.length > 0)
            .sort((a, b) => b.arrears.length - a.arrears.length)
            .map(({ house, arrears }) => (
              <div key={house.id} className="p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-black text-slate-800">{house.headOfFamily}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blok {house.block}-{house.number}</p>
                  </div>
                  <span className="px-2 py-1 bg-rose-100 text-rose-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                    {arrears.length} Bulan
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {arrears.map(m => (
                    <span key={m} className="px-2 py-1 bg-white text-rose-500 rounded-lg text-[9px] font-bold border border-rose-100">
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          {occupiedHousesList.filter(h => getArrearsForHouse(h).length > 0).length === 0 && (
            <div className="col-span-full py-12 text-center bg-emerald-50/50 rounded-[2rem] border-2 border-dashed border-emerald-100">
              <p className="text-emerald-600 font-black text-sm uppercase tracking-widest">Semua Warga Sudah Lunas!</p>
              <p className="text-emerald-400 text-xs mt-1 italic">Tidak ada tunggakan iuran yang tercatat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
