import React, { useState } from 'react';
import { 
  Inbox, Search, Filter, Plus, FileText, Calendar, Building, CheckCircle2,
  Clock, Archive, Eye, Trash2, Edit3, Upload, FileDown, ExternalLink, X, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IncomingMail } from '../../types';
import { 
  addIncomingMailToDb, updateIncomingMailInDb, deleteIncomingMailFromDb, 
  uploadImageToStorage 
} from '../../services/databaseService';
import { toast } from 'sonner';

interface IncomingMailManagerProps {
  incomingMails: IncomingMail[];
}

export const IncomingMailManager: React.FC<IncomingMailManagerProps> = ({ incomingMails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMail, setSelectedMail] = useState<IncomingMail | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    mailNumber: '',
    agendaNumber: `SM/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
    sender: '',
    subject: '',
    receivedDate: new Date().toISOString().split('T')[0],
    letterDate: new Date().toISOString().split('T')[0],
    category: 'Edaran' as IncomingMail['category'],
    dispositionNotes: '',
    status: 'Menunggu Disposisi' as IncomingMail['status'],
    fileUrl: ''
  });

  const filteredMails = incomingMails.filter(m => {
    const matchSearch = 
      m.mailNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.agendaNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchCategory = filterCategory === 'All' || m.category === filterCategory;
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const handleOpenAdd = () => {
    setSelectedMail(null);
    setFormData({
      mailNumber: '',
      agendaNumber: `SM/${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
      sender: '',
      subject: '',
      receivedDate: new Date().toISOString().split('T')[0],
      letterDate: new Date().toISOString().split('T')[0],
      category: 'Edaran',
      dispositionNotes: '',
      status: 'Menunggu Disposisi',
      fileUrl: ''
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mail: IncomingMail) => {
    setSelectedMail(mail);
    setFormData({
      mailNumber: mail.mailNumber,
      agendaNumber: mail.agendaNumber,
      sender: mail.sender,
      subject: mail.subject,
      receivedDate: mail.receivedDate,
      letterDate: mail.letterDate,
      category: mail.category,
      dispositionNotes: mail.dispositionNotes || '',
      status: mail.status,
      fileUrl: mail.fileUrl || ''
    });
    setFileToUpload(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mailNumber || !formData.sender || !formData.subject) {
      toast.error('Mohon lengkapi Nomor Surat, Pengirim, dan Perihal!');
      return;
    }

    setIsSubmitting(true);
    try {
      let fileUrl = formData.fileUrl;
      let fileType: 'pdf' | 'image' | undefined = undefined;

      if (fileToUpload) {
        const isPdf = fileToUpload.type === 'application/pdf';
        fileType = isPdf ? 'pdf' : 'image';
        fileUrl = await uploadImageToStorage(fileToUpload, `incoming_mails/${Date.now()}_${fileToUpload.name}`);
      }

      if (selectedMail) {
        await updateIncomingMailInDb(selectedMail.id, {
          ...formData,
          fileUrl,
          fileType: fileType || selectedMail.fileType
        });
        toast.success('Surat Masuk berhasil diperbarui!');
      } else {
        await addIncomingMailToDb({
          ...formData,
          fileUrl,
          fileType
        });
        toast.success('Surat Masuk baru berhasil dicatat!');
      }

      setIsModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan Surat Masuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus arsip surat masuk ini?')) {
      try {
        await deleteIncomingMailFromDb(id);
        toast.success('Surat Masuk berhasil dihapus');
      } catch (error) {
        toast.error('Gagal menghapus surat masuk');
      }
    }
  };

  // Stats calculation
  const totalMails = incomingMails.length;
  const pendingDisposition = incomingMails.filter(m => m.status === 'Menunggu Disposisi').length;
  const edaranCount = incomingMails.filter(m => m.category === 'Edaran').length;
  const archivedCount = incomingMails.filter(m => m.status === 'Diarsipkan').length;

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Inbox className="text-indigo-600" size={24} />
            <span>Manajemen Surat Masuk</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Arsip digital surat masuk dari Kelurahan, Polsek, PLN, RW & instansi luar.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0"
        >
          <Plus size={16} />
          <span>Catat Surat Masuk</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Inbox size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Surat Masuk</p>
            <p className="text-lg font-black text-slate-800">{totalMails} Berkas</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Perlu Disposisi</p>
            <p className="text-lg font-black text-amber-600">{pendingDisposition} Surat</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Surat Edaran</p>
            <p className="text-lg font-black text-emerald-600">{edaranCount} Berkas</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Archive size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Diarsipkan</p>
            <p className="text-lg font-black text-blue-600">{archivedCount} Berkas</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari no. surat, pengirim, perihal..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="All">Semua Kategori</option>
            <option value="Edaran">Edaran</option>
            <option value="Undangan">Undangan</option>
            <option value="Pemberitahuan">Pemberitahuan</option>
            <option value="Himbauan">Himbauan</option>
            <option value="Tagihan/Instansi">Tagihan/Instansi</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          <select
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="All">Semua Status</option>
            <option value="Menunggu Disposisi">Menunggu Disposisi</option>
            <option value="Sudah Ditindaklanjuti">Sudah Ditindaklanjuti</option>
            <option value="Diarsipkan">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* Incoming Mail List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="p-4">No. Agenda & Surat</th>
                <th className="p-4">Pengirim</th>
                <th className="p-4">Perihal</th>
                <th className="p-4">Tgl Terima</th>
                <th className="p-4">Kategori & Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredMails.length > 0 ? (
                filteredMails.map((mail) => (
                  <tr key={mail.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 font-mono text-[11px]">{mail.agendaNumber}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Asli: {mail.mailNumber}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">{mail.sender}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="font-semibold text-slate-800 line-clamp-2">{mail.subject}</p>
                      {mail.dispositionNotes && (
                        <p className="text-[9px] text-indigo-600 font-semibold italic mt-0.5 truncate">
                          Disposisi: "{mail.dispositionNotes}"
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700">{mail.receivedDate}</p>
                      <p className="text-[9px] text-slate-400">Surat: {mail.letterDate}</p>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase">
                          {mail.category}
                        </span>
                        <div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            mail.status === 'Menunggu Disposisi'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : mail.status === 'Sudah Ditindaklanjuti'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {mail.status}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {mail.fileUrl && (
                          <button
                            onClick={() => {
                              setSelectedMail(mail);
                              setIsPreviewOpen(true);
                            }}
                            title="Pratinjau Surat"
                            className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(mail)}
                          title="Edit & Disposisi"
                          className="p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(mail.id)}
                          title="Hapus"
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium italic">
                    Belum ada catatan surat masuk yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Surat Masuk */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 z-10 space-y-5 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedMail ? 'Edit & Disposisi Surat Masuk' : 'Catat Surat Masuk Baru'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">No. Agenda Internal RT *</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono"
                      value={formData.agendaNumber}
                      onChange={e => setFormData({ ...formData, agendaNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">No. Surat Asli Pihak Luar *</label>
                    <input
                      type="text"
                      placeholder="Contoh: 005/KEL-TND/VIII/2026"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.mailNumber}
                      onChange={e => setFormData({ ...formData, mailNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Pengirim Surat *</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kelurahan Tondo, Polsek, PLN..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.sender}
                      onChange={e => setFormData({ ...formData, sender: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Kategori Surat</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    >
                      <option value="Edaran">Edaran</option>
                      <option value="Undangan">Undangan</option>
                      <option value="Pemberitahuan">Pemberitahuan</option>
                      <option value="Himbauan">Himbauan</option>
                      <option value="Tagihan/Instansi">Tagihan/Instansi</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Perihal Surat *</label>
                  <input
                    type="text"
                    placeholder="Ringkasan perihal surat..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Tanggal Terima Surat</label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.receivedDate}
                      onChange={e => setFormData({ ...formData, receivedDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Tanggal Pada Surat</label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.letterDate}
                      onChange={e => setFormData({ ...formData, letterDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 mb-1">Catatan Disposisi Ketua RT</label>
                  <textarea
                    rows={2}
                    placeholder="Instruksi tindak lanjut (misal: Diteruskan ke Seksi Keamanan)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    value={formData.dispositionNotes}
                    onChange={e => setFormData({ ...formData, dispositionNotes: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Status Penanganan</label>
                    <select
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="Menunggu Disposisi">Menunggu Disposisi</option>
                      <option value="Sudah Ditindaklanjuti">Sudah Ditindaklanjuti</option>
                      <option value="Diarsipkan">Diarsipkan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Unggah Lampiran (PDF/Foto)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-500"
                      onChange={e => setFileToUpload(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Surat'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Preview Lampiran Surat */}
      <AnimatePresence>
        {isPreviewOpen && selectedMail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs" onClick={() => setIsPreviewOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 z-10 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedMail.subject}</h3>
                  <p className="text-xs text-slate-500">Pengirim: {selectedMail.sender} • No. Surat: {selectedMail.mailNumber}</p>
                </div>
                <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-slate-100 rounded-xl p-4 flex items-center justify-center min-h-[350px]">
                {selectedMail.fileUrl ? (
                  selectedMail.fileType === 'pdf' || selectedMail.fileUrl.endsWith('.pdf') ? (
                    <iframe src={selectedMail.fileUrl} title="Lampiran Surat PDF" className="w-full h-[450px] rounded-lg border border-slate-200" />
                  ) : (
                    <img src={selectedMail.fileUrl} alt="Lampiran Surat" className="max-w-full max-h-[450px] object-contain rounded-lg shadow-md" />
                  )
                ) : (
                  <p className="text-slate-400 text-xs font-semibold">Tidak ada lampiran berkas digital.</p>
                )}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 font-semibold">Status: {selectedMail.status}</span>
                {selectedMail.fileUrl && (
                  <a
                    href={selectedMail.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700"
                  >
                    <ExternalLink size={14} /> Buka Berkas Penuh
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
