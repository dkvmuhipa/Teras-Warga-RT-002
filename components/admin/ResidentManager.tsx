import React, { useState } from 'react';
import { 
  Search, Filter, Grid, List, UserPlus, Download, Upload, 
  Trash2, Edit2, MoreHorizontal, CheckCircle, XCircle, AlertCircle,
  Users, Home, X, Phone, Shield, Calendar, MapPin, Activity,
  ChevronRight, CreditCard, Mail, User
} from 'lucide-react';
import { House, Report, Official, PdfConfig, PaymentStatus } from '../../types';
import { HouseMap } from '../HouseMap';
import { generateResidentReportPDF } from '../../services/pdfService';
import { batchUpdateHouses, deleteHouseFromDb, updateHouseData, addHouse } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';

interface ResidentManagerProps {
  houses: House[];
  reports: Report[];
  officials: Official[];
  pdfConfig: PdfConfig;
}

export const ResidentManager: React.FC<ResidentManagerProps> = ({ 
  houses, reports, officials, pdfConfig 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedResident, setSelectedResident] = useState<House | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    headOfFamily: '',
    block: '',
    number: '',
    phone: '',
    status: 'Occupied',
    paymentStatus: PaymentStatus.UNPAID,
    occupants: 1,
    familyMembers: [] as { name: string; relation: 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain'; nik?: string; birthDate?: string }[]
  });

  const resetForm = () => {
    setFormData({
      headOfFamily: '',
      block: '',
      number: '',
      phone: '',
      status: 'Occupied',
      paymentStatus: PaymentStatus.UNPAID,
      occupants: 1,
      familyMembers: []
    });
    setEditingHouseId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (house: House) => {
    setEditingHouseId(house.id);
    setFormData({
      headOfFamily: house.headOfFamily,
      block: house.block,
      number: house.number,
      phone: house.phone || '',
      status: house.status,
      paymentStatus: house.paymentStatus,
      occupants: house.occupants || 1,
      familyMembers: house.familyMembers || []
    });
    setIsModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        location: { x: 0, y: 0 } // Default location, map editor handles this separately
      };

      if (editingHouseId) {
        await updateHouseData(editingHouseId, data);
        if (selectedResident?.id === editingHouseId) {
            setSelectedResident({ ...selectedResident, ...data } as House);
        }
      } else {
        await addHouse(data);
      }
      setIsModalOpen(false);
      resetForm();
      alert('Data warga berhasil disimpan!');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan data warga.');
    }
  };

  const handleUpdatePayment = async (house: House) => {
    const newStatus = house.paymentStatus === PaymentStatus.PAID ? PaymentStatus.UNPAID : PaymentStatus.PAID;
    if (confirm(`Ubah status pembayaran menjadi ${newStatus}?`)) {
      await updateHouseData(house.id, { paymentStatus: newStatus });
      if (selectedResident?.id === house.id) {
        setSelectedResident({ ...selectedResident, paymentStatus: newStatus });
      }
    }
  };

  // Filter Logic
  const filteredHouses = houses.filter(h => {
    const matchesSearch = h.headOfFamily.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          h.block.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || h.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalResidents = houses.reduce((acc, h) => acc + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredHouses.map(h => h.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      await deleteHouseFromDb(id);
      if (selectedResident?.id === id) {
        setIsDrawerOpen(false);
        setSelectedResident(null);
      }
    }
  };

  const openDetail = (house: House) => {
    setSelectedResident(house);
    setIsDrawerOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 relative"
    >
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Data Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola data kependudukan dan status hunian RT 002.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => generateResidentReportPDF(houses, pdfConfig)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 font-bold text-sm transition-all shadow-sm"
          >
            <Download size={18} /> Export PDF
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
          >
            <UserPlus size={18} /> Tambah Warga
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-blue-600/20 flex items-center gap-5 group hover:scale-[1.02] transition-transform relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="p-4 bg-white/20 text-white rounded-2xl backdrop-blur-sm border border-white/20">
            <Users size={24} />
          </div>
          <div className="relative z-10 text-white">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Warga</p>
            <h3 className="text-2xl font-black">{totalResidents} <span className="text-xs font-bold opacity-60">Jiwa</span></h3>
          </div>
        </motion.div>

        {[
          { icon: Home, label: 'Rumah Dihuni', value: occupiedHouses, unit: 'Unit', color: 'emerald' },
          { icon: Shield, label: 'Rumah Kosong', value: emptyHouses, unit: 'Unit', color: 'slate' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:shadow-xl hover:shadow-slate-200/50 transition-all"
          >
            <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900">{stat.value} <span className="text-xs font-bold text-slate-400">{stat.unit}</span></h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama, blok, atau nomor..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 border border-slate-200/50">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid size={20}/>
            </button>
            <button 
              onClick={() => setViewMode('table')} 
              className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={20}/>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <Filter size={18} className="text-slate-400 shrink-0" />
            <select 
              className="bg-transparent border-none text-sm font-bold text-slate-700 outline-none cursor-pointer pr-4"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">Semua Status</option>
              <option value="Occupied">Dihuni</option>
              <option value="Empty">Kosong</option>
              <option value="Business">Usaha</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Content View */}
      <motion.div variants={itemVariants}>
        {viewMode === 'grid' ? (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <HouseMap 
              houses={filteredHouses} 
              isAdmin={true} 
              reports={reports} 
              officials={officials}
              onEditHouse={(h) => openDetail(h)}
              onPayDues={(h) => handleUpdatePayment(h)} 
            />
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                    <th className="px-8 py-5 w-10">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                        checked={selectedIds.size === filteredHouses.length && filteredHouses.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-8 py-5">Warga / KK</th>
                    <th className="px-8 py-5">Blok & Nomor</th>
                    <th className="px-8 py-5">Status Hunian</th>
                    <th className="px-8 py-5">Status Iuran</th>
                    <th className="px-8 py-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredHouses.map((house) => (
                    <motion.tr 
                      key={house.id} 
                      layout
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => openDetail(house)}
                    >
                      <td className="px-8 py-5" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                          checked={selectedIds.has(house.id)}
                          onChange={() => handleSelectOne(house.id)}
                        />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100 group-hover:scale-110 transition-transform">
                            {house.headOfFamily.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors text-base">{house.headOfFamily}</p>
                            <p className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone size={10} /> {house.phone || '-'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="font-mono font-black text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl text-xs border border-slate-200">
                          {house.block}-{house.number}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          house.status === 'Occupied' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          house.status === 'Empty' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {house.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          house.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          {house.paymentStatus === PaymentStatus.PAID ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                          {house.paymentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleOpenEdit(house)}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(house.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Resident Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedResident && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Detail Warga</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Informasi Lengkap Keluarga</p>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-center mb-10 text-white relative overflow-hidden shadow-xl shadow-indigo-600/20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="w-28 h-28 mx-auto bg-white/20 backdrop-blur-md text-white rounded-[2rem] flex items-center justify-center text-4xl font-black mb-6 border-4 border-white/30 shadow-2xl">
                      {selectedResident.headOfFamily.charAt(0)}
                    </div>
                    <h2 className="text-3xl font-black mb-2">{selectedResident.headOfFamily}</h2>
                    <p className="text-indigo-100/80 font-bold uppercase tracking-widest text-[10px]">Kepala Keluarga</p>
                    
                    <div className="flex justify-center gap-3 mt-8">
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        Blok {selectedResident.block}-{selectedResident.number}
                      </div>
                      <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-black uppercase tracking-widest">
                        {selectedResident.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Sections */}
                <div className="grid grid-cols-1 gap-8">
                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Informasi Kontak</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                          <Phone size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Telepon / WA</p>
                          <p className="text-base font-bold text-slate-800">{selectedResident.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-5 bg-slate-50 border border-slate-100 rounded-3xl group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                        <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                          <MapPin size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alamat</p>
                          <p className="text-base font-bold text-slate-800">Blok {selectedResident.block} No. {selectedResident.number}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Status Keuangan</h4>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-2 h-full ${selectedResident.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-800">Iuran Bulanan</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode Februari 2026</p>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          selectedResident.paymentStatus === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {selectedResident.paymentStatus}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleUpdatePayment(selectedResident)}
                        className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        Update Status Pembayaran
                      </button>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-2">Anggota Keluarga</h4>
                    {selectedResident.familyMembers && selectedResident.familyMembers.length > 0 ? (
                      <div className="space-y-3">
                        {selectedResident.familyMembers.map((member, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                              <p className="font-bold text-slate-800">{member.name}</p>
                              <p className="text-xs text-slate-500">{member.relation} • {member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID') : '-'}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-slate-200">
                              {member.nik || 'No NIK'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 p-8 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4">
                          <Users size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">Belum ada data anggota keluarga</p>
                        <button onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }} className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Tambah Anggota</button>
                      </div>
                    )}
                  </section>
                </div>

                {/* Actions Footer */}
                <div className="mt-12 pt-8 border-t border-slate-100 flex gap-4">
                  <button 
                    onClick={() => { setIsDrawerOpen(false); handleOpenEdit(selectedResident); }}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Edit Data
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedResident.id)}
                    className="flex-1 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-sm hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                  >
                    Hapus Warga
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHouseId ? "Edit Data Warga" : "Tambah Warga Baru"}>
        <form onSubmit={handleSaveHouse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Kepala Keluarga</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.headOfFamily} onChange={e => setFormData({...formData, headOfFamily: e.target.value})} required placeholder="Nama Lengkap..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Blok</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.block} onChange={e => setFormData({...formData, block: e.target.value})} required placeholder="A" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Nomor</label>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required placeholder="12" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-slate-700">Telepon / WA</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Status Hunian</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                <option value="Occupied">Dihuni</option>
                <option value="Empty">Kosong</option>
                <option value="Business">Usaha</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700">Jumlah Penghuni</label>
              <input type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={formData.occupants} onChange={e => setFormData({...formData, occupants: parseInt(e.target.value)})} min={1} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Daftar Anggota Keluarga</label>
              <button 
                type="button"
                onClick={() => setFormData({
                  ...formData, 
                  familyMembers: [...formData.familyMembers, { name: '', relation: 'Anak', nik: '', birthDate: '' }]
                })}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <UserPlus size={14} /> Tambah
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.familyMembers.map((member, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative group">
                  <button 
                    type="button"
                    onClick={() => {
                      const newMembers = [...formData.familyMembers];
                      newMembers.splice(idx, 1);
                      setFormData({...formData, familyMembers: newMembers});
                    }}
                    className="absolute top-2 right-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={16} />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="Nama Lengkap" 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      value={member.name}
                      onChange={e => {
                        const newMembers = [...formData.familyMembers];
                        newMembers[idx].name = e.target.value;
                        setFormData({...formData, familyMembers: newMembers});
                      }}
                    />
                    <select 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      value={member.relation}
                      onChange={e => {
                        const newMembers = [...formData.familyMembers];
                        newMembers[idx].relation = e.target.value as any;
                        setFormData({...formData, familyMembers: newMembers});
                      }}
                    >
                      <option value="Istri">Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Orang Tua">Orang Tua</option>
                      <option value="Famili Lain">Famili Lain</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      placeholder="NIK (Opsional)" 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      value={member.nik || ''}
                      onChange={e => {
                        const newMembers = [...formData.familyMembers];
                        newMembers[idx].nik = e.target.value;
                        setFormData({...formData, familyMembers: newMembers});
                      }}
                    />
                    <input 
                      type="date"
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      value={member.birthDate || ''}
                      onChange={e => {
                        const newMembers = [...formData.familyMembers];
                        newMembers[idx].birthDate = e.target.value;
                        setFormData({...formData, familyMembers: newMembers});
                      }}
                    />
                  </div>
                </div>
              ))}
              {formData.familyMembers.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-2 italic">Belum ada anggota keluarga ditambahkan.</p>
              )}
            </div>
          </div>
          <Button type="submit" className="w-full py-3 mt-2">{editingHouseId ? 'Simpan Perubahan' : 'Tambah Warga'}</Button>
        </form>
      </Modal>
    </motion.div>
  );
};
