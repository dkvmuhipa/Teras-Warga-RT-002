import React from 'react';
import { Calendar, Plus, Trash2, Edit2 } from 'lucide-react';
import { AppEvent } from '../../types';

interface EventManagerProps {
  events: AppEvent[];
}

export const EventManager: React.FC<EventManagerProps> = ({ events }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Manajemen Acara</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all">
          <Plus size={18} /> Tambah Acara
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Calendar size={20} />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </div>
            <h3 className="font-bold text-lg text-slate-900">{event.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{event.description}</p>
            <p className="text-xs font-bold text-slate-400 mt-4">{new Date(event.date).toLocaleDateString('id-ID')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
