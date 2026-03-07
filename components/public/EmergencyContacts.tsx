import React from 'react';
import { Phone, AlertTriangle, ShieldAlert } from 'lucide-react';
import { EMERGENCY_CONTACTS } from '../../constants/emergencyContacts';

export const EmergencyContacts: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-[2.5rem] shadow-2xl shadow-rose-500/30 border border-rose-400 p-8 space-y-6 text-white h-full flex flex-col">
      <div className="flex items-center gap-4">
        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
          <ShieldAlert size={32} className="text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight">Kontak Darurat</h3>
          <p className="text-rose-100 font-bold uppercase tracking-wider text-xs">Layanan Penting Kota Palu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-grow">
        {EMERGENCY_CONTACTS.map((contact, index) => (
          <a
            key={index}
            href={`tel:${contact.phone}`}
            className="flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group gap-2"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-[11px] leading-tight">{contact.name}</p>
              <p className="text-[9px] font-mono text-rose-100 mt-0.5">{contact.phone}</p>
            </div>
            <div className="bg-white p-1.5 rounded-xl text-rose-600 shadow-sm shrink-0">
              <Phone size={14} />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
