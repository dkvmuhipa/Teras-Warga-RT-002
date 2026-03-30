import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Trash2, CheckCircle, Eraser, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  initialValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, initialValue }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialValue && !isUploaded) {
      // Check if it looks like a signature (not a full photo)
      // or just load it anyway. If it's a photo, it might look weird on canvas.
      // But usually initialValue is what was saved before.
      sigCanvas.current?.fromDataURL(initialValue);
    }
  }, [initialValue]);

  const clear = () => {
    sigCanvas.current?.clear();
    setUploadedPreview(null);
    setIsUploaded(false);
    if (onClear) onClear();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('Ukuran file terlalu besar (maks 500KB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setUploadedPreview(dataUrl);
        setIsUploaded(true);
        // Clear canvas if something was drawn
        sigCanvas.current?.clear();
      };
      reader.readAsDataURL(file);
    }
  };

  const save = () => {
    if (isUploaded && uploadedPreview) {
      onSave(uploadedPreview);
      toast.success('Tanda tangan terupload berhasil disiapkan!');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      alert('Silakan buat tanda tangan atau upload gambar terlebih dahulu.');
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
      toast.success('Tanda tangan berhasil disiapkan!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] overflow-hidden relative group min-h-[256px] flex items-center justify-center">
        {isUploaded && uploadedPreview ? (
          <div className="w-full h-64 flex items-center justify-center p-8 bg-white">
            <img src={uploadedPreview} alt="Uploaded Signature" className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <SignatureCanvas 
            ref={sigCanvas}
            penColor="#1e293b"
            canvasProps={{
              className: "w-full h-64 cursor-crosshair",
              style: { width: '100%', height: '256px' }
            }}
            onBegin={() => {
              if (isUploaded) {
                setIsUploaded(false);
                setUploadedPreview(null);
              }
            }}
          />
        )}
        
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-white text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm border border-slate-100 transition-all"
            title="Upload Gambar"
          >
            <Upload size={18} />
          </button>
          <button 
            onClick={clear}
            className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-xl shadow-sm border border-slate-100 transition-all"
            title="Hapus"
          >
            <Eraser size={18} />
          </button>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
            {isUploaded ? 'Gambar Terupload' : 'Tanda Tangan di Sini atau Upload'}
          </p>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 py-3 border-slate-200 text-slate-500"
        >
          <Upload size={16} className="mr-2" /> Upload TTD
        </Button>
        <Button 
          variant="outline" 
          onClick={clear} 
          className="flex-1 py-3 border-slate-200 text-slate-500"
        >
          <Trash2 size={16} className="mr-2" /> Reset
        </Button>
        <Button 
          onClick={save} 
          className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700"
        >
          <CheckCircle size={16} className="mr-2" /> Simpan Tanda Tangan
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
