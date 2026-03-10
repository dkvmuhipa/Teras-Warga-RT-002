import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Users, Baby, User, UserCheck, Heart, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface DemographicAnalyticsProps {
  houses: any[];
}

export const DemographicAnalytics: React.FC<DemographicAnalyticsProps> = ({ houses }) => {
  // Helper to calculate age
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30; // Default to adult if unknown
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Aggregate all residents (Head of Family + Family Members)
  const allResidents: any[] = [];
  houses.forEach(h => {
    if (h.status === 'Occupied') {
      // Add Head of Family
      allResidents.push({
        gender: h.gender || 'Laki-laki',
        age: calculateAge(h.birthDate),
        job: h.jobCategory || 'Lainnya'
      });
      
      // Add Family Members
      if (h.familyMembers) {
        h.familyMembers.forEach((m: any) => {
          allResidents.push({
            gender: m.gender || 'Laki-laki',
            age: calculateAge(m.birthDate),
            job: m.job || 'Lainnya'
          });
        });
      }
    }
  });

  const totalResidents = allResidents.length;
  const totalOccupied = houses.filter(h => h.status === 'Occupied').length;
  
  // Age distribution
  const ageGroups = {
    balita: allResidents.filter(r => r.age <= 5).length,
    anak: allResidents.filter(r => r.age > 5 && r.age <= 12).length,
    remaja: allResidents.filter(r => r.age > 12 && r.age <= 18).length,
    dewasa: allResidents.filter(r => r.age > 18 && r.age <= 55).length,
    lansia: allResidents.filter(r => r.age > 55).length,
  };

  const ageDistribution = [
    { name: 'Balita (0-5)', value: ageGroups.balita, color: '#10b981' },
    { name: 'Anak (6-12)', value: ageGroups.anak, color: '#3b82f6' },
    { name: 'Remaja (13-18)', value: ageGroups.remaja, color: '#6366f1' },
    { name: 'Dewasa (19-55)', value: ageGroups.dewasa, color: '#8b5cf6' },
    { name: 'Lansia (55+)', value: ageGroups.lansia, color: '#f59e0b' },
  ];

  // Gender distribution
  const genderDistribution = [
    { name: 'Laki-laki', value: allResidents.filter(r => r.gender === 'Laki-laki').length, color: '#3b82f6' },
    { name: 'Perempuan', value: allResidents.filter(r => r.gender === 'Perempuan').length, color: '#ec4899' },
  ];

  // Occupation distribution
  const jobs: Record<string, number> = {};
  allResidents.forEach(r => {
    const job = r.job || 'Lainnya';
    jobs[job] = (jobs[job] || 0) + 1;
  });

  const occupationData = Object.entries(jobs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 occupations

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-8 pb-20"
    >
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Analitik Kependudukan</h2>
        <p className="text-slate-500 font-medium mt-1">Wawasan mendalam mengenai demografi warga RT 002.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Jiwa</p>
            <h3 className="text-2xl font-black text-slate-900">{totalResidents}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Baby size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balita & Anak</p>
            <h3 className="text-2xl font-black text-slate-900">{ageDistribution[0].value + ageDistribution[1].value}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <Heart size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lansia</p>
            <h3 className="text-2xl font-black text-slate-900">{ageDistribution[4].value}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tingkat Hunian</p>
            <h3 className="text-2xl font-black text-slate-900">{Math.round((totalOccupied / houses.length) * 100)}%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">Distribusi Usia</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">Distribusi Jenis Kelamin</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupation Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest mb-8">Sebaran Pekerjaan Warga</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupationData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
