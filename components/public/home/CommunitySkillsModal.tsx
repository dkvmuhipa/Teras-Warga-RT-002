import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Phone } from 'lucide-react';
import { CommunitySkill } from '../../../types';
import { Modal } from '../../ui/Modal';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useTenant } from '../../../context/TenantContext';

interface CommunitySkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  skills: CommunitySkill[];
}

export const CommunitySkillsModal: React.FC<CommunitySkillsModalProps> = ({
  isOpen,
  onClose,
  skills
}) => {
  const navigate = useNavigate();
  const { currentTenant } = useTenant();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Direktori Jasa & Keahlian Warga ${currentTenant.name}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 p-2 text-left">
        <div className="p-4 bg-amber-500/10 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl">
              <Wrench size={22} />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm">Gotong Royong Ekonomi &amp; Jasa Antar-Warga</h4>
              <p className="text-xs text-slate-600 font-medium">
                Temukan teknisi, tukang, guru les, atau katering dari tetangga sendiri di lingkungan {currentTenant.name}.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => {
              onClose();
              navigate('/resident');
            }}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl shadow-md shrink-0 cursor-pointer"
          >
            + Pasang Jasa Saya
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {skills.length > 0 ? (
            skills.map((item) => (
              <Card key={item.id} className="p-5 bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[9px] font-black uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Rumah: Blok {item.houseId}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 text-base">{item.title}</h4>
                    <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-3 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Penyedia Jasa</p>
                      <p className="text-xs font-bold text-slate-800">{item.providerName}</p>
                    </div>
                    {item.rateInfo && (
                      <span className="text-[11px] font-black text-emerald-600">💰 {item.rateInfo}</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => {
                      const fallbackPhone = (currentTenant.chairmanPhone || '085961194621').replace(/\D/g, '').replace(/^0/, '62');
                      const waPhone = (item.phone || fallbackPhone).replace(/\D/g, '').replace(/^0/, '62');
                      const msg = `Halo Bpk/Ibu ${item.providerName} (Blok ${item.houseId}), saya tetangga di ${currentTenant.name} ingin menanyakan tentang jasa "${item.title}". Apakah sedang tersedia?`;
                      window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Phone size={14} /> Hubungi via WhatsApp
                  </button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Wrench size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Belum ada daftar jasa tetangga yang dipublikasikan.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Warga dapat mempromosikan keahlian mereka melalui Portal Mandiri Warga.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
