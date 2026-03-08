import React, { useState, useEffect } from 'react';
import { Checkpoint } from '../../types';
import { subscribeToCheckpoints, addCheckpointToDb, updateCheckpointInDb, deleteCheckpointFromDb } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Plus, Trash2, Edit2, Save, X, MapPin } from 'lucide-react';
import { Modal } from '../ui/Modal';
import toast from 'react-hot-toast';

export const CheckpointManager: React.FC = () => {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCheckpoint, setEditingCheckpoint] = useState<Checkpoint | null>(null);
    
    // Form State
    const [name, setName] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [x, setX] = useState<number>(0);
    const [y, setY] = useState<number>(0);

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
        if (window.confirm("Apakah Anda yakin ingin menghapus checkpoint ini?")) {
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
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Daftar Titik Patroli</h3>
                    <p className="text-sm text-slate-500">Kelola lokasi checkpoint untuk patroli keamanan.</p>
                </div>
                <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                    <Plus size={18} className="mr-2" /> Tambah Titik
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checkpoints.map((cp) => (
                    <div key={cp.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <MapPin size={20} />
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(cp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(cp.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{cp.name}</h4>
                        <p className="text-xs text-slate-500 font-mono bg-slate-50 p-1.5 rounded-lg inline-block border border-slate-100">
                            {cp.qrCode}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                            <span>Posisi X: {cp.x}%</span>
                            <span>Posisi Y: {cp.y}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCheckpoint ? "Edit Checkpoint" : "Tambah Checkpoint Baru"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Nama Lokasi</label>
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            placeholder="Contoh: Gerbang Utama"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Kode QR (Unik)</label>
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
                            placeholder="Contoh: GERBANG_UTAMA"
                            value={qrCode}
                            onChange={e => setQrCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">* Gunakan huruf kapital dan underscore (_), tanpa spasi.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Posisi X (%)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={x}
                                onChange={e => setX(Number(e.target.value))}
                                min="0" max="100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Posisi Y (%)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={y}
                                onChange={e => setY(Number(e.target.value))}
                                min="0" max="100"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Batal</Button>
                        <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
