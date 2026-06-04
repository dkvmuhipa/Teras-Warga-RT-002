import React from 'react';
import { House } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ResidentAnalyticsProps {
  houses: House[];
}

export const ResidentAnalytics: React.FC<ResidentAnalyticsProps> = ({ houses }) => {
  const statusData = [
    { name: 'Dihuni', value: houses.filter(h => h.status === 'Occupied').length, color: '#10b981' },
    { name: 'Kosong', value: houses.filter(h => h.status === 'Empty').length, color: '#64748b' },
    { name: 'Usaha', value: houses.filter(h => h.status === 'Business').length, color: '#a855f7' },
    { name: 'Mengunjungi', value: houses.filter(h => h.status === 'Visiting').length, color: '#0ea5e9' },
  ];

  const residenceTypeData = [
    { name: 'Tetap', value: houses.filter(h => h.residenceType === 'Tetap').length },
    { name: 'Sewa', value: houses.filter(h => h.residenceType === 'Sewa').length },
    { name: 'Keluarga', value: houses.filter(h => h.residenceType === 'Rumah Keluarga').length },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-sm md:text-lg font-black text-slate-800 mb-4 md:mb-6">Status Hunian</h3>
        <div className="h-48 sm:h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-sm md:text-lg font-black text-slate-800 mb-4 md:mb-6">Tipe Kepenghunian</h3>
        <div className="h-48 sm:h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={residenceTypeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
