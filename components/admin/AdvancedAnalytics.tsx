import React from 'react';
import { BarChart3, AlertTriangle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { House, CashFlow, Report } from '../../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

interface AdvancedAnalyticsProps {
  houses: House[];
  cashFlow: CashFlow[];
  reports: Report[];
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ houses, cashFlow, reports }) => {
  // Data Quality Checks
  const missingPhoneCount = houses.filter(h => !h.phone || h.phone === '-').length;
  const unverifiedHousesCount = houses.filter(h => !h.isVerified).length;
  
  // Trend Data: Monthly Cash Flow
  const monthlyCashFlow = cashFlow.reduce((acc: any, curr) => {
    const month = new Date(curr.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    if (!acc[month]) acc[month] = { month, Income: 0, Expense: 0 };
    acc[month][curr.type] += curr.amount;
    return acc;
  }, {});
  const chartData = Object.values(monthlyCashFlow);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black text-slate-900">Analitik & Laporan Lanjutan</h2>
      
      {/* Data Quality Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={24} /></div>
          <div>
            <h3 className="font-bold text-slate-900">Data Warga Tidak Lengkap</h3>
            <p className="text-sm text-slate-500">{missingPhoneCount} rumah belum memiliki nomor telepon.</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl"><AlertTriangle size={24} /></div>
          <div>
            <h3 className="font-bold text-slate-900">Data Warga Belum Verifikasi</h3>
            <p className="text-sm text-slate-500">{unverifiedHousesCount} rumah belum diverifikasi.</p>
          </div>
        </div>
      </div>

      {/* Trends */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2"><TrendingUp className="text-indigo-600" /> Tren Keuangan Bulanan</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
              <Tooltip />
              <Area type="monotone" dataKey="Income" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              <Area type="monotone" dataKey="Expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
