import React, { useState } from 'react';
import { FileText, Award, Calendar, ChevronRight, Layers, FileCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { House, PdfConfig, CashFlow, PopulationReport, InventoryItem } from '../../types';
import { MonthlyActivityReportManager } from './MonthlyActivityReportManager';
import { AnnualLPJManager } from './AnnualLPJManager';

interface ReportManagerProps {
  houses?: House[];
  pdfConfig?: PdfConfig;
  cashFlow?: CashFlow[];
  populationReports?: PopulationReport[];
  populationLogs?: any[];
  events?: any[];
  inventory?: InventoryItem[];
  iuranPayments?: any[];
  initialSubTab?: 'monthly' | 'annual';
}

export const ReportManager: React.FC<ReportManagerProps> = ({
  houses = [],
  pdfConfig,
  cashFlow = [],
  populationReports = [],
  populationLogs = [],
  events = [],
  inventory = [],
  iuranPayments = [],
  initialSubTab = 'monthly'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'monthly' | 'annual'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Header Hub Laporan & LPJ */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider">
            <Award size={14} />
            Pusat Pelaporan Resmi RT 02
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Kegiatan &amp; LPJ RT
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Dokumentasi pertanggungjawaban kegiatan bulanan, semester, dan tahunan pengurus RT 002 Huntap Tondo 2.
          </p>
        </div>

        {/* Segmented Pill Tabs */}
        <div className="inline-flex items-center p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 shadow-inner shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveSubTab('monthly')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'monthly'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={15} />
            Laporan Bulanan
          </button>
          <button
            onClick={() => setActiveSubTab('annual')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'annual'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award size={15} />
            LPJ Tahunan &amp; Semester
          </button>
        </div>
      </div>

      {/* Konten Laporan Aktif */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'monthly' ? (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <MonthlyActivityReportManager
              houses={houses}
              pdfConfig={pdfConfig}
              cashFlow={cashFlow}
              populationReports={populationReports}
            />
          </motion.div>
        ) : (
          <motion.div
            key="annual"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <AnnualLPJManager
              houses={houses}
              cashFlow={cashFlow}
              populationReports={populationReports}
              populationLogs={populationLogs}
              events={events}
              inventory={inventory}
              iuranPayments={iuranPayments}
              pdfConfig={pdfConfig}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
