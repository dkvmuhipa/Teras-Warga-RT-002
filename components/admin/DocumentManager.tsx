import React, { useState } from 'react';
import { FileText, Upload, Trash2, ExternalLink } from 'lucide-react';
import { Document } from '../../types';

interface DocumentManagerProps {
  documents: Document[];
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-black text-2xl text-slate-800">Arsip Dokumen</h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
          <Upload size={18} /> Unggah Dokumen
        </button>
      </div>
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{doc.title}</h4>
                    <p className="text-xs text-slate-500">{doc.category} • {new Date(doc.uploadDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                    <ExternalLink size={18} />
                  </a>
                  <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-400 italic">Belum ada dokumen diarsipkan.</div>
          )}
        </div>
      </div>
    </div>
  );
};
