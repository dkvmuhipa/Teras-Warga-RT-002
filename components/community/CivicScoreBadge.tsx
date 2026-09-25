import React from 'react';
import { House, PaymentStatus, CivicScoreRecord } from '../../types';
import { Award, ShieldCheck, CheckCircle2, Sparkles, HeartHandshake, Shield, Check, Flame } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export interface CivicScoreOptions {
  arrearsCount?: number;
  stbmProblem?: boolean;
}

export const calculateCivicScore = (house: House, options?: CivicScoreOptions): CivicScoreRecord => {
  let score = 20; // Skor dasar hunian terdaftar resmi di RT 002
  const badges: string[] = [];

  // 1. Tertib Iuran Kas & Retribusi Sampah TPS3R (Maks 30 Poin)
  let duesScore = 0;
  if (options?.arrearsCount !== undefined) {
    if (options.arrearsCount === 0) {
      duesScore = 30;
      badges.push('Iuran Tertib 100%');
    } else if (options.arrearsCount === 1) {
      duesScore = 20;
      badges.push('Tunggakan 1 Bln');
    } else if (options.arrearsCount <= 3) {
      duesScore = 10;
    } else {
      duesScore = 0;
    }
  } else {
    // Fallback bila tanpa context arrears
    if (house.paymentStatusAir === PaymentStatus.PAID && house.paymentStatusSampah === PaymentStatus.PAID) {
      duesScore = 30;
      badges.push('Iuran Tertib 100%');
    } else if (house.paymentStatusSampah === PaymentStatus.PAID) {
      duesScore = 18;
    }
  }
  score += duesScore;

  // 2. Partisipasi Siskamling Ronda Malam (Maks 25 Poin)
  let rondaScore = 0;
  if (house.rondaExempt) {
    rondaScore = 25;
    badges.push('Dispensasi Siskamling Sah');
  } else if ((house.rondaPoints || 0) > 0 || (house.rondaDutyCount || 0) > 0) {
    rondaScore = 25;
    badges.push('Siaga Siskamling Aktif');
  } else {
    rondaScore = 18; // Terjadwal ronda
    badges.push('Siaga Siskamling');
  }
  score += rondaScore;

  // 3. Sanitasi Lingkungan & 5 Pilar STBM (Maks 20 Poin)
  let stbmScore = 20;
  if (options?.stbmProblem) {
    stbmScore = 10;
    badges.push('Pantauan Sanitasi');
  } else {
    stbmScore = 20;
    badges.push('100% ODF Sehat');
  }
  score += stbmScore;

  // 4. Kelengkapan Berkas & Verifikasi Kependudukan (Maks 15 Poin)
  let activityScore = 5;
  if (house.nik && house.nik.length === 16) activityScore += 5;
  if (house.isVerified) {
    activityScore += 5;
    badges.push('Keluarga Terverifikasi');
  }
  score += activityScore;

  score = Math.min(100, Math.max(0, score));

  let tier: 'Teladan Utama' | 'Aktif Berdaya' | 'Partisipatif' | 'Warga Baru' = 'Warga Baru';
  if (score >= 85) tier = 'Teladan Utama';
  else if (score >= 70) tier = 'Aktif Berdaya';
  else if (score >= 50) tier = 'Partisipatif';

  return {
    houseId: `${house.block}-${house.number}`,
    headOfFamily: house.headOfFamily || 'Keluarga',
    score,
    tier,
    badges,
    duesScore,
    rondaScore,
    stbmScore,
    activityScore
  };
};

interface CivicScoreBadgeProps {
  house: House;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CivicScoreBadge: React.FC<CivicScoreBadgeProps> = ({ 
  house, 
  showDetails = false,
  size = 'md',
  className = ''
}) => {
  // Dynamically subscribe to real-time financial context
  let arrearsCount: number | undefined = undefined;
  try {
    const financial = useFinancial();
    if (financial?.getArrearsForHouse) {
      const arrears = financial.getArrearsForHouse(house);
      arrearsCount = arrears.length;
    }
  } catch (e) {
    // Graceful fallback outside provider
  }

  const civic = calculateCivicScore(house, { arrearsCount });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Teladan Utama':
        return {
          bg: 'bg-[#fff4eb] text-[#ea580c] border-amber-100',
          badgeBg: 'bg-[#ea580c] text-white',
          pillBg: 'bg-white/80 text-[#ea580c] border border-amber-150',
          icon: '🥇'
        };
      case 'Aktif Berdaya':
        return {
          bg: 'bg-[#f0f2fe] text-[#4f46e5] border-indigo-100',
          badgeBg: 'bg-indigo-600 text-white',
          pillBg: 'bg-white/80 text-indigo-700 border border-indigo-150',
          icon: '🥈'
        };
      case 'Partisipatif':
        return {
          bg: 'bg-[#e8faf0] text-[#059669] border-emerald-100',
          badgeBg: 'bg-emerald-600 text-white',
          pillBg: 'bg-white/80 text-[#059669] border border-emerald-150',
          icon: '🥉'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200/80',
          badgeBg: 'bg-slate-500 text-white',
          pillBg: 'bg-white/80 text-slate-700 border border-slate-200',
          icon: '🌱'
        };
    }
  };

  const colors = getTierColor(civic.tier);

  // Compact badge for card lists & tables
  if (size === 'sm') {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border shadow-2xs transition-all ${colors.bg} ${className}`}
        title={`Civic Score: ${civic.score}/100 (${civic.tier})`}
      >
        <span className="text-xs leading-none">{colors.icon}</span>
        <span className="font-extrabold tracking-tight">{civic.tier}</span>
        <span className="opacity-40 font-normal">|</span>
        <span className="font-black font-mono tracking-tight">{civic.score}</span>
      </div>
    );
  }

  // Full detailed card
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-2xs ${colors.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{colors.icon}</span>
          <div>
            <span className="text-[9px] uppercase font-black tracking-wider opacity-60 block">Civic Score RT 02</span>
            <span className="text-xs font-black tracking-tight">{civic.tier}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 bg-white/90 border border-slate-100 px-3 py-1 rounded-xl shadow-2xs">
          <span className="text-base font-black font-mono text-slate-800">{civic.score}</span>
          <span className="text-[10px] font-extrabold text-slate-400">/100</span>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-wrap gap-1.5">
          {civic.badges.map((b, i) => (
            <span key={i} className="text-[9px] font-bold bg-white text-slate-600 border border-slate-100 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
              <CheckCircle2 size={11} className="text-[#059669]" />
              <span>{b}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
