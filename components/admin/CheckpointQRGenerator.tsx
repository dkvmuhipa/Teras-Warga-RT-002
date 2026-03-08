import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Checkpoint } from '../../types';
import { subscribeToCheckpoints } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Printer, X } from 'lucide-react';

interface CheckpointQRGeneratorProps {
  onClose: () => void;
}

export const CheckpointQRGenerator: React.FC<CheckpointQRGeneratorProps> = ({ onClose }) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToCheckpoints((data) => {
        setCheckpoints(data);
    });
    return () => unsubscribe();
  }, []);

  const handlePrint = () => {
    const printContent = componentRef.current;
    if (printContent) {
        // Create a temporary iframe to print
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        iframe.style.left = '-10000px';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
            doc.open();
            doc.write(`
                <html>
                    <head>
                        <title>Cetak QR Code Checkpoint</title>
                        <style>
                            body { font-family: sans-serif; padding: 20px; }
                            .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                            .qr-card { border: 2px solid #000; padding: 20px; text-align: center; page-break-inside: avoid; border-radius: 10px; }
                            .qr-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
                            .qr-code { margin: 0 auto; }
                            .qr-footer { margin-top: 10px; font-size: 12px; color: #555; }
                        </style>
                    </head>
                    <body>
                        <div class="qr-grid">
                            ${checkpoints.map(cp => `
                                <div class="qr-card">
                                    <div class="qr-title">${cp.name}</div>
                                    <div style="display: flex; justify-content: center;">
                                       ${document.getElementById(`qr-${cp.id}`)?.outerHTML || ''}
                                    </div>
                                    <div class="qr-footer">Scan untuk Checkpoint</div>
                                </div>
                            `).join('')}
                        </div>
                    </body>
                </html>
            `);
            doc.close();
            iframe.contentWindow?.focus();
            setTimeout(() => {
                iframe.contentWindow?.print();
                document.body.removeChild(iframe);
            }, 500);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Cetak QR Code Checkpoint</h2>
            <p className="text-sm text-slate-500">Cetak dan tempel kode ini di lokasi titik patroli.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div ref={componentRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {checkpoints.map((cp) => (
              <div key={cp.id} className="bg-white p-8 rounded-3xl border-2 border-slate-900 flex flex-col items-center text-center shadow-sm">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-6">{cp.name}</h3>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-inner mb-4">
                    <div id={`qr-${cp.id}`}>
                        <QRCode 
                            value={cp.qrCode} 
                            size={200}
                            level="H"
                        />
                    </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scan via Aplikasi Ronda</p>
                <p className="text-[10px] text-slate-300 mt-1 font-mono">{cp.qrCode}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
          <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
            <Printer size={18} className="mr-2" /> Cetak QR Code
          </Button>
        </div>
      </div>
    </div>
  );
};
