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
    { name: 'Usaha', value: houses.filter(h => h.status === 'Business').length, color: '#f59e0b' },
  ];

  const residenceTypeData = [
    { name: 'Tetap', value: houses.filter(h => h.residenceType === 'Tetap').length },
    { name: 'Kontrak', value: houses.filter(h => h.residenceType === 'Kontrak').length },
    { name: 'Kost', value: houses.filter(h => h.residenceType === 'Kost').length },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Status Hunian</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-6">Tipe Kepemilikan</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={residenceTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
