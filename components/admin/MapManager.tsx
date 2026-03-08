import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Save, Move, Info, Shield, Home } from 'lucide-react';
import { MapPoint, House } from '../../types';
import { addMapPointToDb, updateMapPointInDb, deleteMapPointFromDb } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MapManagerProps {
  mapPoints: MapPoint[];
  houses: House[];
}

export const MapManager: React.FC<MapManagerProps> = ({ mapPoints, houses }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MapPoint>>({
    label: '',
    type: 'Gate',
    x: 50,
    y: 50,
    icon: 'MapPin'
  });

  const handleSave = async () => {
    if (!formData.label) return;
    
    if (editingId) {
      await updateMapPointInDb(editingId, formData);
      setEditingId(null);
    } else {
      await addMapPointToDb(formData as MapPoint);
      setIsAdding(false);
    }
    setFormData({ label: '', type: 'Gate', x: 50, y: 50, icon: 'MapPin' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus titik informasi ini?')) {
      await deleteMapPointFromDb(id);
    }
  };

  const handleEdit = (point: MapPoint) => {
    setEditingId(point.id);
    setFormData(point);
    setIsAdding(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Gate': return <Move size={16} />;
      case 'Security': return <Shield size={16} />;
      case 'Block': return <Home size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Manajemen Denah Digital</h2>
          <p className="text-sm text-slate-500">Atur titik informasi penting seperti Gerbang, Pos Satpam, dan Blok.</p>
        </div>
        <Button onClick={() => { setIsAdding(true); setEditingId(null); }} className="gap-2">
          <Plus size={18} /> Tambah Titik
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Points */}
        <div className="lg:col-span-1 space-y-4">
          {mapPoints.map((point) => (
            <Card key={point.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    point.type === 'Gate' ? 'bg-amber-100 text-amber-600' :
                    point.type === 'Security' ? 'bg-blue-100 text-blue-600' :
                    point.type === 'Block' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {getIcon(point.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{point.label}</h4>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{point.type}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(point)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <MapPin size={16} />
                  </button>
                  <button onClick={() => handleDelete(point.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>X: {point.x}%</span>
                <span>Y: {point.y}%</span>
              </div>
            </Card>
          ))}
          {mapPoints.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">Belum ada titik informasi.</p>
            </div>
          )}
        </div>

        {/* Editor / Preview */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden border-2 border-slate-200 shadow-xl">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={18} className="text-indigo-600" />
                {isAdding ? (editingId ? 'Edit Titik Informasi' : 'Tambah Titik Baru') : 'Preview Denah Digital'}
              </h3>
              {isAdding && (
                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">
                  Mode Penempatan Aktif
                </div>
              )}
            </div>

            <div className="relative">
              {/* The Map Area */}
              <div 
                className={`relative aspect-[16/9] min-h-[300px] bg-slate-200 overflow-hidden border-b border-slate-200 ${isAdding ? 'cursor-crosshair' : ''}`}
                onClick={(e) => {
                  if (!isAdding) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                  setFormData({ ...formData, x, y });
                }}
              >
                {/* Visual Map Context */}
                <div className="absolute inset-0 bg-slate-100 opacity-60 pointer-events-none select-none p-6">
                  <div className="grid grid-cols-4 gap-6 h-full">
                    {/* Block C5 */}
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-2xl font-black text-slate-400">C5</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-3 w-3/4">
                          {[...Array(6)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                    </div>
                    {/* Block C7 & C8 */}
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C7</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C8</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                    </div>
                    {/* Block C9 & C10 */}
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C9</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C10</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                    </div>
                    {/* Block C11 & C12 */}
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C11</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                      <div className="flex-1 bg-white rounded-2xl border-2 border-slate-300 flex flex-col items-center justify-center shadow-sm">
                        <span className="text-xl font-black text-slate-400">C12</span>
                        <div className="grid grid-cols-2 gap-1.5 mt-2 w-3/4">
                          {[...Array(4)].map((_, i) => <div key={i} className="h-2.5 bg-slate-200 rounded-full"></div>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid Lines for better positioning */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '5% 5%' }}></div>

                {/* All Points Preview */}
                {mapPoints.map(p => (
                  <div 
                    key={p.id}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300 ${editingId === p.id ? 'z-30 scale-110' : 'z-10 opacity-60'}`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <div className={`p-1.5 rounded-full shadow-md ${
                      p.type === 'Gate' ? 'bg-amber-500' :
                      p.type === 'Security' ? 'bg-blue-500' :
                      p.type === 'Block' ? 'bg-emerald-500' :
                      'bg-slate-500'
                    } text-white border-2 border-white`}>
                      {getIcon(p.type)}
                    </div>
                    <span className="mt-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-black text-slate-800 shadow-sm border border-slate-200 uppercase tracking-tighter">
                      {p.label}
                    </span>
                  </div>
                ))}

                {/* New Point Marker (When Adding/Editing) */}
                {isAdding && !mapPoints.find(p => p.id === editingId) && (
                  <div 
                    className="absolute z-40 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce"
                    style={{ left: `${formData.x}%`, top: `${formData.y}%` }}
                  >
                    <div className="bg-rose-600 text-white p-2 rounded-full shadow-xl ring-4 ring-rose-100 border-2 border-white">
                      <MapPin size={20} />
                    </div>
                    <span className="mt-1 bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-lg">
                      {formData.label || 'Titik Baru'}
                    </span>
                  </div>
                )}

                {/* Interaction Overlay */}
                {!isAdding && (
                  <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center group">
                    <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">Klik "Tambah Titik" untuk mengatur</p>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Area (Appears when adding/editing) */}
              {isAdding && (
                <div className="p-6 bg-white space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Label / Nama Titik</label>
                        <input 
                          type="text" 
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          placeholder="Contoh: Gerbang Utama"
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kategori Lokasi</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Gate', 'Security', 'Block', 'Other'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, type: type as any })}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                formData.type === type 
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' 
                                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <div className={`p-1 rounded-lg ${
                                type === 'Gate' ? 'bg-amber-100 text-amber-600' :
                                type === 'Security' ? 'bg-blue-100 text-blue-600' :
                                type === 'Block' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {getIcon(type)}
                              </div>
                              {type === 'Gate' ? 'Gerbang' : type === 'Security' ? 'Pos Satpam' : type === 'Block' ? 'Blok' : 'Lainnya'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-2 mb-2">
                          <Info size={14} /> Petunjuk Penempatan
                        </h4>
                        <p className="text-[11px] text-indigo-600 leading-relaxed">
                          Klik pada area denah di atas untuk menentukan posisi titik. Gunakan blok rumah sebagai acuan lokasi.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="bg-white p-2 rounded-lg border border-indigo-200 text-center">
                            <p className="text-[9px] text-slate-400 uppercase font-black">Posisi X</p>
                            <p className="text-sm font-black text-indigo-600">{formData.x}%</p>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-indigo-200 text-center">
                            <p className="text-[9px] text-slate-400 uppercase font-black">Posisi Y</p>
                            <p className="text-sm font-black text-indigo-600">{formData.y}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setIsAdding(false)} className="flex-1 h-12 rounded-xl">Batal</Button>
                    <Button onClick={handleSave} className="flex-1 h-12 rounded-xl gap-2 shadow-lg shadow-indigo-200">
                      <Save size={18} /> Simpan Perubahan
                    </Button>
                  </div>
                </div>
              )}

              {!isAdding && (
                <div className="p-8 text-center bg-white">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                      <Move size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800">Visualisasi Denah Aktif</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tampilan di atas adalah representasi digital wilayah RT 002. Anda dapat menambahkan titik informasi baru untuk membantu warga mengenali fasilitas umum.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
