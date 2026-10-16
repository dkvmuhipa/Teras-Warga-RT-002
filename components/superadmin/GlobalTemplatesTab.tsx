import React, { useState } from 'react';
import { 
  FileText, Copy, ExternalLink, Check, Download, 
  Plus, Sparkles, Send, Eye, ShieldCheck, X, CheckCircle2,
  Layers, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export interface LetterTemplate {
  id: string;
  code: string;
  title: string;
  category: 'kependudukan' | 'keamanan' | 'usaha' | 'sosial';
  description: string;
  variables: string[];
  contentPreview: string;
  isOfficialKemendagri: boolean;
}

interface GlobalTemplatesTabProps {
  onLogAudit: (action: string, category: any, targetTenantId?: string, details?: string) => void;
}

export const GlobalTemplatesTab: React.FC<GlobalTemplatesTabProps> = ({
  onLogAudit
}) => {
  const [templates, setTemplates] = useState<LetterTemplate[]>([
    {
      id: 'tpl-domisili',
      code: 'SKD-01',
      title: 'Surat Pengantar Keterangan Domisili',
      category: 'kependudukan',
      description: 'Format baku verifikasi alamat tempat tinggal warga untuk keperluan perbankan, dinas, atau sekolah.',
      variables: ['nama_warga', 'nik', 'alamat_lengkap', 'lama_tinggal', 'nomor_surat', 'nama_ketua_rt'],
      contentPreview: 'Menerangkan bahwa yang bersangkutan adalah benar warga yang berdomisili sah di wilayah RT {{nomor_rt}} / RW {{nomor_rw}} sejak tahun {{lama_tinggal}}...',
      isOfficialKemendagri: true
    },
    {
      id: 'tpl-skck',
      code: 'SKCK-02',
      title: 'Surat Pengantar Catatan Kepolisian (SKCK)',
      category: 'keamanan',
      description: 'Pengantar resmi ke Polsek/Polres untuk permohonan penerbitan SKCK melamar pekerjaan atau studi.',
      variables: ['nama_warga', 'nik', 'tempat_tanggal_lahir', 'pekerjaan', 'keperluan_skck', 'nomor_surat'],
      contentPreview: 'Yang bersangkutan memiliki kelakuan baik dan tidak pernah terlibat tindak kriminal atau pelanggaran ketertiban umum di lingkungan...',
      isOfficialKemendagri: true
    },
    {
      id: 'tpl-sku',
      code: 'SKU-03',
      title: 'Surat Keterangan Usaha (SKU) Mikro / UMKM',
      category: 'usaha',
      description: 'Legalitas pengantar usaha rumahan dan UMKM warga untuk pengajuan pinjaman bank / KUR.',
      variables: ['nama_pemilik', 'nik', 'nama_usaha', 'jenis_usaha', 'lokasi_usaha', 'lama_usaha_berjalan'],
      contentPreview: 'Menerangkan bahwa benar nama di atas memiliki kegiatan usaha aktif di bidang {{jenis_usaha}} yang berlokasi di wilayah RT...',
      isOfficialKemendagri: true
    },
    {
      id: 'tpl-sktm',
      code: 'SKTM-04',
      title: 'Surat Keterangan Tidak Mampu (SKTM)',
      category: 'sosial',
      description: 'Format pengantar rekomendasi bansos, beasiswa, KIP kuliah, atau keringanan biaya kesehatan BPJS.',
      variables: ['nama_warga', 'nik', 'penghasilan_rata_rata', 'tanggungan_anak', 'keperluan_beasiswa'],
      contentPreview: 'Berdasarkan data peninjauan lingkungan, keluarga yang bersangkutan masuk ke dalam kategori prasejahtera / membutuhkan bantuan...',
      isOfficialKemendagri: true
    },
    {
      id: 'tpl-keramaian',
      code: 'SIK-05',
      title: 'Surat Pengantar Izin Keramaian & Acara',
      category: 'keamanan',
      description: 'Pemberitahuan penyelenggaraan hajatan, perayaan, atau kegiatan sosial di area publik lingkungan RT.',
      variables: ['nama_penyelenggara', 'jenis_acara', 'waktu_pelaksanaan', 'lokasi_kegiatan', 'penanggung_jawab'],
      contentPreview: 'Pengurus RT menyatakan tidak berkeberatan atas permohonan izin keramaian untuk kegiatan {{jenis_acara}} dengan tetap menjaga ketertiban...',
      isOfficialKemendagri: false
    },
    {
      id: 'tpl-kematian',
      code: 'SKK-06',
      title: 'Surat Keterangan Kematian Lingkungan',
      category: 'kependudukan',
      description: 'Pernyataan resmi wafatnya warga untuk kepengurusan akta kematian di Disdukcapil atau santunan duka.',
      variables: ['nama_almarhum', 'nik', 'tanggal_meninggal', 'tempat_meninggal', 'nama_pelapor'],
      contentPreview: 'Menerangkan bahwa almarhum/almarhumah {{nama_almarhum}} telah berpulang ke rahmatullah pada tanggal {{tanggal_meninggal}}...',
      isOfficialKemendagri: true
    }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<LetterTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleCopyCode = (tpl: LetterTemplate) => {
    navigator.clipboard.writeText(JSON.stringify(tpl, null, 2));
    setCopiedId(tpl.id);
    toast.success(`Format ${tpl.code} disalin ke clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeployAll = async () => {
    setIsDeploying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onLogAudit(
        'Deploy Template Persuratan',
        'module',
        'all',
        `Katalog ${templates.length} template surat standar disinkronkan ke seluruh armada RT`
      );
      toast.success('Seluruh template berhasil disinkronisasi ke semua armada RT!');
    } catch (err) {
      toast.error('Gagal menyinkronkan template');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono uppercase font-black mb-2">
            Standardisasi Birokrasi Warga
          </div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Katalog Master Template Persuratan Lingkungan
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl mt-1 leading-relaxed">
            Template surat resmi berstandar Kemendagri & Pemda yang otomatis tersedia untuk seluruh RT di platform Teras Warga. Menghemat waktu pengurus RT agar tidak perlu merumuskan draf surat dari nol.
          </p>
        </div>

        <button
          onClick={handleDeployAll}
          disabled={isDeploying}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Send size={14} />
          <span>{isDeploying ? 'Menyinkronkan...' : 'Deploy ke Seluruh Armada RT'}</span>
        </button>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(tpl => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {tpl.code}
                </span>
                {tpl.isOfficialKemendagri && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 size={11} />
                    <span>Standar Resmi</span>
                  </span>
                )}
              </div>

              <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 tracking-tight">
                {tpl.title}
              </h3>

              <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                {tpl.description}
              </p>

              {/* Dynamic Variables Chips */}
              <div className="space-y-1.5 mb-4">
                <span className="text-[10px] font-bold uppercase text-slate-400 font-mono block">
                  Variabel Dinamis:
                </span>
                <div className="flex flex-wrap gap-1">
                  {tpl.variables.slice(0, 4).map(v => (
                    <span key={v} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                      {`{{${v}}}`}
                    </span>
                  ))}
                  {tpl.variables.length > 4 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-50 text-slate-400">
                      +{tpl.variables.length - 4} tag
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedTemplate(tpl)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Eye size={13} />
                <span>Pratinjau Draf</span>
              </button>
              <button
                onClick={() => handleCopyCode(tpl)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Salin JSON Template"
              >
                {copiedId === tpl.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  {selectedTemplate.code}
                </span>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedTemplate.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Paper Preview Simulation */}
              <div className="p-6 bg-white border border-slate-300 rounded-2xl shadow-inner font-serif text-xs text-slate-800 space-y-3">
                <div className="text-center border-b-2 border-slate-900 pb-3">
                  <div className="font-sans font-black text-xs uppercase tracking-wider text-slate-900">
                    PEMERINTAH KOTA PALU • KECAMATAN MANTIKULORE
                  </div>
                  <div className="font-sans font-bold text-sm text-slate-900">
                    RUKUN TETANGGA 002 / RUKUN WARGA 020
                  </div>
                  <div className="text-[10px] text-slate-600 font-sans mt-0.5">
                    Kompleks Huntap Tondo 2, Kelurahan Tondo, Kota Palu, Sulawesi Tengah 94119
                  </div>
                </div>

                <div className="text-center py-1">
                  <div className="font-bold uppercase tracking-wider underline">
                    {selectedTemplate.title}
                  </div>
                  <div className="text-[10px] font-sans text-slate-500">
                    Nomor: 045 / {selectedTemplate.code} / RT.02-RW.20 / X / 2026
                  </div>
                </div>

                <p className="leading-relaxed text-justify">
                  {selectedTemplate.contentPreview}
                </p>

                <p className="text-justify leading-relaxed">
                  Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya oleh yang bersangkutan.
                </p>

                <div className="flex justify-between pt-4 font-sans text-[11px]">
                  <div></div>
                  <div className="text-center">
                    <div>Palu, 16 Oktober 2026</div>
                    <div className="font-bold mt-1">Ketua RT 002</div>
                    <div className="h-12 flex items-center justify-center italic text-slate-400 text-[10px]">
                      (Tanda Tangan Digital)
                    </div>
                    <div className="font-bold underline">Bpk. M. Irfan</div>
                  </div>
                </div>
              </div>

              {/* Tag variables list */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Daftar Tag Isian Otomatis:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.variables.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-xs font-mono font-bold">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex justify-end">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
