import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Heart, Users, ArrowRight, Activity, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToActivities } from '../../services/databaseService';
import { Activity as ActivityType } from '../../types';

export const DigitalSummary = () => {
    const navigate = useNavigate();
    const [upcomingActivities, setUpcomingActivities] = useState<ActivityType[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToActivities((data: ActivityType[]) => {
            const upcoming = data
                .filter((a: ActivityType) => a.status !== 'Completed')
                .sort((a: ActivityType, b: ActivityType) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 2);
            setUpcomingActivities(upcoming);
        });
        return () => unsubscribe();
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
            {/* Upcoming Activities Card */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Agenda Mendatang</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Kegiatan Warga RT 02</h3>
                        </div>
                        <button 
                            onClick={() => navigate('/kegiatan')}
                            className="p-4 bg-slate-50 rounded-2xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                        >
                            <Calendar size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingActivities.length > 0 ? (
                            upcomingActivities.map((activity) => (
                                <div key={activity.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all group/item">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            activity.status === 'Ongoing' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                            {activity.status}
                                        </span>
                                        {activity.isMandatory && (
                                            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100">Wajib</span>
                                        )}
                                    </div>
                                    <h4 className="font-black text-slate-800 mb-3 group-hover/item:text-indigo-600 transition-colors">{activity.title}</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <Clock size={12} className="text-indigo-500" />
                                            {new Date(activity.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                            <MapPin size={12} className="text-indigo-500" />
                                            {activity.location}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="md:col-span-2 py-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                <Calendar size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada agenda terdekat</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Health & Posyandu Card */}
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden group cursor-pointer" onClick={() => navigate('/kesehatan')}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <Heart size={24} />
                        </div>
                        <h4 className="text-xl font-black tracking-tight mb-3">Posyandu Digital</h4>
                        <p className="text-sm font-medium text-emerald-50 text-emerald-100 leading-relaxed">
                            Pantau kesehatan keluarga Anda secara mandiri. Cek riwayat pemeriksaan bayi, balita, remaja, dewasa, ibu hamil, dan lansia langsung dari ponsel Anda.
                        </p>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Cek Rekam Medis</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
