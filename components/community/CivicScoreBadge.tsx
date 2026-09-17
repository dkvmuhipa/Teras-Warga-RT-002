import React from 'react';
import { House, PaymentStatus, CivicScoreRecord } from '../../types';
import { Award, ShieldCheck, CheckCircle2, Sparkles, HeartHandshake } from 'lucide-react';

export const calculateCivicScore = (house: House): CivicScoreRecord => {
  let score = 20; // Base score warga terdaftar
  const badges: string[] = [];

  // 1. Dues Score (Maks 25)
  let duesScore = 0;
  if (house.paymentStatusAir === PaymentStatus.PAID && house.paymentStatusSampah === PaymentStatus.PAID) {
    duesScore = 25;
    badges.push('Iuran Tertib');
  } else if (house.paymentStatusSampah === PaymentStatus.PAID) {
    duesScore = 15;
  }
  score += duesScore;

  // 2. Ronda & Keamanan (Maks 25)
  let rondaScore = 25; // Default berpartisipasi jadwal
  badges.push('Siaga Siskamling');
  score += rondaScore;

  // 3. 5 Pilar STBM & Sanitasi (Maks 20)
  let stbmScore = 20; // 100% ODF Biotank PUPR
  badges.push('100% ODF Sehat');
  score += stbmScore;

  // 4. Dokumen & Verifikasi KTP (Maks 10)
  let activityScore = 0;
  if (house.isVerified) {
    activityScore = 10;
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

export const CivicScoreBadge: React.FC<{ house: House; showDetails?: boolean }> = ({ house, showDetails = false }) => {
  const civic = calculateCivicScore(house);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Teladan Utama':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          badgeBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white',
          icon: '🥇'
        };
      case 'Aktif Berdaya':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          badgeBg: 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white',
          icon: '🥈'
        };
      case 'Partisipatif':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          badgeBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
          icon: '🥉'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          badgeBg: 'bg-slate-500 text-white',
          icon: '🌱'
        };
    }
  };

  const colors = getTierColor(civic.tier);

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between p-2.5 rounded-2xl border shadow-2xs ${colors.bg}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{colors.icon}</span>
          <div>
            <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block">Civic Score RT 02</span>
            <span className="text-xs font-black tracking-tight">{civic.tier}</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1 bg-white/80 border border-white/60 px-2.5 py-1 rounded-xl shadow-2xs">
          <span className="text-sm font-black font-mono text-slate-900">{civic.score}</span>
          <span className="text-[9px] font-extrabold text-slate-400">/100</span>
        </div>
      </div>

      {showDetails && (
        <div className="flex flex-wrap gap-1">
          {civic.badges.map((b, i) => (
            <span key={i} className="text-[9px] font-extrabold bg-white text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
              <CheckCircle2 size={10} className="text-emerald-500" />
              <span>{b}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
