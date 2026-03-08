import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bill, BillItem } from '../../types';
import { X, CheckCircle, AlertCircle, Plus, Upload } from 'lucide-react';
import { updateBillInDb } from '../../services/databaseService';

interface BillDetailModalProps {
  houseId: string;
  bills: Bill[];
  onClose: () => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({ houseId, bills, onClose }) => {
  const houseBills = bills.filter(b => b.houseId === houseId).sort((a, b) => b.month.localeCompare(a.month));

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
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-black text-slate-800">Riwayat Tagihan {houseId}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          {houseBills.length > 0 ? (
            houseBills.map(bill => (
              <div key={bill.id} className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-slate-700">Bulan: {bill.month}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${bill.total === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {bill.total === 0 ? 'Lunas' : `Sisa: Rp${bill.total.toLocaleString()}`}
                  </span>
                </div>
                <div className="space-y-2">
                  {bill.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                          <p className="font-bold text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500">Rp{item.amount.toLocaleString()}</p>
                      </div>
                      {item.status === 'Paid' ? (
                          <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold"><CheckCircle size={14}/> Lunas</span>
                      ) : (
                          <button 
                              onClick={() => handleMarkAsPaid(bill.id, item.id)}
                              className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                          >
                              Bayar
                          </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 font-bold">
              Tidak ada riwayat tagihan untuk rumah ini.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
