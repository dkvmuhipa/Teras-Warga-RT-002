import React, { useState, useEffect, useRef } from 'react';
import { Checkpoint, House } from '../../types';
import { subscribeToCheckpoints, addCheckpointToDb, updateCheckpointInDb, deleteCheckpointFromDb } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Plus, Trash2, Edit2, Save, X, MapPin, Wand2, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { MapLayout } from '../HouseMap';

interface CheckpointManagerProps {
    houses: House[];
}

export const CheckpointManager: React.FC<CheckpointManagerProps> = ({ houses }) => {
    const confirm = useConfirm();
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
    
    // Form State
    const [name, setName] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [x, setX] = useState<number>(0);
    const [y, setY] = useState<number>(0);
    const mapRef = useRef<HTMLDivElement>(null);

    const handleMapClick = (e: React.MouseEvent) => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const newX = ((e.clientX - rect.left) / rect.width) * 100;
        const newY = ((e.clientY - rect.top) / rect.height) * 100;
        setX(Math.round(newX * 10) / 10);
        setY(Math.round(newY * 10) / 10);
    };

    useEffect(() => {
        const unsubscribe = subscribeToCheckpoints((data) => {
            setCheckpoints(data);
        });
        return () => unsubscribe();
    }, []);

    const handleEdit = (cp: Checkpoint) => {
        setEditingCheckpoint(cp);
        setName(cp.name || '');
        setQrCode(cp.qrCode || '');
        setX(cp.x ?? 0);
        setY(cp.y ?? 0);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingCheckpoint(null);
        setName('');
        setQrCode('');
        setX(0);
        setY(0);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !qrCode) {
            toast.error("Nama dan Kode QR wajib diisi!");
            return;
        }

        try {
            const data = { name, qrCode, x, y };
            
            if (editingCheckpoint) {
                await updateCheckpointInDb(editingCheckpoint.id, data);
                toast.success("Checkpoint berhasil diperbarui!");
            } else {
                await addCheckpointToDb(data);
                toast.success("Checkpoint berhasil ditambahkan!");
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Gagal menyimpan data.");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Hapus Checkpoint',
            message: 'Apakah Anda yakin ingin menghapus checkpoint ini?',
            confirmLabel: 'Hapus',
            isDanger: true
        });

        if (isConfirmed) {
            try {
                await deleteCheckpointFromDb(id);
                toast.success("Checkpoint dihapus.");
            } catch (error) {
                toast.error("Gagal menghapus data.");
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Cyber Header Banner */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                            POS & CHECKPOINT COMMAND
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">Manajemen Pos Ronda & Titik Patroli</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Konfigurasi lokasi pos checkpoint QR Code, koordinat titik siskamling, dan pemetaan posisi patroli</p>
                    </div>
                    
                    <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-950/50 py-3.5 px-6 rounded-2xl font-black uppercase tracking-wider text-xs">
                        <Plus size={18} className="mr-2" /> Tambah Pos Checkpoint
                    </Button>
                </div>
            </div>

            {/* Checkpoint Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {checkpoints.map((cp, idx) => (
                    <div key={cp.id} className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl hover:border-indigo-500/50 transition-all relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                                    P{idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-100 text-sm md:text-base tracking-tight">{cp.name}</h4>
                                    <p className="text-[9px] font-mono text-indigo-300 uppercase tracking-widest mt-0.5">CHECKPOINT TITIK {idx + 1}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                                <button onClick={() => handleEdit(cp)} className="p-2 text-slate-400 hover:text-indigo-300 hover:bg-indigo-950/60 rounded-lg transition-colors" title="Edit Pos">
                                    <Edit2 size={15} />
                                </button>
                                <button onClick={() => handleDelete(cp.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/60 rounded-lg transition-colors" title="Hapus Pos">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </div>

                        {/* QR Code Tag */}
                        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 mb-4 flex items-center justify-between">
                            <div>
                                <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest block mb-0.5">KODE UNIK CHECK-IN</span>
                                <span className="text-xs font-mono font-black text-emerald-400 tracking-wider">
                                    {cp.qrCode || 'BELUM DIATUR'}
                                </span>
                            </div>
                            <div className="p-2 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400">
                                <ShieldCheck size={16} />
                            </div>
                        </div>

                        {/* Position Info */}
                        <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                                <MapPin size={12} className="text-indigo-400" />
                                X: <strong className="text-slate-200">{cp.x || 0}%</strong>
                            </span>
                            <span>
                                Y: <strong className="text-slate-200">{cp.y || 0}%</strong>
                            </span>
                        </div>
                    </div>
                ))}

                {checkpoints.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-slate-900 rounded-[2.5rem] border border-slate-800 text-white">
                        <div className="w-16 h-16 bg-slate-800/60 rounded-3xl flex items-center justify-center text-slate-500 mx-auto mb-4 border border-slate-700/50">
                            <MapPin size={32} />
                        </div>
                        <h4 className="text-base font-bold text-slate-200">Belum Ada Pos Checkpoint</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">Klik Tambah Pos Checkpoint di atas untuk mendaftarkan titik siskamling baru.</p>
                    </div>
                )}
            </div>

            {/* Modal Dialog */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCheckpoint ? "Edit Pos Checkpoint" : "Tambah Pos Checkpoint Baru"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-mono font-black mb-2 text-slate-500 uppercase tracking-widest">Nama Pos / Lokasi Checkpoint</label>
                        <input 
                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Contoh: Pos Garda 01 (Gerbang Utama)"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-mono font-black mb-2 text-slate-500 uppercase tracking-widest">Kode QR Checkpoint (Unik)</label>
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-black text-indigo-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all uppercase"
                                placeholder="Contoh: POS_GARDA_01"
                                value={qrCode}
                                onChange={e => setQrCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => {
                                    if (!name) {
                                        toast.error("Isi nama lokasi terlebih dahulu");
                                        return;
                                    }
                                    const generated = name.toUpperCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
                                    setQrCode(generated);
                                }}
                                className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center justify-center shrink-0"
                                title="Generate Kode QR Otomatis"
                            >
                                <Wand2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono font-black mb-2 text-slate-500 uppercase tracking-widest">Posisi X (% Horizontal)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={x}
                                onChange={e => setX(Number(e.target.value))}
                                min="0" max="100" step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono font-black mb-2 text-slate-500 uppercase tracking-widest">Posisi Y (% Vertikal)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={y}
                                onChange={e => setY(Number(e.target.value))}
                                min="0" max="100" step="0.1"
                            />
                        </div>
                    </div>

                    {/* Visual Picker */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-mono font-black text-slate-500 uppercase tracking-widest">Klik di Peta untuk Menentukan Posisi Penanda</label>
                        <div 
                            ref={mapRef}
                            onClick={handleMapClick}
                            className="relative w-full bg-slate-900 rounded-3xl border-2 border-dashed border-slate-700 overflow-hidden cursor-crosshair group p-4 min-h-[160px]"
                        >
                            {/* Real Map Layout Preview */}
                            <div className="opacity-30 pointer-events-none scale-90 origin-top">
                                <MapLayout 
                                    houses={houses}
                                    renderBlock={(blockCode) => (
                                        <div className="bg-slate-700 rounded-lg p-2 text-center text-[8px] font-black text-white">
                                            {blockCode}
                                        </div>
                                    )}
                                />
                            </div>
                            
                            {/* Current Point Indicator */}
                            <div 
                                className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full shadow-xl border-2 border-white bg-indigo-600 text-white z-10 transition-all duration-300 animate-pulse"
                                style={{ left: `${x}%`, top: `${y}%` }}
                            >
                                <ShieldCheck size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black uppercase text-xs">Batal</Button>
                        <Button type="submit" className="flex-1 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs shadow-lg shadow-indigo-100">Simpan Pos Checkpoint</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
