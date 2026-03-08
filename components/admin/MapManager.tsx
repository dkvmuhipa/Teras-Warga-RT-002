import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Save, Move, Info, Shield, Home } from 'lucide-react';
import { MapPoint } from '../../types';
import { addMapPointToDb, updateMapPointInDb, deleteMapPointFromDb } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface MapManagerProps {
  mapPoints: MapPoint[];
}

export const MapManager: React.FC<MapManagerProps> = ({ mapPoints }) => {
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
          <Card className="p-6">
            {isAdding ? (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Edit Titik' : 'Tambah Titik Baru'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Label / Nama</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Contoh: Gerbang Utama"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tipe</label>
                    <select 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="Gate">Gerbang</option>
                      <option value="Security">Pos Satpam</option>
                      <option value="Block">Blok</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Icon (Lucide Name)</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="MapPin, Shield, etc."
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Posisi pada Denah (Klik pada area di bawah)</label>
                  <div 
                    className="relative aspect-[16/9] bg-slate-200 rounded-2xl overflow-hidden cursor-crosshair border-2 border-slate-300"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
                      setFormData({ ...formData, x, y });
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                      <p className="text-slate-800 font-black text-4xl uppercase tracking-widest">Preview Denah</p>
                    </div>
                    
                    {/* Current Point Preview */}
                    <div 
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                      style={{ left: `${formData.x}%`, top: `${formData.y}%` }}
                    >
                      <div className="bg-indigo-600 text-white p-2 rounded-full shadow-lg animate-bounce">
                        <MapPin size={20} />
                      </div>
                      <span className="mt-1 bg-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm border border-slate-200">
                        {formData.label || 'Titik Baru'}
                      </span>
                    </div>

                    {/* Other Points for Reference */}
                    {mapPoints.filter(p => p.id !== editingId).map(p => (
                      <div 
                        key={p.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 opacity-40"
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      >
                        <div className="bg-slate-400 text-white p-1 rounded-full">
                          <MapPin size={12} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs font-bold text-slate-500">
                    <span>X: {formData.x}%</span>
                    <span>Y: {formData.y}%</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setIsAdding(false)} className="flex-1">Batal</Button>
                  <Button onClick={handleSave} className="flex-1 gap-2">
                    <Save size={18} /> Simpan Titik
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-indigo-50 p-6 rounded-full text-indigo-600">
                  <MapPin size={48} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Editor Titik Denah</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Pilih titik di sebelah kiri untuk mengedit atau klik "Tambah Titik" untuk membuat baru.</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
