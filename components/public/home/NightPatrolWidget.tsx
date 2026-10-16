import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Moon, ShieldCheck, Clock, Calendar, ChevronRight } from 'lucide-react';
import { RondaSchedule, PatrolSession } from '../../../types';
import { Button } from '../../ui/Button';

interface NightPatrolWidgetProps {
  ronda: RondaSchedule[];
  activePatrol: PatrolSession | null;
}

export const NightPatrolWidget: React.FC<NightPatrolWidgetProps> = ({ ronda, activePatrol }) => {
  const navigate = useNavigate();

  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayRonda = ronda.find((r) => r.day === today);

  return (
    <div className="bg-slate-950 text-white p-7 md:p-8 rounded-[2.5rem] shadow-xl shadow-slate-950/20 relative overflow-hidden group border border-white/10">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12 pointer-events-none">
        <Moon size={140} />
      </div>
      
      <div className="relative z-10 space-y-6">
        {activePatrol && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Patrol</span>
              </div>
              <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="font-black text-white text-sm leading-tight">{activePatrol.officerName}</p>
                <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-widest mt-0.5">Petugas Aktif</p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="pb-5 border-b border-white/10 flex justify-between items-end">
          <div>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-1">Jadwal Siskamling</p>
            <p className="text-3xl font-black text-white leading-none tracking-tight">{today}</p>
            <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-1.5">
              <Calendar size={13} className="text-indigo-400" /> {fullDate}
            </p>
          </div>
          <div className="bg-indigo-600/20 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-indigo-500/30">
            <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300">Shift Malam</span>
          </div>
        </div>

        <div className="space-y-3">
          {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
            todayRonda.shifts ? (
              todayRonda.shifts.map((shift, i) => (
                <div key={shift.id} className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={11} strokeWidth={2.5} /> {shift.time}
                    </p>
                    <span className="text-[8px] font-black bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 uppercase">Shift {i+1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {shift.members.map((member, j) => (
                      <span key={j} className="text-[10px] font-bold text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              todayRonda.members.map((member, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xs border border-indigo-500/30">
                    {i + 1}
                  </div>
                  <span className="font-bold text-sm tracking-tight text-white/90">{member}</span>
                </div>
              ))
            )
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-bold uppercase tracking-wider">
              Jadwal belum diatur
            </div>
          )}
        </div>

        <Button 
          onClick={() => navigate('/info')} 
          variant="secondary"
          className="w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2"
        >
          Selengkapnya <ChevronRight size={14} strokeWidth={3}/>
        </Button>
      </div>
    </div>
  );
};
