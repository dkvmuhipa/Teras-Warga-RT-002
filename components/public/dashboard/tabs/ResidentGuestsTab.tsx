import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Info, 
  History 
} from 'lucide-react';
import { GuestReport } from '../../../../types';
import { Card } from '../../../ui/Card';

interface ResidentGuestsTabProps {
  guestReports: GuestReport[];
}

export const ResidentGuestsTab: React.FC<ResidentGuestsTabProps> = ({ guestReports }) => {
  return (
    <motion.div 
      key="guests"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-black text-slate-800">Log Kunjungan Tamu</h3>
        <p className="text-sm text-slate-500 font-medium">Daftar tamu yang melapor berkunjung ke rumah Anda melalui sistem Keamanan RT.</p>
      </div>

      <div className="space-y-4">
        {guestReports.length > 0 ? (
          guestReports.map((guest) => (
            <Card key={guest.id} className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${guest.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                  <Users size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800">{guest.guestName}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      guest.status === 'Active' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {guest.status === 'Active' ? 'Masih Berkunjung' : 'Sudah Pulang'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(guest.arrivalDate).toLocaleDateString('id-ID')}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {guest.stayDuration}</span>
                    <span className="flex items-center gap-1"><Info size={12} /> {guest.relationship}</span>
                  </div>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dilaporkan Pada</p>
                <p className="text-xs font-bold text-slate-700">{new Date(guest.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' })} WITA</p>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
              <History size={32} />
            </div>
            <h4 className="font-black text-slate-800 mb-1">Belum Ada Data Tamu</h4>
            <p className="text-xs text-slate-400 font-medium">Tidak ada riwayat tamu yang melapor berkunjung ke rumah Anda.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
