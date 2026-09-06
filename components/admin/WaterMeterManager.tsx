import React, { useState, useEffect, useMemo } from 'react';
import { 
  Droplets, Search, Filter, Plus, CheckCircle2, Clock, 
  AlertTriangle, XCircle, Download, Send, Camera, Eye, 
  Settings, Save, RefreshCw, ChevronRight, ChevronLeft, 
  Sliders, Calendar, Check, AlertCircle, ArrowUpDown, 
  TrendingUp, DollarSign, Home, User, Edit2, Trash2
} from 'lucide-react';
import { House, WaterMeterReading, WaterUtilitySettings } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { 
  subscribeToWaterMeterReadings, 
  addWaterMeterReading, 
  updateWaterMeterReading, 
  deleteWaterMeterReading, 
  batchSaveWaterMeterReadings, 
  verifyWaterMeterReading,
  subscribeToSettings,
  updateSettings,
  calculateWaterUtilityBill
} from '../../services/databaseService';
import { useConfirm } from '../../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';

interface WaterMeterManagerProps {
  houses: House[];
}

export const WaterMeterManager: React.FC<WaterMeterManagerProps> = ({ houses = [] }) => {
  const confirm = useConfirm();

  // Current selected period (format: YYYY-MM)
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [activeTab, setActiveTab] = useState<'recap' | 'batch' | 'verification' | 'settings'>('recap');
  const [readings, setReadings] = useState<WaterMeterReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'recorded' | 'unrecorded' | 'pending' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Settings State
  const [waterSettings, setWaterSettings] = useState<WaterUtilitySettings>({
    billingMode: 'pdam',
    providerName: 'PDAM Kota Palu',
    baseQuotaM3: 10,
    baseFee: 35000,
    ratePerM3: 3500,
    maintenanceFee: 0,
    minUsageM3: 10,
    readingDueDate: 20,
    autoSyncToBills: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Batch Recording State
  const [batchBlock, setBatchBlock] = useState<string>('A');
  const [batchInputs, setBatchInputs] = useState<Record<string, { currentReading: number; prevReading: number }>>({});
  const [isSavingBatch, setIsSavingBatch] = useState<boolean>(false);

  // Single Edit / Create Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReading, setEditingReading] = useState<{
    houseId: string;
    previousReading: number;
    currentReading: number;
    ratePerM3: number;
    maintenanceFee: number;
    photoUrl?: string;
    recordedBy: 'Petugas RT' | 'Warga';
    recordedByName?: string;
    status: WaterMeterReading['status'];
    adminNotes?: string;
  } | null>(null);

  // Photo Verification Modal
  const [verifyingItem, setVerifyingItem] = useState<WaterMeterReading | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  // Subscribe to water readings for the selected period
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToWaterMeterReadings((data) => {
      setReadings(data);
      setLoading(false);
    }, selectedPeriod);

    return () => unsubscribe();
  }, [selectedPeriod]);

  // Subscribe to general settings to fetch water utility settings
  useEffect(() => {
    const unsubSettings = subscribeToSettings((settingsData) => {
      if (settingsData?.waterUtility) {
        setWaterSettings({
          billingMode: settingsData.waterUtility.billingMode ?? 'pdam',
          providerName: settingsData.waterUtility.providerName ?? 'PDAM Kota Palu',
          baseQuotaM3: settingsData.waterUtility.baseQuotaM3 ?? 10,
          baseFee: settingsData.waterUtility.baseFee ?? 35000,
          ratePerM3: settingsData.waterUtility.ratePerM3 ?? 3500,
          maintenanceFee: settingsData.waterUtility.maintenanceFee ?? 0,
          minUsageM3: settingsData.waterUtility.minUsageM3 ?? 10,
          readingDueDate: settingsData.waterUtility.readingDueDate ?? 20,
          autoSyncToBills: settingsData.waterUtility.autoSyncToBills ?? true
        });
      }
    });

    return () => unsubSettings();
  }, []);

  // Compute map of reading by houseId
  const readingsMap = useMemo(() => {
    const map = new Map<string, WaterMeterReading>();
    readings.forEach(r => map.set(r.houseId, r));
    return map;
  }, [readings]);

  // List of distinct blocks from houses
  const blocks = useMemo(() => {
    const set = new Set<string>();
    houses.forEach(h => {
      if (h.block) set.add(h.block.toUpperCase());
    });
    return Array.from(set).sort();
  }, [houses]);

  // Merge houses with readings
  const mergedHouseData = useMemo(() => {
    return houses.map(house => {
      const houseId = `${house.block}-${house.number}`;
      const reading = readingsMap.get(houseId) || readingsMap.get(`${house.block}${house.number}`);
      return {
        house,
        houseId,
        reading
      };
    });
  }, [houses, readingsMap]);

  // Filtered rows for Tab Recap
  const filteredData = useMemo(() => {
    return mergedHouseData.filter(({ house, houseId, reading }) => {
      // Filter Block
      if (selectedBlock !== 'all' && house.block?.toUpperCase() !== selectedBlock) {
        return false;
      }

      // Filter Status
      if (statusFilter === 'recorded' && !reading) return false;
      if (statusFilter === 'unrecorded' && reading) return false;
      if (statusFilter === 'pending' && (!reading || reading.status !== 'Menunggu Verifikasi')) return false;
      if (statusFilter === 'verified' && (!reading || reading.status !== 'Terverifikasi')) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHouse = houseId.toLowerCase().includes(q);
        const matchName = house.headOfFamily?.toLowerCase().includes(q);
        const matchPhone = house.phone?.includes(q);
        if (!matchHouse && !matchName && !matchPhone) return false;
      }

      return true;
    });
  }, [mergedHouseData, selectedBlock, statusFilter, searchQuery]);

  // KPI Calculations
  const kpi = useMemo(() => {
    const totalHouses = houses.length;
    let recordedCount = 0;
    let pendingCount = 0;
    let totalUsageM3 = 0;
    let totalBilled = 0;

    readings.forEach(r => {
      recordedCount++;
      if (r.status === 'Menunggu Verifikasi') pendingCount++;
      totalUsageM3 += (r.usage || 0);
      totalBilled += (r.totalAmount || 0);
    });

    return {
      totalHouses,
      recordedCount,
      unrecordedCount: Math.max(0, totalHouses - recordedCount),
      pendingCount,
      totalUsageM3,
      totalBilled
    };
  }, [houses, readings]);

  // Initialize batch inputs when switching to batch tab or changing batch block
  useEffect(() => {
    if (activeTab === 'batch') {
      const targetHouses = houses.filter(h => h.block?.toUpperCase() === batchBlock);
      const initialMap: Record<string, { currentReading: number; prevReading: number }> = {};
      
      targetHouses.forEach(h => {
        const hid = `${h.block}-${h.number}`;
        const existing = readingsMap.get(hid);
        initialMap[hid] = {
          currentReading: existing ? existing.currentReading : 0,
          prevReading: existing ? existing.previousReading : 0
        };
      });
      setBatchInputs(initialMap);
    }
  }, [activeTab, batchBlock, houses, readingsMap]);

  // Navigate period by month
  const handlePeriodChange = (offset: number) => {
    const [yearStr, monthStr] = selectedPeriod.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + offset;
    if (month > 12) {
      month = 1;
      year += 1;
    } else if (month < 1) {
      month = 12;
      year -= 1;
    }
    setSelectedPeriod(`${year}-${String(month).padStart(2, '0')}`);
  };

  // Period formatted name
  const formattedPeriodName = useMemo(() => {
    const [y, m] = selectedPeriod.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedPeriod]);

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      await updateSettings({
        waterUtility: waterSettings
      });
      toast.success('Pengaturan utilitas air berhasil disimpan!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan pengaturan utilitas.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Open Edit or Create Single Modal
  const handleOpenEdit = (houseId: string, existing?: WaterMeterReading) => {
    if (existing) {
      setEditingReading({
        houseId: existing.houseId,
        previousReading: existing.previousReading,
        currentReading: existing.currentReading,
        ratePerM3: existing.ratePerM3,
        maintenanceFee: existing.maintenanceFee,
        photoUrl: existing.photoUrl,
        recordedBy: existing.recordedBy,
        recordedByName: existing.recordedByName,
        status: existing.status,
        adminNotes: existing.adminNotes
      });
    } else {
      setEditingReading({
        houseId,
        previousReading: 0,
        currentReading: 0,
        ratePerM3: waterSettings.ratePerM3,
        maintenanceFee: waterSettings.maintenanceFee,
        recordedBy: 'Petugas RT',
        status: 'Terverifikasi'
      });
    }
    setIsModalOpen(true);
  };

  // Save Single Reading
  const handleSaveSingleReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReading) return;

    const usage = Math.max(0, editingReading.currentReading - editingReading.previousReading);
    const bill = calculateWaterUtilityBill(usage, {
      billingMode: waterSettings.billingMode,
      baseQuotaM3: waterSettings.baseQuotaM3,
      baseFee: waterSettings.baseFee,
      ratePerM3: editingReading.ratePerM3,
      maintenanceFee: editingReading.maintenanceFee
    });

    try {
      await addWaterMeterReading({
        houseId: editingReading.houseId,
        period: selectedPeriod,
        previousReading: Number(editingReading.previousReading),
        currentReading: Number(editingReading.currentReading),
        usage,
        ratePerM3: Number(editingReading.ratePerM3),
        maintenanceFee: Number(editingReading.maintenanceFee),
        baseFee: bill.baseFee,
        excessUsage: bill.excessUsage,
        excessFee: bill.excessFee,
        totalAmount: bill.totalAmount,
        photoUrl: editingReading.photoUrl || '',
        recordedBy: editingReading.recordedBy,
        recordedByName: editingReading.recordedByName || 'Petugas RT',
        recordedAt: new Date().toISOString(),
        status: editingReading.status,
        adminNotes: editingReading.adminNotes || ''
      });

      toast.success(`Catatan meter untuk rumah ${editingReading.houseId} berhasil disimpan.`);
      setIsModalOpen(false);
      setEditingReading(null);
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan catatan meteran.');
    }
  };

  // Delete reading
  const handleDeleteReading = async (id: string, houseId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pencatatan Meter',
      message: `Hapus data meter air periode ${selectedPeriod} untuk rumah ${houseId}?`,
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteWaterMeterReading(id);
        toast.success(`Pencatatan meter ${houseId} dihapus.`);
      } catch (error) {
        toast.error('Gagal menghapus data meter.');
      }
    }
  };

  // Save Batch Patrol Readings
  const handleSaveBatch = async () => {
    setIsSavingBatch(true);
    try {
      const recordsToSave: Omit<WaterMeterReading, 'id'>[] = [];
      
      Object.entries(batchInputs).forEach(([houseId, input]) => {
        if (input.currentReading > 0 || input.prevReading > 0) {
          const usage = Math.max(0, input.currentReading - input.prevReading);
          const bill = calculateWaterUtilityBill(usage, waterSettings);

          recordsToSave.push({
            houseId,
            period: selectedPeriod,
            previousReading: Number(input.prevReading),
            currentReading: Number(input.currentReading),
            usage,
            ratePerM3: waterSettings.ratePerM3,
            maintenanceFee: waterSettings.maintenanceFee,
            baseFee: bill.baseFee,
            excessUsage: bill.excessUsage,
            excessFee: bill.excessFee,
            totalAmount: bill.totalAmount,
            recordedBy: 'Petugas RT',
            recordedByName: 'Petugas RT Keliling',
            recordedAt: new Date().toISOString(),
            status: 'Terverifikasi'
          });
        }
      });

      if (recordsToSave.length === 0) {
        toast.error('Tidak ada data meter yang diisi.');
        setIsSavingBatch(false);
        return;
      }

      await batchSaveWaterMeterReadings(recordsToSave);
      toast.success(`Berhasil menyimpan ${recordsToSave.length} data meter untuk Blok ${batchBlock}!`);
      setActiveTab('recap');
    } catch (error) {
      console.error(error);
      toast.error('Gagal menyimpan batch catatan meter.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Handle Verification Action
  const handleVerifySubmit = async (status: 'Terverifikasi' | 'Ditolak') => {
    if (!verifyingItem) return;
    try {
      await verifyWaterMeterReading(verifyingItem.id, status, verificationNotes);
      toast.success(`Catatan meter rumah ${verifyingItem.houseId} telah ${status.toLowerCase()}.`);
      setVerifyingItem(null);
      setVerificationNotes('');
    } catch (error) {
      toast.error('Gagal memverifikasi catatan.');
    }
  };

  // Format WhatsApp Message for Billing
  const handleSendWhatsApp = (house: House, reading?: WaterMeterReading) => {
    if (!house.phone) {
      toast.error(`Nomor WhatsApp untuk rumah ${house.block}-${house.number} belum terdaftar.`);
      return;
    }

    const cleanPhone = house.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

    let text = `*PEMBERITAHUAN TAGIHAN AIR RT 002 HUNTAP TONDO 2*\n`;
    text += `====================================\n`;
    text += `Yth. Bpk/Ibu *${house.headOfFamily}* (Rumah *${house.block}-${house.number}*)\n`;
    text += `Periode Tagihan: *${formattedPeriodName}*\n\n`;

    if (reading) {
      text += `📊 *Rincian Pemakaian & Tagihan Air PDAM:*\n`;
      text += `• Angka Awal (Bulan Lalu) : ${reading.previousReading} m³\n`;
      text += `• Angka Akhir (Bulan Ini) : ${reading.currentReading} m³\n`;
      text += `• Total Pemakaian : *${reading.usage} m³*\n`;
      if (waterSettings.billingMode === 'pdam') {
        text += `• Paket Dasar PDAM (s/d ${waterSettings.baseQuotaM3 || 10} m³) : Rp ${(reading.baseFee ?? waterSettings.baseFee ?? 35000).toLocaleString('id-ID')}\n`;
        if ((reading.excessUsage || 0) > 0) {
          text += `• Kelebihan Pemakaian (${reading.excessUsage} m³ × Rp ${reading.ratePerM3.toLocaleString('id-ID')}) : Rp ${(reading.excessFee || 0).toLocaleString('id-ID')}\n`;
        }
      } else {
        text += `• Tarif per m³ : Rp ${reading.ratePerM3.toLocaleString('id-ID')}\n`;
      }
      if (reading.maintenanceFee > 0) {
        text += `• Beban Pemeliharaan/Admin : Rp ${reading.maintenanceFee.toLocaleString('id-ID')}\n`;
      }
      text += `------------------------------------\n`;
      text += `*TOTAL TAGIHAN AIR : Rp ${reading.totalAmount.toLocaleString('id-ID')}*\n`;
      text += `------------------------------------\n`;
      text += `Status Catatan: _${reading.status}_\n\n`;
    } else {
      text += `⚠️ *Perhatian:* Angka meteran air untuk rumah Anda bulan ini belum tercatat.\n`;
      text += `Mohon segera melakukan catat meter mandiri lewat Aplikasi Portal Warga RT 002 sebelum batas tanggal ${waterSettings.readingDueDate}.\n\n`;
    }

    text += `Pembayaran dapat dilakukan bersamaan dengan Iuran Bulanan RT via transfer Bank/QRIS atau tunai ke Bendahara RT 002.\n`;
    text += `Terima kasih atas kerja samanya menjaga kelancaran pasokan air bersih lingkungan kita. 🙏💧\n\n`;
    text += `_Pengurus RT 002 / RW 001 Kelurahan Tondo_`;

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Export CSV Recap
  const handleExportCSV = () => {
    if (readings.length === 0) {
      toast.error('Belum ada data meter air untuk diekspor pada periode ini.');
      return;
    }

    const headers = [
      'Blok-Nomor',
      'Kepala Keluarga',
      'Periode',
      'Meter Bulan Lalu (m3)',
      'Meter Bulan Ini (m3)',
      'Pemakaian (m3)',
      'Tarif per m3',
      'Beban Pompa',
      'Total Tagihan (Rp)',
      'Dicatat Oleh',
      'Status Verifikasi'
    ];

    const rows = mergedHouseData.map(({ house, houseId, reading }) => {
      return [
        houseId,
        `"${house.headOfFamily || '-'}"`,
        selectedPeriod,
        reading ? reading.previousReading : 0,
        reading ? reading.currentReading : 0,
        reading ? reading.usage : 0,
        reading ? reading.ratePerM3 : waterSettings.ratePerM3,
        reading ? reading.maintenanceFee : waterSettings.maintenanceFee,
        reading ? reading.totalAmount : 0,
        reading ? `"${reading.recordedBy}"` : '"Belum Dicatat"',
        reading ? `"${reading.status}"` : '"Belum Ada Data"'
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Meter_Air_RT002_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('File CSV Rekapitulasi berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-cyan-100">
              <Droplets className="w-3.5 h-3.5 animate-pulse" />
              Sistem Utilitas Air Bersih RT 002
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Pencatatan Meter & Tagihan Air
            </h1>
            <p className="text-cyan-100 text-sm max-w-xl">
              Kelola pencatatan meteran sumur bor/tandon air RT, kalkulasi kubikasi pemakaian warga, verifikasi bukti foto, dan kirim rincian tagihan secara transparan.
            </p>
          </div>

          {/* Period Selector Controller */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePeriodChange(-1)}
              className="bg-white/20 hover:bg-white/30 text-white border-none p-2 rounded-xl"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-3 text-center min-w-[140px]">
              <span className="text-xs text-cyan-200 block uppercase font-medium">Periode Aktif</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                {formattedPeriodName}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePeriodChange(1)}
              className="bg-white/20 hover:bg-white/30 text-white border-none p-2 rounded-xl"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rumah Tercatat</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {kpi.recordedCount} <span className="text-sm font-normal text-slate-400">/ {kpi.totalHouses}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {Math.round((kpi.recordedCount / (kpi.totalHouses || 1)) * 100)}% selesai terdata
            </p>
          </div>
        </Card>

        <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Konsumsi</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-800 dark:text-white">
              {kpi.totalUsageM3.toLocaleString('id-ID')} <span className="text-sm font-normal text-slate-400">m³</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rata-rata: {kpi.recordedCount > 0 ? (kpi.totalUsageM3 / kpi.recordedCount).toFixed(1) : 0} m³/rumah
            </p>
          </div>
        </Card>

        <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tagihan Air</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Rp {kpi.totalBilled.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {waterSettings.billingMode === 'metered' ? 'Kalkulasi Kubikasi + Beban' : 'Tarif Flat Lingkungan'}
            </p>
          </div>
        </Card>

        <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Butuh Verifikasi</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {kpi.pendingCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Catatan mandiri foto warga
            </p>
          </div>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2 pb-1">
        <button
          onClick={() => setActiveTab('recap')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'recap'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          Rekapitulasi Pemakaian ({readings.length})
        </button>

        <button
          onClick={() => setActiveTab('batch')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'batch'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Input Cepat Keliling (Batch Blok)
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-colors whitespace-nowrap relative ${
            activeTab === 'verification'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          Verifikasi Foto Warga
          {kpi.pendingCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-black bg-amber-500 text-white rounded-full">
              {kpi.pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Pengaturan Tarif & Jadwal
        </button>
      </div>

      {/* TAB CONTENT: 1. REKAPITULASI PEMAKAIAN */}
      {activeTab === 'recap' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Blok / Nomor / Nama Warga..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Filter Block */}
              <select
                value={selectedBlock}
                onChange={(e) => setSelectedBlock(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Semua Blok</option>
                {blocks.map(b => (
                  <option key={b} value={b}>Blok {b}</option>
                ))}
              </select>

              {/* Filter Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="recorded">Sudah Dicatat</option>
                <option value="unrecorded">Belum Dicatat</option>
                <option value="pending">Menunggu Verifikasi</option>
                <option value="verified">Terverifikasi</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 text-xs font-bold rounded-xl"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Ekspor CSV
              </Button>
            </div>
          </div>

          {/* Table of Houses & Readings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Rumah / Warga</th>
                    <th className="py-3.5 px-4 text-center">Meter Lalu (m³)</th>
                    <th className="py-3.5 px-4 text-center">Meter Ini (m³)</th>
                    <th className="py-3.5 px-4 text-center">Pemakaian</th>
                    <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                    <th className="py-3.5 px-4 text-center">Status & Bukti</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Droplets className="w-10 h-10 mx-auto mb-2 text-slate-300 opacity-50" />
                        Tidak ada data rumah yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map(({ house, houseId, reading }) => (
                      <tr key={houseId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Rumah & Warga */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold">
                              {houseId}
                            </span>
                            <span>{house.headOfFamily || 'Belum Ada Penghuni'}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{house.phone || 'No WA: -'}</span>
                            {house.occupants ? <span>• {house.occupants} Jiwa</span> : null}
                          </div>
                        </td>

                        {/* Meter Lalu */}
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600 dark:text-slate-300">
                          {reading ? reading.previousReading : '-'}
                        </td>

                        {/* Meter Ini */}
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {reading ? reading.currentReading : (
                            <span className="text-xs font-normal text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                              Belum Input
                            </span>
                          )}
                        </td>

                        {/* Pemakaian */}
                        <td className="py-3.5 px-4 text-center">
                          {reading ? (
                            <span className="inline-flex items-center gap-1 font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2.5 py-0.5 rounded-full text-xs">
                              <Droplets className="w-3 h-3" />
                              {reading.usage} m³
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Total Tagihan */}
                        <td className="py-3.5 px-4 text-right">
                          {reading ? (
                            <div className="font-black text-slate-900 dark:text-white">
                              Rp {reading.totalAmount.toLocaleString('id-ID')}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* Status & Bukti */}
                        <td className="py-3.5 px-4 text-center">
                          {reading ? (
                            <div className="flex flex-col items-center gap-1">
                              {reading.status === 'Terverifikasi' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Terverifikasi
                                </span>
                              ) : reading.status === 'Menunggu Verifikasi' ? (
                                <button
                                  onClick={() => setVerifyingItem(reading)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 transition-colors"
                                >
                                  <Clock className="w-3 h-3 animate-spin" />
                                  Perlu Review
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                  <XCircle className="w-3 h-3" />
                                  Ditolak
                                </span>
                              )}

                              {reading.photoUrl && (
                                <button
                                  onClick={() => setVerifyingItem(reading)}
                                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Lihat Foto
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Belum dicatat</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Input / Edit Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(houseId, reading)}
                              className="p-1.5 h-8 w-8 rounded-lg hover:bg-blue-50 text-blue-600"
                              title={reading ? 'Edit Meteran' : 'Catat Meteran'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            {/* WhatsApp Notification Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendWhatsApp(house, reading)}
                              className="p-1.5 h-8 w-8 rounded-lg hover:bg-emerald-50 text-emerald-600 border-emerald-200"
                              title="Kirim Rincian Tagihan ke WA Warga"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete Button (if recorded) */}
                            {reading && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteReading(reading.id, houseId)}
                                className="p-1.5 h-8 w-8 rounded-lg hover:bg-red-50 text-red-600 border-red-200"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. INPUT CEPAT KELILING RT (BATCH) */}
      {activeTab === 'batch' && (
        <div className="space-y-4">
          <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  Mode Input Cepat Petugas Ronda / Keliling Blok
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fitur ini dirancang khusus untuk mempermudah petugas mencatat angka fisik meteran dari rumah ke rumah per blok secara cepat tanpa reload.
                </p>
              </div>

              {/* Block Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Pilih Blok:</span>
                <div className="flex gap-1">
                  {blocks.map(b => (
                    <button
                      key={b}
                      onClick={() => setBatchBlock(b)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        batchBlock === b
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      Blok {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Batch Table Form */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Rumah & Nama</th>
                    <th className="py-3 px-4 text-center w-36">Meter Lalu (m³)</th>
                    <th className="py-3 px-4 text-center w-40">Meter Baru (m³)</th>
                    <th className="py-3 px-4 text-center">Pemakaian</th>
                    <th className="py-3 px-4 text-right">Estimasi Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {houses.filter(h => h.block?.toUpperCase() === batchBlock).map(house => {
                    const hid = `${house.block}-${house.number}`;
                    const val = batchInputs[hid] || { currentReading: 0, prevReading: 0 };
                    const usage = Math.max(0, val.currentReading - val.prevReading);
                    const estTotal = calculateWaterUtilityBill(usage, waterSettings).totalAmount;

                    return (
                      <tr key={hid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
                              {hid}
                            </span>
                            <span>{house.headOfFamily || 'Kosong'}</span>
                          </div>
                        </td>

                        {/* Meter Lalu Input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={val.prevReading}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setBatchInputs(prev => ({
                                ...prev,
                                [hid]: { ...prev[hid], prevReading: v }
                              }));
                            }}
                            className="w-28 text-center font-mono py-1.5 px-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                          />
                        </td>

                        {/* Meter Baru Input */}
                        <td className="py-2 px-4 text-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={val.currentReading || ''}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setBatchInputs(prev => ({
                                ...prev,
                                [hid]: { ...prev[hid], currentReading: v }
                              }));
                            }}
                            className="w-32 text-center font-mono font-bold py-1.5 px-2 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>

                        {/* Live Kubikasi */}
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${
                            usage > 0 
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
                              : 'text-slate-400'
                          }`}>
                            <Droplets className="w-3 h-3" />
                            {usage} m³
                          </span>
                        </td>

                        {/* Live Total Tagihan */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-white">
                          {val.currentReading > 0 ? `Rp ${estTotal.toLocaleString('id-ID')}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Floating Action */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {waterSettings.billingMode === 'pdam' 
                  ? `Skema PDAM: Rp ${(waterSettings.baseFee || 35000).toLocaleString('id-ID')} / ${waterSettings.baseQuotaM3 || 10} m³ (+ Rp ${waterSettings.ratePerM3.toLocaleString('id-ID')}/m³ kelebihan)`
                  : `Tarif aktif: Rp ${waterSettings.ratePerM3.toLocaleString('id-ID')}/m³`}
              </span>
              <Button
                onClick={handleSaveBatch}
                disabled={isSavingBatch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                {isSavingBatch ? 'Menyimpan Data...' : `Simpan Semua Catatan Blok ${batchBlock}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. VERIFIKASI FOTO WARGA */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <Card className="p-5 border-slate-100 dark:border-slate-800 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Antrean Verifikasi Foto Angka Meteran Mandiri
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Periksa kecocokan antara foto angka meteran fisik yang diunggah warga dengan angka meteran yang dilaporkan.
            </p>
          </Card>

          {readings.filter(r => r.status === 'Menunggu Verifikasi').length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Semua Catatan Mandiri Sudah Terverifikasi</h3>
              <p className="text-slate-400 text-xs mt-1">Tidak ada antrean foto baru yang butuh review pengurus saat ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readings.filter(r => r.status === 'Menunggu Verifikasi').map(r => (
                <Card key={r.id} className="overflow-hidden border-amber-200 dark:border-amber-900/50 shadow-md">
                  {/* Photo Preview Header */}
                  <div className="relative h-48 bg-slate-950 flex items-center justify-center overflow-hidden group">
                    {r.photoUrl ? (
                      <img 
                        src={r.photoUrl} 
                        alt={`Meteran ${r.houseId}`} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-slate-500 flex flex-col items-center gap-2">
                        <Camera className="w-8 h-8 opacity-40" />
                        <span className="text-xs">Tanpa Foto Fisik</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white font-mono font-bold text-xs">
                      Rumah {r.houseId}
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Pelapor:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{r.recordedByName || r.recordedBy}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Meter Lalu</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{r.previousReading} m³</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Meter Dilaporkan</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{r.currentReading} m³</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span className="text-slate-500">Pemakaian: <strong>{r.usage} m³</strong></span>
                      <span className="font-black text-emerald-600">Rp {r.totalAmount.toLocaleString('id-ID')}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setVerifyingItem(r);
                          setVerificationNotes('');
                        }}
                        className="flex-1 text-xs font-bold rounded-xl"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Periksa Detail
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 4. PENGATURAN TARIF & JADWAL */}
      {activeTab === 'settings' && (
        <Card className="p-6 max-w-2xl border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Pengaturan Sistem Air Bersih RT 002
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Atur formula tarif per meter kubik, abonemen pemeliharaan tandon/sumur, dan batas waktu catat mandiri.
            </p>
          </div>

          <div className="space-y-4">
            {/* Billing Mode */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Skema Penagihan Air
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setWaterSettings(s => ({ ...s, billingMode: 'pdam' }))}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    waterSettings.billingMode === 'pdam'
                      ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-900/20 text-cyan-800 dark:text-cyan-200 ring-2 ring-cyan-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    Skema PDAM
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Rp 35.000 / 10 m³ pertama, selebihnya per m³.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setWaterSettings(s => ({ ...s, billingMode: 'metered' }))}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    waterSettings.billingMode === 'metered'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm">Kubikasi Murni</div>
                  <div className="text-xs text-slate-500 mt-1">Volume pemakaian murni × tarif per m³.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setWaterSettings(s => ({ ...s, billingMode: 'flat' }))}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    waterSettings.billingMode === 'flat'
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-sm">Mode Flat (Tetap)</div>
                  <div className="text-xs text-slate-500 mt-1">Iuran air tetap setiap bulan tanpa meteran.</div>
                </button>
              </div>
            </div>

            {/* PDAM Scheme Settings */}
            {waterSettings.billingMode === 'pdam' && (
              <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-100 dark:border-cyan-900/40 rounded-2xl space-y-3">
                <div className="font-bold text-xs uppercase tracking-wider text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5" />
                  Konfigurasi Paket PDAM (Pengelolaan Resmi)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Kuota Dasar Pemakaian (m³)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={waterSettings.baseQuotaM3 ?? 10}
                      onChange={(e) => setWaterSettings(s => ({ ...s, baseQuotaM3: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Standar PDAM: 10 m³</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Tarif Kuota Dasar (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={waterSettings.baseFee ?? 35000}
                      onChange={(e) => setWaterSettings(s => ({ ...s, baseFee: Number(e.target.value) }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Standar PDAM: Rp 35.000</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tarif Kelebihan di Atas Kuota Dasar (per m³)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={waterSettings.ratePerM3}
                      onChange={(e) => setWaterSettings(s => ({ ...s, ratePerM3: Number(e.target.value) }))}
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Dikenakan untuk setiap m³ pemakaian di atas {waterSettings.baseQuotaM3 || 10} m³ (misal Rp 3.500/m³).</p>
                </div>
              </div>
            )}

            {/* Rate Per M3 for Standard Metered */}
            {waterSettings.billingMode === 'metered' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Tarif Air per Meter Kubik (m³)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={waterSettings.ratePerM3}
                    onChange={(e) => setWaterSettings(s => ({ ...s, ratePerM3: Number(e.target.value) }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Misal: Rp 3.500 / m³.</p>
              </div>
            )}

            {/* Maintenance / Admin Fee */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Biaya Administrasi / Beban Meteran Tambahan (Opsional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={waterSettings.maintenanceFee}
                  onChange={(e) => setWaterSettings(s => ({ ...s, maintenanceFee: Number(e.target.value) }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Biaya administrasi pemeliharaan pipa meteran warga (default: Rp 0 jika sudah terintegrasi tarif PDAM).
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Batas Tanggal Catat Mandiri Tiap Bulan
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={waterSettings.readingDueDate}
                  onChange={(e) => setWaterSettings(s => ({ ...s, readingDueDate: Number(e.target.value) }))}
                  className="w-24 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs text-slate-500">
                  Tanggal {waterSettings.readingDueDate} setiap bulannya (pengingat sistem otomatis).
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSavingSettings ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Utilitas'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* MODAL: SINGLE EDIT / INPUT METER */}
      {isModalOpen && editingReading && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Catat Meter Air: Rumah ${editingReading.houseId}`}
        >
          <form onSubmit={handleSaveSingleReading} className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-xs text-blue-700 dark:text-blue-300">
              Periode: <strong>{formattedPeriodName}</strong> ({selectedPeriod})
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Meter Bulan Lalu (m³)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editingReading.previousReading}
                  onChange={(e) => setEditingReading(r => r ? { ...r, previousReading: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Meter Bulan Ini (m³)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={editingReading.currentReading}
                  onChange={(e) => setEditingReading(r => r ? { ...r, currentReading: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-3 py-2 bg-blue-50/50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-xl text-sm font-mono font-bold text-blue-700 dark:text-blue-300"
                />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {(() => {
              const usage = Math.max(0, editingReading.currentReading - editingReading.previousReading);
              const previewBill = calculateWaterUtilityBill(usage, {
                billingMode: waterSettings.billingMode,
                baseQuotaM3: waterSettings.baseQuotaM3,
                baseFee: waterSettings.baseFee,
                ratePerM3: editingReading.ratePerM3,
                maintenanceFee: editingReading.maintenanceFee
              });

              return (
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume Pemakaian:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {usage} m³
                    </span>
                  </div>
                  {waterSettings.billingMode === 'pdam' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Paket Dasar (s/d {waterSettings.baseQuotaM3 || 10} m³):</span>
                        <span>Rp {(previewBill.baseFee).toLocaleString('id-ID')}</span>
                      </div>
                      {previewBill.excessUsage > 0 && (
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>Kelebihan ({previewBill.excessUsage} m³ × Rp {editingReading.ratePerM3}):</span>
                          <span>Rp {previewBill.excessFee.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarif per m³:</span>
                      <span>Rp {editingReading.ratePerM3.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {editingReading.maintenanceFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Beban Admin:</span>
                      <span>Rp {editingReading.maintenanceFee.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-sm text-emerald-600">
                    <span>Estimasi Total:</span>
                    <span>
                      Rp {previewBill.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Status Select */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Status Verifikasi
              </label>
              <select
                value={editingReading.status}
                onChange={(e) => setEditingReading(r => r ? { ...r, status: e.target.value as any } : null)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="Terverifikasi">Terverifikasi (Disetujui)</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Ditolak">Ditolak</option>
              </select>
            </div>

            {/* Catatan Admin */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Catatan Pengurus (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Angka fisik sesuai foto meteran kran depan"
                value={editingReading.adminNotes || ''}
                onChange={(e) => setEditingReading(r => r ? { ...r, adminNotes: e.target.value } : null)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                Simpan Catatan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: VERIFIKASI FOTO METERAN WARGA */}
      {verifyingItem && (
        <Modal
          isOpen={!!verifyingItem}
          onClose={() => setVerifyingItem(null)}
          title={`Verifikasi Foto Meteran: Rumah ${verifyingItem.houseId}`}
        >
          <div className="space-y-4">
            {/* Foto Meteran Zoomable */}
            <div className="rounded-2xl overflow-hidden bg-slate-950 max-h-80 flex items-center justify-center border border-slate-800">
              {verifyingItem.photoUrl ? (
                <img
                  src={verifyingItem.photoUrl}
                  alt={`Bukti Meteran ${verifyingItem.houseId}`}
                  className="max-h-80 w-auto object-contain"
                />
              ) : (
                <div className="py-12 text-slate-500 text-center">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  Warga tidak menyertakan foto bukti fisik.
                </div>
              )}
            </div>

            {/* Rincian Angka */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-center font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Meter Lalu</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{verifyingItem.previousReading} m³</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Dilaporkan</span>
                <span className="font-black text-blue-600 dark:text-blue-400">{verifyingItem.currentReading} m³</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Total Tagihan</span>
                <span className="font-black text-emerald-600">Rp {verifyingItem.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Catatan Verifikasi */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Catatan Verifikasi / Alasan Penolakan
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Foto buram/tidak terbaca, mohon foto ulang meteran."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleVerifySubmit('Ditolak')}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold rounded-xl"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Tolak Catatan
              </Button>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setVerifyingItem(null)}>
                  Tutup
                </Button>
                <Button
                  type="button"
                  onClick={() => handleVerifySubmit('Terverifikasi')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Setujui & Verifikasi
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
