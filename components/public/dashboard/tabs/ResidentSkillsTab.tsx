import React from 'react';
import { motion } from 'motion/react';
import { 
  Wrench, 
  Plus, 
  Phone 
} from 'lucide-react';
import { House } from '../../../../types';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';

interface ResidentSkillsTabProps {
  communitySkills: any[];
  currentHouse: House | undefined;
  onOpenAddSkillModal: () => void;
}

export const ResidentSkillsTab: React.FC<ResidentSkillsTabProps> = ({
  communitySkills,
  currentHouse,
  onOpenAddSkillModal,
}) => {
  return (
    <motion.div 
      key="skills"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 text-left"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Wrench size={18} />
            </span>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Direktori Jasa &amp; Keahlian Warga RT 02</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">Temukan tukang, teknisi, guru les, atau katering dari tetangga sendiri di lingkungan kita.</p>
        </div>
        <Button 
          onClick={onOpenAddSkillModal}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 cursor-pointer"
        >
          <Plus size={16} className="mr-1.5" /> Promosikan Jasa / Keahlian
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {communitySkills.length > 0 ? (
          communitySkills.map((item) => (
            <Card key={item.id} className="p-6 bg-white border-slate-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-wider border border-indigo-100">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Rumah: Blok {item.houseId}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{item.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penyedia Jasa</p>
                  <p className="text-xs font-bold text-slate-800">{item.providerName}</p>
                  {item.rateInfo && (
                    <p className="text-[11px] font-semibold text-emerald-600 mt-1">💰 {item.rateInfo}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    const waPhone = (item.phone || '6285961194621').replace(/\D/g, '').replace(/^0/, '62');
                    const msg = `Halo Bpk/Ibu ${item.providerName} (Blok ${item.houseId}), saya tetangga di RT 02 ingin menanyakan tentang jasa "${item.title}". Apakah sedang tersedia?`;
                    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                >
                  <Phone size={14} /> Hubungi via WhatsApp
                </button>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-3 shadow-xs">
              <Wrench size={32} />
            </div>
            <h4 className="font-black text-slate-700 text-sm mb-1">Belum Ada Daftar Jasa Warga</h4>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-4">Jadilah yang pertama mempromosikan keahlian pertukangan, servis, atau katering Anda!</p>
            <Button 
              onClick={onOpenAddSkillModal}
              className="bg-indigo-600 text-white"
            >
              <Plus size={14} className="mr-1.5" /> Tambah Jasa Saya
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
