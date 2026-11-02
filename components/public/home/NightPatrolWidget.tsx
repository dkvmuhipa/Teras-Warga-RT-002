import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, ShieldCheck, Clock, Calendar, ChevronRight } from 'lucide-react';
import { RondaSchedule, PatrolSession } from '../../../types';

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
    <div className="bg-slate-900 text-white p-5 sm:p-6 md:p-7 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
      <div className="relative z-10 space-y-5">
        {activePatrol && (
          <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white inline-block shrink-0"></span>
                <span className="text-xs font-medium text-emerald-400">Patroli Berlangsung</span>
              </div>
              <span className="text-[11px] font-mono font-medium text-slate-300 bg-slate-700 px-2 py-0.5 rounded border border-slate-600">
                {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WITA
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-emerald-400 border border-slate-600 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-semibold text-white text-xs leading-tight">{activePatrol.officerName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Petugas Pos Ronda</p>
              </div>
            </div>
          </div>
        )}

        <div className="pb-4 border-b border-slate-800 flex justify-between items-end">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-0.5">Jadwal Siskamling</p>
            <p className="text-2xl font-semibold text-white leading-tight tracking-tight">{today}</p>
            <p className="text-xs text-slate-400 font-normal flex items-center gap-1.5 mt-1">
              <Calendar size={13} className="text-slate-500" /> {fullDate}
            </p>
          </div>
          <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
            <span className="text-xs font-medium text-slate-300">Shift Malam</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
            todayRonda.shifts ? (
              todayRonda.shifts.map((shift, i) => (
                <div key={shift.id} className="space-y-2 p-3.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" /> {shift.time}
                    </p>
                    <span className="text-[10px] font-medium bg-slate-700 text-slate-300 px-2 py-0.5 rounded border border-slate-600">Shift {i+1}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {shift.members.map((member, j) => (
                      <span key={j} className="text-xs font-normal text-slate-200 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                        {member}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              todayRonda.members.map((member, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-slate-800 hover:bg-slate-800/80 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-mono font-semibold text-xs border border-slate-700 shrink-0">
                    {i + 1}
                  </div>
                  <span className="font-normal text-xs text-slate-200">{member}</span>
                </div>
              ))
            )
          ) : (
            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs font-normal">
              Jadwal belum diatur
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate('/info')} 
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-medium transition-colors border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Buka Jadwal Lengkap</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};
