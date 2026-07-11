import React from 'react';
import { Home, Users, Settings, BarChart2 } from 'lucide-react';
import classNames from 'classnames';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarNavigationProps {
  viewMode: string;
  setViewMode: (mode: string) => void;
}

const items: NavItem[] = [
  { id: 'resident', label: 'Data Warga', icon: <Users size={20} /> },
  { id: 'analytics', label: 'Analitik', icon: <BarChart2 size={20} /> },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
];

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ viewMode, setViewMode }) => {
  return (
    <nav className="sidebar-navigation bg-bg-primary p-4 h-full">
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={classNames(
              'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors duration-200',
              {
                'bg-accent text-white': viewMode === item.id,
                'text-gray-700 hover:bg-gray-100': viewMode !== item.id,
              }
            )}
            onClick={() => setViewMode(item.id)}
            aria-label={item.label}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
};
