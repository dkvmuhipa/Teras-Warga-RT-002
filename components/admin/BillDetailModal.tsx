import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bill, BillItem, House } from '../../types';
import { X, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { updateBillInDb } from '../../services/databaseService';

interface BillDetailModalProps {
  house: House;
  bills: Bill[];
  onClose: () => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({ house, bills, onClose }) => {
  const houseBills = bills.filter(b => b.houseId === house.id).sort((a, b) => b.month.localeCompare(a.month));

  const handleMarkAsPaid = async (billId: string, itemId: string) => {
    const bill = houseBills.find(b => b.id === billId);
    if (!bill) return;

    const updatedItems = bill.items.map(item => 
      item.id === itemId ? { ...item, status: 'Paid' as const, paymentDate: new Date().toISOString() } : item
    );
    
    await updateBillInDb(billId, { 
        items: updatedItems,
        total: updatedItems.reduce((acc, curr) => acc + (curr.status === 'Paid' ? 0 : curr.amount), 0)
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-white/20"
      >
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Riwayat Tagihan</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {house.headOfFamily} • Blok {house.block}-{house.number}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all rounded-2xl active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
          {houseBills.length > 0 ? (
            houseBills.map(bill => (
              <div key={bill.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 group transition-all hover:shadow-xl hover:shadow-slate-200/50">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">Periode: {bill.month}</h4>
                  </div>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${bill.total === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {bill.total === 0 ? 'LUNAS' : `SISA Rp${bill.total.toLocaleString()}`}
                  </span>
                </div>
                <div className="space-y-3">
                  {bill.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50 transition-all hover:bg-white hover:border-slate-200">
                      <div>
                          <p className="font-black text-slate-700 text-xs uppercase tracking-wider">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">Rp {item.amount.toLocaleString()}</p>
                      </div>
                      {item.status === 'Paid' ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle size={14} strokeWidth={3} /> Lunas
                            </span>
                            {item.paymentDate && (
                              <span className="text-[8px] font-bold text-slate-400 mt-0.5">
                                {new Date(item.paymentDate).toLocaleDateString('id-ID')}
                              </span>
                            )}
                          </div>
                      ) : (
                          <button 
                              onClick={() => handleMarkAsPaid(bill.id, item.id)}
                              className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-2"
                          >
                              <DollarSign size={12} /> Bayar
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <AlertCircle size={40} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Tidak Ada Data</p>
                <p className="text-xs font-bold text-slate-400 mt-1">Belum ada riwayat tagihan untuk rumah ini.</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
