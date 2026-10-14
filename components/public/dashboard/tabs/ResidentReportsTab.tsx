import React from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { Report } from '../../../../types';
import { Card } from '../../../ui/Card';
import { Button } from '../../../ui/Button';

interface ResidentReportsTabProps {
  reports: Report[];
  onOpenReportModal: () => void;
  onSelectReportDetail: (report: Report) => void;
}

export const ResidentReportsTab: React.FC<ResidentReportsTabProps> = ({
  reports,
  onOpenReportModal,
  onSelectReportDetail,
}) => {
  return (
    <motion.div 
      key="reports"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-slate-800">Laporan Masalah</h3>
          <p className="text-sm text-slate-500 font-medium">Laporkan masalah keamanan, kebersihan, atau fasilitas di lingkungan.</p>
        </div>
        <Button onClick={onOpenReportModal} className="bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100">
          <AlertTriangle size={18} className="mr-2" /> Buat Laporan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.length > 0 ? (
          reports.map((report) => (
            <Card 
              key={report.id} 
              className="p-6 bg-white border-slate-100 shadow-sm flex items-center justify-between group hover:border-rose-200 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onSelectReportDetail(report)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${
                  report.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' :
                  report.status === 'Diproses' ? 'bg-indigo-50 text-indigo-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {report.status === 'Selesai' ? <CheckCircle size={24} /> : 
                   report.status === 'Diproses' ? <Clock size={24} /> : 
                   <AlertCircle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800">Laporan {report.type}</h4>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                      report.status === 'Selesai' ? 'bg-emerald-100 text-emerald-600' :
                      report.status === 'Diproses' ? 'bg-indigo-100 text-indigo-600' :
                      'bg-rose-100 text-rose-600'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">{report.description}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Diajukan: {new Date(report.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <AlertTriangle size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada laporan</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
