import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, 
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
  Users, Baby, User, UserCheck, Heart, TrendingUp, 
  BookOpen, Car, GraduationCap, Briefcase, MapPin, 
  ChevronRight, Info, Sparkles, FileText, AlertTriangle, Activity, DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { House, CashFlow, Report } from '../../types';

interface DemographicAnalyticsProps {
  houses: House[];
  cashFlow: CashFlow[];
  reports: Report[];
}

export const DemographicAnalytics: React.FC<DemographicAnalyticsProps> = ({ houses = [], cashFlow = [], reports = [] }) => {
  const [activeTab, setActiveTab] = useState<'demographics' | 'advanced'>('demographics');

  // Early return if data is missing
  if (!houses || !Array.isArray(houses)) {
    return (
      <div className="flex items-center justify-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
        <div className="text-center">
          <Users className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Memuat data analitik...</p>
        </div>
      </div>
    );
  }

  // Helper to calculate age
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 30;
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 30;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Aggregate all residents (Head of Family + Family Members)
  const stats = useMemo(() => {
    const allResidents: any[] = [];
    const religions: Record<string, number> = {};
    const educations: Record<string, number> = {};
    const jobs: Record<string, number> = {};
    let totalVehicles = 0;
    let totalPregnant = 0;
    let totalBabies = 0;
    let totalToddlers = 0;
    let totalTeenagers = 0;
    let totalAdults = 0;
    let totalElderly = 0;
    let totalWidows = 0;

    houses.forEach(h => {
      if (h && h.status === 'Occupied') {
        totalVehicles += (h.vehicleCount || 0);
        totalPregnant += (h.pregnantCount || 0);
        totalBabies += (h.babyCount || 0);
        totalToddlers += (h.toddlerCount || 0);
        totalTeenagers += (h.teenagerCount || 0);
        totalAdults += (h.adultCount || 0);
        totalElderly += (h.elderlyCount || 0);
        totalWidows += (h.widowCount || 0);

        // Add Head of Family
        const hoF = {
          gender: h.gender || 'Laki-laki',
          age: calculateAge(h.birthDate),
          job: h.jobCategory || 'Lainnya',
          religion: h.religion || 'Lainnya',
          education: h.education || 'Lainnya'
        };
        allResidents.push(hoF);
        
        religions[hoF.religion] = (religions[hoF.religion] || 0) + 1;
        educations[hoF.education] = (educations[hoF.education] || 0) + 1;
        jobs[hoF.job] = (jobs[hoF.job] || 0) + 1;
        
        // Add Family Members
        if (h.familyMembers && Array.isArray(h.familyMembers)) {
          h.familyMembers.forEach((m: any) => {
            if (!m) return;
            const member = {
              gender: m.gender || 'Laki-laki',
              age: calculateAge(m.birthDate),
              job: m.job || 'Lainnya',
              religion: h.religion || 'Lainnya', // Assume same as HoF if not specified
              education: m.education || 'Lainnya'
            };
            allResidents.push(member);
            religions[member.religion] = (religions[member.religion] || 0) + 1;
            educations[member.education] = (educations[member.education] || 0) + 1;
            jobs[member.job] = (jobs[member.job] || 0) + 1;
          });
        }
      }
    });

    return {
      allResidents,
      religions,
      educations,
      jobs,
      totalVehicles,
      totalPregnant,
      totalBabies,
      totalToddlers,
      totalTeenagers,
      totalAdults,
      totalElderly,
      totalWidows,
      totalOccupied: houses.filter(h => h.status === 'Occupied').length
    };
  }, [houses]);

  const { 
    allResidents, religions, educations, jobs, 
    totalVehicles, totalPregnant, totalBabies, 
    totalToddlers, totalTeenagers, totalAdults,
    totalElderly, totalWidows, totalOccupied 
  } = stats;

  const totalResidents = allResidents.length || 1; // Prevent division by zero
  
  // Age distribution
  const ageGroups = {
    bayi: allResidents.filter(r => r.age < 1).length,
    balita: allResidents.filter(r => r.age >= 1 && r.age <= 5).length,
    anak: allResidents.filter(r => r.age > 5 && r.age <= 12).length,
    remaja: allResidents.filter(r => r.age > 12 && r.age <= 18).length,
    dewasa: allResidents.filter(r => r.age > 18 && r.age <= 55).length,
    lansia: allResidents.filter(r => r.age > 55).length,
  };

  const ageDistribution = [
    { name: 'Bayi (0-1)', value: ageGroups.bayi, color: '#06b6d4' },
    { name: 'Balita (1-5)', value: ageGroups.balita, color: '#10b981' },
    { name: 'Anak (6-12)', value: ageGroups.anak, color: '#3b82f6' },
    { name: 'Remaja (13-18)', value: ageGroups.remaja, color: '#6366f1' },
    { name: 'Dewasa (19-55)', value: ageGroups.dewasa, color: '#8b5cf6' },
    { name: 'Lansia (55+)', value: ageGroups.lansia, color: '#f59e0b' },
  ];

  const genderDistribution = [
    { name: 'Laki-laki', value: allResidents.filter(r => r.gender === 'Laki-laki').length, color: '#3b82f6' },
    { name: 'Perempuan', value: allResidents.filter(r => r.gender === 'Perempuan').length, color: '#ec4899' },
  ];

  const religionData = Object.entries(religions)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const educationData = Object.entries(educations)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const occupationData = Object.entries(jobs)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Advanced Analytics Data
  const missingPhoneCount = houses.filter(h => !h.phone || h.phone === '-').length;
  const unverifiedHousesCount = houses.filter(h => !h.isVerified).length;
  
  const monthlyCashFlow = useMemo(() => {
    if (!cashFlow || !Array.isArray(cashFlow)) return [];
    
    try {
      const groups = cashFlow.reduce((acc: any, curr) => {
        if (!curr || !curr.date) return acc;
        const date = new Date(curr.date);
        if (isNaN(date.getTime())) return acc;
        
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthKey = `${month + 1}-${year}`;
        const sortKey = year * 100 + month;
        
        if (!acc[monthKey]) {
          // Fallback for toLocaleDateString
          let monthLabel = monthKey;
          try {
            monthLabel = date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
          } catch (e) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            monthLabel = `${months[month]} ${year}`;
          }
          
          acc[monthKey] = { month: monthLabel, Income: 0, Expense: 0, sortKey };
        }
        
        if (curr.type === 'Income' || curr.type === 'Expense') {
          acc[monthKey][curr.type] += Number(curr.amount) || 0;
        }
        return acc;
      }, {});
      
      return Object.values(groups).sort((a: any, b: any) => a.sortKey - b.sortKey);
    } catch (err) {
      return [];
    }
  }, [cashFlow]);

  const cashFlowChartData = monthlyCashFlow;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10 pb-24"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Intelligence Center</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Analitik & Demografi</h2>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Pusat data terpadu RT 02 untuk memantau demografi warga, tren keuangan, dan kualitas data secara real-time.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('demographics')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'demographics' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Demografi
          </button>
          <button 
            onClick={() => setActiveTab('advanced')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'advanced' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Operasional & Tren
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        {activeTab === 'demographics' ? (
          <div key="demographics" className="space-y-10">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Users, label: 'Total Jiwa', value: totalResidents, sub: 'Penduduk Terdaftar', color: 'blue' },
                { icon: Baby, label: 'Balita & Anak', value: ageGroups.balita + ageGroups.anak, sub: 'Generasi Penerus', color: 'emerald' },
                { icon: Heart, label: 'Lansia', value: ageGroups.lansia, sub: 'Warga Senior', color: 'amber' },
                { icon: Car, label: 'Total Kendaraan', value: totalVehicles, sub: 'Mobilitas Warga', color: 'indigo' }
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl group-hover:rotate-6 transition-transform">
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-3xl font-black text-slate-900 leading-none mb-1">{stat.value}</h3>
                      <p className="text-[10px] font-bold text-slate-400">{stat.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Age Distribution - Large Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Usia</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Komposisi Generasi Warga</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                    <TrendingUp size={20} />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ageDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {ageDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                          itemStyle={{ fontWeight: 'bold', fontSize: '14px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {ageDistribution.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-sm font-bold text-slate-600">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-slate-900">{item.value}</span>
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {Math.round((item.value / totalResidents) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Gender Distribution - Modern Vertical Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[3rem] shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <h3 className="text-xl font-black tracking-tight mb-2 relative z-10">Keseimbangan Gender</h3>
                <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-10 relative z-10">Rasio Laki-laki & Perempuan</p>
                
                <div className="space-y-10 relative z-10">
                  {genderDistribution.map((item, i) => (
                    <div key={item.name} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${i === 0 ? 'bg-blue-400/20' : 'bg-pink-400/20'}`}>
                            {i === 0 ? <User size={18} /> : <UserCheck size={18} />}
                          </div>
                          <span className="text-sm font-bold">{item.name}</span>
                        </div>
                        <span className="text-2xl font-black">{item.value} <span className="text-xs font-bold opacity-60">Jiwa</span></span>
                      </div>
                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / totalResidents) * 100}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-blue-400' : 'bg-pink-400'}`}
                        />
                      </div>
                      <p className="text-[10px] font-black text-white/40 text-right uppercase tracking-widest">
                        {Math.round((item.value / totalResidents) * 100)}% dari total populasi
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 p-5 bg-white/10 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Info size={16} />
                    </div>
                    <p className="text-[10px] font-bold leading-relaxed">
                      Rasio gender yang seimbang menunjukkan keberagaman sosial yang sehat di lingkungan RT 02.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Occupation Bar Chart */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Sebaran Pekerjaan</h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Profil Profesional Warga</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Top 6 Kategori</div>
                  </div>
                </div>
                
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupationData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} 
                        width={120}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} barSize={32}>
                        {occupationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Education Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Tingkat Pendidikan</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Kualifikasi Akademik</p>
                
                <div className="space-y-5">
                  {educationData.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <GraduationCap size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">{item.name}</span>
                          <span className="text-xs font-black text-indigo-600">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${(item.value / totalResidents) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl transition-colors flex items-center justify-center gap-2">
                  Lihat Detail Pendidikan <ChevronRight size={14} />
                </button>
              </motion.div>

              {/* Religion Distribution */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">Keberagaman Agama</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Harmoni dalam Perbedaan</p>
                
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={religionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {religionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {religionData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-bold text-slate-500">{item.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Vulnerable Groups - Bento Style */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {[
                  { label: 'Ibu Hamil', value: totalPregnant, icon: Heart, color: 'rose' },
                  { label: 'Bayi', value: totalBabies, icon: Baby, color: 'sky' },
                  { label: 'Balita', value: totalToddlers, icon: Sparkles, color: 'emerald' },
                  { label: 'Remaja', value: totalTeenagers, icon: Users, color: 'indigo' },
                  { label: 'Dewasa', value: totalAdults, icon: UserCheck, color: 'emerald' },
                  { label: 'Lansia', value: totalElderly, icon: User, color: 'amber' },
                  { label: 'Janda', value: totalWidows, icon: Heart, color: 'pink' }
                ].map((item) => (
                  <div key={item.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:bg-slate-50 transition-all">
                    <div className="p-4 bg-slate-50 text-slate-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <item.icon size={20} />
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-1">{item.value}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Quick Insights Footer */}
            <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-2xl font-black tracking-tight">Ringkasan Wawasan Demografi</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Berdasarkan data terbaru, RT 02 memiliki populasi yang didominasi oleh kelompok usia produktif (Dewasa) sebesar {Math.round((ageGroups.dewasa / totalResidents) * 100)}%. 
                    Tingkat partisipasi ekonomi cukup tinggi dengan mayoritas warga bekerja sebagai {occupationData[0]?.name || 'Karyawan'}. 
                    Kebutuhan akan fasilitas ramah anak dan lansia tetap menjadi prioritas mengingat terdapat {ageGroups.balita + ageGroups.anak} anak-anak dan {ageGroups.lansia} lansia.
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <button className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-xl shadow-white/5 flex items-center gap-3">
                    Cetak Laporan Lengkap <FileText size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            key="advanced"
            className="space-y-10"
          >
            {/* Data Quality Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all"
              >
                <div className="p-5 bg-amber-50 text-amber-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Data Warga Tidak Lengkap</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{missingPhoneCount} rumah belum memiliki nomor telepon yang valid.</p>
                  <button className="mt-3 text-xs font-black text-amber-600 uppercase tracking-widest hover:underline">Perbaiki Sekarang</button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all"
              >
                <div className="p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] group-hover:scale-110 transition-transform">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Data Belum Verifikasi</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{unverifiedHousesCount} rumah memerlukan verifikasi data fisik.</p>
                  <button className="mt-3 text-xs font-black text-rose-600 uppercase tracking-widest hover:underline">Verifikasi Massal</button>
                </div>
              </motion.div>
            </div>

            {/* Trends Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                      <TrendingUp className="text-indigo-600" /> Tren Keuangan Bulanan
                    </h3>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Perbandingan Pemasukan & Pengeluaran</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase">Expense</span>
                    </div>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  {cashFlowChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowChartData}>
                        <defs>
                          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} tickFormatter={(v) => `Rp${v/1000000}jt`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                        />
                        <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                        <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm italic">
                      Belum ada data transaksi untuk ditampilkan.
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="p-4 bg-white/10 rounded-2xl w-fit mb-6">
                    <Activity size={24} className="text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight mb-4">Efisiensi Operasional</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-8">
                    Sistem mendeteksi peningkatan efisiensi sebesar 15% dalam pengelolaan administrasi surat-menyurat bulan ini.
                  </p>
                  
                  <div className="space-y-6">
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-300">Respon Laporan</span>
                        <span className="text-xs font-black text-emerald-400">Cepat</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[85%]"></div>
                      </div>
                    </div>
                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-slate-300">Koleksi Iuran</span>
                        <span className="text-xs font-black text-amber-400">72%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[72%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button className="relative z-10 mt-10 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3">
                  Optimalkan Sistem <ChevronRight size={18} />
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
