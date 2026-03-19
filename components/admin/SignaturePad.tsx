import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, CheckCircle, Eraser } from 'lucide-react';
import { Button } from '../ui/Button';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  initialValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, initialValue }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    if (onClear) onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Silakan buat tanda tangan terlebih dahulu.');
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden relative group">
        <SignatureCanvas 
          ref={sigCanvas}
          penColor="#1e293b"
          canvasProps={{
            className: "w-full h-64 cursor-crosshair",
            style: { width: '100%', height: '256px' }
          }}
        />
        
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={clear}
            className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm border border-slate-100 transition-all"
            title="Hapus"
          >
            <Eraser size={18} />
          </button>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tanda Tangan di Sini</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={clear} 
          className="flex-1 py-3 border-slate-200 text-slate-500"
        >
          <Trash2 size={16} /> Reset
        </Button>
        <Button 
          onClick={save} 
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700"
        >
          <CheckCircle size={16} /> Simpan Tanda Tangan
        </Button>
      </div>

      {initialValue && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tanda Tangan Saat Ini:</p>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 inline-block">
            <img src={initialValue} alt="Current Signature" className="max-h-20" />
          </div>
        </div>
      )}
    </div>
  );
};
