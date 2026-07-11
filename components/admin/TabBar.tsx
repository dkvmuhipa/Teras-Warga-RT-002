import React from 'react';
import { User, DollarSign, Clock } from 'lucide-react';

interface TabBarProps {
  activeTab: 'profile' | 'finance' | 'history';
  setActiveTab: (tab: 'profile' | 'finance' | 'history') => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'finance' as const, label: 'Keuangan', icon: DollarSign },
    { id: 'history' as const, label: 'Riwayat', icon: Clock },
  ];

  return (
    <div className="flex p-2 bg-slate-50 border-b border-slate-100 shrink-0">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === tab.id
              ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <tab.icon size={14} /> {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabBar;
