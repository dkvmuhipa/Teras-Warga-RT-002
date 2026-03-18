import React, { useState } from 'react';
import { MapPoint, House } from '../../types';
import { addMapPointToDb, updateMapPointInDb, deleteMapPointFromDb } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Plus, Trash2, Edit2, MapPin, Shield, Move, Lightbulb, Video, Droplets, Trash } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { MapLayout } from '../HouseMap';

interface MapPointManagerProps {
    mapPoints: MapPoint[];
    houses: House[];
}

export const MapPointManager: React.FC<MapPointManagerProps> = ({ mapPoints, houses }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPoint, setEditingPoint] = useState<MapPoint | null>(null);
    
    // Form State
    const [label, setLabel] = useState('');
    const [type, setType] = useState<MapPoint['type']>('Other');
    const [x, setX] = useState<number>(50);
    const [y, setY] = useState<number>(50);
    const mapRef = React.useRef<HTMLDivElement>(null);

    const handleMapClick = (e: React.MouseEvent) => {
        if (!mapRef.current) return;
        const rect = mapRef.current.getBoundingClientRect();
        const newX = ((e.clientX - rect.left) / rect.width) * 100;
        const newY = ((e.clientY - rect.top) / rect.height) * 100;
        setX(Math.round(newX * 10) / 10);
        setY(Math.round(newY * 10) / 10);
    };

    const handleEdit = (point: MapPoint) => {
        setEditingPoint(point);
        setLabel(point.label);
        setType(point.type);
        setX(point.x);
        setY(point.y);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPoint(null);
        setLabel('');
        setType('Other');
        setX(50);
        setY(50);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!label) {
            toast.error("Label wajib diisi!");
            return;
        }

        try {
            const data = { label, type, x, y };
            
            if (editingPoint) {
                await updateMapPointInDb(editingPoint.id, data);
                toast.success("Titik informasi diperbarui!");
            } else {
                await addMapPointToDb(data);
                toast.success("Titik informasi ditambahkan!");
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error("Gagal menyimpan data.");
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Hapus titik informasi ini?")) {
            try {
                await deleteMapPointFromDb(id);
                toast.success("Titik informasi dihapus.");
            } catch (error) {
                console.error(error);
                toast.error("Gagal menghapus data.");
            }
        }
    };

    const getIcon = (type: MapPoint['type']) => {
        switch (type) {
            case 'Gate': return <Move size={20} />;
            case 'Security': return <Shield size={20} />;
            case 'PJU': return <Lightbulb size={20} />;
            case 'CCTV': return <Video size={20} />;
            case 'Hydrant': return <Droplets size={20} />;
            case 'Trash': return <Trash size={20} />;
            default: return <MapPin size={20} />;
        }
    };

    const getColor = (type: MapPoint['type']) => {
        switch (type) {
            case 'Gate': return 'bg-amber-500';
            case 'Security': return 'bg-blue-500';
            case 'Block': return 'bg-emerald-500';
            case 'PJU': return 'bg-yellow-500';
            case 'CCTV': return 'bg-indigo-500';
            case 'Hydrant': return 'bg-rose-500';
            case 'Trash': return 'bg-orange-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Manajemen Titik Informasi</h3>
                    <p className="text-sm text-slate-500">Kelola penanda fasilitas umum di peta (PJU, CCTV, Gerbang, dsb).</p>
                </div>
                <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                    <Plus size={18} className="mr-2" /> Tambah Penanda
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mapPoints.map((point) => (
                    <div key={point.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-xl text-white ${getColor(point.type)}`}>
                                {getIcon(point.type)}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(point)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(point.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1">{point.label}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{point.type}</span>
                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                            <span>X: {Math.round(point.x)}%</span>
                            <span>Y: {Math.round(point.y)}%</span>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPoint ? "Edit Penanda" : "Tambah Penanda Baru"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Label Penanda</label>
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            placeholder="Contoh: PJU Blok C1"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Tipe Fasilitas</label>
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={type}
                            onChange={e => setType(e.target.value as any)}
                        >
                            <option value="PJU">PJU (Lampu Jalan)</option>
                            <option value="CCTV">CCTV</option>
                            <option value="Gate">Gerbang / Portal</option>
                            <option value="Security">Pos Keamanan</option>
                            <option value="Hydrant">Hydrant</option>
                            <option value="Trash">Tempat Sampah Umum</option>
                            <option value="Block">Papan Blok</option>
                            <option value="Other">Lainnya</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Posisi X (%)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={x}
                                onChange={e => setX(Number(e.target.value))}
                                min="0" max="100" step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Posisi Y (%)</label>
                            <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={y}
                                onChange={e => setY(Number(e.target.value))}
                                min="0" max="100" step="0.1"
                            />
                        </div>
                    </div>

                    {/* Visual Picker */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest">Klik di Peta untuk Menentukan Posisi</label>
                        <div 
                            ref={mapRef}
                            onClick={handleMapClick}
                            className="relative w-full bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden cursor-crosshair group p-4"
                        >
                            {/* Real Map Layout Preview */}
                            <div className="opacity-20 pointer-events-none scale-90 origin-top">
                                <MapLayout 
                                    houses={houses}
                                    renderBlock={(blockCode) => (
                                        <div className="bg-slate-400 rounded-lg p-2 text-center text-[8px] font-black text-white">
                                            {blockCode}
                                        </div>
                                    )}
                                />
                            </div>
                            
                            {/* Current Point Indicator */}
                            <div 
                                className={`absolute -translate-x-1/2 -translate-y-1/2 p-1 rounded-full shadow-lg border-2 border-white ${getColor(type)} text-white z-10 transition-all duration-300`}
                                style={{ left: `${x}%`, top: `${y}%` }}
                            >
                                {getIcon(type)}
                            </div>

                            {/* Hover Indicator */}
                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"></div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic">Tip: Klik pada area di atas untuk memindahkan penanda secara visual sesuai tata letak blok rumah.</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Batal</Button>
                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
