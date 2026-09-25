import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, title, icon: Icon, action }) => {
  return (
    <div 
      className={`bg-white rounded-3xl border border-slate-100 shadow-xs ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200/80 transition-all' : ''} ${className}`}
      onClick={onClick}
    >
      {(title || Icon || action) && (
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-50">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-[#f0f2fe] text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/60 shadow-xs">
                <Icon size={18} />
              </div>
            )}
            {title && <h3 className="font-extrabold text-slate-800 tracking-tight text-base">{title}</h3>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};
