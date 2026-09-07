import React, { useRef } from 'react';
import { House } from '../../../types';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Printer, Share2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface KartuKeluargaModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: House | null;
}

export const KartuKeluargaModal: React.FC<KartuKeluargaModalProps> = ({
  isOpen,
  onClose,
  house
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !house) return null;

  // Build members list starting with Head of Family
  const allMembers = [
    {
      no: 1,
      name: house.headOfFamily || 'KEPALA KELUARGA',
      nik: house.nik || '-',
      gender: house.gender || 'Laki-laki',
      birthPlace: house.birthPlace || 'Palu',
      birthDate: house.birthDate ? new Date(house.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
      religion: house.religion || 'Islam',
      education: house.education || '-',
      job: house.jobCategory || '-',
      bloodType: house.bloodType || '-',
      maritalStatus: house.maritalStatus || 'Kawin',
      relation: 'KEPALA KELUARGA',
      nationality: house.nationality || 'WNI',
      fatherName: '-',
      motherName: '-'
    },
    ...(house.familyMembers || []).map((m, idx) => ({
      no: idx + 2,
      name: m.name || '-',
      nik: m.nik || '-',
      gender: m.gender || '-',
      birthPlace: m.birthPlace || 'Palu',
      birthDate: m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
      religion: house.religion || 'Islam',
      education: m.education || '-',
      job: m.job || '-',
      bloodType: m.bloodType || '-',
      maritalStatus: m.maritalStatus || (m.relation?.toLowerCase().includes('istri') ? 'Kawin' : 'Belum Kawin'),
      relation: (m.relation || 'ANGGOTA KELUARGA').toUpperCase(),
      nationality: 'WNI',
      fatherName: house.headOfFamily || '-',
      motherName: '-'
    }))
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `📄 Salinan Blanko Kartu Keluarga (KK) Digital
No. KK / ID Hunian: ${house.id}
Kepala Keluarga: ${house.headOfFamily}
Alamat: Blok ${house.block}-${house.number}, RT 002 / RW 020, Huntap 2 Tondo, Kota Palu.
Total Anggota: ${allMembers.length} Jiwa.
Terverifikasi resmi pada Database Digital Teras Warga RT 002.`;

    const encoded = encodeURIComponent(text);
    if (house.phone) {
      const cleanPhone = house.phone.replace(/[^0-9]/g, '');
      const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
      window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        toast.success("Salinan Data KK Disalin ke Clipboard!");
      } else {
        toast.info("Data KK Siap dibagikan");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Action Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider mb-1">
              <ShieldCheck size={14} className="text-emerald-600" />
              ARSIP KARTU KELUARGA RESMI RT 002
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Blanko Kartu Keluarga (KK) Digital
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Format baku kependudukan Republik Indonesia untuk warga Hunian Tetap (Huntap) 2 Tondo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 rounded-xl text-xs font-bold border-slate-200 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Share2 size={14} />
              <span>Bagikan WA</span>
            </Button>
            <Button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-slate-900/10 active:scale-95"
            >
              <Printer size={14} />
              <span>Cetak Blanko KK</span>
            </Button>
          </div>
        </div>

        {/* PRINTABLE OFFICIAL KARTU KELUARGA SHEET */}
        <div 
          ref={printRef}
          id="printable-kartu-keluarga"
          className="bg-[#fcfbf7] border-2 border-slate-800 p-6 md:p-10 rounded-2xl shadow-sm text-slate-900 font-serif relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white"
        >
          {/* Subtle Security Guilloche Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />

          {/* Official KK Header */}
          <div className="text-center space-y-1 mb-6 border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-[0.25em] text-slate-900 font-sans uppercase">
              KARTU KELUARGA
            </h1>
            <p className="text-sm md:text-base font-black tracking-[0.3em] font-mono text-slate-800 uppercase">
              No. {house.id?.replace(/[^a-zA-Z0-9]/g, '') || '727103020020001'}
            </p>
          </div>

          {/* KK Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-xs mb-6 font-sans">
            <div className="space-y-1">
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Nama Kepala Keluarga</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-black uppercase text-slate-950">{house.headOfFamily || '-'}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Alamat</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">Blok {house.block} No. {house.number}, Huntap 2</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">RT / RW</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">002 / 020</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Kode Pos</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900 font-mono">94119</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Desa / Kelurahan</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">TONDO</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Kecamatan</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">MANTIKULORE</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Kabupaten / Kota</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">KOTA PALU</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold uppercase text-slate-700">Provinsi</span>
                <span className="col-span-1 font-bold">:</span>
                <span className="col-span-6 font-bold uppercase text-slate-900">SULAWESI TENGAH</span>
              </div>
            </div>
          </div>

          {/* TABEL 1: DATA ANGGOTA KELUARGA */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-[10px] sm:text-xs font-sans text-center">
              <thead>
                <tr className="bg-slate-200/80 font-black text-slate-900 border border-slate-900">
                  <th className="border border-slate-900 py-1.5 px-2 w-8">No</th>
                  <th className="border border-slate-900 py-1.5 px-3 text-left">Nama Lengkap</th>
                  <th className="border border-slate-900 py-1.5 px-3">NIK</th>
                  <th className="border border-slate-900 py-1.5 px-2">Jenis Kelamin</th>
                  <th className="border border-slate-900 py-1.5 px-2">Tempat Lahir</th>
                  <th className="border border-slate-900 py-1.5 px-2">Tanggal Lahir</th>
                  <th className="border border-slate-900 py-1.5 px-2">Agama</th>
                  <th className="border border-slate-900 py-1.5 px-2">Pendidikan</th>
                  <th className="border border-slate-900 py-1.5 px-2">Jenis Pekerjaan</th>
                  <th className="border border-slate-900 py-1.5 px-1 w-10">Gol. Darah</th>
                </tr>
                <tr className="bg-slate-100 text-[9px] font-bold text-slate-500 border border-slate-900">
                  <td className="border border-slate-900 py-0.5">(1)</td>
                  <td className="border border-slate-900 py-0.5">(2)</td>
                  <td className="border border-slate-900 py-0.5">(3)</td>
                  <td className="border border-slate-900 py-0.5">(4)</td>
                  <td className="border border-slate-900 py-0.5">(5)</td>
                  <td className="border border-slate-900 py-0.5">(6)</td>
                  <td className="border border-slate-900 py-0.5">(7)</td>
                  <td className="border border-slate-900 py-0.5">(8)</td>
                  <td className="border border-slate-900 py-0.5">(9)</td>
                  <td className="border border-slate-900 py-0.5">(10)</td>
                </tr>
              </thead>
              <tbody>
                {allMembers.map((m) => (
                  <tr key={m.no} className="border border-slate-900 hover:bg-slate-50/80">
                    <td className="border border-slate-900 py-1.5 px-1 font-bold">{m.no}</td>
                    <td className="border border-slate-900 py-1.5 px-3 text-left font-black uppercase">{m.name}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-mono font-bold">{m.nik}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-medium">{m.gender}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-medium uppercase">{m.birthPlace}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-mono font-medium">{m.birthDate}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-medium uppercase">{m.religion}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-medium">{m.education}</td>
                    <td className="border border-slate-900 py-1.5 px-2 font-medium">{m.job}</td>
                    <td className="border border-slate-900 py-1.5 px-1 font-mono font-bold">{m.bloodType}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABEL 2: STATUS HUBUNGAN & SILSILAH */}
          <div className="mb-8 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-[10px] sm:text-xs font-sans text-center">
              <thead>
                <tr className="bg-slate-200/80 font-black text-slate-900 border border-slate-900">
                  <th className="border border-slate-900 py-1.5 px-2 w-8">No</th>
                  <th className="border border-slate-900 py-1.5 px-3">Status Perkawinan</th>
                  <th className="border border-slate-900 py-1.5 px-3">Status Hubungan Dalam Keluarga</th>
                  <th className="border border-slate-900 py-1.5 px-3">Kewarganegaraan</th>
                  <th className="border border-slate-900 py-1.5 px-3">Nama Ayah</th>
                  <th className="border border-slate-900 py-1.5 px-3">Nama Ibu</th>
                </tr>
                <tr className="bg-slate-100 text-[9px] font-bold text-slate-500 border border-slate-900">
                  <td className="border border-slate-900 py-0.5">(1)</td>
                  <td className="border border-slate-900 py-0.5">(11)</td>
                  <td className="border border-slate-900 py-0.5">(12)</td>
                  <td className="border border-slate-900 py-0.5">(13)</td>
                  <td className="border border-slate-900 py-0.5">(14)</td>
                  <td className="border border-slate-900 py-0.5">(15)</td>
                </tr>
              </thead>
              <tbody>
                {allMembers.map((m) => (
                  <tr key={m.no} className="border border-slate-900 hover:bg-slate-50/80">
                    <td className="border border-slate-900 py-1.5 px-1 font-bold">{m.no}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-medium">{m.maritalStatus}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-black uppercase text-indigo-950">{m.relation}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-bold">{m.nationality}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-medium uppercase">{m.fatherName}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-medium uppercase">{m.motherName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SIGNATURE & LEGALIZATION FOOTER */}
          <div className="grid grid-cols-2 gap-8 text-xs font-sans pt-4 border-t border-slate-300">
            <div className="text-center space-y-16">
              <p className="font-bold text-slate-700 uppercase">KEPALA KELUARGA,</p>
              <div>
                <p className="font-black text-slate-950 underline uppercase tracking-wide">{house.headOfFamily || '-'}</p>
                <p className="text-[10px] text-slate-400 font-mono">Tanda Tangan / Cap Jempol</p>
              </div>
            </div>

            <div className="text-center space-y-16">
              <div>
                <p className="font-bold text-slate-700">Dikeluarkan di: PALU</p>
                <p className="font-bold text-slate-700">
                  Pada Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-black text-slate-900 uppercase mt-1">PENGURUS RT 002 / RW 020 KELURAHAN TONDO</p>
              </div>
              <div>
                <p className="font-black text-slate-950 underline uppercase tracking-wide">PENGURUS RT 002</p>
                <p className="text-[10px] text-slate-500 font-mono">Arsip Kependudukan Digital</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
