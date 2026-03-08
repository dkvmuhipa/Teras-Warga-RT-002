import React from 'react';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Bill, House } from '../../types';

interface BillManagerProps {
  bills: Bill[];
  houses: House[];
}

export const BillManager: React.FC<BillManagerProps> = ({ bills, houses }) => {
  const isLate = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    return now > due && now.getDate() > 20;
  };

  return (
    <div className="space-y-6">
      <h2 className="font-black text-2xl text-slate-800">Manajemen Iuran Itemized</h2>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {bills.length > 0 ? (
            bills.map((bill) => {
              const house = houses.find(h => h.id === bill.houseId);
              const late = isLate(bill.dueDate);
              
              return (
                <div key={bill.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-800">Rumah {house ? `${house.block}/${house.number}` : bill.houseId} - {bill.month}</h4>
                    <span className="text-xs font-bold text-slate-500">Jatuh Tempo: {bill.dueDate}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {bill.items.map(item => (
                      <div key={item.id} className={`p-4 rounded-2xl border ${item.status === 'Paid' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          {item.status === 'Paid' ? <CheckCircle2 size={16} className="text-emerald-600"/> : <AlertCircle size={16} className="text-rose-600"/>}
                        </div>
                        <p className="text-sm text-slate-600">Rp{item.amount.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Pengelola: {item.manager}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <p className="font-black text-slate-800">Total: Rp{bill.total.toLocaleString('id-ID')}</p>
                    {late && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">Terlambat</span>}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 italic">Belum ada data tagihan.</div>
          )}
        </div>
      </div>
    </div>
  );
};
