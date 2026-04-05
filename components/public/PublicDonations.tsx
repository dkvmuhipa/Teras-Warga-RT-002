import React, { useState, useEffect } from 'react';
import { DonationCampaign, DonationRecord, House } from '../../types';
import { addDonationRecord, subscribeToDonationRecords } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { Heart, Users, Calendar, ArrowRight, Wallet, History, Info, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PublicDonationsProps {
  campaigns: DonationCampaign[];
  houses: House[];
}

export default function PublicDonations({ campaigns, houses }: PublicDonationsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<DonationCampaign | null>(null);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [donationRecords, setDonationRecords] = useState<DonationRecord[]>([]);
  
  // Form State
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const residentHouseId = localStorage.getItem('resident_house_id') || '';
  const residentName = localStorage.getItem('resident_name') || 'Warga';

  useEffect(() => {
    if (selectedCampaign && isHistoryModalOpen) {
      const unsub = subscribeToDonationRecords(selectedCampaign.id, (data) => {
        setDonationRecords(data);
      });
      return () => unsub();
    }
  }, [selectedCampaign, isHistoryModalOpen]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;
    if (amount <= 0) {
      toast.error("Jumlah donasi harus lebih dari 0");
      return;
    }

    try {
      await addDonationRecord({
        campaignId: selectedCampaign.id,
        donorName: residentName,
        houseId: residentHouseId,
        amount,
        note,
        isAnonymous
      });
      toast.success("Terima kasih atas donasi Anda! Semoga berkah.");
      setIsDonationModalOpen(false);
      setAmount(0);
      setNote('');
    } catch (error) {
      toast.error("Gagal mengirim donasi");
    }
  };

  const activeCampaigns = campaigns.filter(c => c.status === 'Aktif');
  const completedCampaigns = campaigns.filter(c => c.status === 'Selesai');

  const getCampaignIcon = (type: DonationCampaign['type']) => {
    switch (type) {
      case 'Kematian': return <Heart className="text-rose-500" />;
      case 'Musibah': return <AlertCircle className="text-amber-500" />;
      case 'Sosial': return <Users className="text-indigo-500" />;
      case 'Pembangunan': return <Clock className="text-emerald-500" />;
      default: return <Heart className="text-rose-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
          <Heart className="text-rose-500" size={32} />
          Donasi Sosial & Kas Kematian
        </h2>
        <p className="text-slate-500 font-medium">Wadah gotong royong warga RT 02 untuk membantu sesama</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-600 rounded-full"></div>
          Donasi Aktif
        </h3>

        {activeCampaigns.length === 0 ? (
          <Card className="p-12 text-center bg-slate-50 border-dashed border-2">
            <p className="text-slate-400 font-bold">Saat ini tidak ada penggalangan dana aktif.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeCampaigns.map((campaign) => (
              <Card key={campaign.id} className="overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                      {getCampaignIcon(campaign.type)}
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full uppercase tracking-widest">
                      {campaign.type}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-2">{campaign.title}</h4>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-2">{campaign.description}</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-400 uppercase tracking-widest">Terkumpul</span>
                        <span className="text-indigo-600">
                          {campaign.targetAmount 
                            ? `${Math.round((campaign.currentAmount / campaign.targetAmount) * 100)}%`
                            : 'Tanpa Target'}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 transition-all duration-1000"
                          style={{ width: `${campaign.targetAmount ? Math.min(100, (campaign.currentAmount / campaign.targetAmount) * 100) : 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Donasi</p>
                        <p className="text-lg font-black text-slate-800">Rp {campaign.currentAmount.toLocaleString()}</p>
                      </div>
                      {campaign.targetAmount && (
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</p>
                          <p className="text-sm font-bold text-slate-600 text-slate-400">Rp {campaign.targetAmount.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <Button 
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setIsHistoryModalOpen(true);
                    }}
                    variant="outline" 
                    className="flex-1 text-xs font-bold"
                  >
                    <History size={14} className="mr-2" /> Riwayat
                  </Button>
                  <Button 
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setIsDonationModalOpen(true);
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-200"
                  >
                    <Wallet size={14} className="mr-2" /> Donasi
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {completedCampaigns.length > 0 && (
          <>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 pt-8">
              <div className="w-2 h-6 bg-slate-400 rounded-full"></div>
              Donasi Selesai
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedCampaigns.map((campaign) => (
                <Card key={campaign.id} className="p-6 opacity-75 grayscale hover:grayscale-0 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-800">{campaign.title}</h4>
                    <CheckCircle2 className="text-emerald-500" size={20} />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Terkumpul</p>
                      <p className="text-lg font-black text-slate-800">Rp {campaign.currentAmount.toLocaleString()}</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsHistoryModalOpen(true);
                      }}
                      variant="ghost" 
                      className="text-xs font-bold text-indigo-600"
                    >
                      Lihat Laporan <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Donation Modal */}
      <Modal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
        title={`Donasi: ${selectedCampaign?.title}`}
      >
        <form onSubmit={handleDonate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Jumlah Donasi (Rp)</label>
            <input 
              type="number"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Pesan / Doa (Opsional)</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[80px]"
              placeholder="Tuliskan doa atau pesan singkat..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <input 
              type="checkbox" 
              id="anonymous"
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
            />
            <label htmlFor="anonymous" className="text-xs font-bold text-slate-600 cursor-pointer">Donasi sebagai Hamba Allah (Anonim)</label>
          </div>
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex gap-3">
            <Info className="text-indigo-600 shrink-0" size={18} />
            <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
              Silakan hubungi Pengurus RT (085961194621) untuk menyalurkan donasi Anda secara tunai atau koordinasi lebih lanjut. Klik tombol di bawah untuk mencatat niat donasi Anda.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDonationModalOpen(false)} className="flex-1">Batal</Button>
            <Button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white">Konfirmasi Donasi</Button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal 
        isOpen={isHistoryModalOpen} 
        onClose={() => setIsHistoryModalOpen(false)} 
        title={`Riwayat Donasi: ${selectedCampaign?.title}`}
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
          {donationRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 font-bold">Belum ada riwayat donasi.</p>
            </div>
          ) : (
            donationRecords.map((record) => (
              <div key={record.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm">
                    {record.isAnonymous ? '?' : record.donorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {record.isAnonymous ? 'Hamba Allah' : record.donorName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {format(new Date(record.date), 'd MMM yyyy, HH:mm', { locale: id })}
                    </p>
                    {record.note && <p className="text-xs italic text-slate-500 mt-1">"{record.note}"</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">Rp {record.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Rumah {record.houseId}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
